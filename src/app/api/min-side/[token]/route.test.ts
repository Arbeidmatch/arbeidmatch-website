import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ callAts: vi.fn(), annonserFor: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (...a: unknown[]) => h.callAts(...a) }));
vi.mock("@/lib/min-side/annonser-server", async (orig) => ({
  ...(await orig<typeof import("@/lib/min-side/annonser-server")>()),
  annonserFor: (...a: unknown[]) => h.annonserFor(...a),
}));

import { GET } from "./route";

/**
 * ORDER 276: the page's load carries the section Annonser, asked for the
 * organisation number the ATS gave for this key and nothing else.
 */

const TOKEN = "aaaaaaaa-0000-4000-8000-000000000276";
const req = (query = "") =>
  new NextRequest(`https://www.arbeidmatch.no/api/min-side/${TOKEN}${query}`, { headers: { "x-forwarded-for": `10.0.1.${Math.floor(Math.random() * 250)}` } });
const ctx = { params: Promise.resolve({ token: TOKEN }) };

beforeEach(() => {
  h.callAts.mockReset();
  h.annonserFor.mockReset();
});

describe("GET /api/min-side/<token> with Annonser", () => {
  it("asks for the ATS's own organisation number, never one in the address", async () => {
    h.callAts.mockResolvedValue({ status: 200, body: { me: {}, company: { name: "Test AS", org_number: "999 999 999" } } });
    h.annonserFor.mockResolvedValue({ state: "unavailable" });
    const res = await GET(req("?org=888888888"), ctx);
    expect(h.annonserFor).toHaveBeenCalledWith("999999999");
    expect((await res.json()).annonser).toEqual({ state: "unavailable" });
  });

  it("never passes on an annonser field it did not fetch itself", async () => {
    h.callAts.mockResolvedValue({ status: 200, body: { me: {}, company: { name: "Test AS", org_number: "999999999" }, annonser: { state: "ok" } } });
    h.annonserFor.mockResolvedValue(null);
    const body = await (await GET(req(), ctx)).json();
    expect(body.annonser).toBeNull();
  });

  it("asks nothing when the ATS refuses the key", async () => {
    h.callAts.mockResolvedValue({ status: 404, body: { error: "x" } });
    const res = await GET(req(), ctx);
    expect(res.status).toBe(404);
    expect(h.annonserFor).not.toHaveBeenCalled();
  });
});
