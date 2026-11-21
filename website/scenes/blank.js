// Blank: one project, worked on alone, in the app's own look. A 20-minute focus session runs (fast-forwarded),
// the step is done, a progress photo joins the project's timeline, the finished project becomes a
// before→after 9:16 reel, and the buddy's check-in shows up. Photos are the app's own (Unsplash, self-hosted).
// The streak is the app's axolotl holding its number: Done makes it hop and roll the number on, then it peeks
// over a tip card asking for a progress photo, the way the app's assistant does.
import { timeline, spring, range, clamp, lerp, ease, h } from './kit.js';
import { AXO_STREAK, AXO_TIP, AXO_BUDDY } from './blank-axo.js';

const I18N = window.I18N;
const LABEL = 'Blank: a 20-minute focus session on a sourdough project, the step is ticked off and the axolotl’s streak sign goes from 11 to 12, the axolotl asks for a progress photo, the photo joins the project timeline, the project becomes a before and after reel, and a buddy’s check-in arrives.';
I18N.add({
  [LABEL]: 'Blank: eine 20-minütige Fokus-Session an einem Sauerteig-Projekt, der Schritt wird abgehakt und das Streak-Schild des Axolotls springt von 11 auf 12, der Axolotl fragt nach einem Fortschrittsfoto, das Foto kommt in die Projekt-Zeitleiste, das Projekt wird zum Vorher-nachher-Reel, und der Check-in des Buddys kommt an.',
  'Bake your first sourdough loaf': 'Backe dein erstes Sauerteigbrot',
  'Cooking · 6 days worked': 'Kochen · 6 Tage gearbeitet',
  'Step 3 of 5': 'Schritt 3 von 5',
  'Step 4 of 5': 'Schritt 4 von 5',
  'Mix, rest and do stretch-and-folds': 'Mischen, ruhen lassen, dehnen und falten',
  'Shape and bake': 'Formen und backen',
  'Done': 'Erledigt',
  '20 min': '20 Min.',
  'Photos': 'Fotos',
  'Day 1': 'Tag 1',
  'Day 6': 'Tag 6',
  'Day 12': 'Tag 12',
  '20 minutes': '20 Minuten',
  'Mia': 'Mia',
  'checked in today': 'eingecheckt',
  '20 minutes, nice. A photo of where you’re at?': '20 Minuten, stark. Ein Foto vom Stand?',
  'Photo': 'Foto',
});

const PERIOD = 12, REST = 10.2;
const IN = 0.05, TAP_T = 1.2, TIMER = 1.4, RUN = [1.7, 3.8], TIMER_OUT = 4.15, TAP_D = 4.45, TAP_C = 5.15, THUMB = 5.4, REEL = 6.3, WIPE = [7.0, 7.7], BUDDY = 8.5, OUT = [11.4, 11.95];
// the axolotl: Done grows the streak (hop + number roll), then the tip peeks in over the empty right column,
// its Photo button is the camera tap, and it leaves before the reel arrives
const HOP = TAP_D + 0.12, HOP_D = 0.68, TIP_IN = TAP_D + 0.22, TIP_OUT = 5.8, STREAK = [11, 12];
const A = '/scenes/assets/blank/';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4 4L18.5 7.5"/></svg>';
const clock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V10M10 3h4"/></svg>';
const cam = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.4"/><path d="M8.5 7 10 4.5h4L15.5 7"/></svg>';

// motion.js's hop (height 0.65, the sign sits near the top edge), as keyframes on the timeline in viewBox units
const HOP_AT = [0, 0.14, 0.4, 0.52, 0.74, 0.87, 1];
const HOP_EASE = [ease.out, ease.out, ease.out, ease.in, ease.out, ease.inOut];
const HOP_LIFT = [0, -0.7, 17.5, 19.5, 0, 0, 0], HOP_SX = [1, 1.1, 0.93, 1, 1.14, 0.96, 1], HOP_SY = [1, 0.88, 1.09, 1, 0.86, 1.04, 1];
const HOP_RIDE = [0, 0, 16.8, 19.5, 0, 0, 0], HOP_TILT = [0, 0, -2, -1, 1.5, -0.5, 0];
function track(u, at, vals, eases) {
  if (u <= 0) return vals[0];
  if (u >= 1) return vals[vals.length - 1];
  let i = 0;
  while (u > at[i + 1]) i++;
  return lerp(vals[i], vals[i + 1], (eases ? eases[i] : ease.inOut)(range(u, at[i], at[i + 1])));
}

