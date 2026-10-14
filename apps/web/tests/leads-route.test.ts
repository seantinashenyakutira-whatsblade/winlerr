import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsert } = vi.hoisted(() => ({ mockInsert: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: () => ({ insert: mockInsert }) })),
}));

import { POST } from "../src/app/api/leads/route";

const URL = "NEXT_PUBLIC_SUPABASE_URL";
const ANON = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

let savedUrl: string | undefined;
let savedAnon: string | undefined;
let ipCounter = 0;

function freshIp(): string {
  ipCounter += 1;
  return `10.200.0.${ipCounter}`;
}

function post(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  savedUrl = process.env[URL];
  savedAnon = process.env[ANON];
  process.env[URL] = "https://example.supabase.co";
  process.env[ANON] = "anon-key";
  mockInsert.mockReset();
  mockInsert.mockResolvedValue({ error: null });
});

afterEach(() => {
  if (savedUrl === undefined) delete process.env[URL];
  else process.env[URL] = savedUrl;
  if (savedAnon === undefined) delete process.env[ANON];
  else process.env[ANON] = savedAnon;
});

describe("POST /api/leads", () => {
  it("rejects with 503 instead of a fake success when Supabase env is missing", async () => {
    delete process.env[URL];
    delete process.env[ANON];

    const res = await POST(post({ name: "Chanda Mwansa" }, freshIp()));
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(503);
    expect(body["ok"]).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("requires a name with 400", async () => {
    const res = await POST(post({ business_name: "Mwansa Catering" }, freshIp()));
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(body["ok"]).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON with 400", async () => {
    const res = await POST(post("{not-json", freshIp()));

    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rate-limits burst submissions from one IP with 429", async () => {
    const ip = freshIp();
    const payload = { name: "Chanda Mwansa" };
    let lastStatus = 0;
    for (let i = 0; i < 6; i += 1) {
      const res = await POST(post(payload, ip));
      lastStatus = res.status;
      await res.json();
    }

    expect(lastStatus).toBe(429);
  });

  it("persists the lead before reporting success", async () => {
    const res = await POST(
      post(
        {
          name: "Chanda Mwansa",
          business_name: "Mwansa Catering",
          whatsapp: "+260970000000",
          email: "you@example.com",
          message: "Need a website",
        },
        freshIp(),
      ),
    );
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith({
      name: "Chanda Mwansa",
      business_name: "Mwansa Catering",
      whatsapp: "+260970000000",
      email: "you@example.com",
      message: "Need a website",
      source: "landing_page",
      status: "new",
    });
  });

  it("reports 500 without success when the insert fails", async () => {
    mockInsert.mockResolvedValue({ error: { code: "42501", message: "denied" } });

    const res = await POST(post({ name: "Chanda Mwansa" }, freshIp()));
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(500);
    expect(body["ok"]).toBe(false);
  });
});
