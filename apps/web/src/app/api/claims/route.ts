import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendClaimConfirmation, sendClaimNotification } from "@/lib/email";
import { isReservedSlug, slugify } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUSINESS_NAME_MAX = 80;
const EMAIL_MAX = 254;
const WHATSAPP_MAX = 40;
const SOURCE_MAX = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ERR_NAME = "That name isn't available. Try another.";
const ERR_SLUG = "That domain is taken. Try another.";
const ERR_GENERIC = "Something went wrong. Please try again.";
const ERR_TOO_MANY = "Too many claims right now. Please try again later.";

interface ClaimPayload {
  business_name?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  source?: unknown;
}

function trimmedString(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/**
 * MVP-only limiter: 5 requests per IP per hour.
 * Not production-grade — in-memory Map, single instance, resets on redeploy.
 * Replace with Upstash/Redis in Phase 2.
 */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_HITS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Claims emails are best-effort: a missing key, a Resend outage or a rejected
 * address must never turn a successful claim into a 500.
 */
async function dispatchEmails(payload: {
  to: string;
  businessName: string;
  slug: string;
  whatsapp?: string;
}) {
  try {
    await sendClaimConfirmation(payload.to, {
      businessName: payload.businessName,
      slug: payload.slug,
    });

    const owner = process.env["OWNER_EMAIL"];
    if (owner && owner.trim().length > 0) {
      await sendClaimNotification(owner.trim(), {
        businessName: payload.businessName,
        slug: payload.slug,
        email: payload.to,
        ...(payload.whatsapp ? { whatsapp: payload.whatsapp } : {}),
      });
    } else {
      console.warn("claims: OWNER_EMAIL not set — skipping owner notification");
    }
  } catch {
    // Defensive: the email helpers already swallow their own failures.
    console.warn("claims: email dispatch failed");
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: ERR_TOO_MANY }, { status: 429 });
  }

  let body: ClaimPayload;
  try {
    body = (await request.json()) as ClaimPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const businessName = trimmedString(body.business_name, BUSINESS_NAME_MAX);
  if (!businessName) {
    return NextResponse.json({ ok: false, error: ERR_NAME }, { status: 400 });
  }

  const email = trimmedString(body.email, EMAIL_MAX);
  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const whatsapp = trimmedString(body.whatsapp, WHATSAPP_MAX);
  const source = trimmedString(body.source, SOURCE_MAX) ?? "landing_page";

  const slug = slugify(businessName);
  if (!slug || isReservedSlug(slug)) {
    return NextResponse.json({ ok: false, error: ERR_NAME }, { status: 400 });
  }

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("claims: Supabase env missing");
    return NextResponse.json({ ok: false, error: ERR_GENERIC }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // The id is generated here rather than read back after the insert: RLS
  // grants anon INSERT only (no SELECT policy), so PostgREST would return no
  // rows even on success.
  const id = randomUUID();

  const { error } = await supabase.from("claims").insert({
    id,
    business_name: businessName,
    slug,
    email,
    whatsapp: whatsapp ?? null,
    status: "pending",
    metadata: { source },
  });

  if (error) {
    // `claims_slug_key` unique violation. This is the duplicate check: a
    // pre-read against the anon key would always come back empty because there
    // is no anon SELECT policy, so the constraint is the source of truth.
    if (error.code === "23505") {
      return NextResponse.json({ ok: false, error: ERR_SLUG }, { status: 409 });
    }
    // Log the Postgres code only — never the message, never the key.
    console.warn("claims: insert failed", { code: error.code });
    return NextResponse.json({ ok: false, error: ERR_GENERIC }, { status: 500 });
  }

  await dispatchEmails({
    to: email,
    businessName,
    slug,
    ...(whatsapp ? { whatsapp } : {}),
  });

  return NextResponse.json({ ok: true, slug, id });
}
