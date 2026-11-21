// Yap: one tap on "Catch up" plays every voice note you haven't heard, back to back, at 1.25× with the pauses
// cut and the words captioned as they are spoken; hold the button to reply, release to send. The app's own
// light look: iOS grey, white cards, its red accent; avatars are the emoji people pick in the app. All in cqw.
import { timeline, spring, range, clamp, lerp, ease, h } from './kit.js';

const I18N = window.I18N;
const LABEL = 'Yap: one tap on Catch up plays every unheard voice note in a row, with the words captioned as they are spoken; holding the button records a reply, releasing sends it.';
I18N.add({
  [LABEL]: 'Yap: Ein Tipp auf Aufholen spielt alle ungehörten Sprachnachrichten hintereinander ab, die Wörter erscheinen als Untertitel, während sie gesprochen werden; gedrückt halten nimmt eine Antwort auf, loslassen schickt sie ab.',
  'Catch up': 'Aufholen',
  '4 voice notes · about 1 min': '4 Sprachnotizen · etwa 1 Min.',
  'Daily question': 'Frage des Tages',
  'What’s the most surprising thing you learned about a friend?': 'Was ist das Überraschendste, das du über eine Freundin oder einen Freund erfahren hast?',
  '1 of 4': '1 von 4',
  '2 of 4': '2 von 4',
  'Voice message': 'Sprachnachricht',
  'are we still meeting at the station at four or did that change': 'treffen wir uns noch um vier am Bahnhof oder hat sich das geändert',
  'Hold to reply to Lena': 'Halten, um Lena zu antworten',
  'Release to send': 'Loslassen zum Senden',
  'Sent to Lena': 'An Lena gesendet',
});

const PERIOD = 12, REST = 10;
const IN = 0.05, TAP = 1.1, SHEET = 1.3, PLAY = [2.1, 5.6], HOLD = 6.1, RELEASE = 8.0, NEXT = 8.7, OUT = [11.4, 11.95];
const play = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.8v14.4a1 1 0 0 0 1.52.85l11.5-7.2a1 1 0 0 0 0-1.7L8.52 3.95A1 1 0 0 0 7 4.8Z"/></svg>';
const pause = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4.2" height="15" rx="1.3"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.3"/></svg>';
const prev = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="2.4" height="14" rx="1"/><path d="M19 5.9v12.2a.9.9 0 0 1-1.4.75L9.3 12.75a.9.9 0 0 1 0-1.5l8.3-6.1A.9.9 0 0 1 19 5.9Z"/></svg>';
const mic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>';
const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const LEVELS = [30, 55, 80, 45, 95, 60, 35, 75, 50, 90, 40, 65, 85, 30, 55, 70, 45, 25];

const f3 = (n) => Math.round(n * 1000) / 1000;
function put(el, tr, op) {
  if (tr != null && el._t !== tr) { el._t = tr; el.style.transform = tr; }
  if (op != null) { op = f3(clamp(op)); if (el._o !== op) { el._o = op; el.style.opacity = op; el.style.visibility = op ? '' : 'hidden'; } }
}
const ty = (y, s = 1) => `translate3d(0,${f3(y)}cqw,0)` + (s === 1 ? '' : ` scale(${f3(s)})`);
const pop = (el, u, from = 0.94, dy = 2) => { const s = spring(u, 0.74, 9); put(el, ty((1 - s) * dy, lerp(from, 1, s)), clamp(u * 3)); };

