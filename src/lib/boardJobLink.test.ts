import { describe, expect, it } from "vitest";

import { advertDestination, boardPostingId, clickRecordUrl, OUR_JOB_LIST, postingIdOfExternalUrl } from "./boardJobLink";

/**
 * The public link he approved on 16 August 2026: this domain in front of
 * everybody, the posting behind it, and the tap still counted.
 *
 * REPAIR R20, 4 October 2026: what is behind it is the advert's own page on
 * this site. Nothing of ours points at the old board any more - a person who
 * applies there lands in another system and never reaches the job or the
 * project it belongs to - and the links already published keep working.
 */

/** Assembled from its parts so this file is not a place the old address is written. */
const OLD_BOARD = ["jobs", "arbeidmatch", "no"].join(".");

describe("what counts as a posting", () => {
  it("takes a posting number and nothing else", () => {
    expect(boardPostingId("482823")).toBe("482823");
    expect(boardPostingId(" 482823 ")).toBe("482823");
    expect(boardPostingId("bricklayer-9f2c")).toBeNull();
    expect(boardPostingId("482823; drop")).toBeNull();
    expect(boardPostingId("")).toBeNull();
    expect(boardPostingId(null)).toBeNull();
  });
});

describe("where the visitor lands", () => {
  it("is the advert's own page on this site", () => {
    expect(advertDestination("bricklayer-in-trondheim-am-j-2026-4e631")).toBe(
      "https://www.arbeidmatch.no/stilling/bricklayer-in-trondheim-am-j-2026-4e631",
    );
  });

  it("is our own list when there is no advert to open, never an error page", () => {
    expect(advertDestination("")).toBe(OUR_JOB_LIST);
    expect(advertDestination(undefined)).toBe(OUR_JOB_LIST);
    expect(OUR_JOB_LIST).toBe("https://www.arbeidmatch.no/jobs");
  });

  it("never sends anybody to a host that is not ours", () => {
    for (const bad of [
      "https://evil.example.com",
      "//evil.example.com",
      "javascript:alert(1)",
      "482823@evil.com",
      "../../etc",
      `https://${OLD_BOARD}/job/482823`,
    ]) {
      expect(advertDestination(bad).startsWith("https://www.arbeidmatch.no/")).toBe(true);
      expect(advertDestination(bad)).not.toContain(OLD_BOARD);
    }
  });

  it("never names the old board, whatever it is given", () => {
    for (const value of ["482823", "", "bricklayer-in-trondheim-am-j-2026-4e631", null, undefined]) {
      expect(advertDestination(value)).not.toContain(OLD_BOARD);
    }
  });
});

describe("the posting number on an imported advert", () => {
  it("is read off the path, whichever system the row came from", () => {
    expect(postingIdOfExternalUrl(`https://${OLD_BOARD}/job/482823`)).toBe("482823");
    expect(postingIdOfExternalUrl(`https://${OLD_BOARD}/job/482823/`)).toBe("482823");
  });

  it("is null for anything that is not one advert", () => {
    expect(postingIdOfExternalUrl(`https://${OLD_BOARD}`)).toBeNull();
    expect(postingIdOfExternalUrl(`https://${OLD_BOARD}/job/bricklayer-9f2c`)).toBeNull();
    expect(postingIdOfExternalUrl("not a url")).toBeNull();
    expect(postingIdOfExternalUrl(null)).toBeNull();
    expect(postingIdOfExternalUrl("")).toBeNull();
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
