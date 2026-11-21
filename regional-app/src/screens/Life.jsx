import { useEffect, useMemo, useRef, useState } from 'react'
import { dateOfDay } from '../dates'
import { fmtDate, getLang, t, tn } from '../i18n'
import { AREAS } from '../plan'
import { GROUPS, GROUPS_BY_ID, SKILLS, SKILLS_BY_ID } from '../life/skills'
import { L, isRight, num, parseNumber } from '../life/format'
import { MIX, MIXES, OMIX, ROUND, SPRINT_SECONDS, cardQueue, lifeStreak, mastered, nextSkill, questionAt, runFor, sprintQuestion, strength, tried } from '../life/engine'
import { BackButton, CheckIcon, ChevronIcon, FlameIcon, Header, IconBadge, LifeIcon, NavBar, Page, PlanIcon, Rich, Ring, SearchField, SectionHeader, StatusDot, TimerIcon } from '../ui'

// Everyday maths: short lessons and endless practice for the maths you meet outside school.
// Everything runs on the device, so it works on the bus with no signal.

const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

function GroupBadge({ group, small = true }) {
  return (
    <IconBadge color={group.color} small={small}>
      <span className={`font-semibold ${group.glyph.length > 1 ? 'text-[11px]' : small ? 'text-[14px]' : 'text-[17px]'}`}>{group.glyph}</span>
    </IconBadge>
  )
}

const rightLately = (e) => Math.round(strength(e) * 10)

function SkillRow({ s, life, onOpen }) {
  const e = life.skills[s.id]
  const g = GROUPS_BY_ID[s.group]
  return (
    <button onClick={() => onOpen(s.id)} className="row">
      <GroupBadge group={g} />
      <span className="min-w-0 flex-1">
        <span className="body block truncate">{L(s.title)}</span>
        <span className="footnote block truncate">{tried(e) ? t('{k} of the last 10 right', { k: rightLately(e) }) : L(s.rule)}</span>
      </span>
      {mastered(e) ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--green)' }} aria-label={t('Mastered')}>
          <CheckIcon className="h-3.5 w-3.5 text-white" />
        </span>
      ) : tried(e) ? (
        <Ring value={strength(e)} size={26} stroke={4} color={g.color} label={t('{k} of the last 10 right', { k: rightLately(e) })} />
      ) : null}
      <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
    </button>
  )
}