export function mount(el) {
  el.classList.add('sc-yap');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', LABEL);
  const root = h(`<div class="y-all" aria-hidden="true">
    <div class="y-feed">
      <div class="y-logo">yap<b>.</b></div>
      <div class="y-cu"><span class="y-pbtn">${play}<i class="y-tap"></i></span><span><b>Catch up</b><small>4 voice notes · about 1 min</small></span></div>
      <div class="y-dq"><span class="y-cap">Daily question</span><b>What’s the most surprising thing you learned about a friend?</b></div>
    </div>
    <div class="y-player">
      <i class="y-chev">${chev}</i>
      <div class="y-top"><b>Catch up</b><small><span class="y-n1">1 of 4</span><span class="y-n2">2 of 4</span></small></div>
      <span class="y-speed" data-no-i18n>1.25×</span>
      <div class="y-who"><span class="y-av">🐸</span><span><b>Lena</b><small>Voice message</small></span></div>
      <p class="y-cap-text"></p>
      <div class="y-bar"><i></i></div>
      <div class="y-times" data-no-i18n><span class="y-t0">0:00</span><span>0:06</span></div>
      <div class="y-ctl"><i class="y-prev">${prev}</i><span class="y-pp"><i class="y-ip">${pause}</i><i class="y-ipl">${play}</i></span><i class="y-next">${prev}</i></div>
      <div class="y-hold"><span class="y-h1">${mic}<span>Hold to reply to Lena</span></span><span class="y-h2"><i class="y-rec"></i><span class="y-wave">${LEVELS.map(() => '<i></i>').join('')}</span><span>Release to send</span></span><span class="y-h3"><i class="y-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4 4L18.5 7.5"/></svg></i><span>Sent to Lena</span></span></div>
    </div>
  </div>`);
  el.append(root);
  I18N.apply(el);

  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const feed = $('.y-feed'), tap = $('.y-tap'), pbtn = $('.y-pbtn'), player = $('.y-player'), cap = $('.y-cap-text'), bar = $('.y-bar i'), t0 = $('.y-t0');
  const ip = $('.y-ip'), ipl = $('.y-ipl'), hold = $('.y-hold'), h1 = $('.y-h1'), h2 = $('.y-h2'), rec = $('.y-rec'), bars = $$('.y-wave i'), h3 = $('.y-h3'), n1 = $('.y-n1'), n2 = $('.y-n2');
  const CAPTION = 'are we still meeting at the station at four or did that change';
  let spans = [], lastLit = -2, lastSec = -1;
  function buildCaption() {
    cap.replaceChildren(...I18N.t(CAPTION).split(' ').map((w, i, a) => { const s = document.createElement('span'); s.textContent = w + (i < a.length - 1 ? ' ' : ''); return s }));
    spans = [...cap.children]; lastLit = -2;
  }
  buildCaption();

  function draw(t) {
    put(root, null, 1 - ease.inOut(range(t, OUT[0], OUT[1])));
    pop(feed, range(t, IN, IN + 0.7), 0.97, 2);
    const press = t >= TAP && t < TAP + 0.14 ? 0.92 : 1;
    put(pbtn, `scale(${press})`, null);
    const tu = range(t, TAP - 0.05, TAP + 0.45);
    put(tap, `translate(-50%,-50%) scale(${f3(lerp(0.3, 1.6, ease.out(tu)))})`, tu > 0 && tu < 1 ? 1 - tu : 0);

    // the player rises over the feed
    const su = spring(range(t, SHEET, SHEET + 0.8), 0.84, 8);
    put(player, `translate3d(0,${f3((1 - su) * 82)}cqw,0)`, t >= SHEET ? 1 : 0);

    // words light up as they are spoken: said in black, the current word in red, the rest grey
    const p = range(t, PLAY[0], PLAY[1]);
    const lit = t < PLAY[0] ? -1 : Math.min(spans.length - 1, Math.floor(p * spans.length));
    if (lit !== lastLit) { lastLit = lit; spans.forEach((s, i) => { s.className = i < lit || (p >= 1 && i <= lit) ? 'said' : i === lit ? 'now' : '' }) }
    bar.style.width = `${f3(p * 100)}%`;
    const sec = Math.round(6 * p);
    if (sec !== lastSec) { lastSec = sec; t0.textContent = `0:0${sec}` }
    const playing = t >= PLAY[0] && t < PLAY[1];
    put(ip, null, playing ? 1 : 0); put(ipl, null, playing ? 0 : 1);

    // hold to reply, release to send
    const holding = t >= HOLD && t < RELEASE;
    put(hold, `scale(${holding ? 0.97 : 1})`, null);
    hold.classList.toggle('on', holding);
    const sentNow = t >= RELEASE && t < NEXT + 0.6;
    put(h1, null, holding || sentNow ? 0 : 1); put(h2, null, holding ? 1 : 0); put(h3, null, sentNow ? 1 : 0);
    hold.classList.toggle('sent', sentNow);
    put(rec, `scale(${f3(1 + 0.25 * Math.max(0, Math.sin(t * 6)))})`, null);
    bars.forEach((b, i) => { const lv = holding ? LEVELS[(i + Math.floor(t * 9)) % LEVELS.length] : 12; b.style.height = `${lv}%` });
    const nx = range(t, NEXT, NEXT + 0.4);
    put(n1, ty(-nx * 1.5), 1 - nx); put(n2, ty((1 - nx) * 1.5), nx);
  }

  const tl = timeline(el, draw, { period: PERIOD, restAt: REST });
  el.addEventListener('click', () => tl.restart());
  document.addEventListener('langchange', () => { I18N.apply(el); buildCaption(); });
  return tl;
}
