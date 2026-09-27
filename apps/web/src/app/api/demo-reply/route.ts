import { NextResponse } from "next/server";
import { createProvider, resolveDefaultResolution } from "@winlerr/ai";

/**
 * POST /api/demo-reply
 *
 * Powers the homepage AI demo. Given a business type and a customer enquiry,
 * returns the reply Winlerr would send on WhatsApp.
 *
 * Design rules (deliberate, see task brief):
 *  - Never 500 to the user. Any failure degrades to a canned reply so the
 *    marketing page always works.
 *  - `OPENROUTER_API_KEY` is read server-side only and never leaves this
 *    module. Nothing in the response echoes the key.
 *  - The enquiry is never persisted and never written to a database or log.
 *    Only businessType / mode / latencyMs are logged.
 *
 * Validation is hand-rolled to match the sibling `api/leads` route rather than
 * introducing a schema dependency; the surface is two fields.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUSINESS_TYPES = ["Restaurant", "Salon", "Contractor", "Retail", "Other"] as const;
type BusinessType = (typeof BUSINESS_TYPES)[number];

/**
 * Fixed fictional business profiles for the homepage demo.
 *
 * These exist so the model has a closed set of facts to answer from. The
 * sandbox businesses are invented; the model is instructed to answer only from
 * the injected profile and to confirm anything outside it.
 *
 * Keys are a superset of `BUSINESS_TYPES`: a request whose business type has
 * no profile (for example "Retail") falls back to "Other".
 */
export const SANDBOX_PROFILES = {
  Restaurant: {
    name: "Mwansa Kitchen",
    city: "Lusaka",
    hours: "Mon-Sat 11:00-21:00, Sun closed",
    delivery: "Kabulonga, Woodlands, Roma, Chelston. 30-45 min.",
    menu: "grilled tilapia K140, beef stew K120, chicken curry K110, vegetarian platter K95",
    payment: "Airtel Money, MTN MoMo, cash",
  },
  Salon: {
    name: "Glow Beauty Studio",
    city: "Kabulonga",
    services: "braids (from K250), haircut K80, manicure K60, pedicure K80, makeup K150+",
    hours: "Tue-Sat 09:00-18:00. Walk-ins welcome, bookings preferred.",
    payment: "cash, Airtel Money",
  },
  Contractor: {
    name: "Kabwe Construction",
    city: "Lusaka",
    services: "roofing (IBR, Harvey, tiles), timber framing, leak repairs, renovations",
    area: "Lusaka + 50km",
    notes: "Free site assessment offered. Quotes depend on dimensions and materials.",
  },
  Boutique: {
    name: "Chiluba Fashion",
    city: "Lusaka",
    categories: "dresses, blouses, shoes, bags, accessories",
    sizes: "XS-XL",
    shipping: "Lusaka same-day; Kitwe/Ndola 24h via bus; other areas via courier",
    payment: "Airtel Money, MTN MoMo, cash on delivery (Lusaka only)",
  },
  "Professional services": {
    name: "Banda & Associates",
    city: "Lusaka",
    services: "PACRA company registration, ZRA tax advisory, compliance, bookkeeping",
    engagement: "fixed-fee packages, no hourly billing",
    pacra_timeline: "typically 7-14 business days",
    notes: "Free 15-minute consultation offered",
  },
  Other: {
    name: "Winlerr Sandbox Client",
    city: "Lusaka",
    notes: "General enquiry — reply warmly and ask how you can help.",
  },
} as const;

const ENQUIRY_MAX = 300;

const CANNED: Record<BusinessType, string> = {
  Restaurant:
    "Hi, thanks for reaching out. I'd be happy to help with that. Could you tell me the date and how many people are coming, and I'll check with the owner and come back to you shortly with the total?",
  Salon:
    "Hi, thanks for reaching out. I'd be glad to help you book. What day and time suits you best, and how many people are coming in? I'll confirm with the owner and come back to you shortly.",
  Contractor:
    "Hi, thanks for reaching out. I'd be glad to help with the job. Where in Lusaka is the work, and roughly when do you need it done? I'll check with the owner and come back to you shortly with next steps.",
  Retail:
    "Hi, thanks for reaching out. I'd be happy to help you with that. What would you like, and are you collecting or should we arrange delivery? I'll check with the owner and come back to you shortly.",
  Other:
    "Hi, thanks for reaching out. I'd be glad to help you with that. Could you tell me a little more about what you need? I'll check with the owner and come back to you shortly.",
};

/** The sandbox profile for a business type, falling back to "Other". */
function profileFor(businessType: BusinessType): Record<string, unknown> {
  const profiles: Record<string, Record<string, unknown>> = SANDBOX_PROFILES;
  return profiles[businessType] ?? profiles["Other"];
}