// The last seven days: a filled dot for every day you practised
function Week({ life, today }) {
  const days = Array.from({ length: 7 }, (_, i) => today - 6 + i)
  return (
    <div className="mt-4 flex justify-between" aria-label={t('This week')}>
      {days.map((d) => {
        const n = life.log[d] || 0
        return (
          <div key={d} className="flex w-8 flex-col items-center gap-1">
            <span className="caption">{fmtDate(dateOfDay(d), { weekday: 'narrow' })}</span>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: n ? 'var(--accent)' : 'var(--fill)', boxShadow: d === today ? 'inset 0 0 0 2px var(--accent)' : undefined }}
              aria-label={n ? tn(n, '{n} answer', '{n} answers') : t('No practice')}
            >
              {n > 0 && <CheckIcon className="h-3.5 w-3.5 text-white" />}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MixCard({ life, today, id, onQuiz, title, note, firstNote, icon }) {
  const streak = lifeStreak(life, today)
  const run = life[id]
  const M = MIXES[id]
  const open = run && !run.done
  const done = life[M.day] === today && !open
  const triedCount = SKILLS.filter((s) => s.track === M.track && tried(life.skills[s.id])).length
  return (
    <div className="card mt-4 overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <IconBadge color="var(--accent)" small={false}>
            {icon}
          </IconBadge>
          <div className="min-w-0 flex-1">
            <p className="footnote flex items-center gap-1 font-semibold" style={{ color: streak ? 'var(--orange)' : 'var(--link)' }}>
              {streak > 0 && <FlameIcon className="h-[14px] w-[14px]" />}
              {streak > 0 ? tn(streak, '{n} day in a row', '{n} days in a row') : t('Every day')}
            </p>
            <p className="title3">{done ? t('Done for today') : title}</p>
          </div>
          {done && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'var(--green)' }}>
              <CheckIcon className="h-3.5 w-3.5 text-white" />
            </span>
          )}
        </div>
        <p className="footnote mt-3">{triedCount < 3 ? firstNote : note}</p>
        <Week life={life} today={today} />
      </div>
      <div className="px-4 pb-4">
        <button onClick={() => onQuiz(id)} className={`btn w-full ${done ? 'btn-tinted' : 'btn-filled'}`}>
          {open ? t('Continue · {i} of {n}', { i: run.res.length + 1, n: run.ids.length }) : done ? t('Another Set') : t('Start')}
        </button>
      </div>
    </div>
  )
}

function SkillGroups({ life, track, onOpenSkill }) {
  return GROUPS.filter((g) => g.track === track).map((g) => {
    const list = SKILLS.filter((s) => s.group === g.id)
    const done = list.filter((s) => mastered(life.skills[s.id])).length
    return (
      <div key={g.id}>
        <SectionHeader>
          {L(g.name)} · {done}/{list.length}
        </SectionHeader>
        <div className="group" style={{ '--inset': '56px' }}>
          {list.map((s) => (
            <SkillRow key={s.id} s={s} life={life} onOpen={onOpenSkill} />
          ))}
        </div>
      </div>
    )
  })
}

function OpenRound({ life, onQuiz }) {
  const run = life.run
  const s = run && !run.done && SKILLS_BY_ID[run.id]
  if (!s) return null
  return (
    <button onClick={() => onQuiz(run.id)} className="row">
      <GroupBadge group={GROUPS_BY_ID[s.group]} />
      <span className="min-w-0 flex-1">
        <span className="body block truncate">{t('Continue: {title}', { title: L(s.title) })}</span>
        <span className="footnote block">{t('Question {i} of {n}', { i: run.res.length + 1, n: run.ids.length })}</span>
      </span>
      <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
    </button>
  )
}

// The tab: olympiad problem-solving you can do standing in a shop, everyday maths underneath
export function LifeTab({ life, today, cardsDue, idea, onOpenSkill, onQuiz, onSprint, onCheats, onCards, onIdea, onEveryday }) {
  const next = nextSkill(life, 'olympiad')
  const everydayDone = life.mixDay === today
  return (
    <>
      <NavBar title={t('Pocket')} />
      <Page>
        <Header eyebrow={t('Olympiad training in 5 minutes')} title={t('Pocket')} />

        <MixCard
          life={life}
          today={today}
          id="omix"
          onQuiz={onQuiz}
          icon={<LifeIcon className="h-5 w-5" />}
          title={t('Today’s pocket set')}
          firstNote={t('{n} quick ones: facts, tricks, true or false, and the first idea for a real GWF problem. No proofs to write.', { n: OMIX })}
          note={t('{n} quick ones from your weakest topics, plus true or false and a real GWF problem. No proofs to write.', { n: OMIX })}
        />

        <SectionHeader>{t('Train the instinct')}</SectionHeader>
        <div className="group" style={{ '--inset': '56px' }}>
          <OpenRound life={life} onQuiz={onQuiz} />
          <button onClick={onCards} className="row">
            <IconBadge color="var(--purple)">
              <span className="text-[13px] font-semibold">{cardsDue ?? '·'}</span>
            </IconBadge>
            <span className="min-w-0 flex-1">
              <span className="body block">{t('Rule cards')}</span>
              <span className="footnote block">{cardsDue ? tn(cardsDue, '{n} theorem to recall today', '{n} theorems to recall today') : cardsDue === 0 ? t('All caught up — back tomorrow') : t('The toolbox as flashcards')}</span>
            </span>
            <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
          </button>
          <button onClick={onIdea} disabled={!idea} className="row disabled:opacity-50">
            <IconBadge color="var(--indigo)">
              <span className="text-[14px] font-semibold">?</span>
            </IconBadge>
            <span className="min-w-0 flex-1">
              <span className="body block">{t('Find the idea')}</span>
              <span className="footnote block truncate">{idea ? `${idea.comp || 'GWF'} ${idea.year} · ${idea.n} · ${t('plan it, don’t write it')}` : t('Past problems, no write-up')}</span>
            </span>
            <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
          </button>
          <button onClick={onSprint} className="row">
            <IconBadge color="var(--blue)">
              <TimerIcon className="h-4 w-4" />
            </IconBadge>
            <span className="min-w-0 flex-1">
              <span className="body block">{t('60-second sprint')}</span>
              <span className="footnote block">{life.best ? t('Mental maths against the clock · best {n}', { n: life.best }) : t('Mental maths against the clock')}</span>
            </span>
            <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
          </button>
          <button onClick={onCheats} className="row">
            <IconBadge>
              <PlanIcon className="h-4 w-4" />
            </IconBadge>
            <span className="min-w-0 flex-1">
              <span className="body block">{t('Cheat sheet')}</span>
              <span className="footnote block">{t('Every rule on one page')}</span>
            </span>
            <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
          </button>
        </div>

        {next && (
          <>
            <SectionHeader>{t('Next on the path')}</SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              <SkillRow s={next} life={life} onOpen={onOpenSkill} />
            </div>
          </>
        )}

        <SkillGroups life={life} track="olympiad" onOpenSkill={onOpenSkill} />

        <SectionHeader>{t('Nice to have')}</SectionHeader>
        <div className="group" style={{ '--inset': '56px' }}>
          <button onClick={onEveryday} className="row">
            <IconBadge color="var(--orange)">
              <span className="text-[14px] font-semibold">€</span>
            </IconBadge>
            <span className="min-w-0 flex-1">
              <span className="body block">{t('Everyday maths')}</span>
              <span className="footnote block">{everydayDone ? t('Today’s mix is done') : t('Percentages, money, odds, trips · 25 skills')}</span>
            </span>
            <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
          </button>
        </div>
        <p className="footnote mt-4 px-4">{t('9 of the last 10 right masters a skill. Mastered skills still come back in the mix now and then.')}</p>
      </Page>
    </>
  )
}

export function EverydayScreen({ life, today, backLabel, onBack, onOpenSkill, onQuiz }) {
  const next = nextSkill(life, 'everyday')
  return (
    <>
      <NavBar title={t('Everyday maths')} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <Header eyebrow={t('Maths you’ll actually use')} title={t('Everyday maths')} />
        <MixCard
          life={life}
          today={today}
          id="mix"
          onQuiz={onQuiz}
          icon={<span className="text-[17px] font-semibold">€</span>}
          title={t('The 3-minute mix')}
          firstNote={t('{n} quick questions to get you started. Works offline, one hand is enough.', { n: MIX })}
          note={t('{n} quick questions from your skills, the weakest first. Works offline.', { n: MIX })}
        />
        {next && (
          <>
            <SectionHeader>{t('Next on the path')}</SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              <SkillRow s={next} life={life} onOpen={onOpenSkill} />
            </div>
          </>
        )}
        <SkillGroups life={life} track="everyday" onOpenSkill={onOpenSkill} />
      </Page>
    </>
  )
}

/* ---------- rule cards: recall a theorem, then check ---------- */

export function CardsScreen({ life, today, tools, backLabel, onBack, onRate, onFinish, onOpenTool }) {
  const [queue, setQueue] = useState(() => (tools.length ? cardQueue(life, tools, today) : []))
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  const [knew, setKnew] = useState(0)
  const [again, setAgain] = useState({})
  const finished = useRef(false)
  useEffect(() => {
    if (tools.length && !queue.length && i === 0) setQueue(cardQueue(life, tools, today))
  }, [tools.length])
  const card = queue[i]
  const done = queue.length > 0 && i >= queue.length
  useEffect(() => {
    if (done && !finished.current) {
      finished.current = true
      onFinish()
    }
  }, [done])

  const rate = (ok) => {
    // A card you didn't know comes back once more at the end of this session
    if (!again[card.id]) onRate(card.id, ok)
    if (ok) setKnew((k) => k + 1)
    else if (!again[card.id]) {
      setAgain((a) => ({ ...a, [card.id]: true }))
      setQueue((q) => [...q, card])
    }
    setShown(false)
    setI((x) => x + 1)
    window.scrollTo(0, 0)
  }
  const color = card ? AREAS[card.area]?.color || 'var(--indigo)' : 'var(--indigo)'

  return (
    <>
      <NavBar title={t('Rule cards')} alwaysTitle left={<BackButton onClick={onBack} label={backLabel} />} right={card && !done && <span className="subhead secondary tabular-nums">{i + 1}/{queue.length}</span>} />
      <Page className="pt-2">
        {!tools.length ? (
          <div className="flex min-h-[40dvh] items-center justify-center" aria-label={t('Loading')}>
            <span className="spinner spinner-dark" />
          </div>
        ) : !queue.length ? (
          <div className="card mt-6 p-5 text-center">
            <p className="title2">{t('All caught up')}</p>
            <p className="subhead secondary mt-1">{t('No cards are due. New ones arrive tomorrow — try the pocket set meanwhile.')}</p>
          </div>
        ) : done ? (
          <div className="mt-6 text-center">
            <div className="pop flex justify-center">
              <Ring value={knew / queue.length} size={168} stroke={16} color="var(--purple)" label={`${knew}/${queue.length}`}>
                <span className="text-[44px] font-bold leading-none tabular-nums">{Object.keys(again).length ? queue.length - Object.keys(again).length : knew}</span>
              </Ring>
            </div>
            <h1 className="title1 rise mt-6">{t('Cards done')}</h1>
            <p className="subhead secondary rise mt-1">{t('Cards you knew come back later and later; the others tomorrow.')}</p>
            <button onClick={onBack} autoFocus className="btn btn-filled mt-6 w-full">
              {t('Done')}
            </button>
          </div>
        ) : (
          <div key={`${card.id}:${i}`} className="fade-in">
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {queue.map((_, k) => (
                <span key={k} className="h-1.5 flex-1 rounded-full" style={{ background: k < i ? 'var(--purple)' : k === i ? 'var(--accent)' : 'var(--fill)' }} />
              ))}
            </div>
            <div className="card mt-5 p-5">
              <p className="footnote font-semibold" style={{ color }}>
                {AREAS[card.area]?.name || t('Toolbox')}
                {!life.cards[card.id] && !again[card.id] ? ` · ${t('New')}` : ''}
              </p>
              <h1 className="title2 mt-1">{card.name}</h1>
              {card.nameDe && card.nameDe !== card.name && (
                <p className="subhead secondary mt-0.5" lang="de">
                  {card.nameDe}
                </p>
              )}
              {!shown && <p className="callout secondary mt-4">{t('Say the statement out loud, and when you’d use it. Then flip the card.')}</p>}
            </div>

            {shown ? (
              <>
                <SectionHeader>{t('Statement')}</SectionHeader>
                <div className="card p-4">
                  <Rich text={card.statement} />
                </div>
                {card.when && (
                  <>
                    <SectionHeader>{t('When to use it')}</SectionHeader>
                    <div className="card p-4">
                      <Rich text={card.when} className="callout" />
                    </div>
                  </>
                )}
                {card.example && (
                  <>
                    <SectionHeader>{t('Example')}</SectionHeader>
                    <div className="card p-4">
                      <Rich text={card.example.q} className="callout font-semibold" />
                      <Rich text={card.example.a} className="callout mt-2" />
                    </div>
                  </>
                )}
                <button onClick={() => onOpenTool(card.id)} className="link subhead mt-2 h-11 px-1 active:opacity-50">
                  {t('Open in the toolbox')}
                </button>
                <div className="sticky bottom-0 -mx-4 mt-4 grid grid-cols-2 gap-3 px-4 py-3" style={{ background: 'var(--bg)', boxShadow: '0 -0.5px 0 var(--sep)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
                  <button onClick={() => rate(false)} className="btn btn-gray">
                    {t('Not yet')}
                  </button>
                  <button onClick={() => rate(true)} className="btn btn-purple">
                    {t('Knew it')}
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setShown(true)} autoFocus className="btn btn-filled mt-5 w-full">
                {t('Flip the Card')}
              </button>
            )}
          </div>
        )}
      </Page>
    </>
  )
}

/* ---------- find the idea: plan a past problem without writing it up ---------- */

// The opening of the solution, up to a few lines, so a formula on its own line doesn't cut it off
const paragraphs = (solution) => String(solution || '').split(/\n\s*\n/)
const keyCount = (solution) => {
  const ps = paragraphs(solution)
  let n = 0
  let len = 0
  while (n < ps.length && (len < 220 || n < 1)) len += ps[n++].length
  return n
}

export function IdeaScreen({ p, entry, backLabel, onBack, onRate, onNext, onOpenBank }) {
  const [hints, setHints] = useState(0)
  const [reveal, setReveal] = useState(false)
  const [full, setFull] = useState(false)
  const [rated, setRated] = useState(null)
  const statement = getLang() === 'de' ? p.qDe || p.q : p.q || p.qDe
  const color = AREAS[p.area]?.color
  const RATINGS = [
    [2, t('Had the key idea'), 'var(--green)'],
    [1, t('Partly'), 'var(--orange)'],
    [0, t('Missed it'), 'var(--red)'],
  ]
  return (
    <>
      <NavBar title={t('Find the idea')} alwaysTitle left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page className="pt-2">
        <p className="footnote mt-2 font-semibold" style={{ color }}>
          {AREAS[p.area]?.name} · {p.comp || 'GWF'} {p.year} · {t('Problem {n}', { n: p.n })}
          {entry ? ` · ${t('seen before')}` : ''}
        </p>
        <div className="card mt-2 p-4">
          <Rich text={statement} lang={statement === p.qDe ? 'de' : undefined} />
        </div>
        {!reveal && (
          <div className="card mt-4 p-4" style={{ background: 'var(--tint)' }}>
            <p className="footnote font-semibold uppercase" style={{ color: 'var(--link)' }}>
              {t('No proof today')}
            </p>
            <p className="callout mt-1">{t('Try small cases in your head. What would you do first? What is the one step everything hinges on? When you have a plan, compare.')}</p>
          </div>
        )}

        {p.hints.slice(0, hints).map((h, i) => (
          <div key={i} className="card rise mt-3 p-4">
            <p className="footnote font-semibold">{t('Hint {n}', { n: i + 1 })}</p>
            <Rich text={h} className="callout mt-1" />
          </div>
        ))}

        {!reveal ? (
          <div className="mt-4 grid gap-3">
            {hints < p.hints.length && (
              <button onClick={() => setHints((h) => h + 1)} className="btn btn-tinted w-full">
                {t('Hint {n} of {total}', { n: hints + 1, total: p.hints.length })}
              </button>
            )}
            <button onClick={() => setReveal(true)} className="btn btn-filled w-full">
              {t('Compare with the Key Idea')}
            </button>
          </div>
        ) : (
          <>
            <SectionHeader>{t('The key idea')}</SectionHeader>
            <div className="card pop p-4">
              <Rich text={paragraphs(p.solution).slice(0, keyCount(p.solution)).join('\n\n')} className="callout" />
              {p.techniques?.length > 0 && <p className="footnote mt-3">{p.techniques.join(' · ')}</p>}
              {full ? (
                <Rich text={paragraphs(p.solution).slice(keyCount(p.solution)).join('\n\n')} className="callout mt-3" />
              ) : (
                paragraphs(p.solution).length > keyCount(p.solution) && (
                  <button onClick={() => setFull(true)} className="link subhead mt-2 h-9 active:opacity-50">
                    {t('Show the Whole Solution')}
                  </button>
                )
              )}
            </div>
            {rated == null ? (
              <>
                <p className="footnote mt-5 px-1 font-semibold uppercase">{t('How close was your plan?')}</p>
                <div className="mt-2 grid gap-3">
                  {RATINGS.map(([r, label, c]) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRated(r)
                        onRate(r)
                      }}
                      className="btn btn-gray w-full"
                      style={{ color: c }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-5 grid gap-3">
                <p className="subhead secondary px-1 text-center">{rated === 2 ? t('Nice. This one comes back only once all the others are done.') : t('It comes back after the new ones — try to spot the idea faster then.')}</p>
                <button onClick={onNext} autoFocus className="btn btn-filled w-full">
                  {t('Next Problem')}
                </button>
                <button onClick={() => onOpenBank(p.id)} className="btn btn-gray w-full">
                  {t('Write It Up Later in Train')}
                </button>
              </div>
            )}
          </>
        )}
      </Page>
    </>
  )
}

/* ---------- a skill's lesson ---------- */

function Steps({ steps, className = '' }) {
  return (
    <ol className={`grid gap-2 ${className}`}>
      {steps.map((st, i) => (
        <li key={i} className="flex gap-3">
          <span className="caption mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-semibold tabular-nums" style={{ background: 'var(--fill)', color: 'var(--label)' }}>
            {i + 1}
          </span>
          <Rich as="span" text={L(st)} className="callout tabular-nums" />
        </li>
      ))}
    </ol>
  )
}

export function SkillScreen({ skill: s, entry, backLabel, onBack, onPractise, onRead }) {
  const g = GROUPS_BY_ID[s.group]
  useEffect(() => {
    if (!entry?.read) onRead()
  }, [s.id])
  const practise = (
    <button onClick={onPractise} className="btn btn-filled w-full">
      {t('Practise · {n} Questions', { n: ROUND })}
    </button>
  )
  return (
    <>
      <NavBar title={L(s.title)} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <p className="footnote font-semibold" style={{ color: g.color }}>
          {L(g.name)}
        </p>
        <h1 className="title1 mt-1">{L(s.title)}</h1>
        {tried(entry) && (
          <p className="footnote mt-1">
            {t('{k} of the last 10 right', { k: rightLately(entry) })} · {tn(entry.n, '{n} answer', '{n} answers')}
            {mastered(entry) ? ` · ${t('Mastered')}` : ''}
          </p>
        )}

        <div className="card mt-4 p-4" style={{ background: 'var(--tint)' }}>
          <p className="footnote font-semibold uppercase" style={{ color: 'var(--link)' }}>
            {t('The rule')}
          </p>
          <p className="headline mt-1 tabular-nums">{L(s.rule)}</p>
        </div>
        <div className="mt-4">{practise}</div>

        <SectionHeader>{t('The idea')}</SectionHeader>
        <div className="card p-4">
          <p className="body">{L(s.idea)}</p>
        </div>

        <SectionHeader>{t('Worked example')}</SectionHeader>
        <div className="card p-4">
          <p className="headline tabular-nums">{L(s.example.q)}</p>
          <Steps steps={s.example.steps} className="mt-3" />
        </div>

        <SectionHeader>{t('Watch out')}</SectionHeader>
        <div className="card p-4">
          <p className="body">{L(s.trap)}</p>
        </div>

        <SectionHeader>{t('Where you’ll use it')}</SectionHeader>
        <div className="card p-4">
          <p className="body">{L(s.use)}</p>
        </div>

        <div className="mt-6">{practise}</div>
      </Page>
    </>
  )
}

/* ---------- a round of questions ---------- */

function Segments({ run, k }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {run.ids.map((_, i) => (
        <span key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: run.res[i] === 1 ? 'var(--green)' : run.res[i] === 0 ? 'var(--red)' : i === k ? 'var(--accent)' : 'var(--fill)' }} />
      ))}
    </div>
  )
}

