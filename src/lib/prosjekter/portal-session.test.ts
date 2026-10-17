import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PROJ-REST A (17 October 2026): the client's session for the project pages,
 * kept from a redeemed login link, passed to the ATS with a presentation;
 * "Logg inn" and "Send ny lenke" never carry an address the visitor typed.
 */

const callAts = vi.fn(async (_path: string, _init: { method: string; headers?: Record<string, string>; body?: unknown }) => ({
  status: 200,
  body: {} as Record<string, unknown>,
}));
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (path: string, init: { method: string }) => callAts(path, init) }));

import {
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_HEADER,
  intentQuery,
  loginIntentFrom,
  loginTarget,
  sessionHeaders,
  sessionKeyFrom,
} from "./portal-session";
import { GET as innGET } from "@/app/api/prosjekter/inn/[token]/route";
import { GET as presentationGET, POST as presentationPOST } from "@/app/api/prosjekter/presentation/[token]/route";
import { POST as presentationLoginPOST } from "@/app/api/prosjekter/presentation/[token]/logg-inn/route";
import { POST as resendPOST } from "@/app/api/prosjekter/login/[token]/route";

const PRES = "9f9f9f9f-4444-4d4d-8e8e-222222222222";
const PROFILE = "6e6e6e6e-5555-4e4e-8f8f-333333333333";
const SUB = "1c1c1c1c-7777-4a4a-8b8b-555555555555";
const LOGIN = "abcdefghijklmnopqrstuvwxyz012345";
const params = (token: string) => ({ params: Promise.resolve({ token }) });

