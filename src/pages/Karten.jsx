import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { getJahrgang, getKapitel, getKapitelTopics } from '../data/curriculum.js'
import { cardsOfTopic } from '../data/flashcards.js'
import { useContent } from '../data/content.js'
import { titleOf } from '../data/translate.js'
import { isKnown } from '../data/srs.js'
import { shuffle, textMatches } from '../data/questions.js'
import { useLang } from '../i18n.jsx'
import { useProgress } from '../progress.jsx'
import { chapterLink, topicLink } from '../data/links.js'
import { SPRING } from '../motion.js'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import DeTerm from '../components/DeTerm.jsx'
import Segmented from '../components/Segmented.jsx'
import { CheckIcon, XIcon } from '../components/Icons.jsx'

// /karten/:jahrgangId/:kapitelId/:topicId – der Kartenstapel ("gesamt" = ganzes Kapitel)
export function KartenDeck() {
  const { jahrgangId } = useParams()
  const { lang } = useLang()
  useContent(lang, [Number(jahrgangId)])
  return <Deck />
}

function Deck() {
  const { jahrgangId, kapitelId, topicId } = useParams()
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { srs, setLast } = useProgress()
  const jahrgang = getJahrgang(jahrgangId)
  const kapitel = getKapitel(jahrgangId, kapitelId)
  const isGesamt = topicId === 'gesamt'
  const topics = kapitel ? getKapitelTopics(jahrgangId, kapitelId).filter((x) => isGesamt || x.id === topicId) : []
  const title = isGesamt ? titleOf(kapitel, lang) : titleOf(topics[0], lang)
  const backTo = topicLink(jahrgangId, kapitelId, topicId)

  useEffect(() => {
    if (!isGesamt && topics.length) setLast({ jahrgangId: Number(jahrgangId), kapitelId, topicId })
  }, [topicId]) // eslint-disable-line react-hooks/exhaustive-deps

  const deck = useMemo(() => topics.flatMap((x) => cardsOfTopic(x.id, lang)), [topicId, kapitelId, lang]) // eslint-disable-line react-hooks/exhaustive-deps
  // Was noch nicht sitzt zuerst, jeweils gemischt
  const order = (ids) => [...shuffle(ids.filter((id) => !isKnown(srs[id]))), ...shuffle(ids.filter((id) => isKnown(srs[id])))]

  if (!jahrgang || !kapitel || deck.length === 0) {
    return (
      <Page title={t('flashcards')} back={backTo}>
        <p className="text-label2">{t('noCards')}</p>
      </Page>
    )
  }

  return (
    <CardSession
      key={`${topicId}-${kapitelId}`}
      title={title}
      back={backTo}
      cards={deck}
      initialOrder={order}
      showTopic={isGesamt ? (card) => titleOf(topics.find((x) => x.id === card.topicId), lang) : null}
      done={(again, missed) => (
        <>
          <Button variant="secondary" onClick={() => navigate(chapterLink(jahrgangId, kapitelId), { replace: true })} className="w-full">
            {t('otherTopics')}
          </Button>
          {missed.length > 0 && (
            <Button variant="secondary" onClick={() => again(missed)} className="w-full">
              {t('onlyUnknown')}
            </Button>
          )}
          <Button onClick={() => again(deck.map((c) => c.id))} className="w-full">
            {t('studyAgain')}
          </Button>
        </>
      )}
    />
  )
}

// Abfragemodus: Begriff → Erklärung, Erklärung → Begriff, oder Begriff zur Erklärung eintippen.
// Wird pro Gerät gemerkt (reine Bequemlichkeit, darf auch fehlen).
const MODE_KEY = 'bw-buddy-card-mode'
const MODES = ['classic', 'reverse', 'type']
function readMode() {
  try {
    const m = localStorage.getItem(MODE_KEY)
    return MODES.includes(m) ? m : 'classic'
  } catch {
    return 'classic'
  }
}
function saveMode(m) {
  try {
    localStorage.setItem(MODE_KEY, m)
  } catch {
    /* privates Fenster o. Ä. */
  }
}

// Akzeptierte Eingaben für eine Karte: Begriff, Begriff ohne Klammerzusatz, Teile bei "/" und der deutsche Begriff
function acceptedTerms(card) {
  const out = new Set()
  for (const term of [card.term, card.deTerm]) {
    if (!term) continue
    out.add(term)
    const plain = term.replace(/\s*\([^)]*\)/g, '').trim()
    out.add(plain)
    ;(term.match(/\(([^)]*)\)/g) ?? []).forEach((m) => out.add(m.slice(1, -1)))
    plain.split(/\s*(?:\/|–| vs\. )\s*/).forEach((part) => part && out.add(part))
  }
  return [...out].filter((x) => x.length > 1)
}

