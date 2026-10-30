import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORM_RENDERED_AT_FIELD, filledTooFast, MIN_FILL_MS } from "./humanCheck";
import { isKeyRateLimited } from "./apiSecurity";

function readSource(dir: string): string {
  let out = "";
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out += readSource(full);
    else if (/\.(ts|tsx|css|mdx?)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out += fs.readFileSync(full, "utf8");
  }
  return out;
}

describe("no outside human check on any form (ORDER 187)", () => {
  it("never loads or calls the outside challenge again", () => {
    const source = readSource(path.join(process.cwd(), "src")).toLowerCase();
    expect(source.includes("challenges.cloudflare.com")).toBe(false);
    expect(source.includes("turnstile")).toBe(false);
    const pkg = fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8").toLowerCase();
    expect(pkg.includes("turnstile")).toBe(false);
  });
});

describe("our own layers", () => {
  const NOW = 1_770_000_000_000;

  it("refuses a form filled in under three seconds and passes a person", () => {
    expect(filledTooFast({ [FORM_RENDERED_AT_FIELD]: String(NOW - (MIN_FILL_MS - 500)) }, NOW)).toBe(true);
    expect(filledTooFast({ [FORM_RENDERED_AT_FIELD]: NOW - 20_000 }, NOW)).toBe(false);
  });

  it("does not refuse when the stamp is missing, the other layers still apply", () => {
    expect(filledTooFast({}, NOW)).toBe(false);
    expect(filledTooFast({ [FORM_RENDERED_AT_FIELD]: "junk" }, NOW)).toBe(false);
  });

  it("limits one e-mail however many addresses it comes from", () => {
    const hits = [1, 2, 3, 4, 5].map(() => isKeyRateLimited("test-scope", "Same@Example.no", 3, 60_000));
    expect(hits).toEqual([false, false, false, true, true]);
    expect(isKeyRateLimited("test-scope", "other@example.no", 3, 60_000)).toBe(false);
  });
});