function Question({ run, k, onAnswer, onNext, onOpenSkill, onOpenBank }) {
  const q = useMemo(() => questionAt(run, k), [run.seed, run.ids, k])
  const [input, setInput] = useState('')
  const [given, setGiven] = useState(null)
  const [format, setFormat] = useState(false)
  const [hint, setHint] = useState(false)
  const nextRef = useRef(null)
  const answered = run.res.length > k
  const ok = run.res[k] === 1
  const last = k + 1 >= run.ids.length
  const g = GROUPS_BY_ID[q.skill.group]

  useEffect(() => {
    if (answered) nextRef.current?.focus({ preventScroll: true })
  }, [answered])

  const submit = (value) => {
    if (answered) return
    const v = isRight(q, value)
    if (v === null) {
      setFormat(true)
      return
    }
    setGiven(value)
    onAnswer(q.skill.id, v)
  }

  return (
    <>
      <p className="footnote mt-5 font-semibold" style={{ color: g.color }}>
        {MIXES[run.id] ? `${L(g.name)} · ${L(q.skill.title)}` : t('Question {i} of {n}', { i: k + 1, n: run.ids.length })}
      </p>
      <div className="card mt-2 p-4">
        <Rich text={q.q} className="problem tabular-nums" style={{ fontSize: q.bank ? 17 : 19, lineHeight: q.bank ? '25px' : '27px' }} lang={q.bank && getLang() === 'de' ? 'de' : undefined} />
      </div>

      {q.choices ? (
        <div className="mt-4 grid gap-3">
          {q.choices.map((c, i) => {
            const isAnswer = i === q.answer
            const picked = given === String(i)
            const color = answered && isAnswer ? 'var(--green)' : answered && picked ? 'var(--red)' : null
            return (
              <button
                key={i}
                onClick={() => submit(String(i))}
                disabled={answered}
                className="press card flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-default"
                style={{ boxShadow: color ? `inset 0 0 0 2px ${color}` : undefined }}
              >
                <span className="body flex-1 tabular-nums">{c}</span>
                {answered && isAnswer && <StatusDot status="ok" />}
                {answered && picked && !isAnswer && <StatusDot status="failed" />}
              </button>
            )
          })}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(input)
          }}
          className="mt-4"
        >
          <div className={`field flex h-14 items-center gap-2 px-4 ${format ? 'shake' : ''}`} style={{ borderColor: answered ? (ok ? 'var(--green)' : 'var(--red)') : format ? 'var(--orange)' : 'transparent' }}>
            {q.unit && (
              <span className="headline invisible shrink-0" aria-hidden="true">
                {q.unit}
              </span>
            )}
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setFormat(false)
              }}
              readOnly={answered}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              inputMode="decimal"
              enterKeyHint="go"
              aria-label={t('Your answer')}
              placeholder={t('Your answer')}
              className="min-w-0 flex-1 bg-transparent text-center text-[22px] font-medium tabular-nums outline-none placeholder:text-[17px] placeholder:font-normal placeholder:text-[var(--label-2)]"
              style={{ color: 'var(--label)' }}
            />
            {q.unit && <span className="headline secondary shrink-0">{q.unit}</span>}
          </div>
          {format && (
            <p className="footnote mt-2 text-center" style={{ color: 'var(--orange)' }} aria-live="polite">
              {t('Enter just the number')}
            </p>
          )}
          {!answered && (
            <button disabled={!input.trim()} className="btn btn-filled mt-4 w-full">
              {t('Check')}
            </button>
          )}
        </form>
      )}

      {!answered && (
        <div className="mt-3 text-center">
          {hint ? (
            <p className="footnote rise px-2 tabular-nums">{L(q.skill.rule)}</p>
          ) : (
            <button onClick={() => setHint(true)} className="link subhead h-11 px-3 active:opacity-50">
              {t('Show the Rule')}
            </button>
          )}
        </div>
      )}

      {answered && (
        <>
          <div className="card pop mt-4 p-4" role="status">
            <div className="flex items-center gap-2">
              <StatusDot status={ok ? 'ok' : 'failed'} />
              <p className="headline" style={{ color: ok ? 'var(--green)' : 'var(--red)' }}>
                {ok ? t('Correct!') : t('Not quite')}
              </p>
            </div>
            {(!ok || q.min != null) && (
              <p className="body mt-2 tabular-nums">
                {t('Answer')}: <span className="font-semibold">{q.show}</span>
                {!ok && given != null && !q.choices && <span className="secondary"> · {t('you said {x}', { x: given })}</span>}
              </p>
            )}
            {q.note && <p className="footnote mt-1">{q.note}</p>}
            <p className="footnote mt-4 font-semibold uppercase">{q.choices ? t('Why') : t('The fast way')}</p>
            <Steps steps={q.steps} className="mt-2" />
            {q.bank ? (
              <button onClick={() => onOpenBank(q.bank)} className="link subhead mt-3 h-9 active:opacity-50">
                {t('Open the Problem')}
              </button>
            ) : (
              !ok && (
                <button onClick={() => onOpenSkill(q.skill.id)} className="link subhead mt-3 h-9 active:opacity-50">
                  {t('Open the lesson')}
                </button>
              )
            )}
          </div>
          <button ref={nextRef} onClick={onNext} className="btn btn-filled mt-4 w-full">
            {last ? t('See the Result') : t('Next')}
          </button>
        </>
      )}
    </>
  )
}

