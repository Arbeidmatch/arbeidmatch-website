import { describe, expect, it } from "vitest";

import { boardDestination, boardPostingId, clickRecordUrl } from "./boardJobLink";

/**
 * The public link he approved on 16 August 2026: this domain in front of
 * everybody, the board posting behind it, and the tap still counted.
 */

describe("what counts as a posting", () => {
  it("takes a board posting id and nothing else", () => {
    expect(boardPostingId("482823")).toBe("482823");
    expect(boardPostingId(" 482823 ")).toBe("482823");
    expect(boardPostingId("bricklayer-9f2c")).toBeNull();
    expect(boardPostingId("482823; drop")).toBeNull();
    expect(boardPostingId("")).toBeNull();
    expect(boardPostingId(null)).toBeNull();
  });
});

describe("where the visitor lands", () => {
  it("is the posting on the board", () => {
    expect(boardDestination("482823")).toBe("https://jobs.arbeidmatch.no/job/482823");
  });

  it("is the board itself when the link is broken, never an error page", () => {
    expect(boardDestination("../../etc")).toBe("https://jobs.arbeidmatch.no");
    expect(boardDestination(undefined)).toBe("https://jobs.arbeidmatch.no");
  });

  it("never sends anybody to a host that is not ours", () => {
    for (const bad of ["https://evil.example.com", "//evil.example.com", "javascript:alert(1)", "482823@evil.com"]) {
      expect(boardDestination(bad).startsWith("https://jobs.arbeidmatch.no")).toBe(true);
    }
  });
});

describe("where the tap is recorded", () => {
  it("goes to the ATS redirect, carrying the surface it came from", () => {
    expect(clickRecordUrl("482823", "comment")).toBe("https://ats.arbeidmatch.no/api/go/apply?p=482823&src=comment");
    expect(clickRecordUrl("482823", "post")).toBe("https://ats.arbeidmatch.no/api/go/apply?p=482823&src=post");
  });

  it("defaults to the comment, which is where these links live", () => {
    expect(clickRecordUrl("482823", null)).toContain("src=comment");
  });

  it("cannot be talked into recording something else", () => {
    expect(clickRecordUrl("482823", "comment&j=other")).toBe("https://ats.arbeidmatch.no/api/go/apply?p=482823&src=commentjother");
    expect(clickRecordUrl("nu-e-id", "comment")).toBeNull();
  });
});
