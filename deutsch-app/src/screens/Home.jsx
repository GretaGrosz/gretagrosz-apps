import { useStore, currentStreak, hearts as heartsOf, freezeAvailable } from '../lib/store.js'
import { today, daysBetween, fmt, weekKey, fromKey } from '../lib/dates.js'
import { phaseOf, phases, pacing, nextLesson, unitById, weeklyTextsorte, weakestSkills, lessonDone, LESSONS, estimateLevel, LEVELS } from '../lib/curriculum.js'
import { dueCards } from '../lib/srs.js'
import { Page, Progress, go } from '../components/ui.jsx'
import TEXTSORTEN from '../../data/textsorten.json'
import Icon, { IconTile, TEXTSORTE_ICON } from '../components/Icon.jsx'

const SKILL_LABEL = (s) => s.replace(/^adj\./, 'Adjektiv ').replace(/^art\./, 'Artikel ').replace(/^np\./, 'Nomen im Fall ').replace(/^plural\.datn/, 'Dativ Plural -n').replace(/^plural\.keinN/, 'Plural ohne extra -n')
  .replace(/^komma\./, 'Beistrich: ').replace(/^wortstellung\.v2/, 'Verb an Position 2').replace(/^wortstellung\.ns/, 'Verb am Ende (Nebensatz)').replace(/^wortstellung\.verbverb/, 'Nebensatz vorne: Verb, Verb')
  .replace(/^poss\./, 'Possessiv ').replace(/^ns\./, 'Nebensatz ').replace(/^rel\./, 'Relativpronomen ').replace(/\.N\b/, ' Nom.').replace(/\.A\b/, ' Akk.').replace(/\.D\b/, ' Dat.').replace(/\.G\b/, ' Gen.')
  .replace(/\.m$/, ' mask.').replace(/\.f$/, ' fem.').replace(/\.n$/, ' neutr.').replace(/\.pl$/, ' Plural').replace(/\./g, ' ')
export { SKILL_LABEL }

