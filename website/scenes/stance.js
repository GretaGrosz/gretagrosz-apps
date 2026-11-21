// Agora: Argue back. Your argument for today's question opens, the AI argues the other side, and after the
// third round a judge gives the verdict: it quotes your strongest line and names the point you never answered.
// The app's own look: solid cards on iOS grey, the indigo accent, the serif for questions. All in cqw.
import { timeline, spring, range, clamp, lerp, ease, h } from './kit.js';

const I18N = window.I18N;
const LABEL = 'Agora, Argue back: your argument for today’s question opens, the AI argues the other side for three rounds, then the verdict quotes your strongest line and names the point you never answered.';
I18N.add({
  [LABEL]: 'Agora, Gegenrede: Dein Argument zur Frage des Tages eröffnet, die KI argumentiert drei Runden lang für die Gegenseite, dann zitiert das Urteil deinen stärksten Satz und nennt den Punkt, auf den du nie geantwortet hast.',
  'If every part of you were replaced, one piece at a time, would you still be you?':
    'Wenn jeder Teil von dir ersetzt würde, Stück für Stück, wärst du dann noch du?',
  'You: Still me': 'Du: Immer noch ich',
  'Other side: Someone new': 'Gegenseite: Jemand Neues',
  'Round 1 of 3': 'Runde 1 von 3',
  'Round 3 of 3': 'Runde 3 von 3',
  'You': 'Du',
  'Other side': 'Gegenseite',
  'Memories carry over gradually, so there is never one moment where you stop being you.':
    'Erinnerungen gehen nach und nach mit, also gibt es nie den einen Moment, in dem du aufhörst, du zu sein.',
  'If every part is swapped out bit by bit, what is left of the original? Which one is the real you?':
    'Wenn jedes Teil Stück für Stück ersetzt wird, was bleibt vom Original? Wer ist dann das echte Du?',
  'Verdict': 'Urteil',
  'Even': 'Unentschieden',
  'You both gave reasons.': 'Ihr habt beide begründet.',
  'Your strongest line': 'Dein stärkster Satz',
  '“There is never one moment where you stop being you.”': '„Es gibt nie den einen Moment, in dem du aufhörst, du zu sein.“',
  'You never answered': 'Darauf hast du nie geantwortet',
  'Where exactly the line is.': 'Wo genau die Grenze liegt.',
});

const PERIOD = 12, REST = 10.2;
const IN = 0.05, ROUND = 0.6, YOU = [0.9, 2.6], DOTS = [2.9, 3.8], THEM = 3.8, ROUND3 = 5.2, VERDICT = 5.8, QUOTE = 6.7, MISS = 7.4, OUT = [11.4, 11.95];

const f3 = (n) => Math.round(n * 1000) / 1000;
function put(el, tr, op) {
  if (tr != null && el._t !== tr) { el._t = tr; el.style.transform = tr; }
  if (op != null) { op = f3(clamp(op)); if (el._o !== op) { el._o = op; el.style.opacity = op; el.style.visibility = op ? '' : 'hidden'; } }
}
const ty = (y, s = 1) => `translate3d(0,${f3(y)}cqw,0)` + (s === 1 ? '' : ` scale(${f3(s)})`);
const pop = (el, u, from = 0.94, dy = 2) => { const s = spring(u, 0.74, 9); put(el, ty((1 - s) * dy, lerp(from, 1, s)), clamp(u * 3)); };

export function mount(el) {
  el.classList.add('sc-stance');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', LABEL);
  const root = h(`<div class="a-all" aria-hidden="true">
    <p class="a-q">If every part of you were replaced, one piece at a time, would you still be you?</p>
    <div class="a-chips"><span class="a-chip a-me"><i></i>You: Still me</span><span class="a-chip"><i></i>Other side: Someone new</span></div>
    <div class="a-round"><span class="a-r1">Round 1 of 3</span><span class="a-r3">Round 3 of 3</span></div>
    <div class="a-you"><span class="a-cap">You</span><p class="a-yt"></p></div>
    <div class="a-them"><span class="a-cap">Other side</span><span class="a-dots"><i></i><i></i><i></i></span><p class="a-tt">If every part is swapped out bit by bit, what is left of the original? Which one is the real you?</p></div>
    <div class="a-verdict">
      <span class="a-cap">Verdict</span>
      <b class="a-even">Even</b>
      <p class="a-why">You both gave reasons.</p>
      <div class="a-best"><span class="a-cap a-acc">Your strongest line</span><p>“There is never one moment where you stop being you.”</p></div>
      <div class="a-miss"><span class="a-cap">You never answered</span><p>Where exactly the line is.</p></div>
    </div>
  </div>`);
  el.append(root);
  I18N.apply(el);

  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const q = $('.a-q'), chips = $('.a-chips'), round = $('.a-round'), r1 = $('.a-r1'), r3 = $('.a-r3');
  const you = $('.a-you'), yt = $('.a-yt'), them = $('.a-them'), dots = $('.a-dots'), dotEls = $$('.a-dots i'), tt = $('.a-tt');
  const verdict = $('.a-verdict'), best = $('.a-best'), miss = $('.a-miss');
  // your argument is typed word by word (the words come from the current language)
  const YOUR = 'Memories carry over gradually, so there is never one moment where you stop being you.';
  let words = [], shownWords = -1;
  const setWords = () => { words = I18N.t(YOUR).split(' '); shownWords = -1; };
  setWords();

  function draw(t) {
    put(root, null, 1 - ease.inOut(range(t, OUT[0], OUT[1])));
    pop(q, range(t, IN, IN + 0.7), 0.97, 1.6);
    pop(chips, range(t, IN + 0.15, IN + 0.85), 0.95, 1.6);
    pop(round, range(t, ROUND, ROUND + 0.5), 1, 1);
    const rr = range(t, ROUND3, ROUND3 + 0.4);
    put(r1, ty(-rr * 2), 1 - rr); put(r3, ty((1 - rr) * 2), rr);

    pop(you, range(t, YOU[0] - 0.2, YOU[0] + 0.4), 0.96, 2);
    const n = Math.round(words.length * range(t, YOU[0], YOU[1]));
    if (n !== shownWords) { shownWords = n; yt.textContent = words.slice(0, Math.max(n, 0)).join(' ') || ' '; }

    pop(them, range(t, DOTS[0], DOTS[0] + 0.6), 0.96, 2);
    const typing = t >= DOTS[0] && t < THEM;
    put(dots, null, typing ? 1 : 0);
    dotEls.forEach((d, i) => put(d, `translate3d(0,${f3(typing ? -0.6 * Math.max(0, Math.sin((t * 7) - i * 0.9)) : 0)}cqw,0)`, null));
    put(tt, null, range(t, THEM, THEM + 0.4));

    // after round 3 the verdict rises over the exchange
    const vu = spring(range(t, VERDICT, VERDICT + 0.9), 0.82, 8);
    put(verdict, `translate3d(0,${f3((1 - vu) * 60)}cqw,0)`, t >= VERDICT ? 1 : 0);
    pop(best, range(t, QUOTE, QUOTE + 0.7), 0.94, 1.6);
    pop(miss, range(t, MISS, MISS + 0.7), 0.97, 1.6);
  }

  const tl = timeline(el, draw, { period: PERIOD, restAt: REST });
  el.addEventListener('click', () => tl.restart());
  document.addEventListener('langchange', () => { I18N.apply(el); setWords(); });
  return tl;
}
