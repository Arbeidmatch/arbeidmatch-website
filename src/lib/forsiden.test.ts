import { describe, expect, it } from "vitest";
import { industryOf, jobCardImage, jobReference, type PublicJob } from "./jobs-fetch";

/** A row shaped like the ones /api/public/jobs actually returns. */
function job(overrides: Partial<PublicJob> = {}): PublicJob {
  return {
    id: "j1",
    title: "Bricklayer in Trondheim",
    category: "Construction",
    location: "Ranheim",
    country: "NO",
    hourly_rate_offer: null,
    salary_fixed: null,
    salary_range_min: null,
    salary_range_max: null,
    salary_mode: null,
    accommodation_provided: null,
    rotation: null,
    shift_type: null,
    required_driver_licenses: null,
    public_applies: null,
    public_views: 57,
    public_likes: 0,
    public_slug: "bricklayer-in-trondheim-ranheim-am-j-2026-4e631",
    public_show_company: null,
    external_image_url: null,
    published_at: null,
    created_at: null,
    ...overrides,
  };
}

describe("jobReference", () => {
  it("prefers the reference the ATS resolved", () => {
    expect(jobReference(job({ reference: "AM-J-2026-4E631" }))).toBe("AM-J-2026-4E631");
  });

  it("reads it out of the slug when the ATS has not shipped the change yet", () => {
    // The two repos deploy separately, so this side must keep working against
    // an older ATS rather than showing a gap where the reference goes.
    expect(jobReference(job())).toBe("AM-J-2026-4E631");
  });

  it("has none when the slug carries none", () => {
    expect(jobReference(job({ public_slug: "old-style-slug", reference: null }))).toBeNull();
  });
});

describe("industryOf", () => {
  it("takes the ATS's answer when it is there", () => {
    expect(industryOf(job({ industry: "automotive" }))).toBe("automotive");
  });

  it("works it out from the title when the ATS has not sent one", () => {
    // Same trap as on the ATS side: three live postings are titled "Car
    // mechanic" and filed under Construction.
    expect(industryOf(job({ title: "Car mechanic", category: "Construction", industry: null }))).toBe("automotive");
    expect(industryOf(job({ title: "Electricians with DSB Certification", category: "Manufacturing" }))).toBe(
      "electrical",
    );
  });

  it("never returns nothing, so the strip always has four", () => {
    expect(industryOf(job({ title: "Two people needed", category: null, industry: null }))).toBe("construction");
  });
});

describe("jobCardImage", () => {
  it("uses our own address, so the mark is on the file everywhere it is re-posted", () => {
    expect(jobCardImage(job())).toMatch(/\/api\/public\/job-card-image\/bricklayer-in-trondheim/);
  });

  it("sends a posting with no slug to the logo rather than to a hole in the row", () => {
    expect(jobCardImage(job({ public_slug: null }))).toMatch(/job-card-image\/fallback$/);
  });

  it("never points at the source board directly", () => {
    // The whole reason for the proxy: a picture served from cdn.recman.io
    // carries no mark and is not ours wherever it lands next.
    const src = jobCardImage(job({ external_image_url: "https://cdn.recman.io/x/photo.jpg" }));
    expect(src).not.toContain("cdn.recman.io");
  });
});
