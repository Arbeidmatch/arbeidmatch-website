import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ search: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/brreg", () => ({ searchBrregCompanies: mocks.search }));
vi.mock("@/lib/errorNotifier", () => ({ notifyError: mocks.notify }));
import { GET } from "./route";

/** PROJ-SEC (9), 17 October 2026: the company search is limited and quiet on the visitor's own mistakes. */

function call(q: string, ip = "203.0.113.50") {
  return GET(new NextRequest(`https://www.arbeidmatch.no/api/brreg/search?q=${encodeURIComponent(q)}`, { headers: { "x-forwarded-for": ip } }));
}

beforeEach(() => {
  mocks.search.mockReset().mockResolvedValue([]);
  mocks.notify.mockReset();
});

describe("the Brreg search", () => {
  it("refuses a query longer than 100 characters without asking the register or reporting an error", async () => {
    const res = await call("a".repeat(101), "203.0.113.51");
    expect(res.status).toBe(400);
    expect(mocks.search).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect((await call("a".repeat(100), "203.0.113.51")).status).toBe(200);
  });

  it("allows 60 searches in ten minutes per visitor, then answers 429 without an error report", async () => {
    for (let i = 0; i < 60; i += 1) expect((await call("bygg", "203.0.113.52")).status).toBe(200);
    const refused = await call("bygg", "203.0.113.52");
    expect(refused.status).toBe(429);
    expect(refused.headers.get("Retry-After")).toBeTruthy();
    expect(mocks.notify).not.toHaveBeenCalled();
    // Another visitor is not affected.
    expect((await call("bygg", "203.0.113.53")).status).toBe(200);
  });

  it("still reports a failure on our side", async () => {
    mocks.search.mockRejectedValueOnce(new Error("boom"));
    expect((await call("bygg", "203.0.113.54")).status).toBe(500);
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });
});
