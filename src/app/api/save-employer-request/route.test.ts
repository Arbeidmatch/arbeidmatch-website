import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The save route and the ticket a personalised presentation carries (the
 * owner, 24 September 2026). Supabase is mocked: nothing here reaches a
 * database.
 */
const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  limit: vi.fn(),
  ticket: { data: null as Record<string, unknown> | null, error: null as unknown },
  inserted: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/errorNotifier", () => ({ notifyError: vi.fn(async () => undefined) }));
vi.mock("@/lib/secureLogger", () => ({ logApiError: vi.fn() }));
vi.mock("@/lib/apiSecurity", async (original) => ({
  ...(await original<typeof import("@/lib/apiSecurity")>()),
  getRateLimitResult: mocks.limit,
}));

import { POST } from "./route";

const TOKEN = "11111111-2222-4333-8444-555555555555";
const DECK = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const DAY = 24 * 60 * 60 * 1000;

const valid = {
  token: TOKEN,
  company: "Test Bygg AS",
  orgNumber: "999999999",
  email: "post@testbygg.invalid",
  full_name: "Test Person",
  phone: "+47 12345678",
  hiringType: "recruitment",
  requesterKind: "own_operation",
  category: "Construction",
  position: "Carpenter",
  qualification: "Skilled",
  city: "Trondheim",
  howDidYouHear: "presentation",
};

function request(body: unknown) {
  return new NextRequest("https://www.arbeidmatch.no/api/save-employer-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fakeSupabase() {
  return {
    from: (table: string) => {
      if (table === "request_tokens") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => mocks.ticket,
        };
        return chain;
      }
      if (table === "employer_requests") {
        return {
          insert: (row: Record<string, unknown>) => {
            mocks.inserted.push(row);
            const chain = {
              select: () => chain,
              maybeSingle: async () => ({ data: { id: 42 }, error: null }),
            };
            return chain;
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.inserted.length = 0;
  mocks.limit.mockReturnValue({ limited: false, retryAfterSeconds: 0 });
  mocks.admin.mockReturnValue(fakeSupabase());
  mocks.ticket = {
    data: {
      how_did_you_hear: "presentation",
      created_at: new Date(Date.now() - 2 * DAY).toISOString(),
      expires_at: new Date(Date.now() + 28 * DAY).toISOString(),
      used: false,
    },
    error: null,
  };
});

describe("save-employer-request with a presentation's ticket", () => {
  it("saves the request and records the source and the deck for the ATS", async () => {
    const response = await POST(request({ ...valid, deck: DECK }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, referenceId: "AM-ER-2026-00042" });
    const row = mocks.inserted[0];
    expect(row.token_id).toBe(TOKEN);
    expect(row.how_did_you_hear).toBe("presentation");
    const answers = row.form_answers as Record<string, unknown>;
    expect(answers.source).toBe("presentation");
    expect(answers.deck).toBe(DECK);
    expect(answers.token).toBeUndefined();
  });

  it("records the source even when the link carried no deck", async () => {
    await POST(request(valid));
    const answers = mocks.inserted[0].form_answers as Record<string, unknown>;
    expect(answers.source).toBe("presentation");
    expect(answers.deck).toBeNull();
  });

  it("refuses an expired presentation ticket and saves nothing", async () => {
    mocks.ticket = {
      data: { ...mocks.ticket.data, created_at: new Date(Date.now() - 31 * DAY).toISOString() },
      error: null,
    };
    const response = await POST(request({ ...valid, deck: DECK }));
    expect(response.status).toBe(410);
    expect(mocks.inserted).toHaveLength(0);
  });

  it("refuses a presentation ticket that was already used", async () => {
    mocks.ticket = { data: { ...mocks.ticket.data, used: true }, error: null };
    expect((await POST(request(valid))).status).toBe(410);
    expect(mocks.inserted).toHaveLength(0);
  });

  it("keeps a website ticket as it was: no source, the deck dropped, its own answer kept", async () => {
    mocks.ticket = {
      data: { how_did_you_hear: "website-request", created_at: new Date().toISOString(), expires_at: null, used: false },
      error: null,
    };
    const response = await POST(request({ ...valid, howDidYouHear: "Google", deck: DECK }));
    expect(response.status).toBe(200);
    const row = mocks.inserted[0];
    expect(row.how_did_you_hear).toBe("Google");
    const answers = row.form_answers as Record<string, unknown>;
    expect(answers.source).toBeUndefined();
    expect(answers.deck).toBeUndefined();
  });

  it("takes the source from the ticket, never from the body", async () => {
    mocks.ticket = {
      data: { how_did_you_hear: "website-request", created_at: new Date().toISOString(), expires_at: null, used: false },
      error: null,
    };
    await POST(request({ ...valid, howDidYouHear: "presentation" }));
    const answers = mocks.inserted[0].form_answers as Record<string, unknown>;
    expect(answers.source).toBeUndefined();
  });

  it("refuses a deck that is not a presentation token", async () => {
    expect((await POST(request({ ...valid, deck: "not-a-uuid" }))).status).toBe(400);
    expect(mocks.inserted).toHaveLength(0);
  });
});