function Summary({ run, life, today, onAgain, onBack, onOpenSkill }) {
  const score = run.res.filter(Boolean).length
  const n = run.ids.length
  const share = score / n
  const color = share >= 0.8 ? 'var(--green)' : share >= 0.5 ? 'var(--accent)' : 'var(--orange)'
  const secs = run.endedAt ? Math.max(1, Math.round((run.endedAt - run.startedAt) / 1000)) : null
  const streak = lifeStreak(life, today)
  const bySkill = [...new Set(run.ids)].map((id) => ({ s: SKILLS_BY_ID[id], right: run.ids.filter((x, i) => x === id && run.res[i] === 1).length, of: run.ids.filter((x) => x === id).length })).filter((x) => x.s)
  return (
    <div className="mt-6 text-center">
      <div className="pop flex justify-center">
        <Ring value={share} size={168} stroke={16} color={color} label={`${score}/${n}`}>
          <span className="text-[44px] font-bold leading-none tabular-nums">
            {score}/{n}
          </span>
        </Ring>
      </div>
      <h1 className="title1 rise mt-6">{score === n ? t('Perfect round') : share >= 0.8 ? t('Strong round') : share >= 0.5 ? t('Round done') : t('Good practice')}</h1>
      <p className="subhead secondary rise mt-1 tabular-nums">
        {secs != null && (secs >= 60 ? t('{m} min {s} s', { m: Math.floor(secs / 60), s: secs % 60 }) : t('{s} seconds', { s: secs }))}
        {streak > 0 && ` · ${tn(streak, '{n} day in a row', '{n} days in a row')}`}
      </p>

      {MIXES[run.id] && (
        <>
          <SectionHeader>{t('In this set')}</SectionHeader>
          <div className="group text-left" style={{ '--inset': '56px' }}>
            {bySkill.map(({ s, right, of }) => (
              <button key={s.id} onClick={() => onOpenSkill(s.id)} className="row">
                <GroupBadge group={GROUPS_BY_ID[s.group]} />
                <span className="body min-w-0 flex-1 truncate">{L(s.title)}</span>
                <span className="subhead tabular-nums" style={{ color: right === of ? 'var(--green)' : 'var(--red)' }}>
                  {right}/{of}
                </span>
                <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
              </button>
            ))}
          </div>
        </>
      )}
      {!MIXES[run.id] && share < 0.8 && <p className="footnote mt-4 px-4">{t('Read the worked example once more, then go again. New numbers every round.')}</p>}

      <div className="mt-6 grid gap-3">
        <button onClick={onAgain} autoFocus className="btn btn-filled w-full">
          {MIXES[run.id] ? t('Another Set') : t('Another Round')}
        </button>
        <button onClick={onBack} className="btn btn-gray w-full">
          {t('Done')}
        </button>
      </div>
    </div>
  )
}

