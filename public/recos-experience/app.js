const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const chapters = $$('.chapter');
const names = ['THE GATEWAY', 'YOUR WORKSPACE', 'YOUR TEAM', 'THE CONNECTIONS', 'YOUR NEXT CHAPTER'];
const hashes = ['arrival', 'workspace', 'team', 'connections', 'future'];
const productViews = ['overview', 'candidates', 'pipeline', 'messages', 'team'];
const chapterViews = ['overview', 'candidates', 'team', 'candidates', 'overview'];
let selectedProduct = 'overview';
function selectProduct(view, animate = true) {
 if (!productViews.includes(view)) return;
 selectedProduct = view; chapterViews[Math.max(0, current)] = view;
 $$('[data-product]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.product === view)));
 $('#product-view-label').textContent = view[0].toUpperCase() + view.slice(1);
 if (current === 3) {
  const prior = Number($('[data-step][aria-pressed="true"]')?.dataset.step);
  const index = view === 'candidates' ? 0 : view === 'messages' ? 2 : view === 'pipeline' ? (prior === 3 ? 3 : 1) : -1;
  $$('[data-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.step) === index)));
  $('#journey-text').textContent = index >= 0 ? descriptions[index] : 'Explore how your individual work connects with your workspace and team.';
 }
 world?.setView(view, Math.max(0, current), !animate || paused);
}
function openProduct(view = selectedProduct) {
 selectProduct(view, false);
 $('#product-frame').src = '/recos-experience/product-preview.html?view=' + selectedProduct + '&seats=' + seats;
 openDialog($('#product-dialog'));
}
$$('[data-product]').forEach(button => button.addEventListener('click', () => selectProduct(button.dataset.product)));
$('#open-product').addEventListener('click', () => openProduct());
addEventListener('message', event => {
 if (event.origin !== location.origin || event.source !== $('#product-frame').contentWindow || event.data?.type !== 'recos-preview') return;
 if (Number.isInteger(event.data.seats)) { seats = Math.max(1, Math.min(8, event.data.seats)); renderSeats(); }
 if (productViews.includes(event.data.view)) selectProduct(event.data.view, false);
});
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = motion.matches;
let seats = 1, world = null, progress = 0, targetProgress = 0, time = 0, frame = 0;
let lastFrame = performance.now(), current = -1, travelAnimation = 0, snapTimer = 0;
let pointerX = 0, pointerY = 0, navigating = false, failed = false, scrollDirection = 1;
function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - innerHeight); }
function readProgress() { return Math.max(0, Math.min(4, scrollY / maxScroll() * 4)); }
function setMotion() {
  document.body.classList.toggle('motion-paused', paused);
  $('#motion-button').setAttribute('aria-pressed', String(paused));
  $('#motion-button').textContent = paused ? 'Enable motion \u25b7' : 'Pause motion \u2161';
  $('#scene-state').textContent = failed ? 'SIMPLIFIED EXPERIENCE' : paused ? 'STILL VIEW / MOTION PAUSED' : 'LIVE EXPERIENCE / SCROLL TO EXPLORE';
}
setMotion();
$('#motion-button').addEventListener('click', () => { paused = !paused; setMotion(); });
motion.addEventListener('change', () => { paused = motion.matches; setMotion(); });
function stopTravel() { cancelAnimationFrame(travelAnimation); navigating = false; clearTimeout(snapTimer); }
function goTo(index, options = {}) {
  clearTimeout(resizeTimer);
  const destination = Math.max(0, Math.min(4, index));
  stopTravel();
  const start = scrollY, end = maxScroll() * destination / 4;
  if (options.history !== false) history.pushState(null, '', '#' + hashes[destination]);
  if (paused || options.instant) {
    scrollTo(0, end); targetProgress = progress = destination; paintChapters(); return;
  }
  navigating = true;
  const started = performance.now();
  const duration = options.duration || (1450 + Math.min(2, Math.abs(destination - progress)) * 350);
  function travel(now) {
    const t = Math.min(1, (now - started) / duration);
    const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    scrollTo(0, start + (end - start) * eased);
    targetProgress = readProgress();
    if (t < 1) travelAnimation = requestAnimationFrame(travel);
    else { navigating = false; targetProgress = destination; }
  }
  travelAnimation = requestAnimationFrame(travel);
}
$$('[data-go]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); goTo(Number(button.dataset.go)); }));
$('#next-chapter').addEventListener('click', () => goTo(current >= 4 ? 0 : current + 1));
addEventListener('popstate', () => {
  const index = hashes.indexOf(location.hash.slice(1));
  goTo(index < 0 ? 0 : index, { history: false, instant: paused });
});
addEventListener('wheel', stopTravel, { passive: true });
addEventListener('touchstart', stopTravel, { passive: true });
addEventListener('scroll', () => {
  const nextProgress = readProgress();
  if (Math.abs(nextProgress - targetProgress) > .001) scrollDirection = Math.sign(nextProgress - targetProgress);
  targetProgress = nextProgress;
  if (navigating || document.body.classList.contains('modal-open')) return;
  clearTimeout(snapTimer);
  snapTimer = setTimeout(() => {
    const nearest = Math.abs(readProgress() - Math.round(readProgress())) < .03
      ? Math.round(readProgress()) : scrollDirection > 0 ? Math.ceil(readProgress()) : Math.floor(readProgress());
    if (Math.abs(readProgress() - nearest) > .015) goTo(nearest, { duration: 700, history: false });
  }, 220);
}, { passive: true });
addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName)) return;
  const next = ['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key);
  const previous = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key);
  if (next || previous || event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? 4 : current + (next ? 1 : -1));
  }
});
addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse') return;
  pointerX = event.clientX / innerWidth * 2 - 1; pointerY = -(event.clientY / innerHeight * 2 - 1);
}, { passive: true });
function paintChapters() {
  const nearest = Math.round(progress), distance = Math.abs(progress - nearest);
  const opacity = paused ? 1 : Math.max(0, 1 - distance * 3.4);
  chapters.forEach((chapter, i) => {
    const active = i === nearest;
    chapter.classList.toggle('active', active);
    chapter.inert = !active || opacity < .2;
    chapter.setAttribute('aria-hidden', String(!active));
    chapter.style.opacity = active ? String(opacity) : '0';
    chapter.style.transform = paused ? 'none' : 'translateY(' + ((i - progress) * 100) + 'px) scale(' + (1 + (i - progress) * .07) + ')';
    chapter.style.filter = !paused && active ? 'blur(' + Math.max(0, distance * 6 - .4) + 'px)' : 'none';
  });
  $('#progress-fill').style.width = ((progress + 1) / 5 * 100) + '%';
  const travelOpacity = paused ? 0 : Math.max(0, (distance - .22) * 3.2);
  $('.travel-label').style.opacity = String(travelOpacity);
  $('#travel-flash').style.opacity = String(travelOpacity);
  $('#travel-destination').textContent = names[Math.min(4, Math.max(0, targetProgress > progress ? Math.ceil(progress) : Math.floor(progress)))];
  if (distance < .008 && !navigating && location.hash !== '#' + hashes[nearest]) history.replaceState(null, '', '#' + hashes[nearest]);
  document.body.dataset.chapter = String(nearest);
  document.body.dataset.travel = distance > .08 ? 'moving' : 'arrived';
  if (nearest !== current) {
    const focused = document.activeElement;
    if (focused && chapters.some(chapter => chapter.contains(focused) && chapter.inert)) $('#chapter-content').focus({ preventScroll: true });
    current = nearest;
    selectProduct(chapterViews[nearest], false);
    $('#chapter-number').textContent = String(nearest + 1).padStart(2, '0');
    $('#world-status').textContent = names[nearest];
    $$('.chapter-rail [data-go]').forEach(button => {
      if (Number(button.dataset.go) === nearest) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('#next-chapter').setAttribute('aria-label', nearest === 4 ? 'Return to arrival' : 'Next chapter');
    $('#next-chapter').textContent = nearest === 4 ? '\u21ba' : '\u2197';
  }
}
function renderSeats() {
  $('#seat-output').textContent = seats; $$('[data-seat-count]').forEach(el => el.textContent = seats);
  $('#remove-seat').disabled = seats === 1; $('#add-seat').disabled = seats === 8; world?.setSeats(seats);
}
$('#add-seat').addEventListener('click', () => { seats = Math.min(8, seats + 1); renderSeats(); });
$('#remove-seat').addEventListener('click', () => { seats = Math.max(1, seats - 1); renderSeats(); }); renderSeats();
$$('[data-role]').forEach(button => button.addEventListener('click', () => {
  $$('[data-role]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  $('#role-copy').textContent = button.dataset.role === 'owner'
    ? 'Your business, your team and your way of working. One shared home for the work ahead.'
    : 'Your own place within a workspace. Bring your relationships and connect with the team around you.';
}));
const descriptions = [
  'Relationships are the starting point. Give the people behind your recruitment activity a connected home.',
  'Connect client relationships with opportunities. See the possibilities behind the next conversation.',
  'Keep conversations, interviews and next steps in the same story, so your team can move forward together.',
  'Bring documents and progress into the picture. Keep sight of the work behind each placement.'
];
$$('[data-step]').forEach(button => button.addEventListener('click', () => {
  $$('[data-step]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  const index = Number(button.dataset.step); $('#journey-text').textContent = descriptions[index]; world?.setActivity(index); selectProduct(['candidates', 'pipeline', 'messages', 'pipeline'][index]);
}));
function openDialog(dialog) { stopTravel(); dialog.showModal(); document.body.classList.add('modal-open'); }
$$('[data-interest]').forEach(button => button.addEventListener('click', () => {
  $('#interest-form').reset(); $('#interest-type').value = button.dataset.interest === 'owner' && seats > 1 ? 'team' : button.dataset.interest;
  $('#interest-form').hidden = false; $('#form-result').hidden = true; openDialog($('#interest-dialog'));
}));
[$('#questions-button'), $('#mobile-questions')].forEach(button => button.addEventListener('click', () => openDialog($('#questions-dialog'))));
$$('dialog').forEach(dialog => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); $('#interest-form').reset(); });
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
});
let signupPending = false;
$('#interest-form').addEventListener('submit', async event => {
 event.preventDefault();
 if (signupPending || !event.currentTarget.reportValidity()) return;
 const form = event.currentTarget, fields = new FormData(form), button = form.querySelector('[type="submit"]');
 signupPending = true; button.disabled = true; button.textContent = 'Joining...'; form.setAttribute('aria-busy', 'true');
 $('#form-result').hidden = true;
 try {
  const response = await fetch('/api/feature-waitlist', {
   method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
   body: JSON.stringify({ email: String(fields.get('email')).trim(), consent: fields.get('consent') === 'on', website: fields.get('website'), feature: 'RecOS Beta',
    wants_assistance: 'recos-beta|interest=' + fields.get('interest') + '|seats=' + seats + '|priorityBeta=1|feedback=1|consent=1' })
  });
  const result = await response.json();
  if (!response.ok || result.success !== true) throw new Error(response.status === 429 ? 'rate-limit' : 'signup-failed');
  form.hidden = true;
  $('#form-result').textContent = "You're on the list. Current beta slots are full. We will email you when a place can be offered. Once invited, you can help shape RecOS with your feedback.";
  form.reset();
 } catch (error) {
  $('#form-result').textContent = error.message === 'rate-limit' ? 'Too many attempts. Please wait a few minutes and try again.' : 'We could not confirm your signup. Please try again, or contact us through the website.';
 } finally {
  signupPending = false; button.disabled = false; button.textContent = 'Join the waitlist'; form.removeAttribute('aria-busy'); $('#form-result').hidden = false;
 }
});
function fallback() { failed = true; document.body.classList.add('webgl-fallback'); $('#fallback-notice').hidden = false; setMotion(); }
$('#universe').addEventListener('worldnavigate', event => goTo(event.detail));
$('#universe').addEventListener('screenselected', event => openProduct(event.detail));
$('#universe').addEventListener('seatselected', event => { $('#scene-state').textContent = 'RECRUITER SEAT ' + event.detail + ' / YOUR TEAM'; });
$('#universe').addEventListener('activityselected', event => { $('[data-step="' + event.detail + '"]').click(); });
$('#universe').addEventListener('sceneunavailable', fallback);
$('#universe').addEventListener('scenerestored', () => { failed = false; document.body.classList.remove('webgl-fallback'); $('#fallback-notice').hidden = true; setMotion(); });
function tick(now) {
  const delta = Math.min((now - lastFrame) / 1000, .05); lastFrame = now;
  if (!document.hidden) {
    const moving = !paused && !document.querySelector('dialog[open]');
    if (moving) time += delta;
    progress = paused ? Math.round(targetProgress) : progress + (targetProgress - progress) * (1 - Math.exp(-delta * 9));
    if (Math.abs(progress - targetProgress) < .0008) progress = targetProgress;
    paintChapters(); world?.render(progress, time, moving, pointerX, pointerY);
  }
  frame = requestAnimationFrame(tick);
}
let resizeTimer;
addEventListener('resize', () => {
  world?.resize();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => goTo(current < 0 ? 0 : current, { instant: true, history: false }), 100);
});
addEventListener('pagehide', event => { if (!event.persisted) { cancelAnimationFrame(frame); stopTravel(); world?.dispose(); } });
const initial = hashes.indexOf(location.hash.slice(1));
if (initial >= 0) goTo(initial, { instant: true, history: false });
else { scrollTo(0, 0); targetProgress = progress = 0; }
paintChapters();
try {
  const { createUniverse } = await import('/recos-experience/universe.js'); world = await createUniverse($('#universe')); world.setSeats(seats); selectProduct(selectedProduct, false);
  document.body.dataset.scene = 'ready'; setMotion();
} catch (error) {
  fallback(); document.body.dataset.scene = 'fallback';
  console.warn('Immersive view unavailable; using accessible chapter navigation.', error);
}
frame = requestAnimationFrame(tick);
