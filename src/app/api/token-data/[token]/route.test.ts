import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * What the wizard is told about a ticket (the owner, 24 September 2026): a
 * live presentation ticket opens it without the OTP step, an expired one does
 * not. Supabase is mocked.
 */
const mocks = vi.hoisted(() => ({ admin: vi.fn(), row: null as Record<string, unknown> | null }));
vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/errorNotifier", () => ({ notifyError: vi.fn(async () => undefined) }));
vi.mock("@/lib/secureLogger", () => ({ logApiError: vi.fn() }));

import { GET } from "./route";

const TOKEN = "11111111-2222-4333-8444-555555555555";
const DAY = 24 * 60 * 60 * 1000;

function fakeSupabase() {
  return {
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        single: async () => ({ data: mocks.row, error: mocks.row ? null : { message: "none" } }),
        maybeSingle: async () => ({ data: null, error: null }),
      };
      return chain;
    },
  };
}

async function read() {
  const response = await GET(new Request(`https://www.arbeidmatch.no/api/token-data/${TOKEN}`), {
    params: Promise.resolve({ token: TOKEN }),
  });
  return (await response.json()) as { data: Record<string, unknown> };
}

beforeEach(() => {
  mocks.admin.mockReturnValue(fakeSupabase());
  mocks.row = {
    company: "Test Bygg AS",
    email: "post@testbygg.invalid",
    full_name: "",
    phone: "",
    org_number: "999999999",
    gdpr_consent: false,
    how_did_you_hear: "presentation",
    ats_company_id: "co1",
    created_at: new Date(Date.now() - DAY).toISOString(),
    expires_at: new Date(Date.now() + 29 * DAY).toISOString(),
    used: false,
  };
});

describe("token-data for a presentation's ticket", () => {
  it("flags a live one as passing the gate", async () => {
    const { data } = await read();
    expect(data.isPresentation).toBe(true);
    expect(data.presentationTicket).toBe(true);
    expect(data.gdpr_consent).toBe(false);
  });

  it("does not flag one past 30 days", async () => {
    mocks.row = { ...mocks.row, created_at: new Date(Date.now() - 30 * DAY).toISOString() };
    const { data } = await read();
    expect(data.isPresentation).toBe(true);
    expect(data.presentationTicket).toBe(false);
  });

  it("never flags a website ticket", async () => {
    mocks.row = { ...mocks.row, how_did_you_hear: "website-request", ats_company_id: null };
    const { data } = await read();
    expect(data.presentationTicket).toBe(false);
  });
});
