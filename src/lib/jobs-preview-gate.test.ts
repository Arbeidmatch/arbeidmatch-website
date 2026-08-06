import { describe, it, expect, afterEach } from "vitest";
import { isJobsSectionOpen, isPreviewKeyValid, mayViewJobsPreview } from "./jobs-preview-gate";

/**
 * Which way the gate falls, asserted, because it decides whether the owner can open
 * arbeidmatch.no/jobs from a plain link and whether a stranger can.
 *
 * The default was reversed on 6 August 2026: no key configured now means open. The
 * page carries `noindex` either way, and what is behind it is a list of our own open
 * jobs which is already readable on the ATS board without a key.
 */
const KEY = "JOBS_PREVIEW_KEY";

afterEach(() => {
  delete process.env[KEY];
});

describe("with no key configured", () => {
  it("is open, and says so", () => {
    delete process.env[KEY];
    expect(isJobsSectionOpen()).toBe(true);
    expect(mayViewJobsPreview({})).toBe(true);
    expect(mayViewJobsPreview({ paramKey: null, cookieKey: null })).toBe(true);
  });

  it("treats a key too short to be a secret as no key at all", () => {
    // Twelve characters is the floor. A three character "key" in an environment
    // variable is somebody testing, not a lock, and pretending otherwise would leave
    // the section shut for a reason nobody could find.
    process.env[KEY] = "short";
    expect(isJobsSectionOpen()).toBe(true);
    expect(mayViewJobsPreview({})).toBe(true);
  });
});

describe("with a key configured", () => {
  const key = "abcdefghijklmnop";

  it("locks the section to whoever has the link", () => {
    process.env[KEY] = key;
    expect(isJobsSectionOpen()).toBe(false);
    expect(mayViewJobsPreview({})).toBe(false);
    expect(mayViewJobsPreview({ paramKey: "wrong-but-long-enough" })).toBe(false);
    expect(mayViewJobsPreview({ paramKey: key })).toBe(true);
    expect(mayViewJobsPreview({ cookieKey: key })).toBe(true);
  });

  it("refuses an empty candidate", () => {
    process.env[KEY] = key;
    expect(isPreviewKeyValid("")).toBe(false);
    expect(isPreviewKeyValid(null)).toBe(false);
    expect(isPreviewKeyValid(undefined)).toBe(false);
  });
});
