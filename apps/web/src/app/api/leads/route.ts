import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface LeadPayload {
  name?: unknown;
  business_name?: unknown;
  whatsapp?: unknown;
  email?: unknown;
  message?: unknown;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 2000) : undefined;
}

// MVP-only limiter: per-IP sliding window. Not production-grade
// (single instance, resets on redeploy — use Upstash/Redis for scale).
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again." }, { status: 429 });
  }

  let body: LeadPayload;
  try {
    body = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const name = optionalString(body.name);
  if (!name) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  }

  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("leads route: Supabase env missing, returning stub response");
    return NextResponse.json({ ok: true, stub: true });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("leads").insert({
    name,
    business_name: optionalString(body.business_name) ?? null,
    whatsapp: optionalString(body.whatsapp) ?? null,
    email: optionalString(body.email) ?? null,
    message: optionalString(body.message) ?? null,
    source: "landing_page",
    status: "new",
  });

  if (error) {
    console.warn("leads route: insert failed");
    return NextResponse.json({ ok: false, error: "Unable to submit. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
