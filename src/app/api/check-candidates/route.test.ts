import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ orFilters: [] as string[], notify: vi.fn() }));
vi.mock("@/lib/errorNotifier", () => ({ notifyError: mocks.notify }));
vi.mock("@/lib/supabaseService", () => ({
  getSupabaseServiceClient: () => {
    const query = {
      select: () => query,
      or: (filter: string) => {
        mocks.orFilters.push(filter);
        return Promise.resolve({ count: 3, error: null });
      },
    };
    return { from: () => query };
  },
}));
import { GET } from "./route";
import { safeIlikePattern } from "@/lib/postgrestSafe";

/** ORDER 415, 21 November 2026: an anonymous visitor cannot shape the candidate filter, and cannot ask without end. */

function call(role: string, ip = "203.0.113.60") {
  return GET(new NextRequest(`https://www.arbeidmatch.no/api/check-candidates?role=${encodeURIComponent(role)}`, { headers: { "x-forwarded-for": ip } }));
}

beforeEach(() => {
  mocks.orFilters.length = 0;
  mocks.notify.mockReset();
});

describe("the candidate check on a request page", () => {
  it("keeps three clauses when the role carries a comma, a parenthesis or a quote", async () => {
    const res = await call("x,id.gt.0", "203.0.113.61");
    expect(await res.json()).toMatchObject({ count: 3 });
    await call("a)or(status.eq.active", "203.0.113.61");
    await call(`weld"er'`, "203.0.113.61");
    for (const filter of mocks.orFilters) {
      expect(filter.split(",")).toHaveLength(3);
      expect(filter).not.toMatch(/[()"']/);
    }
  });

  it("escapes % and _ so they match themselves", () => {
    expect(safeIlikePattern("100%_sure")).toBe("%100\\%\\_sure%");
    expect(safeIlikePattern(",(")).toBeNull();
  });

  it("answers 30 checks in ten minutes per visitor, then 429 without asking the database", async () => {
    for (let i = 0; i < 30; i += 1) expect((await call("welder", "203.0.113.62")).status).toBe(200);
    const asked = mocks.orFilters.length;
    expect((await call("welder", "203.0.113.62")).status).toBe(429);
    expect(mocks.orFilters.length).toBe(asked);
  });
});