function systemPrompt(businessType: BusinessType): string {
  return `You are the Winlerr demo reply assistant. A visitor to winlerr.vip submitted a business enquiry, and you are drafting the reply the business would send back — in real time — to demonstrate Winlerr's Lead Response system.

CRITICAL RULE: You are demonstrating how a REAL business replies. You must NEVER invent prices, stock, availability, hours, menu items, or any specific fact. You may only use facts from the SANDBOX PROFILE below. For anything not in the profile, respond warmly and say you will confirm and get back to them.

SANDBOX PROFILE for this enquiry:
${JSON.stringify(profileFor(businessType), null, 2)}

Tone: Warm, human, WhatsApp-native Zambian business. 2-4 sentences. No emojis. No markdown. Always end with a qualifying question (except final confirmations).

Length: under 300 characters.

Reply only with the drafted message. No preamble, no quotes, no explanation.`;
}

/** Coerce to a canonical BusinessType, case-insensitively. */
function parseBusinessType(value: unknown): BusinessType | null {
  if (typeof value !== "string") return null;
  const needle = value.trim().toLowerCase();
  for (const candidate of BUSINESS_TYPES) {
    if (candidate.toLowerCase() === needle) return candidate;
  }
  return null;
}

function parseEnquiry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > ENQUIRY_MAX) return null;
  return trimmed;
}

/** Strip stray quoting / labels a model sometimes adds despite instructions. */
function tidyReply(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^(reply|assistant|answer)\s*:\s*/i, "");
  if (text.length > 1) {
    const first = text[0];
    const last = text[text.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      text = text.slice(1, -1).trim();
    }
  }
  return text;
}

function replyFor(businessType: BusinessType): string {
  return CANNED[businessType];
}

/**
 * MVP-only limiter: 5 requests per IP per hour.
 * Not production-grade; replace with Upstash/Redis in Phase 2.
 * (In-memory: single instance, resets on redeploy, not shared across regions.)
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

export async function POST(request: Request) {
  const startedAt = Date.now();

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many demo requests. Please try again later." },
      { status: 429 },
    );
  }

  let payload: { businessType?: unknown; enquiry?: unknown };
  try {
    payload = (await request.json()) as { businessType?: unknown; enquiry?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const businessType = parseBusinessType(payload.businessType);
  if (!businessType) {
    return NextResponse.json(
      { ok: false, error: `businessType must be one of: ${BUSINESS_TYPES.join(", ")}.` },
      { status: 400 },
    );
  }

  const enquiry = parseEnquiry(payload.enquiry);
  if (!enquiry) {
    return NextResponse.json(
      { ok: false, error: `enquiry must be a string of 1–${ENQUIRY_MAX} characters.` },
      { status: 400 },
    );
  }

  const canned = () => replyFor(businessType);
  const apiKey = process.env["OPENROUTER_API_KEY"];

  if (!apiKey) {
    const latencyMs = Date.now() - startedAt;
    console.info("demo-reply", { businessType, mode: "canned", latencyMs, reason: "missing_key" });
    return NextResponse.json({ ok: true, mode: "canned", reply: canned() });
  }

  try {
    // `AI_DEFAULT_MODEL` wins when set; otherwise the provider's own default.
    const { model } = resolveDefaultResolution();
    const provider = createProvider("openrouter", { apiKey, ...(model ? { model } : {}) });

    const result = await provider.generate({
      messages: [
        { role: "system", content: systemPrompt(businessType) },
        { role: "user", content: enquiry },
      ],
      maxTokens: 220,
      temperature: 0.5,
      signal: AbortSignal.timeout(12_000),
    });

    const reply = tidyReply(result.text);
    const latencyMs = Date.now() - startedAt;

    if (!reply) {
      console.info("demo-reply", { businessType, mode: "canned", latencyMs, reason: "empty_reply" });
      return NextResponse.json({
        ok: true,
        mode: "canned",
        reply: canned(),
        error: "live_unavailable",
      });
    }

    console.info("demo-reply", { businessType, mode: "live", latencyMs });
    return NextResponse.json({ ok: true, mode: "live", reply, latencyMs });
  } catch {
    // Swallow the provider error entirely: no stack traces, no key material,
    // no provider internals reach the client.
    const latencyMs = Date.now() - startedAt;
    console.warn("demo-reply", { businessType, mode: "canned", latencyMs, reason: "provider_error" });
    return NextResponse.json({
      ok: true,
      mode: "canned",
      reply: canned(),
      error: "live_unavailable",
    });
  }
}
