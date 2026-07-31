import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import sharp from "sharp";

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

/** The dev server's own overlay badge, which belongs in no screenshot. */
const HIDE_DEV_OVERLAY = "nextjs-portal { display: none !important; }";

/** Accept the cookie banner once, so it does not sit across the bottom of every shot. */
async function dismissCookieBanner(page: Page): Promise<void> {
  const accept = page.getByRole("button", { name: /got it|accept/i }).first();
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Playwright writes PNG only. Nine steps at two viewports and 2x density comes to
 * several megabytes of PNG, so each shot is converted to webp and the PNG discarded.
 */
async function capture(page: Page, url: string, file: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE_DEV_OVERLAY });
  await dismissCookieBanner(page);
  // The preview debounces at 300ms, so wait past it before the shutter.
  await page.waitForTimeout(700);

  const temporaryPng = `${file}.png`;
  await page.screenshot({ path: temporaryPng, type: "png", fullPage: false });
  await sharp(temporaryPng).webp({ quality: 82 }).toFile(file);
  await rm(temporaryPng, { force: true });
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

      await capture(desktop, url, path.join(OUT_DIR, `${key}-desktop.webp`));
      await capture(mobile, url, path.join(OUT_DIR, `${key}-mobile.webp`));

      shots[key] = {
        desktop: `/images/cv-guide/${key}-desktop.webp`,
        mobile: `/images/cv-guide/${key}-mobile.webp`,
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
