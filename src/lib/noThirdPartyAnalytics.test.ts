import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Legal review, 25 September 2026: arbeidmatch.no loads no analytics tag from
 * outside the EU. Pageviews are counted first-party and without cookies
 * (TrafficBeacon, /api/track). This keeps a tag from coming back unnoticed.
 */

const SRC = join(__dirname, "..");
const ROOT = join(SRC, "..");

const FORBIDDEN = [
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
  /\bgtag\s*\(/,
  /@next\/third-parties/,
  /@vercel\/analytics/,
  /clarity\.ms/i,
  /connect\.facebook\.net/i,
];

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...files(full));
    else if (/\.(ts|tsx|js|mjs)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

describe("no third-party analytics tag", () => {
  it("nothing in the source loads one", () => {
    const hits: string[] = [];
    for (const file of files(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const re of FORBIDDEN) if (re.test(text)) hits.push(`${relative(SRC, file)}: ${re}`);
    }
    expect(hits).toEqual([]);
  });

  it("no analytics package is a dependency, and the CSP allows no tag host", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(deps.filter((d) => /third-parties|analytics|gtag|tagmanager/i.test(d))).toEqual([]);
    const config = readFileSync(join(ROOT, "next.config.ts"), "utf8");
    expect(config).not.toMatch(/googletagmanager|google-analytics/i);
  });
});
