# Unified homepage stats - Wix embed (reference)

The production **Next.js** site uses the React component `src/components/UnifiedHomeStats.tsx` (single source of truth). If you maintain a **parallel Wix** homepage, use this document to replicate the block.

## 1) Remove the two old counter blocks in Wix

1. **Editor → Pages → Home.**
2. Identify **hero** widgets that show live or static numbers (e.g. “candidates today”, “active on site”, “total visits”) inside a dark card - **delete that entire strip/column.**
3. Scroll to the **“Why Norwegian companies choose us”** (or similar) area and find the **four light stat cards** (500+, 50+, 10+, 98%) - **delete that whole group** (or the column that only contains those cards).
4. **Publish** and verify in preview that no duplicate metrics remain.

## 2) Insert the new unified block (Custom embed)

1. In the editor, place the cursor **immediately under the main hero headline / intro** (before “Who are you?” or the next major section).
2. Add **Embed** → **HTML iframe** / **Custom element** / **Embed HTML** (wording depends on Wix version).
3. Paste the snippet below (adjust container width to **100%** and remove extra margins if Wix adds them).

> Wix may sanitize `<script>`. If scripts are stripped, host the stats on your Next site only, or use **Velo** to inject the script from the page code tab.

### HTML shell

```html
<section
  id="am-unified-stats"
  class="am-stats-root"
  aria-label="ArbeidMatch key results"
  style="background:#0f1923;color:#fff;font-family:system-ui,-apple-system,sans-serif;"
>
  <div class="am-stats-inner">
    <!-- populated by script -->
  </div>
</section>
```

### CSS (`<style>` in embed or Page CSS)

```css
.am-stats-root { width:100%; padding:80px 0; opacity:0; transition:opacity 0.4s ease-out; }
.am-stats-root.am-stats--visible { opacity:1; }
.am-stats-inner { max-width:1200px; margin:0 auto; padding:0 16px; }
.am-stats-grid {
  display:grid; grid-template-columns:1fr; gap:0;
}
@media (min-width:768px){ .am-stats-grid{ grid-template-columns:repeat(2,1fr);} }
@media (min-width:1024px){ .am-stats-grid{ grid-template-columns:repeat(3,1fr);} }
.am-stat {
  text-align:center; padding:32px 16px;
  border-top:1px solid rgba(201,168,76,0.3);
}
.am-stat-num {
  font-size:clamp(2.75rem,5.5vw,4.5rem); font-weight:800; color:#C9A84C;
  font-variant-numeric:tabular-nums; line-height:1;
}
.am-stat-label {
  margin-top:16px; font-size:14px; font-weight:500; text-transform:uppercase;
  letter-spacing:0.08em; color:#fff; opacity:0.7;
}
@media(min-width:768px){
  .am-stat:nth-child(odd){ border-right:1px solid rgba(255,255,255,0.08); }
  .am-stat:nth-child(even){ border-right:none; }
}
@media(min-width:1024px){
  .am-stat{ border-right:1px solid rgba(255,255,255,0.08); }
  .am-stat:nth-child(3n){ border-right:none; }
}
```

### JavaScript (count-up + Intersection Observer)

Standalone example (adjust selectors if your HTML differs). Same targets as production: **500+, 50+, 30, 98%, 94,288+, 2 weeks** (duration **2000ms**, stagger **100ms**).

```html
<script>
(function () {
  var root = document.getElementById("am-unified-stats");
  if (!root) return;
  var inner = root.querySelector(".am-stats-inner");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stats = [
    { key: "a", end: 500, suffix: "+", label: "Placements completed", aria: "500 plus placements completed" },
    { key: "b", end: 50, suffix: "+", label: "Active Norwegian clients", aria: "50 plus active Norwegian clients" },
    { key: "d", end: 98, suffix: "%", label: "Client satisfaction rate", aria: "98 percent client satisfaction rate" },
    { key: "e", end: 94288, suffix: "+", label: "Total visits", aria: "94,288 plus total visits", locale: true },
  ];
  var grid = document.createElement("div");
  grid.className = "am-stats-grid";
  inner.appendChild(grid);

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  stats.forEach(function (s, i) {
    var art = document.createElement("article");
    art.className = "am-stat";
    art.setAttribute("aria-label", s.aria);
    art.innerHTML =
      '<div aria-hidden="true"><div class="am-stat-num" data-idx="' +
      i +
      '">0</div><div class="am-stat-label">' +
      s.label +
      "</div></div>";
    grid.appendChild(art);
  });

  var euStat = document.createElement("article");
  euStat.className = "am-stat";
  euStat.setAttribute("aria-label", "Sourcing across EU and EEA countries");
  euStat.innerHTML =
    '<div aria-hidden="true"><div class="am-stat-num am-stat-eu" style="opacity:1">EU and EEA</div><div class="am-stat-label">Source countries</div></div>';
  grid.appendChild(euStat);

  var del = document.createElement("article");
  del.className = "am-stat";
  del.setAttribute("aria-label", "2 weeks average delivery time");
  del.innerHTML =
    '<div aria-hidden="true"><div class="am-stat-num am-stat-delivery" style="opacity:0">2 weeks</div><div class="am-stat-label">Average delivery time</div></div>';
  grid.appendChild(del);

  requestAnimationFrame(function () {
    root.classList.add("am-stats--visible");
  });

  var started = false;
  function run() {
    if (started) return;
    started = true;
    if (reduced) {
      stats.forEach(function (s, i) {
        var el = grid.querySelector('[data-idx="' + i + '"]');
        var txt = s.locale ? s.end.toLocaleString("en-US") : String(s.end);
        el.textContent = txt + (s.suffix === "%" ? "%" : s.suffix);
      });
      del.querySelector(".am-stat-delivery").style.opacity = "1";
      return;
    }
    var t0 = performance.now();
    var D = 2000;
    var GAP = 100;

    function tick(now) {
      var doneAll = true;
      stats.forEach(function (s, i) {
        var el = grid.querySelector('[data-idx="' + i + '"]');
        var start = t0 + i * GAP;
        if (now < start) {
          doneAll = false;
          return;
        }
        var t = Math.min(1, (now - start) / D);
        var v = Math.round(s.end * easeOutCubic(t));
        var txt = s.locale ? v.toLocaleString("en-US") : String(v);
        var suf = t >= 1 ? s.suffix : "";
        el.textContent = txt + suf;
        if (t < 1) doneAll = false;
      });
      if (now >= t0 + stats.length * GAP) {
        del.querySelector(".am-stat-delivery").style.transition = "opacity 0.5s ease-out";
        del.querySelector(".am-stat-delivery").style.opacity = "1";
      }
      if (!doneAll) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
  );
  io.observe(root);
})();
</script>
```

## 3) Wix limitations

- **Custom HTML** may block or strip **inline scripts** → use **Velo** (`$w.onReady`) or keep stats on **Next.js** only.
- **Robots / duplicate content:** if Wix and Next both index a homepage, align numbers on **one** canonical domain to avoid conflicting claims.
