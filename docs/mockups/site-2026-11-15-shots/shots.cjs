// Paired screenshots: the approved mockup beside the site, at 1440 and 390.
// node shots.cjs <base-url> <out-dir> <pairs-json>   pairs: [{name, route, page, sheet?, open?}]
const { chromium } = require(process.env.PW || 'playwright');
const path = require('path'); const fs = require('fs');
const [,, base, out, pairsJson] = process.argv;
const pairs = JSON.parse(fs.readFileSync(pairsJson, 'utf8'));
const MOCK = 'file:///' + path.resolve(process.env.MOCK).split(String.fromCharCode(92)).join('/');
(async () => {
  const browser = await chromium.launch();
  fs.mkdirSync(out, { recursive: true });
  for (const w of [1440, 390]) {
    const dev = w === 1440 ? 'desk' : 'phone';
    // Mockup
    const mctx = await browser.newContext({ viewport: { width: w === 1440 ? 1440 : 430, height: 1000 }, deviceScaleFactor: 1 });
    const mp = await mctx.newPage();
    await mp.goto(MOCK); await mp.waitForTimeout(500);
    await mp.click(`[data-dev="${dev}"]`); await mp.waitForTimeout(300);
    for (const p of pairs) {
      if (p.page) { await mp.click(`#pgs [data-go="${p.page}"]`); await mp.waitForTimeout(400); }
      if (p.sheet) { await mp.click(`#shs [data-sheet="${p.sheet}"]`); await mp.waitForTimeout(700); }
      if (!p.sheet) await mp.evaluate(() => { const s = document.getElementById('scroll'); const vp = document.getElementById('vp'); const st = document.getElementById('stage'); const ck = document.getElementById('ck'); if (ck) ck.style.display = 'none'; const h = s.scrollHeight; vp.style.setProperty('height', h + 'px'); st.style.setProperty('height', 'auto'); for (const el of [vp, st]) Object.defineProperty(el.style, 'height', { configurable: true, get() { return el.style.getPropertyValue('height'); }, set() {} }); }); await mp.waitForTimeout(200);
      await mp.locator('#stage').screenshot({ path: path.join(out, `${p.name}-mockup-${w}.png`) });
      if (!p.sheet) await mp.evaluate(() => { for (const id of ['vp', 'stage']) { const el = document.getElementById(id); delete el.style.height; } const vp = document.getElementById('vp'); vp.style.height = '800px'; });
      if (p.sheet) { await mp.keyboard.press('Escape'); await mp.locator('.scrim').click({ force: true }).catch(() => {}); await mp.waitForTimeout(400); }
    }
    await mctx.close();
    // Site
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 1440 ? 900 : 844 }, deviceScaleFactor: 1, isMobile: w === 390, hasTouch: w === 390 });
    await ctx.addInitScript(() => { try { localStorage.setItem('arbeidmatch_cookie_consent_v2', JSON.stringify({ v: 2, necessary: true, analytics: false, marketing: false, ts: new Date().toISOString() })); } catch {} });
    const sp = await ctx.newPage();
    for (const p of pairs) {
      await sp.goto(base + p.route, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
      await sp.waitForTimeout(800);
      const sw = await sp.evaluate(() => document.documentElement.scrollWidth);
      const sh = await sp.evaluate(() => document.documentElement.scrollHeight);
      const op = (w === 390 && p.open390) || p.open; if (op) { for (const s of op.split('>>>')) { await sp.click(s.trim()).catch(e => console.log('open failed', p.name, e.message.slice(0,80))); await sp.waitForTimeout(700); } } if (false) { await sp.click(p.open).catch(e => console.log('open failed', p.name, e.message)); await sp.waitForTimeout(800); }
      await sp.screenshot({ path: path.join(out, `${p.name}-site-${w}.png`), fullPage: !(p.open || p.open390) });
      console.log(JSON.stringify({ name: p.name, w, scrollWidth: sw, height: sh, screens: +(sh / (w === 1440 ? 800 : 844)).toFixed(2) }));
    }
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
