import { NextResponse } from "next/server";
import { createProvider, resolveDefaultResolution } from "@winlerr/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/concierge — the landing-page AI assistant.
 *
 * Deliberately bounded (task brief):
 *  - No tools, no actions, no account access, no payments. The system prompt
 *    tells it to hand anything actionable to /get-started or WhatsApp.
 *  - Never 500s: provider failure or a missing key degrades to a written
 *    fallback with the WhatsApp link.
 *  - `OPENROUTER_API_KEY` is read server-side only and never echoed.
 *  - The conversation is not persisted anywhere.
 */

const SYSTEM_PROMPT =
  "You are the Winlerr assistant on winlerr.vip. Winlerr is a Zambia-focused digital growth company. We give small and medium businesses a free professional website (live on yourbusiness.winlerr.vip), then the AI systems that answer, qualify, and follow up with every lead. Our systems: Lead Response, WhatsApp AI Agent, Social DM Agent, Booking System, Customer Follow-up, AI Receptionist. The free website has no upfront cost. To get started, visit /get-started or WhatsApp +260776950796. You cannot take actions, access accounts, or process payments. If asked to do something, direct the user to /get-started or WhatsApp. Keep replies under 400 characters, plain text, no markdown, friendly and confident, WhatsApp-first tone.";

const FALLBACK =
  "I'm having trouble right now. Chat on WhatsApp → https://wa.me/260776950796";

const MESSAGE_MAX = 500;
const REPLY_LIMIT = 400;
const SESSION_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

interface ConciergePayload {
  message?: unknown;
  session_id?: unknown;
}

/**
 * MVP-only limiter: 5 messages per session, 20 per IP per hour.
 * Not production-grade — in-memory Maps, single instance, resets on redeploy.
 * Replace with Upstash/Redis in Phase 2.
 */
const sessionHits = new Map<string, number[]>();
const ipHits = new Map<string, number[]>();
const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_SESSION = 5;
const MAX_PER_IP = 20;

function record(map: Map<string, number[]>, key: string): number {
  const now = Date.now();
  const recent = (map.get(key) ?? []).filter((t) => now - t < HOUR_MS);
  recent.push(now);
  map.set(key, recent);
  return recent.length;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function tidyReply(raw: string): string {
  let text = raw.trim().replace(/^(reply|assistant|answer)\s*:\s*/i, "");
  if (text.length > REPLY_LIMIT) {
    text = text.slice(0, REPLY_LIMIT);
    const lastSpace = text.lastIndexOf(" ");
    if (lastSpace > 0) text = text.slice(0, lastSpace);
    text = `${text}…`;
  }
  return text;
}

function fallbackResponse(sessionId: string) {
  return NextResponse.json({ ok: false, fallback: FALLBACK, session_id: sessionId });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (record(ipHits, `ip:${ip}`) > MAX_PER_IP) {
    return NextResponse.json(
      { ok: false, fallback: FALLBACK, error: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  let body: ConciergePayload;
  try {
    body = (await request.json()) as ConciergePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 1 || message.length > MESSAGE_MAX) {
    return NextResponse.json(
      { ok: false, error: `message must be a string of 1–${MESSAGE_MAX} characters.` },
      { status: 400 },
    );
  }

  // The session id is only ever used as a rate-limit bucket, so an invalid or
  // absent one is replaced rather than trusted (keeps the Map unbounded-key safe).
  const sessionId =
    typeof body.session_id === "string" && SESSION_PATTERN.test(body.session_id)
      ? body.session_id
      : crypto.randomUUID();

  if (record(sessionHits, `sess:${sessionId}`) > MAX_PER_SESSION) {
    return NextResponse.json(
      { ok: false, fallback: FALLBACK, error: "That's five for now — message again in an hour.", session_id: sessionId },
      { status: 429 },
    );
  }

  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) {
    console.warn("concierge: OPENROUTER_API_KEY not set — using fallback");
    return fallbackResponse(sessionId);
  }

  const { model, fallbackModel } = resolveDefaultResolution();

  async function attempt(modelName?: string): Promise<string | null> {
    const provider = createProvider("openrouter", {
      apiKey,
      ...(modelName ? { model: modelName } : {}),
    });
    const result = await provider.generate({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      maxTokens: 320,
      temperature: 0.6,
      signal: AbortSignal.timeout(12_000),
    });
    const text = tidyReply(result.text);
    return text.length > 0 ? text : null;
  }

  try {
    let reply = await attempt(model);
    if (reply === null && fallbackModel && fallbackModel !== model) {
      reply = await attempt(fallbackModel);
    }
    if (reply === null) {
      console.warn("concierge: empty reply — using fallback");
      return fallbackResponse(sessionId);
    }
    return NextResponse.json({ ok: true, reply, session_id: sessionId });
  } catch {
    // Provider/transport failure: no stack, no key, no provider internals.
    console.warn("concierge: provider error — using fallback");
    return fallbackResponse(sessionId);
  }
}