export default function Home() {
  const s = useStore()
  const t = today()
  const streak = currentStreak(s)
  const hearts = heartsOf(s)
  const ph = phaseOf(s.setup)
  const p = phases(s.setup)
  const pace = pacing(s)
  const daysLeft = daysBetween(t, s.setup.examDate)
  const xpToday = s.xp.byDay[t] || 0
  const ans = s.answers[t] || { n: 0, c: 0 }
  const due = dueCards(s).length
  const next = nextLesson(s)
  const nextUnit = next && unitById(next.unit)
  const weak = weakestSkills(s, 3)
  const phaseProgress = Math.min(1, Math.max(0, daysBetween(ph.from, t) / Math.max(1, daysBetween(ph.from, ph.to))))
  const lessonsToday = Object.values(s.lessons).filter((l) => l.last === t).length
  const wk = weekKey(t)
  const textsThisWeek = s.texts.filter((x) => weekKey(x.date) === wk)
  const simsThisWeek = textsThisWeek.filter((x) => x.kind === 'simulation').length
  const dow = fromKey(t).getDay()
  const paragraphDay = [1, 3, 5].includes(dow)
  const ts = weeklyTextsorte(s.setup)
  const tsInfo = TEXTSORTEN.find((x) => x.id === ts)

  let plan
  if (ph.reviewOnly) plan = `Letzte ${daysLeft} Tage: nur Wiederholung – keine neuen Inhalte.`
  else if (ph.n === 3) plan = `Heute: 1 Wiederholungs-Lektion + Üben${simsThisWeek < 2 ? ' + Schularbeit-Simulation' : ''}.`
  else if (ph.n === 4) plan = `Heute: ${Math.max(1, Math.round(s.setup.minutes / 15))} Lektionen im C1-Pfad + Üben. Datum der nächsten Schularbeit? Trag es oben ein.`
  else if (pace.remaining === 0) plan = 'Alle Units dieser Phase geschafft! Weiter im Pfad (Richtung C1), dazu Üben und Sprints.'
  else plan = `Heute: ${pace.perDay} ${pace.perDay === 1 ? 'Lektion' : 'Lektionen'} + 1 Übung, dann bist du im Plan.`

  const Chevron = () => <Icon name="chevronRight" size={22} className="muted" />
  return (
    <Page wide>
      <div className="safe-t flex items-center justify-between pb-2 pt-2">
        <div>
          <p className="text-sm font-medium muted">{fmt(t)}</p>
          <h1 className="h1">Heute</h1>
        </div>
        <div className="flex gap-2 lg:hidden">
          <span className="chip" title="Streak"><Icon name="flame" size={16} className="text-orange-500" />{streak}</span>
          <span className="chip" title="Herzen"><Icon name="heart" size={16} className="text-red-500" />{hearts}</span>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div>
          <div className="card mt-2 bg-gradient-to-br from-brand to-brand-dark !text-white !ring-0 lg:p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Schularbeit am {fmt(s.setup.examDate)}</p>
                <p className="text-4xl font-bold tabular-nums lg:text-5xl">{Math.max(0, daysLeft)} <span className="text-lg font-semibold">Tage</span></p>
              </div>
              <a href="#/einstellungen" className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">Datum ändern</a>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs font-semibold opacity-90">
                <span>Phase {ph.n}: {ph.name}{ph.sub ? ` · ${ph.sub}` : ''}</span>
                <span>{pace.total ? `${pace.done}/${pace.total} Lektionen` : `${Math.round(phaseProgress * 100)} %`}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white" style={{ width: `${(pace.total ? pace.done / pace.total : phaseProgress) * 100}%` }} />
              </div>
              <p className="mt-2 text-sm font-medium">{plan}</p>
              {pace.behind && <p className="mt-1 flex items-start gap-1.5 rounded-lg bg-white/15 px-2 py-1 text-xs"><Icon name="alert" size={14} className="mt-px" />Du bist etwas hinter dem Plan ({pace.done} statt {pace.expectedDone} Lektionen). Das Tagesziel ist darum leicht erhöht.</p>}
            </div>
          </div>

          <button onClick={() => go('/lockin')} className="mt-3 flex w-full items-center gap-4 rounded-2xl bg-ink p-4 text-left text-white shadow-[0_5px_0_#000] transition hover:brightness-125 active:translate-y-[2px] dark:bg-[#e7ece9] dark:text-ink">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 dark:bg-black/10"><Icon name="lock" size={26} /></span>
            <span className="flex-1">
              <span className="block text-lg font-bold">Lock-In starten</span>
              <span className="block text-sm opacity-80">{s.setup.minutes} Min. am Stück: {ph.n === 3 ? 'Wiederholung' : 'Lektion'}, Üben, Sprint</span>
            </span>
            <Icon name="chevronRight" size={22} className="opacity-70" />
          </button>

          {!ph.reviewOnly && ph.n !== 3 && next && (
            <button onClick={() => go(`/lektion/${next.id}`)} className="card mt-3 flex w-full items-center gap-4 text-left active:scale-[.99]">
              <div className="flex h-16 w-16 shrink-0 animate-bob items-center justify-center rounded-full bg-brand text-white shadow-[0_5px_0_#0f7353]"><Icon name="play" size={28} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-brand">Weiter · Unit {nextUnit?.n} · {nextUnit?.level}</p>
                <p className="truncate text-lg font-bold">{next.title}</p>
                <p className="truncate text-sm muted">{nextUnit?.title} · {lessonsToday} heute erledigt</p>
              </div>
              <Chevron />
            </button>
          )}
          {ph.n === 3 && (
            <button onClick={() => go('/wiederholung')} className="card mt-3 flex w-full items-center gap-4 text-left">
              <div className="flex h-16 w-16 shrink-0 animate-bob items-center justify-center rounded-full bg-gold text-white shadow-[0_5px_0_#b07b0e]"><Icon name="repeat" size={28} /></div>
              <div className="flex-1"><p className="text-xs font-bold uppercase tracking-wide text-gold">Prüfungsmodus</p><p className="text-lg font-bold">Wiederholung (gemischt)</p><p className="text-sm muted">gewichtet nach deinen schwächsten Bereichen</p></div>
            </button>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="card !p-3">
              <p className="text-xs font-bold text-gold">XP heute</p>
              <p className="text-xl font-bold tabular-nums">{xpToday}<span className="text-sm muted"> / {s.setup.dailyGoal}</span></p>
              <Progress value={xpToday / s.setup.dailyGoal} className="mt-1 !h-2" color="bg-gold" />
            </div>
            <div className="card !p-3">
              <p className="text-xs font-bold text-brand">Übungen heute</p>
              <p className="text-xl font-bold tabular-nums">{ans.n}<span className="text-sm muted"> / {s.setup.dailyTarget}</span></p>
              <Progress value={ans.n / s.setup.dailyTarget} className="mt-1 !h-2" />
            </div>
          </div>

          <a href="#/ueben" className="card mt-3 flex items-center gap-3">
            <IconTile name="repeat" />
            <div className="flex-1">
              <p className="font-bold">Üben {due > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{due} fällig</span>}</p>
              <p className="text-sm muted">Deine Fehler, „Meine Fehler“ und schwächste Bereiche, gemischt</p>
            </div>
            <Chevron />
          </a>
        </div>

        <div>
          <LevelCard s={s} />

          {weak.length > 0 && (
            <div className="card mt-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold"><Icon name="target" size={16} className="text-red-500" />Deine 3 schwächsten Mikro-Skills</p>
              {weak.map((w) => (
                <a key={w.s} href={`#/ueben?skill=${encodeURIComponent(w.s)}`} className="flex items-center justify-between border-t border-black/5 py-2 text-sm first:border-0 hover:text-brand dark:border-white/10">
                  <span>{SKILL_LABEL(w.s)}</span><span className="font-semibold tabular-nums text-red-500">{Math.round(w.acc * 100)} %</span>
                </a>
              ))}
            </div>
          )}

          {ph.n === 1 && paragraphDay && (
            <a href="#/absatz" className="card mt-3 flex items-center gap-3"><IconTile name="pen" tone="violet" /><div className="flex-1"><p className="font-bold">Schreibaufgabe: ein kurzer Absatz</p><p className="text-sm muted">Mo/Mi/Fr · 60–100 Wörter mit Endkontrolle</p></div><Chevron /></a>
          )}
          {ph.n === 2 && tsInfo && (
            <a href={`#/textsorte/${ts}`} className="card mt-3 flex items-center gap-3"><IconTile name={TEXTSORTE_ICON[ts]} tone="violet" /><div className="flex-1"><p className="font-bold">Textsorte der Woche: {tsInfo.name}</p><p className="text-sm muted">{textsThisWeek.length ? 'Text diese Woche geschrieben' : 'Diese Woche: Bauplan lernen + 1 ganzen Text schreiben'}</p></div><Chevron /></a>
          )}
          {ph.n === 3 && (
            <a href="#/simulation" className="card mt-3 flex items-center gap-3"><IconTile name="clock" tone="gold" /><div className="flex-1"><p className="font-bold">Schularbeit-Simulation</p><p className="text-sm muted">{simsThisWeek}/2 diese Woche · danach Endkontrolle</p></div><Chevron /></a>
          )}

          <div className="mt-3 flex items-center justify-between px-1 text-xs muted">
            <span className="flex items-center gap-1"><Icon name="snowflake" size={13} />Streak-Freeze: {freezeAvailable(s) ? '1 verfügbar diese Woche' : 'diese Woche verbraucht'}</span>
            <span>{LESSONS.filter((l) => lessonDone(s, l.id)).length}/{LESSONS.length} Lektionen</span>
          </div>
          <p className="mt-1 px-1 text-xs muted">Phase 2 ab {fmt(p.p2)} · Prüfungsmodus ab {fmt(p.p3)}</p>
        </div>
      </div>
    </Page>
  )
}

export function LevelCard({ s }) {
  const { reached, working, progress } = estimateLevel(s)
  return (
    <a href="#/pfad" className="card mt-3 block">
      <div className="flex items-baseline justify-between">
        <p className="font-bold">Dein Grammatik-Niveau</p>
        <p className="text-sm muted">{reached ? `${reached} geschafft · ` : ''}jetzt: <b className="text-brand">{working}</b></p>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {LEVELS.map((lv) => {
          const p = progress[lv]
          const f = p.total ? p.done / p.total : 0
          return (
            <div key={lv}>
              <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className={`h-full rounded-full ${lv === 'C1' ? 'bg-gold' : 'bg-brand'}`} style={{ width: `${f * 100}%` }} /></div>
              <p className="mt-1 text-center text-xs font-semibold">{lv} <span className="muted">{Math.round(f * 100)}%</span></p>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs muted">Geschafft = 80 % der Lektionen mit ≥ 80 % Genauigkeit. C1 = alle 40 Units inkl. C1-Pfad.</p>
    </a>
  )
}
