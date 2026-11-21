// BW Buddy: Home in the app's own look. The grade forecast for the next school exam says 4; one tap on
// "Practise these topics" opens a quiz on exactly the topic that stands between you and a 3; it is answered
// right, the forecast moves to 3 and today's plan ticks off its first task. All geometry in cqw.
import { timeline, spring, range, clamp, lerp, ease, h } from './kit.js';

const I18N = window.I18N;
const LABEL = 'BW Buddy: the grade forecast for the next school exam is a 4. One tap practises the topic that stands between you and a 3, the question is answered correctly, the forecast moves to 3 and the first task of today’s plan is done.';
I18N.add({
  [LABEL]: 'BW Buddy: Die Notenprognose für die nächste Schularbeit ist ein Genügend. Ein Tipp übt genau das Thema, das zum Befriedigend fehlt, die Frage wird richtig beantwortet, die Prognose springt auf Befriedigend und die erste Aufgabe von heute ist erledigt.',
  'School exam · in 9 days': 'Schularbeit · in 9 Tagen',
  'Marketing': 'Marketing',
  'Sufficient': 'Genügend',
  'Satisfactory': 'Befriedigend',
  'Forecast for 27 Oct': 'Prognose für 27. Okt.',
  'Between you and a 3:': 'Zum Befriedigend fehlt dir:',
  'Between you and a 2:': 'Zum Gut fehlt dir:',
  'Marketing instruments': 'Marketinginstrumente',
  'Market research': 'Marktforschung',
  'not started': 'offen',
  'Practise these topics': 'Diese Themen üben',
  'Today': 'Heute',
  'The customer at the centre': 'Der Kunde im Mittelpunkt',
  'Practise': 'Üben',
  'Review': 'Wiederholen',
  '3 due': '3 fällig',
  'Which of these belongs to price policy?': 'Was gehört zur Preispolitik?',
  'Discount': 'Rabatt',
  'Trade fair': 'Messe',
  'Packaging': 'Verpackung',
  'Correct': 'Richtig',
  '{a} of 2': '{a} von 2',
});

const PERIOD = 12, REST = 10.2;
const IN = 0.05, TAP = 1.7, SHEET = 2.0, ANSWER = 3.9, SHEET_OUT = 5.4, FLIP = 6.0, COUNT = [6.1, 7.0], NEXT = 7.0, TICK = 7.9, OUT = [11.4, 11.95];
const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
const target = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4 4L18.5 7.5"/></svg>';
const loop = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a6 6 0 0 1 10.5-4L17 8.5M17 4v4.5h-4.5M20 14a6 6 0 0 1-10.5 4L7 15.5M7 20v-4.5h4.5"/></svg>';

const f3 = (n) => Math.round(n * 1000) / 1000;
function put(el, tr, op) {
  if (tr != null && el._t !== tr) { el._t = tr; el.style.transform = tr; }
  if (op != null) { op = f3(clamp(op)); if (el._o !== op) { el._o = op; el.style.opacity = op; el.style.visibility = op ? '' : 'hidden'; } }
}
const ty = (y, s = 1) => `translate3d(0,${f3(y)}cqw,0)` + (s === 1 ? '' : ` scale(${f3(s)})`);