export function QuizScreen({ id, life, today, backLabel, onBack, onAnswer, onNext, onAgain, onOpenSkill, onOpenBank }) {
  const run = runFor(life, id)
  const title = id === 'omix' ? t('Pocket set') : id === 'mix' ? t('Daily mix') : L(SKILLS_BY_ID[id]?.title)
  return (
    <>
      <NavBar
        title={title}
        alwaysTitle
        left={<BackButton onClick={onBack} label={backLabel} />}
        right={run && !run.done && <span className="subhead secondary tabular-nums">{Math.min(run.i + 1, run.ids.length)}/{run.ids.length}</span>}
      />
      <Page className="pt-2">
        {!run ? (
          <div className="flex min-h-[40dvh] items-center justify-center" aria-label={t('Loading')}>
            <span className="spinner spinner-dark" />
          </div>
        ) : (
          <>
            <Segments run={run} k={run.done ? -1 : run.i} />
            {run.done ? (
              <Summary run={run} life={life} today={today} onAgain={onAgain} onBack={onBack} onOpenSkill={onOpenSkill} />
            ) : (
              <Question key={`${run.seed}:${run.i}`} run={run} k={run.i} onAnswer={onAnswer} onNext={onNext} onOpenSkill={onOpenSkill} onOpenBank={onOpenBank} />
            )}
          </>
        )}
      </Page>
    </>
  )
}