const f3 = (n) => Math.round(n * 1000) / 1000;
function put(el, tr, op) {
  if (tr != null && el._t !== tr) { el._t = tr; el.style.transform = tr; }
  if (op != null) { op = f3(clamp(op)); if (el._o !== op) { el._o = op; el.style.opacity = op; el.style.visibility = op ? '' : 'hidden'; } }
}
const ty = (y, s = 1) => `translate3d(0,${f3(y)}cqw,0)` + (s === 1 ? '' : ` scale(${f3(s)})`);
const pop = (el, u, from = 0.92, dy = 2) => { const s = spring(u, 0.72, 9); put(el, ty((1 - s) * dy, lerp(from, 1, s)), clamp(u * 3)); };

export function mount(el) {
  el.classList.add('sc-blank');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', LABEL);
  const root = h(`<div class="bl-all" aria-hidden="true">
    <div class="bl-proj">
      <b class="bl-title">Bake your first sourdough loaf</b>
      <span class="bl-streak">${AXO_STREAK}</span>
      <span class="bl-meta">Cooking · 6 days worked</span>
      <div class="bl-bar"><i></i></div><b class="bl-of" data-no-i18n>2/5</b>
      <div class="bl-step">
        <span class="bl-eye"><span class="bl-e3">Step 3 of 5</span><span class="bl-e4">Step 4 of 5</span></span>
        <b class="bl-st"><span class="bl-s3">Mix, rest and do stretch-and-folds</span><span class="bl-s4">Shape and bake</span></b>
        <div class="bl-acts"><span class="bl-done">${check}<span>Done</span></span><span class="bl-min">${clock}<span>20 min</span></span><span class="bl-cam">${cam}</span><i class="bl-tap"></i></div>
      </div>
      <span class="bl-ph">Photos</span>
      <div class="bl-strip">
        <span class="bl-th"><img src="${A}focaccia.webp" alt=""><small>Day 1</small></span>
        <span class="bl-th bl-new"><img src="${A}sourdough.webp" alt=""><small>Day 6</small></span>
      </div>
    </div>
    <div class="bl-timer">
      <svg class="bl-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="bl-track"/><circle cx="50" cy="50" r="44" class="bl-arc"/></svg>
      <b class="bl-clock" data-no-i18n>20:00</b><span class="bl-mins">20 minutes</span>
      <i class="bl-ok">${check}</i>
    </div>
    <div class="bl-reel">
      <div class="bl-half bl-before"><img src="${A}focaccia.webp" alt=""><small>Day 1</small></div>
      <div class="bl-half bl-after"><img src="${A}sourdough.webp" alt=""><small>Day 12</small></div>
      <b class="bl-rt">Bake your first sourdough loaf</b>
    </div>
    <div class="bl-tip">
      <div class="bl-tipcard"><span class="bl-tipt">20 minutes, nice. A photo of where you’re at?</span><span class="bl-tipb">${cam}<span>Photo</span><i class="bl-tap"></i></span></div>
      <span class="bl-tipaxo">${AXO_TIP}</span>
    </div>
    <div class="bl-buddy"><span class="bl-av">M</span><span class="bl-bt"><span class="bl-nm"><b>Mia</b><b class="bl-fl">${AXO_BUDDY}<span data-no-i18n>6</span></b></span><small>checked in today</small></span></div>
    <i class="bl-flash"></i>
  </div>`);
  el.append(root);
  I18N.apply(el);

  const $ = (s) => root.querySelector(s);
  const proj = $('.bl-proj'), bar = $('.bl-bar i'), of = $('.bl-of'), e3 = $('.bl-e3'), e4 = $('.bl-e4'), s3 = $('.bl-s3'), s4 = $('.bl-s4');
  const done = $('.bl-done'), min = $('.bl-min'), tap = $('.bl-acts .bl-tap'), nw = $('.bl-new');
  const timer = $('.bl-timer'), arc = $('.bl-arc'), clk = $('.bl-clock'), ok = $('.bl-ok'), reel = $('.bl-reel'), after = $('.bl-after'), buddy = $('.bl-buddy'), flash = $('.bl-flash');
  const C = 2 * Math.PI * 44;
  arc.style.strokeDasharray = `${f3(C)}`;
  let shownSec = -1, shownOf = -1;

  // the streak axolotl: idle until Done, then happy (^^ eyes, smile, blush) like the app's header after a tick
  const sx = $('.bl-streak .axo'), sBody = sx.querySelector('.axo-body'), sProp = sx.querySelector('.axo-prop');
  const badge = sx.querySelector('.axo-badge'), num = sx.querySelector('.axo-badge-num');
  const ghost = num.cloneNode(true);
  ghost.setAttribute('class', 'axo-badge-ghost');
  num.after(ghost);
  num.textContent = String(STREAK[1]); ghost.textContent = String(STREAK[0]);
  const moodParts = [...sx.querySelectorAll('[data-mood]')], blush = sx.querySelector('.axo-blush'), notice = sx.querySelector('.axo-fx-notice-l');
  let mood = '';
  function setMood(m) {
    if (m === mood) return;
    mood = m; sx.dataset.mood = m;
    for (const g of moodParts) g.setAttribute('display', g.dataset.mood.split(' ').includes(m) ? 'inline' : 'none');
    blush.setAttribute('opacity', m === 'happy' ? '0.55' : '0');
    notice.setAttribute('display', m === 'happy' ? 'inline' : 'none');
  }
  const tip = $('.bl-tip'), tipCard = $('.bl-tipcard'), tipAxo = $('.bl-tipaxo .axo'), tipB = $('.bl-tipb'), tap2 = $('.bl-tipb .bl-tap');

  // the scene's CSS loops (blink, gill sway) only run while it is on screen
  new IntersectionObserver(([e]) => el.classList.toggle('bl-on', e.isIntersecting)).observe(el);

  function tapAt(t, at, target, dot = tap) {
    const u = range(t, at - 0.05, at + 0.45);
    if (u <= 0 || u >= 1) return false;
    const r = target.getBoundingClientRect(), p = dot.parentElement.getBoundingClientRect(), cq = el.clientWidth / 100 || 1;
    dot.style.left = `${f3((r.left - p.left + r.width / 2) / cq)}cqw`; dot.style.top = `${f3((r.top - p.top + r.height / 2) / cq)}cqw`;
    put(dot, `translate(-50%,-50%) scale(${f3(lerp(0.3, 1.4, ease.out(u)))})`, 1 - u);
    return true;
  }

  function draw(t) {
    put(root, null, 1 - ease.inOut(range(t, OUT[0], OUT[1])));
    pop(proj, range(t, IN, IN + 0.8), 0.97, 2.4);

    // the focus timer: tap "20 min", the ring runs down (fast-forwarded), then ticks
    if (!tapAt(t, TAP_T, min) && !tapAt(t, TAP_D, done)) put(tap, null, 0);
    if (!tapAt(t, TAP_C, tipB, tap2)) put(tap2, null, 0);
    const tIn = range(t, TIMER, TIMER + 0.7), tOut = ease.inOut(range(t, TIMER_OUT, TIMER_OUT + 0.4));
    if (tOut > 0) put(timer, ty(-tOut * 2, lerp(1, 0.96, tOut)), 1 - tOut); else pop(timer, tIn, 0.9, 3);
    const run = range(t, RUN[0], RUN[1]);
    arc.style.strokeDashoffset = f3(C * run);
    const sec = Math.round(1200 * (1 - run));
    if (sec !== shownSec) { shownSec = sec; clk.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
    const ku = range(t, RUN[1] + 0.05, RUN[1] + 0.5);
    put(ok, `scale(${f3(lerp(0.4, 1, spring(ku, 0.5, 11)))})`, clamp(ku * 4));

    // Done: the next step comes up and the bar moves
    const dp = t >= TAP_D && t < TAP_D + 0.14 ? 0.95 : 1;
    put(done, `scale(${dp})`, null);
    const nx = range(t, TAP_D + 0.1, TAP_D + 0.5);
    put(e3, null, 1 - nx); put(e4, null, nx); put(s3, ty(-nx * 1.5), 1 - nx); put(s4, ty((1 - nx) * 1.5), nx);
    bar.style.width = `${f3(lerp(40, 60, ease.out(nx)))}%`;
    const o = nx > 0.5 ? 3 : 2;
    if (o !== shownOf) { shownOf = o; of.textContent = `${o}/5`; }

    // the streak grows: the axolotl hops with its sign, the number rolls from 11 to 12
    setMood(t >= HOP ? 'happy' : 'idle');
    const hu = range(t, HOP, HOP + HOP_D), ru = range(t, HOP + 0.03, HOP + 0.03 + HOP_D);
    put(sBody, `translate(0px,${f3(-track(hu, HOP_AT, HOP_LIFT, HOP_EASE))}px) scale(${f3(track(hu, HOP_AT, HOP_SX, HOP_EASE))},${f3(track(hu, HOP_AT, HOP_SY, HOP_EASE))})`, null);
    put(sProp, `translate(0px,${f3(-track(ru, HOP_AT, HOP_RIDE, HOP_EASE))}px) rotate(${f3(track(ru, HOP_AT, HOP_TILT, HOP_EASE))}deg)`, null);
    const bu = range(t, HOP + 0.04, HOP + 0.5);
    put(badge, `scale(${f3(track(bu, [0, 0.32, 0.6, 0.8, 1], [1, 1.084, 0.9825, 1.007, 1]))}) rotate(${f3(track(bu, [0, 0.32, 0.6, 0.8, 1], [0, -1.75, 1.05, -0.35, 0]))}deg)`, null);
    const gu = ease.in(range(t, HOP, HOP + 0.2)), nu = range(t, HOP + 0.15, HOP + 0.49);
    put(ghost, `translate(0px,${f3(-25 * gu)}px) scale(1,${f3(1 - gu)})`, t < HOP ? 1 : gu >= 1 ? 0 : 1 - gu * 0.8);
    const ny = track(nu, [0, 0.6, 1], [25, -3, 0], [ease.out, ease.out]), ns = track(nu, [0, 0.6, 1], [0, 1.08, 1], [ease.out, ease.out]);
    put(num, `translate(0px,${f3(ny)}px) scale(1,${f3(ns)})`, t < HOP + 0.15 ? 0 : lerp(0.2, 1, Math.min(1, nu / 0.6)));

    // the tip: the card rises with a little spring, the axolotl comes up from behind its top edge, then both go
    const co = ease.in(range(t, TIP_OUT + 0.18, TIP_OUT + 0.4));
    if (co > 0) put(tipCard, ty(co * 2.4, lerp(1, 0.98, co)), 1 - co);
    else { const cu = range(t, TIP_IN, TIP_IN + 0.5), s = spring(cu, 0.6, 10); put(tipCard, ty((1 - s) * 2.6, lerp(0.98, 1, s)), clamp(cu * 4)); }
    const au = range(t, TIP_IN + 0.08, TIP_IN + 0.7), ao = range(t, TIP_OUT, TIP_OUT + 0.38);
    const rise = ao > 0 ? track(ao, [0, 0.25, 1], [0, -3, 104], [ease.inOut, ease.in]) : track(au, [0, 0.62, 0.82, 1], [104, -3.5, 1, 0], [ease.out, ease.inOut, ease.inOut]);
    put(tipAxo, `translate3d(0,${f3(rise)}%,0)`, au > 0 ? 1 - range(ao, 0.45, 0.85) : 0);
    put(tip, null, t >= TIP_IN && t < TIP_OUT + 0.4 ? 1 : 0);
    put(tipB, `scale(${t >= TAP_C && t < TAP_C + 0.14 ? 0.95 : 1})`, null);

    // a progress photo: the shutter flashes, the photo lands in the timeline
    put(flash, null, t >= TAP_C ? 0.55 * (1 - ease.out(range(t, TAP_C, TAP_C + 0.4))) : 0);
    pop(nw, range(t, THUMB, THUMB + 0.7), 0.6, 1);

    // finished: before → after, as a 9:16 reel
    pop(reel, range(t, REEL, REEL + 0.8), 0.9, 4);
    const w = ease.inOut(range(t, WIPE[0], WIPE[1]));
    after.style.clipPath = `inset(${f3((1 - w) * 100)}% 0 0 0)`;

    // the buddy checked in too
    pop(buddy, range(t, BUDDY, BUDDY + 0.7), 0.85, 2);
  }

  const tl = timeline(el, draw, { period: PERIOD, restAt: REST });
  el.addEventListener('click', () => tl.restart());
  document.addEventListener('langchange', () => { I18N.apply(el); shownSec = shownOf = -1; });
  return tl;
}
