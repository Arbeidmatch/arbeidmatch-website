import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const base = process.env.RECOS_BASE_URL || 'http://127.0.0.1:4175';
const browser = await chromium.launch();
try {
 const page = await browser.newPage({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 2 });
 const cases = ['overview', 'candidates', 'pipeline', 'messages'].map(view => ({ view, seats: 1, file: view }));
 for (let seats = 1; seats <= 8; seats++) cases.push({ view: 'team', seats, file: 'team-' + seats });
 for (const item of cases) {
  await page.goto(`${base}/recos-experience/product-preview.html?view=${item.view}&seats=${item.seats}`);
  await page.waitForFunction(view => document.body.dataset.view === view, item.view);
  await page.addStyleTag({ path: fileURLToPath(new URL('./recos-capture.css', import.meta.url)) });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: fileURLToPath(new URL('../public/recos-experience/assets/recos-' + item.file + '.png', import.meta.url)) });
  console.log('Captured fictional presentation at 2400 x 1500:', item.file);
 }
} finally { await browser.close(); }
