import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ORDER 415, 21 November 2026: the website security audit of 20 November.
 * Each test is one finding that must not come back.
 */

const root = process.cwd();

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

describe("the website holds no key to the ATS database", () => {
  it("reads neither ATS service-role variable anywhere in its source", () => {
    const offenders = sourceFiles(join(root, "src")).filter((f) =>
      /SUPABASE_ATS_SERVICE_KEY|ATS_SUPABASE_SERVICE_ROLE_KEY/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});

describe("no model is paid per call to repair the site", () => {
  it("has no auto-fix workflow and no script that calls a model", () => {
    expect(existsSync(join(root, ".github/workflows/auto-fix.yml"))).toBe(false);
    expect(existsSync(join(root, ".github/scripts/generate-fix.js"))).toBe(false);
    expect(existsSync(join(root, ".github/scripts/apply-fix.js"))).toBe(false);
  });
});

describe("premium access is never handed out for an address alone", () => {
  it("has no start-trial and no check-email route", () => {
    expect(existsSync(join(root, "src/app/api/premium/start-trial/route.ts"))).toBe(false);
    expect(existsSync(join(root, "src/app/api/premium/check-email/route.ts"))).toBe(false);
  });
});

describe("a website error opened as a GitHub issue", () => {
  const fetchMock = vi.fn();
  const env = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ number: 1 }) });
    vi.stubGlobal("fetch", fetchMock);
    Object.assign(process.env, { NODE_ENV: "production", GITHUB_TOKEN: "test-token" });
    delete process.env.SMTP_PASS;
    delete process.env.ATS_EMAIL_SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...env };
  });

  it("carries the route and a short code, never the message, stack or context", async () => {
    vi.doMock("@/lib/supabaseService", () => ({ getSupabaseServiceClient: () => null }));
    const { notifyError, errorCode } = await import("@/lib/errorNotifier");
    const error = new Error("insert failed for Acme Bygg AS, ola@acme.no");
    await notifyError({ route: "/api/contact", error, context: { company: "Acme Bygg AS" } });

    const issueCall = fetchMock.mock.calls.find(([url]) => String(url).includes("api.github.com"));
    expect(issueCall).toBeTruthy();
    const sent = JSON.parse(String(issueCall![1].body)) as { title: string; body: string; labels: string[] };
    const all = `${sent.title}\n${sent.body}`;
    expect(all).toContain("/api/contact");
    expect(all).toContain(errorCode(error));
    expect(all).not.toMatch(/Acme|ola@|insert failed|at .*\.ts/);
    expect(sent.labels).not.toContain("auto-fix-pending");
  });

  it("gives the same code to every repeat of the same error", async () => {
    const { errorCode } = await import("@/lib/errorNotifier");
    expect(errorCode(new TypeError("x is undefined"))).toBe(errorCode(new TypeError("x is undefined")));
    expect(errorCode(new TypeError("x is undefined"))).toMatch(/^TypeError-[0-9a-f]{8}$/);
  });
});
