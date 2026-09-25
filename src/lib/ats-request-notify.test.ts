import { describe, expect, it, vi } from "vitest";
import { atsProposeUrl, tellAtsAboutRequest } from "./ats-request-notify";

describe("telling the ATS about a saved request", () => {
  const id = "d4f73751-7ba2-42e0-8ee9-50b3a450e691";

  it("sends only the row's id, to the ATS", () => {
    expect(atsProposeUrl(id)).toBe(`https://ats.arbeidmatch.no/api/public/website-request/${id}/propose`);
    expect(atsProposeUrl("../x")).toBeNull();
  });

  it("posts once and carries no body", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    expect(await tellAtsAboutRequest(id, fetcher as unknown as typeof fetch)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [, init] = fetcher.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("never throws when the ATS cannot be reached", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("down"));
    expect(await tellAtsAboutRequest(id, fetcher as unknown as typeof fetch)).toBe(false);
  });
});
