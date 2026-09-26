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

function systemPrompt(businessType: BusinessType): string {
  return `You are the AI assistant for a small ${businessType} business in Lusaka, Zambia. You reply to customer WhatsApp enquiries on behalf of the owner. Your tone is warm, brief, and helpful — like a friendly receptionist. Ask one qualifying question at most. Reference Zambian context when natural (Kwacha, Lusaka neighborhoods, mobile money). Reply in 2–3 short sentences. Never invent prices, inventory, or availability — if asked, say you'll check with the owner and come back shortly. Sign nothing. Do not use emojis. Output only the reply text, nothing else.`;
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