export function mount(el) {
  el.classList.add('sc-bwbuddy');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', LABEL);
  const root = h(`<div class="bw-all" aria-hidden="true">
    <div class="bw-card">
      <span class="bw-eye">School exam · in 9 days</span><i class="bw-chev">${chev}</i>
      <b class="bw-title">Marketing</b>
      <div class="bw-tile"><b class="bw-g bw-g4">4</b><b class="bw-g bw-g3">3</b></div>
      <div class="bw-gn"><b class="bw-n4">Sufficient</b><b class="bw-n3">Satisfactory</b></div>
      <div class="bw-sub"><span>Forecast for 27 Oct</span> · <span class="bw-pct" data-no-i18n>55 %</span></div>
      <div class="bw-gap"><b class="bw-gap3">Between you and a 3:</b><b class="bw-gap2">Between you and a 2:</b></div>
      <div class="bw-row bw-r3"><span>Marketing instruments</span><span class="bw-st">not started</span></div>
      <div class="bw-row bw-r2"><span>Market research</span><span class="bw-st" data-no-i18n>67 %</span></div>
      <div class="bw-btn">${target}<span>Practise these topics</span><i class="bw-tap"></i></div>
    </div>
    <div class="bw-head"><span>Today</span><span class="bw-count" data-no-i18n>0 / 2</span></div>
    <div class="bw-list">
      <div class="bw-item"><i class="bw-ic bw-ic1">${check}</i><span><b>The customer at the centre</b><small>Practise</small></span><i class="bw-chev">${chev}</i></div>
      <div class="bw-item"><i class="bw-ic">${loop}</i><span><b>Review</b><small>3 due</small></span><i class="bw-chev">${chev}</i></div>
    </div>
    <div class="bw-sheet">
      <i class="bw-grab"></i>
      <span class="bw-q-eye">Marketing instruments</span>
      <p class="bw-q">Which of these belongs to price policy?</p>
      <div class="bw-opt bw-ok"><span>Discount</span><b class="bw-right">${check}<span>Correct</span></b></div>
      <div class="bw-opt"><span>Trade fair</span></div>
      <div class="bw-opt"><span>Packaging</span></div>
    </div>
  </div>`);
  el.append(root);
  I18N.apply(el);

  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const card = $('.bw-card'), g4 = $('.bw-g4'), g3 = $('.bw-g3'), n4 = $('.bw-n4'), n3 = $('.bw-n3'), pct = $('.bw-pct');
  const gap3 = $('.bw-gap3'), gap2 = $('.bw-gap2'), r3 = $('.bw-r3'), r2 = $('.bw-r2'), btn = $('.bw-btn'), tap = $('.bw-tap');
  const head = $('.bw-head'), list = $('.bw-list'), count = $('.bw-count'), ic1 = $('.bw-ic1');
  const sheet = $('.bw-sheet'), ok = $('.bw-ok'), right = $('.bw-right'), tile = $('.bw-tile');
  let shownPct = -1, shownCount = -1;
  const pctText = (n) => (I18N.lang === 'de' ? `${n} %` : `${n} %`);
  const countText = (n) => I18N.t('{a} of 2').replace('{a}', n);

  function draw(t) {
    put(root, null, 1 - ease.inOut(range(t, OUT[0], OUT[1])));
    const c = spring(range(t, IN, IN + 0.8), 0.75, 8.5);
    put(card, ty((1 - c) * 2.4, lerp(0.97, 1, c)), clamp(range(t, IN, IN + 0.3)));
    const l = spring(range(t, IN + 0.25, IN + 1.05), 0.75, 8.5);
    put(head, ty((1 - l) * 2), clamp(range(t, IN + 0.25, IN + 0.55)));
    put(list, ty((1 - l) * 2.4), clamp(range(t, IN + 0.25, IN + 0.55)));

    // one tap on the button
    const press = t >= TAP && t < TAP + 0.14 ? 0.96 : 1;
    put(btn, `scale(${press})`, null);
    const tu = range(t, TAP - 0.05, TAP + 0.45);
    put(tap, `translate(-50%,-50%) scale(${f3(lerp(0.3, 1.4, ease.out(tu)))})`, tu > 0 && tu < 1 ? 1 - tu : 0);

    // the quiz sheet rises, the right answer is tapped, the sheet goes
    const su = spring(range(t, SHEET, SHEET + 0.8), 0.82, 8), so = ease.inOut(range(t, SHEET_OUT, SHEET_OUT + 0.45));
    put(sheet, `translate3d(0,${f3((1 - su) * 70 + so * 70)}cqw,0)`, t >= SHEET && so < 1 ? 1 : 0);
    const a = range(t, ANSWER, ANSWER + 0.25);
    ok.classList.toggle('on', a > 0.5);
    const rs = spring(range(t, ANSWER + 0.1, ANSWER + 0.7), 0.5, 11);
    put(right, `scale(${f3(lerp(0.6, 1, rs))})`, clamp(range(t, ANSWER + 0.1, ANSWER + 0.3)));

    // the forecast moves from 4 to 3
    const fu = range(t, FLIP, FLIP + 0.5), fs = spring(fu, 0.55, 10);
    put(g4, ty(-fu * 6), 1 - clamp(fu * 2));
    put(g3, ty((1 - fs) * 6), clamp(fu * 2));
    put(tile, `scale(${f3(1 + 0.08 * Math.sin(Math.PI * clamp(fu)))})`, null);
    put(n4, null, 1 - clamp(fu * 2)); put(n3, null, clamp(fu * 2));
    const p = Math.round(lerp(55, 68, ease.out(range(t, COUNT[0], COUNT[1]))));
    if (p !== shownPct) { shownPct = p; pct.textContent = pctText(p); }
    const nx = range(t, NEXT, NEXT + 0.5);
    put(gap3, null, 1 - nx); put(r3, ty(-nx * 2), 1 - nx);
    put(gap2, null, nx); put(r2, ty((1 - nx) * 2), nx);

    // today's first task ticks off
    const k = range(t, TICK, TICK + 0.25);
    ic1.classList.toggle('done', k > 0.5);
    put(ic1, `scale(${f3(k > 0 && k < 1 ? 1.15 : 1)})`, null);
    const n = t >= TICK ? 1 : 0;
    if (n !== shownCount) { shownCount = n; count.textContent = countText(n); }
  }

  const tl = timeline(el, draw, { period: PERIOD, restAt: REST });
  el.addEventListener('click', () => tl.restart());
  document.addEventListener('langchange', () => { I18N.apply(el); shownPct = shownCount = -1; });
  return tl;
}