/**
 * Eine Runde Karteikarten. Antippen dreht um, nach rechts wischen = gewusst, nach links = nochmal.
 * Tastatur: Leertaste dreht, ← nochmal, → gewusst.
 * review: Wiederholung fälliger Karten (XP einmal pro Karte und Tag)
 */
export function CardSession({ title, back, cards, initialOrder, showTopic, done, review = false }) {
  const { t } = useLang()
  const { reviewCard, hints, markHint } = useProgress()
  const reduced = useReducedMotion()
  const byId = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards])
  const [queue, setQueue] = useState(() => initialOrder(cards.map((c) => c.id)))
  const [round, setRound] = useState(() => ({ total: cards.length, missed: [] }))
  const [flipped, setFlipped] = useState(false)
  const [exitDir, setExitDir] = useState(0)
  const [turn, setTurn] = useState(0)
  const [mode, setModeState] = useState(readMode)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(null) // Eintippen: null (offen) | true | false
  const nudge = useAnimationControls()
  const current = byId[queue[0]]

  // Beim allerersten Kartenstapel zeigt die Karte einmal kurz, dass man sie wischen kann.
  useEffect(() => {
    if (hints.swipe || reduced || !current) return
    const id = setTimeout(async () => {
      await nudge.start({ x: [0, 38, -38, 0], rotate: [0, 3, -3, 0], transition: { duration: 0.9, ease: 'easeInOut' } })
      markHint('swipe')
    }, 700)
    return () => clearTimeout(id)
  }, [hints.swipe]) // eslint-disable-line react-hooks/exhaustive-deps

  const answer = useCallback(
    (known) => {
      if (!current) return
      setExitDir(known ? 1 : -1)
      setTurn((n) => n + 1)
      reviewCard(current.id, known, { review })
      setFlipped(false)
      setTyped('')
      setChecked(null)
      if (known) setQueue((q) => q.slice(1))
      else {
        setRound((r) => (r.missed.includes(current.id) ? r : { ...r, missed: [...r.missed, current.id] }))
        setQueue((q) => [...q.slice(1), q[0]])
      }
    },
    [current, reviewCard, review],
  )

  const setMode = (m) => {
    setModeState(m)
    saveMode(m)
    setFlipped(false)
    setTyped('')
    setChecked(null)
  }

  const check = () => {
    if (!current || !typed.trim()) return
    setChecked(textMatches(typed, acceptedTerms(current)))
    setFlipped(true)
  }

  const again = (ids) => {
    setQueue(initialOrder(ids))
    setRound({ total: ids.length, missed: [] })
    setFlipped(false)
  }

  useEffect(() => {
    if (!current) return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target instanceof HTMLInputElement) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') answer(true)
      else if (e.key === 'ArrowLeft') answer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, answer])

  if (!current) {
    const first = round.total - round.missed.length
    return (
      <Page title={title} back={back} inline>
        <div className="flex flex-col items-center pt-14 text-center">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white"
          >
            <CheckIcon className="h-10 w-10" />
          </motion.span>
          <h1 className="text-[28px] font-bold text-label">{review ? t('reviewDone') : t('deckDone')}</h1>
          <p className="mt-1 max-w-sm text-[17px] text-label2">{t('deckDoneText', { first, total: round.total })}</p>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-2.5">{done(again, round.missed)}</div>
        </div>
      </Page>
    )
  }

  const progress = round.total ? (round.total - queue.length) / round.total : 0
  const flip = reduced
    ? { front: { opacity: flipped ? 0 : 1 }, back: { opacity: flipped ? 1 : 0 } }
    : { front: { rotateY: flipped ? 180 : 0 }, back: { rotateY: flipped ? 0 : -180 } }

  return (
    <Page title={title} back={back} inline>
      <div className="mx-auto w-full max-w-md">
        <Segmented
          id="card-mode"
          label={t('cardMode')}
          className="mb-4"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'classic', label: t('modeClassic') },
            { value: 'reverse', label: t('modeReverse') },
            { value: 'type', label: t('modeType') },
          ]}
        />
        <div className="mb-2 flex justify-end text-[13px] font-semibold text-label2 tabular">{t('cardsLeft', { n: queue.length })}</div>
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-fill/20" role="progressbar" aria-label={t('progress')} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-accent" initial={false} animate={{ width: `${progress * 100}%` }} transition={SPRING} />
        </div>

        <div className="relative h-[min(400px,52dvh)]" style={{ perspective: 1200 }}>
          <AnimatePresence custom={exitDir} initial={false}>
            <motion.div
              key={turn}
              custom={exitDir}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }}
              exit={(dir) => ({ opacity: 0, x: dir * 340, rotate: dir * 10, transition: { duration: 0.25 } })}
              transition={SPRING}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100 || info.velocity.x > 700) answer(true)
                else if (info.offset.x < -100 || info.velocity.x < -700) answer(false)
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <motion.div animate={nudge} className="h-full w-full">
                <button
                  type="button"
                  onClick={() => setFlipped((f) => !f)}
                  aria-label={flipped ? current.erklaerung : current.term}
                  className="relative block h-full w-full text-left"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Vorderseite: Begriff (klassisch) oder Erklärung (umgekehrt/eintippen) */}
                  <motion.div
                    animate={flip.front}
                    transition={{ duration: reduced ? 0.15 : 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-[24px] bg-surface p-8 text-center shadow-[0_10px_30px_-18px_rgb(0_0_0/0.35)]"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    {showTopic && <span className="absolute top-5 px-6 text-[13px] font-semibold text-label2">{showTopic(current)}</span>}
                    {mode === 'classic' ? (
                      <>
                        <span className="text-[30px] font-bold leading-tight text-accent-text [hyphens:auto]">{current.term}</span>
                        <DeTerm term={current.deTerm} shown={current.term} />
                      </>
                    ) : (
                      <>
                        <span className="text-[13px] font-semibold uppercase tracking-wide text-label2">{t('whichTerm')}</span>
                        <p className="text-[19px] leading-relaxed text-label">{current.erklaerung}</p>
                      </>
                    )}
                  </motion.div>

                  {/* Rückseite: Erklärung (klassisch) oder Begriff mit Erklärung */}
                  <motion.div
                    initial={false}
                    animate={flip.back}
                    transition={{ duration: reduced ? 0.15 : 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                    className="absolute inset-0 flex flex-col justify-center gap-3 overflow-y-auto rounded-[24px] bg-accent p-7 text-white"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    {mode === 'type' && checked !== null && (
                      <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                        {checked ? <CheckIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
                        {checked ? t('cardTypedRight') : t('cardTypedWrong')}
                      </span>
                    )}
                    {mode === 'classic' ? (
                      <span className="text-[20px] font-bold">{current.term}</span>
                    ) : (
                      <span>
                        <span className="block text-[28px] font-bold leading-tight [hyphens:auto]">{current.term}</span>
                        <DeTerm term={current.deTerm} shown={current.term} className="!text-white/80" />
                      </span>
                    )}
                    <p className={mode === 'classic' ? 'text-[17px] leading-relaxed' : 'text-[15px] leading-relaxed opacity-90'}>{current.erklaerung}</p>
                    {current.beispiel && (
                      <p className="text-[15px] opacity-90">
                        <span className="font-semibold">{t('example')}</span> {current.beispiel}
                      </p>
                    )}
                    {mode === 'type' && checked === false && typed.trim() && <p className="text-[13px] opacity-75 line-through">{typed.trim()}</p>}
                  </motion.div>
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {mode === 'type' && checked === null && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              check()
            }}
            className="mt-5 flex gap-2"
          >
            <input
              key={turn}
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t('typeTerm')}
              aria-label={t('typeTerm')}
              enterKeyHint="done"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-control border-2 border-transparent bg-surface px-4 py-3 text-[17px] font-semibold text-label outline-none placeholder:font-normal placeholder:text-label3 focus:border-accent"
            />
            <Button type="submit" disabled={!typed.trim()} className="shrink-0 px-5">
              {t('cardCheck')}
            </Button>
          </form>
        )}

        {mode === 'type' && checked === null && !flipped ? (
          <button type="button" onClick={() => setFlipped(true)} className="mt-3 min-h-[44px] w-full text-[15px] font-semibold text-accent-text active:opacity-50">
            {t('cardShow')}
          </button>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant={mode === 'type' && checked === false ? 'primary' : 'secondary'} onClick={() => answer(false)}>
              {t('notYet')}
            </Button>
            <Button variant={mode === 'type' && checked === false ? 'secondary' : 'primary'} onClick={() => answer(true)}>
              {t('knewIt')}
            </Button>
          </div>
        )}
      </div>
    </Page>
  )
}
