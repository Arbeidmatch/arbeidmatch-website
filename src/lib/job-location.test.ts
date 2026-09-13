import { afterEach, describe, expect, it, vi } from "vitest";

import { BASE_JOB_LOCATION, fetchPublicJob, fetchPublicJobs, ownJobLocation, ownLocationCounts } from "@/lib/jobs-fetch";

describe("ownJobLocation", () => {
  it("reads the office as the base location, Trondheim", () => {
    // His rule, 13 September 2026: Trondheim is the base location for jobs.
    expect(BASE_JOB_LOCATION).toBe("Trondheim");
    expect(ownJobLocation("Ranheim")).toBe("Trondheim");
    expect(ownJobLocation("Ranheim, Trondheim")).toBe("Trondheim");
    expect(ownJobLocation("Sverre Svendsens veg 38, 7056 Ranheim")).toBe("Trondheim");
  });

  it("gives nothing for an empty location", () => {
    expect(ownJobLocation("")).toBeNull();
    expect(ownJobLocation(null)).toBeNull();
  });

  it("keeps a real town", () => {
    expect(ownJobLocation(" Stavanger ")).toBe("Stavanger");
    expect(ownJobLocation("Strømmen")).toBe("Strømmen");
    expect(ownJobLocation("Trondheim")).toBe("Trondheim");
    expect(ownJobLocation("Bergen & Haugesund")).toBe("Bergen & Haugesund");
  });
});

describe("ownLocationCounts", () => {
  it("folds the office into Trondheim so the strip agrees with the cards", () => {
    expect(
      ownLocationCounts([
        { name: "Ranheim", count: 3 },
        { name: "Stavanger", count: 2 },
        { name: "Trondheim", count: 1 },
      ]),
    ).toEqual([
      { name: "Trondheim", count: 4 },
      { name: "Stavanger", count: 2 },
    ]);
  });

  it("drops empty names", () => {
    expect(ownLocationCounts([{ name: "", count: 2 }])).toEqual([]);
  });
});

describe("the board as the site reads it", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows the office as Trondheim on every job and in the town counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: "1", title: "Car mechanic", location: "Ranheim", country: "Norway", public_slug: "a" },
              { id: "2", title: "Precast Concrete Factory Worker", location: "Stavanger", country: "Norway", public_slug: "b" },
              { id: "3", title: "Painter", location: "Trondheim", country: "Norway", public_slug: "c" },
            ],
            meta: {
              locations: [
                { name: "Ranheim", count: 1 },
                { name: "Stavanger", count: 1 },
                { name: "Trondheim", count: 1 },
              ],
            },
          }),
          { status: 200 },
        ),
      ),
    );
    const result = await fetchPublicJobs();
    expect(result.jobs.map((j) => j.location)).toEqual(["Trondheim", "Stavanger", "Trondheim"]);
    expect(result.locations).toEqual([
      { name: "Trondheim", count: 2 },
      { name: "Stavanger", count: 1 },
    ]);
  });

  it("counts towns from the jobs when the ATS sends no counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: "1", title: "Car mechanic", location: "Ranheim", country: "Norway", public_slug: "a" },
              { id: "2", title: "Painter", location: "Trondheim", country: "Norway", public_slug: "b" },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const result = await fetchPublicJobs();
    expect(result.locations).toEqual([{ name: "Trondheim", count: 2 }]);
  });

  it("shows the office as Trondheim on a single advert", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ data: { id: "1", title: "Electricians", location: "Ranheim", public_slug: "e" } }), { status: 200 }),
      ),
    );
    const job = await fetchPublicJob("e");
    expect(job?.location).toBe("Trondheim");
  });
});
