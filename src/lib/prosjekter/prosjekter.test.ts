import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { callAts, visitorIp, vouchingHeaders } from "@/lib/prosjekter/ats";
import { domainsOf } from "@/lib/prosjekter/domains";
import { cleanDescription, isProjectToken, keyDateNo, placeNo, stageNo, valueNo } from "@/lib/prosjekter/format";
import { filtersFrom, filtersQuery } from "@/lib/prosjekter/types";

/**
 * The project portal pages. These pin what fails silently if it drifts: the
 * headers that let the ATS count visitors rather than this site, the Norwegian
 * words copied from the ATS, the token check before anything is forwarded, and
 * that no file of the portal names where the projects come from.
 */

describe("vouching for a visitor", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("takes the first forwarded address and drops what is not one", () => {
    expect(visitorIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(visitorIp(new Headers({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
    expect(visitorIp(new Headers({ "x-forwarded-for": "<script>" }))).toBeNull();
    expect(visitorIp(new Headers())).toBeNull();
  });

  it("sends the secret and the address together, or neither", () => {
    vi.stubEnv("ATS_EMAIL_SECRET", "s3cret");
    expect(vouchingHeaders(new Headers({ "x-forwarded-for": "203.0.113.7" }))).toEqual({
      "x-arbeidmatch-website-secret": "s3cret",
      "x-arbeidmatch-applicant-ip": "203.0.113.7",
    });
    vi.stubEnv("ATS_EMAIL_SECRET", "");
    expect(vouchingHeaders(new Headers({ "x-forwarded-for": "203.0.113.7" }))).toEqual({});
  });

  it("calls the ATS with the headers and passes its status through", async () => {
    vi.stubEnv("ATS_BASE_URL", "https://ats.example/");
    vi.stubEnv("ATS_EMAIL_SECRET", "s3cret");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: "Lenken er ikke gyldig lenger." }), { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const answer = await callAts("/api/public/project-alerts/x", {
      method: "GET",
      visitorHeaders: new Headers({ "x-forwarded-for": "198.51.100.2" }),
    });
    expect(answer).toEqual({ status: 404, body: { error: "Lenken er ikke gyldig lenger." } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://ats.example/api/public/project-alerts/x");
    expect((init.headers as Record<string, string>)["x-arbeidmatch-applicant-ip"]).toBe("198.51.100.2");
    expect((init.headers as Record<string, string>)["x-arbeidmatch-website-secret"]).toBe("s3cret");
  });

  it("answers 503 in Norwegian when the ATS cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    const answer = await callAts("/api/public/projects-overview", { method: "GET", visitorHeaders: new Headers() });
    expect(answer.status).toBe(503);
    expect(String(answer.body.error)).toMatch(/Prøv igjen/);
  });
});

describe("the overview filters", () => {
  it("keeps only the shapes the ATS reads", () => {
    const f = filtersFrom({ stage: "tender", region: "NO060", domain: "electrical", q: "  skole ", page: "3", x: "y" });
    expect(filtersQuery(f)).toBe("?stage=tender&region=NO060&domain=electrical&q=skole&page=3");
    expect(filtersQuery(filtersFrom({ stage: "cancelled", region: "Oslo';", domain: "A B", page: "-2" }))).toBe("");
  });
});

describe("the words, as in the ATS", () => {
  const now = Date.parse("2026-09-29T10:00:00Z");

  it("names value, place and stage in Norwegian", () => {
    expect(valueNo({ awarded_value_nok: null, estimated_value_nok: 2_450_000 })).toBe("2,5 mill. kr");
    expect(valueNo({ awarded_value_nok: 35_000_000, estimated_value_nok: null })).toBe("35 mill. kr");
    expect(valueNo({ awarded_value_nok: null, estimated_value_nok: 0 })).toBeNull();
    expect(placeNo({ city: "Trondheim", regions: ["NO060"] })).toBe("Trondheim, Trøndelag");
    expect(stageNo({ stage: "tender", deadline_at: "2026-09-01T12:00:00Z" }, now)).toBe("Venter på tildeling");
    expect(keyDateNo({ stage: "tender", deadline_at: "2026-10-15T12:00:00Z", start_on: null, published_on: null }, now)).toMatch(
      /^Tilbudsfrist 15\. oktober 2026$/,
    );
  });

  it("finds the trade in the codes", () => {
    expect(domainsOf(["45310000", "45210000"])).toEqual(["buildings", "electrical"]);
    expect(domainsOf(["45000000"])).toEqual(["general"]);
  });

  it("takes every web address out of a description", () => {
    expect(cleanDescription("Se https://example.org/x og www.example.org for mer.")).toBe("Se og for mer.");
  });

  it("accepts only a uuid as a token", () => {
    expect(isProjectToken("1f0e9c7a-0000-4000-8000-000000000000")).toBe(true);
    expect(isProjectToken("../../admin")).toBe(false);
  });
});

describe("the portal never names its source", () => {
  const root = path.resolve(__dirname, "..", "..");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(tsx?|css)$/.test(name) && !name.endsWith(".test.ts")) files.push(full);
    }
  };
  for (const dir of ["app/prosjekter", "app/prosjekt", "app/api/prosjekter", "components/prosjekter", "lib/prosjekter"]) {
    walk(path.join(root, dir));
  }

  it.each(files.map((f) => [path.relative(root, f), f]))("%s", (_name, file) => {
    const text = readFileSync(file, "utf8").toLowerCase();
    expect(text).not.toMatch(/doffin|offentlige kunngj/);
  });
});
