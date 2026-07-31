import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

/**
 * Captures the builder steps and the finished layouts for the /cv guide.
 *
 * Run a dev server first, then `npm run cv:screenshots`. The builder is seeded through
 * the `?demo=1` flag, which only works outside production, so no real person's data can
 * ever end up in a screenshot.
 */

const BASE_URL = process.env.CV_SCREENSHOT_BASE_URL?.trim() || "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "public", "images", "cv-guide");
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const STEPS: Array<{ key: string; step: number }> = [
  { key: "step-1-template", step: 1 },
  { key: "step-2-details", step: 2 },
  { key: "step-3-summary", step: 3 },
  { key: "step-4-experience", step: 4 },
  { key: "step-5-education", step: 5 },
  { key: "step-6-certificates", step: 6 },
  { key: "step-7-skills", step: 7 },
  { key: "step-8-cover-letter", step: 8 },
  { key: "step-9-review", step: 9 },
];

async function capture(page: Page, url: string, file: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  // The preview debounces at 300ms, so wait past it before the shutter.
  await page.waitForTimeout(600);
  await page.screenshot({ path: file, type: "png", fullPage: false });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const shots: Record<string, { desktop: string; mobile: string; width: number; height: number }> = {};

  try {
    const desktop = await browser.newPage({ viewport: DESKTOP, deviceScaleFactor: 2 });
    const mobile = await browser.newPage({ viewport: MOBILE, deviceScaleFactor: 2 });

    for (const { key, step } of STEPS) {
      const url = `${BASE_URL}/cv-gen?demo=1&step=${step}`;
      const desktopFile = path.join(OUT_DIR, `${key}-desktop.png`);
      const mobileFile = path.join(OUT_DIR, `${key}-mobile.png`);

      await capture(desktop, url, desktopFile);
      await capture(mobile, url, mobileFile);

      shots[key] = {
        desktop: `/images/cv-guide/${key}-desktop.png`,
        mobile: `/images/cv-guide/${key}-mobile.png`,
        width: DESKTOP.width,
        height: DESKTOP.height,
      };
      process.stdout.write(`captured ${key}\n`);
    }

    await writeFile(
      path.join(OUT_DIR, "manifest.json"),
      `${JSON.stringify({ generatedAt: new Date().toISOString(), shots }, null, 2)}\n`,
      "utf8",
    );
    process.stdout.write(`\nWrote manifest with ${Object.keys(shots).length} entries.\n`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