/* ---------- the 60-second sprint ---------- */

export function SprintScreen({ best, backLabel, onBack, onFinish }) {
  const [phase, setPhase] = useState('ready')
  const [seed, setSeed] = useState(1)
  const [k, setK] = useState(0)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState([])
  const [input, setInput] = useState('')
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [bestBefore, setBestBefore] = useState(best)
  const inputRef = useRef(null)
  const q = useMemo(() => sprintQuestion(k, seed), [k, seed])
  const left = Math.max(0, SPRINT_SECONDS * 1000 - (now - startedAt))

  useEffect(() => {
    if (phase !== 'run') return
    const tick = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(tick)
  }, [phase])

  useEffect(() => {
    if (phase === 'run' && left <= 0) {
      setPhase('over')
      onFinish(score)
    }
  }, [phase, left])

  const start = () => {
    setBestBefore(best)
    setSeed((Math.random() * 2 ** 31) >>> 0)
    setK(0)
    setScore(0)
    setMissed([])
    setInput('')
    setStartedAt(Date.now())
    setNow(Date.now())
    setPhase('run')
  }
  useEffect(() => {
    if (phase === 'run') inputRef.current?.focus()
  }, [phase])

  // No Enter needed: the next question comes as soon as the number is right
  const type = (v) => {
    setInput(v)
    const x = parseNumber(v)
    if (x != null && Math.abs(x - q.answer) < 1e-9) {
      setScore((s) => s + 1)
      setK((i) => i + 1)
      setInput('')
    }
  }
  const skip = () => {
    setMissed((m) => [...m, q])
    setK((i) => i + 1)
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <>
      <NavBar title={t('60-second sprint')} alwaysTitle left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page className="pt-2">
        {phase === 'ready' && (
          <>
            <h1 className="large-title mt-1">{t('60-second sprint')}</h1>
            <div className="card mt-5 p-5 text-center">
              <p className="title1 tabular-nums">1:00</p>
              <p className="subhead secondary mt-1">{t('As many as you can. No Enter key: the next one appears the moment you’re right.')}</p>
              {best > 0 && <p className="footnote mt-3 font-semibold">{t('Your best: {n}', { n: best })}</p>}
            </div>
            <button onClick={start} className="btn btn-filled mt-5 w-full">
              {t('Start the Clock')}
            </button>
          </>
        )}

        {phase === 'run' && (
          <>
            <div className="flex items-baseline justify-between">
              <span className="title2 tabular-nums" style={{ color: left < 10000 ? 'var(--red)' : 'var(--label)' }}>
                {Math.floor(Math.ceil(left / 1000) / 60)}:{String(Math.ceil(left / 1000) % 60).padStart(2, '0')}
              </span>
              <span className="headline tabular-nums" aria-live="polite">
                {tn(score, '{n} right', '{n} right')}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--fill)' }}>
              <div className="h-full rounded-full" style={{ width: `${(left / (SPRINT_SECONDS * 1000)) * 100}%`, background: left < 10000 ? 'var(--red)' : 'var(--accent)', transition: 'width 0.2s linear' }} />
            </div>
            <div className="card mt-6 flex min-h-[120px] items-center justify-center p-4">
              <p key={k} className="pop text-center text-[38px] font-bold leading-tight tabular-nums">
                {q.q}
              </p>
            </div>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => type(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              inputMode="decimal"
              aria-label={t('Your answer')}
              placeholder="?"
              className="field mt-4 h-16 w-full px-4 text-center text-[30px] font-semibold tabular-nums outline-none placeholder:text-[var(--label-2)]"
              style={{ color: 'var(--label)' }}
            />
            <button onClick={skip} className="btn btn-gray mt-4 w-full">
              {t('Skip')}
            </button>
          </>
        )}

        {phase === 'over' && (
          <div className="mt-6 text-center">
            <div className="pop flex justify-center">
              <Ring value={Math.min(1, score / Math.max(10, bestBefore || 10))} size={168} stroke={16} color={score > bestBefore ? 'var(--purple)' : 'var(--indigo)'} label={String(score)}>
                <span className="text-[56px] font-bold leading-none tabular-nums">{score}</span>
              </Ring>
            </div>
            <h1 className="title1 rise mt-6">{score > bestBefore && bestBefore > 0 ? t('New best!') : t('Time’s up')}</h1>
            <p className="subhead secondary rise mt-1">{bestBefore > 0 && score <= bestBefore ? t('Your best: {n}', { n: bestBefore }) : tn(score, '{n} right in a minute', '{n} right in a minute')}</p>
            {missed.length > 0 && (
              <>
                <SectionHeader>{t('Skipped')}</SectionHeader>
                <div className="group text-left">
                  {missed.map((m, i) => (
                    <div key={i} className="row">
                      <span className="body flex-1 tabular-nums">{m.q}</span>
                      <span className="body font-semibold tabular-nums">= {num(m.answer)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-6 grid gap-3">
              <button onClick={start} autoFocus className="btn btn-filled w-full">
                {t('Go Again')}
              </button>
              <button onClick={onBack} className="btn btn-gray w-full">
                {t('Done')}
              </button>
            </div>
          </div>
        )}
      </Page>
    </>
  )
}

/* ---------- every rule on one page ---------- */

export function CheatSheetScreen({ backLabel, onBack, onOpenSkill }) {
  const [q, setQ] = useState('')
  const hits = SKILLS.filter((s) => !q || [s.title, s.rule, s.use].some((p) => norm(L(p)).includes(norm(q))))
  return (
    <>
      <NavBar title={t('Cheat sheet')} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <Header title={t('Cheat sheet')} />
        <p className="subhead secondary">{t('Every rule in one place, saved on your phone for when you need it.')}</p>
        <div className="mt-4">
          <SearchField value={q} onChange={setQ} placeholder={t('Search the rules')} />
        </div>
        {GROUPS.map((g) => {
          const list = hits.filter((s) => s.group === g.id)
          if (!list.length) return null
          return (
            <div key={g.id}>
              <SectionHeader>{L(g.name)}</SectionHeader>
              <div className="group">
                {list.map((s) => (
                  <button key={s.id} onClick={() => onOpenSkill(s.id)} className="row items-start">
                    <span className="min-w-0 flex-1">
                      <span className="subhead block font-semibold">{L(s.title)}</span>
                      <span className="callout mt-0.5 block tabular-nums">{L(s.rule)}</span>
                    </span>
                    <ChevronIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        {!hits.length && (
          <div className="card mt-5 p-4">
            <p className="subhead secondary">{t('Nothing found for “{q}”.', { q })}</p>
          </div>
        )}
      </Page>
    </>
  )
}
