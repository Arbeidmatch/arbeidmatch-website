import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "./route";

function call(query: string) {
  return GET(new NextRequest(`https://arbeidmatch.no/api/market-preview${query}`));
}

describe("the staff preview route", () => {
  it("keeps the token in an httpOnly cookie for twelve hours and goes on with a 303", () => {
    const res = call("?token=fixture.token-123&next=/jobs/m/M-12");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://arbeidmatch.no/jobs/m/M-12");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("am_market_preview=fixture.token-123");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toContain("Max-Age=43200");
  });

  it("never sends the browser anywhere but the list or a market job", () => {
    expect(call("?token=fixture.token-123&next=https://evil.example").headers.get("location")).toBe("https://arbeidmatch.no/jobs");
    expect(call("?token=fixture.token-123&next=//evil.example").headers.get("location")).toBe("https://arbeidmatch.no/jobs");
  });

  it("sets no cookie without a token", () => {
    const res = call("?next=/jobs");
    expect(res.status).toBe(303);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
