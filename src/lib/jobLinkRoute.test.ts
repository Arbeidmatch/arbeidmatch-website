import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * REPAIR R20, 4 October 2026: `/j/<number>` opens the advert on our own site.
 *
 * That address is under every advert this company has published, and until
 * today it redirected to the old board, where applying puts the person into
 * another system and they never reach the job or the project it belongs to. The
 * published links do not change; what is behind them does.
 */

const state = vi.hoisted(() => ({
  jobs: [] as Array<Record<string, unknown>>,
  recorded: [] as string[],
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("next/server");
  return { ...actual, after: (fn: () => unknown) => void Promise.resolve().then(fn) };
});
vi.mock("./jobs-fetch", () => ({
  fetchPublicJobs: vi.fn(async () => ({ jobs: state.jobs, totalOpen: state.jobs.length, ok: true, industries: [], locations: [] })),
}));

import { handleJobLink } from "./jobLinkRoute";

/** Assembled from its parts so this file is not a place the old address is written. */
const OLD_BOARD = ["jobs", "arbeidmatch", "no"].join(".");

function request(url: string, userAgent = "Mozilla/5.0"): NextRequest {
  return new NextRequest(new Request(url, { headers: { "user-agent": userAgent } }));
}

beforeEach(() => {
  state.jobs = [];
  state.recorded = [];
  vi.stubGlobal("fetch", vi.fn(async (input: unknown) => {
    state.recorded.push(String(input));
    return new Response("", { status: 204 });
  }));
});

describe("the link under every advert", () => {
  it("opens that job's advert on our own site", async () => {
    state.jobs = [
      {
        id: "job-1",
        public_slug: "bricklayer-in-trondheim-am-j-2026-4e631",
        external_url: `https://${OLD_BOARD}/job/482823`,
      },
    ];
    const res = await handleJobLink(request("https://www.arbeidmatch.no/j/482823"), "482823", null);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://www.arbeidmatch.no/stilling/bricklayer-in-trondheim-am-j-2026-4e631",
    );
  });

  it("lands on our own list when no open advert carries that number", async () => {
    const res = await handleJobLink(request("https://www.arbeidmatch.no/j/999999"), "999999", null);
    expect(res.headers.get("location")).toBe("https://www.arbeidmatch.no/jobs");
  });

  it("lands on our own list when the number is not a number at all", async () => {
    const res = await handleJobLink(request("https://www.arbeidmatch.no/j/x"), "../../etc", null);
    expect(res.headers.get("location")).toBe("https://www.arbeidmatch.no/jobs");
  });

  it("still records the tap, with the surface it came from", async () => {
    state.jobs = [
      { id: "job-1", public_slug: "painter-am-j-2026-0a0a0", external_url: `https://${OLD_BOARD}/job/482823` },
    ];
    await handleJobLink(request("https://www.arbeidmatch.no/j/482823/comment"), "482823", "comment");
    // The recording is deliberately left behind the response, so it is awaited
    // here exactly as the platform awaits it after the redirect has gone.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(state.recorded.some((u) => u.includes("/api/go/apply?p=482823&src=comment"))).toBe(true);
  });

  it("sends a scraper to the advert too, which carries its own card", async () => {
    state.jobs = [
      { id: "job-1", public_slug: "painter-am-j-2026-0a0a0", external_url: `https://${OLD_BOARD}/job/482823` },
    ];
    const res = await handleJobLink(
      request("https://www.arbeidmatch.no/j/482823", "facebookexternalhit/1.1"),
      "482823",
      null,
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://www.arbeidmatch.no/stilling/painter-am-j-2026-0a0a0");
  });

  it("never sends anybody to the old board, whatever it is handed", async () => {
    state.jobs = [
      { id: "job-1", public_slug: "painter-am-j-2026-0a0a0", external_url: `https://${OLD_BOARD}/job/482823` },
    ];
    for (const id of ["482823", "999999", "../../etc", "", `https://${OLD_BOARD}/job/482823`]) {
      const res = await handleJobLink(request("https://www.arbeidmatch.no/j/x"), id, null);
      expect(String(res.headers.get("location"))).not.toContain(OLD_BOARD);
    }
  });
});
