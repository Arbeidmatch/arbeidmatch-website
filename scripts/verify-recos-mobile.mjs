import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const base = process.env.RECOS_BASE_URL || 'http://127.0.0.1:4175';
const browser = await chromium.launch({ args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const context = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  // A slow image request must not freeze the page's chapter updates.
  let releaseAssets;
  const assetsReady = new Promise(resolve => { releaseAssets = resolve; });
  await page.route('**/recos-experience/assets/*.png', async route => {
    await assetsReady;
    await route.continue();
  });
  await page.goto(base + '/recos', { waitUntil: 'domcontentloaded' });
  try {
    await page.locator('.primary-entry').tap();
    await page.waitForFunction(() => document.body.dataset.chapter === '1', null, { timeout: 7000 });
    console.log('PASS: Android touch navigation works while scene images are downloading');
  } finally {
    releaseAssets();
  }
  await page.waitForFunction(() => document.body.dataset.scene === 'ready');
  console.log('PASS: scene finishes loading after navigation');
  await page.waitForFunction(() => document.body.dataset.travel === 'arrived');
  await page.locator('.chapter-rail [data-go="0"]').tap();
  await page.waitForFunction(() => document.querySelector('canvas').dataset.progress === '0.000' && scrollY === 0);

  // Android's address bar changes viewport height during a swipe, not width.
  await page.evaluate(() => scrollTo(0, 180));
  await page.setViewportSize({ width: 412, height: 790 });
  await page.waitForFunction(() => document.body.dataset.chapter === '1' && document.body.dataset.travel === 'arrived', null, { timeout: 7000 });
  assert.ok(await page.evaluate(() => scrollY > 500), 'Height changes must not reset a swipe to the first chapter');
  console.log('PASS: address-bar height change preserves forward navigation');

  // Exercise a native touch swipe instead of mouse scrolling on a narrow page.
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 206, y: 460 }] });
  for (let y = 430; y >= 160; y -= 30) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 206, y }] });
    await page.waitForTimeout(40);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => document.body.dataset.chapter === '2' && document.body.dataset.travel === 'arrived');
  await page.locator('#open-product').tap();
  await page.frameLocator('#product-frame').locator('body[data-view="team"]').waitFor();
  assert.equal(await page.locator('#product-dialog').isVisible(), true);
  assert.deepEqual(errors, []);
  console.log('PASS: native Android swipe and interactive preview, no runtime errors');
  await context.close();
} finally {
  await browser.close();
}