let ip = 0;
const req = (url: string, init: { method?: string; cookie?: string; body?: unknown } = {}) =>
  new NextRequest(url, {
    method: init.method ?? "GET",
    headers: {
      "x-forwarded-for": `198.51.100.${(ip = (ip % 250) + 1)}`,
      ...(init.cookie ? { cookie: init.cookie } : {}),
      ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });

beforeEach(() => {
  callAts.mockReset();
  callAts.mockImplementation(async () => ({ status: 200, body: {} }));
});

describe("where a redeemed login goes", () => {
  const none = { plan: false, alerts: false, prosjekt: null };
  it("a presentation's Logg inn goes back to the presentation", () => {
    expect(loginTarget({ profile: PROFILE, projects: null }, { ...none, prosjekt: PRES })).toBe(`/prosjekt/${PRES}`);
    expect(loginTarget({ profile: null, projects: SUB }, { ...none, prosjekt: PRES })).toBe(`/prosjekt/${PRES}`);
    expect(loginTarget({ profile: null, projects: null }, { ...none, prosjekt: PRES })).toBeNull();
  });
  it("otherwise as before: Min side, the alerts, the subscription page", () => {
    expect(loginTarget({ profile: PROFILE, projects: SUB }, none)).toBe(`/min-side/${PROFILE}`);
    expect(loginTarget({ profile: PROFILE, projects: SUB }, { ...none, plan: true })).toBe(`/min-side/${PROFILE}?plan=1`);
    expect(loginTarget({ profile: PROFILE, projects: SUB }, { ...none, alerts: true })).toBe(`/prosjekter/${SUB}`);
    expect(loginTarget({ profile: null, projects: SUB }, none)).toBe(`/prosjekter/${SUB}`);
  });
  it("only a presentation token is carried as prosjekt", () => {
    expect(loginIntentFrom(new URLSearchParams(`prosjekt=${PRES}`)).prosjekt).toBe(PRES);
    expect(loginIntentFrom(new URLSearchParams("prosjekt=../../min-side")).prosjekt).toBeNull();
    expect(intentQuery(loginIntentFrom({ prosjekt: PRES }))).toBe(`?prosjekt=${PRES}`);
    expect(intentQuery(loginIntentFrom({ plan: "1" }))).toBe("?plan=1");
  });
  it("the session is the Min side key first, else the subscription's, and only a well-formed one is passed on", () => {
    expect(sessionKeyFrom({ profile: PROFILE, token: SUB })).toBe(PROFILE);
    expect(sessionKeyFrom({ profile: null, token: SUB })).toBe(SUB);
    expect(sessionKeyFrom({ profile: "x", token: 3 })).toBeNull();
    expect(sessionHeaders(PROFILE)).toEqual({ [PORTAL_SESSION_HEADER]: PROFILE });
    expect(sessionHeaders("not a key")).toEqual({});
    expect(sessionHeaders(undefined)).toEqual({});
  });
});

describe("the login link sets the session cookie and returns to the presentation", () => {
  it("redeems, keeps the key httpOnly and redirects", async () => {
    callAts.mockImplementation(async () => ({ status: 200, body: { profile: PROFILE, token: SUB } }));
    const res = await innGET(req(`https://www.example.invalid/api/prosjekter/inn/${LOGIN}?prosjekt=${PRES}`), params(LOGIN));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`https://www.example.invalid/prosjekt/${PRES}`);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${PORTAL_SESSION_COOKIE}=${PROFILE}`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(callAts.mock.calls[0][0]).toBe(`/api/public/project-login/${LOGIN}`);
  });
  it("an expired link goes to the login page, without a cookie", async () => {
    callAts.mockImplementation(async () => ({ status: 410, body: { error: "Lenken er utløpt." } }));
    const res = await innGET(req(`https://www.example.invalid/api/prosjekter/inn/${LOGIN}`), params(LOGIN));
    expect(res.headers.get("location")).toBe(`https://www.example.invalid/prosjekter/inn/${LOGIN}?status=utlopt`);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("the presentation passes the session on, and Logg inn sends no address", () => {
  it("GET and POST carry the cookie's key to the ATS; without a cookie, nothing", async () => {
    await presentationGET(req(`https://www.example.invalid/api/prosjekter/presentation/${PRES}`, { cookie: `${PORTAL_SESSION_COOKIE}=${PROFILE}` }), params(PRES));
    expect(callAts.mock.calls[0][1].headers).toEqual({ [PORTAL_SESSION_HEADER]: PROFILE });
    await presentationPOST(req(`https://www.example.invalid/api/prosjekter/presentation/${PRES}`, { method: "POST", cookie: `${PORTAL_SESSION_COOKIE}=${PROFILE}` }), params(PRES));
    expect(callAts.mock.calls[1][1].headers).toEqual({ [PORTAL_SESSION_HEADER]: PROFILE });
    await presentationGET(req(`https://www.example.invalid/api/prosjekter/presentation/${PRES}`), params(PRES));
    expect(callAts.mock.calls[2][1].headers).toEqual({});
  });
  it("the masked answer and its status reach the page as the ATS gave them", async () => {
    const masked = { project: { project_no: 1, stage: "tender", regions: [], domains: [], value_band: null } };
    callAts.mockImplementation(async () => ({ status: 401, body: { error: "Logg inn for å se prosjektet.", masked, login: true } }));
    const res = await presentationGET(req(`https://www.example.invalid/api/prosjekter/presentation/${PRES}`), params(PRES));
    expect(res.status).toBe(401);
    expect(((await res.json()) as { masked: unknown }).masked).toEqual(masked);
  });
  it("Logg inn posts nothing but the presentation's token", async () => {
    const res = await presentationLoginPOST(
      req(`https://www.example.invalid/api/prosjekter/presentation/${PRES}/logg-inn`, { method: "POST", body: { email: "fremmed@example.invalid" } }),
      params(PRES),
    );
    expect(res.status).toBe(200);
    expect(callAts.mock.calls[0][0]).toBe(`/api/public/project-presentation/${PRES}/login`);
    expect(callAts.mock.calls[0][1].body).toBeUndefined();
  });
  it("Send ny lenke posts nothing but the old link's token", async () => {
    const res = await resendPOST(req(`https://www.example.invalid/api/prosjekter/login/${LOGIN}`, { method: "POST", body: { email: "fremmed@example.invalid" } }), params(LOGIN));
    expect(res.status).toBe(200);
    expect(callAts.mock.calls[0][0]).toBe(`/api/public/project-login/${LOGIN}`);
    expect(callAts.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(callAts.mock.calls[0][1].body).toBeUndefined();
  });
});
