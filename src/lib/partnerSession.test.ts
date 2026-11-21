import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  row: null as null | { id: string; email: string; expires_at: string },
  updates: [] as Array<Record<string, unknown>>,
  filters: [] as Array<[string, unknown]>,
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdminClient: () => ({
    from: () => {
      const q = {
        select: () => q,
        eq: (col: string, val: unknown) => {
          db.filters.push([col, val]);
          return q;
        },
        gt: () => q,
        maybeSingle: async () => ({ data: db.row, error: null }),
        update: (patch: Record<string, unknown>) => {
          db.updates.push(patch);
          return { eq: async () => ({ error: null }) };
        },
      };
      return q;
    },
  }),
}));

import { PARTNER_SESSION_WORKING_MS, partnerSessionFor } from "@/lib/partnerSession";

const TOKEN = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";

/** ORDER 415: a partner link is bound to its partner and stops soon after it is first used. */
describe("a partner's candidate-page session", () => {
  beforeEach(() => {
    db.row = { id: "s1", email: "Kontakt@Partner.no", expires_at: new Date(Date.now() + 20 * 3600_000).toISOString() };
    db.updates.length = 0;
    db.filters.length = 0;
  });

  it("refuses anything that is not a session token, without asking the database", async () => {
    expect(await partnerSessionFor("abc")).toBeNull();
    expect(db.filters).toHaveLength(0);
  });

  it("names the partner from the row, never from the caller", async () => {
    expect(await partnerSessionFor(TOKEN)).toEqual({ id: "s1", email: "kontakt@partner.no", domain: "partner.no" });
    expect(db.filters).toContainEqual(["used", false]);
  });

  it("shortens a long-lived link to the working window on first use of the list", async () => {
    await partnerSessionFor(TOKEN, { startWindow: true });
    expect(db.updates).toHaveLength(1);
    const until = new Date(String(db.updates[0].expires_at)).getTime();
    expect(Math.abs(until - (Date.now() + PARTNER_SESSION_WORKING_MS))).toBeLessThan(5_000);
  });

  it("never lengthens a link that ends sooner than the window", async () => {
    db.row!.expires_at = new Date(Date.now() + 30 * 60_000).toISOString();
    await partnerSessionFor(TOKEN, { startWindow: true });
    expect(db.updates).toHaveLength(0);
  });

  it("refuses an unknown, used or expired token", async () => {
    db.row = null;
    expect(await partnerSessionFor(TOKEN)).toBeNull();
  });
});
