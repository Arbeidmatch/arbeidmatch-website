import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ callAts: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (...a: unknown[]) => h.callAts(...a) }));

import { POST } from "./route";
import { PASSKEY_CHALLENGE_COOKIE } from "@/lib/min-side/passkey";
import { PORTAL_SESSION_COOKIE } from "@/lib/prosjekter/portal-session";

/**
 * The website's half of the Min side passkeys (ORDER 228): a session is needed
 * to add a key, the ATS's challenge id goes into an httpOnly cookie and back,
 * a refused sign-in sets no session, and an accepted one sets the same session
 * cookie the login link sets.
 */

const TOKEN = "aaaaaaaa-0000-4000-8000-000000000001";
const PROFILE = "cccccccc-0000-4000-8000-000000000003";
const CHALLENGE = "11111111-2222-4333-8444-555555555555";

function req(step: string, body: unknown, cookie?: string) {
  return new NextRequest(`https://www.arbeidmatch.no/api/min-side/passkey/${step}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}
const ctx = (step: string) => ({ params: Promise.resolve({ step }) });

beforeEach(() => h.callAts.mockReset());

describe("/api/min-side/passkey/<step>", () => {
  it("does not start adding a key without a Min side session", async () => {
    const res = await POST(req("register-options", {}), ctx("register-options"));
    expect(res.status).toBe(400);
    expect(h.callAts).not.toHaveBeenCalled();
  });

  it("keeps the ATS challenge in an httpOnly cookie and never in the answer", async () => {
    h.callAts.mockResolvedValue({ status: 200, body: { options: { challenge: "x" }, challenge_id: CHALLENGE } });
    const res = await POST(req("register-options", { token: TOKEN }), ctx("register-options"));
    expect(res.status).toBe(200);
    expect(h.callAts).toHaveBeenCalledWith("/api/public/client-profile/passkey/register/options", expect.objectContaining({ body: { session: TOKEN } }));
    const json = await res.json();
    expect(json.challenge_id).toBeUndefined();
    const set = res.cookies.get(PASSKEY_CHALLENGE_COOKIE);
    expect(set?.value).toBe(CHALLENGE);
    expect(set?.httpOnly).toBe(true);
  });

  it("sets the portal session cookie when the ATS accepts the passkey", async () => {
    h.callAts.mockResolvedValue({ status: 200, body: { ok: true, profile: PROFILE } });
    const res = await POST(req("login-verify", { response: { id: "cred-1" } }, `${PASSKEY_CHALLENGE_COOKIE}=${CHALLENGE}`), ctx("login-verify"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, redirect: `/min-side/${PROFILE}` });
    expect(h.callAts).toHaveBeenCalledWith("/api/public/client-profile/passkey/login/verify", expect.objectContaining({ body: { challenge_id: CHALLENGE, response: { id: "cred-1" } } }));
    const session = res.cookies.get(PORTAL_SESSION_COOKIE);
    expect(session?.value).toBe(PROFILE);
    expect(session?.httpOnly).toBe(true);
    expect(res.cookies.get(PASSKEY_CHALLENGE_COOKIE)?.value).toBe("");
  });

  it("sets no session and passes the sentence on when the passkey is refused", async () => {
    h.callAts.mockResolvedValue({ status: 401, body: { error: "Vi kjente ikke igjen nøkkelen. Logg inn med e-post i stedet." } });
    const res = await POST(req("login-verify", { response: { id: "cred-gone" } }, `${PASSKEY_CHALLENGE_COOKIE}=${CHALLENGE}`), ctx("login-verify"));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/e-post/);
    expect(res.cookies.get(PORTAL_SESSION_COOKIE)).toBeUndefined();
  });

  it("removes only with a session and a well-formed id", async () => {
    const bad = await POST(req("remove", { token: TOKEN, id: "x" }), ctx("remove"));
    expect(bad.status).toBe(400);
    h.callAts.mockResolvedValue({ status: 200, body: { ok: true, passkeys: [] } });
    const ok = await POST(req("remove", { token: TOKEN, id: CHALLENGE }), ctx("remove"));
    expect(ok.status).toBe(200);
    expect(h.callAts).toHaveBeenCalledWith("/api/public/client-profile/passkey/credentials", expect.objectContaining({ body: { session: TOKEN, action: "remove", id: CHALLENGE } }));
  });

  it("answers 404 for a step it does not know", async () => {
    const res = await POST(req("anything", {}), ctx("anything"));
    expect(res.status).toBe(404);
  });
});
