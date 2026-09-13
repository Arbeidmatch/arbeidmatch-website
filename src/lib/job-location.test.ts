import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPublicJob, fetchPublicJobs, ownJobLocation } from "@/lib/jobs-fetch";

describe("ownJobLocation", () => {
  it("never gives the office as a place of work", () => {
    expect(ownJobLocation("Ranheim")).toBeNull();
    expect(ownJobLocation("Ranheim, Trondheim")).toBeNull();
    expect(ownJobLocation("Sverre Svendsens veg 38, 7056 Ranheim")).toBeNull();
    expect(ownJobLocation("")).toBeNull();
    expect(ownJobLocation(null)).toBeNull();
  });

  it("keeps a real town", () => {
    expect(ownJobLocation(" Stavanger ")).toBe("Stavanger");
    expect(ownJobLocation("Strømmen")).toBe("Strømmen");
    expect(ownJobLocation("Trondheim")).toBe("Trondheim");
  });
});

describe("the board as the site reads it", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("drops the office from every job and from the town counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: "1", title: "Car Mechanic, Bergen and Haugesund", location: "Ranheim", country: "Norway", public_slug: "a" },
              { id: "2", title: "Precast Concrete Factory Worker", location: "Stavanger", country: "Norway", public_slug: "b" },
            ],
            meta: { locations: [{ name: "Ranheim", count: 1 }, { name: "Stavanger", count: 1 }] },
          }),
          { status: 200 },
        ),
      ),
    );
    const result = await fetchPublicJobs();
    expect(result.jobs.map((j) => j.location)).toEqual([null, "Stavanger"]);
    expect(result.locations).toEqual([{ name: "Stavanger", count: 1 }]);
  });

  it("drops the office from a single advert", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ data: { id: "1", title: "Electricians", location: "Ranheim", public_slug: "e" } }), { status: 200 }),
      ),
    );
    const job = await fetchPublicJob("e");
    expect(job?.location).toBeNull();
  });
});
