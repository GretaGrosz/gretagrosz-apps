import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getJahrgang, getKapitel, getTopic } from '../data/curriculum.js'
import { titleOf } from '../data/translate.js'
import { deLesson, lessonOf, useContent } from '../data/content.js'
import { topicLink } from '../data/links.js'
import { cardsOfTopic } from '../data/flashcards.js'
import { XP, useProgress } from '../progress.jsx'
import DeTerm from '../components/DeTerm.jsx'
import { useLang } from '../i18n.jsx'
import { theme } from '../theme.js'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { CardsIcon, ChevronLeft } from '../components/Icons.jsx'
import { QUICK, SPRING } from '../motion.js'
import { Ablauf, Entscheidung, Formel, Organe, Kette, KreislaufDiagramm, Marktdiagramm, Prinzip, Tabelle, Transportweg, Zyklus } from '../components/LernDiagramme.jsx'

export default function LernInhalt() {
  const { jahrgangId } = useParams()
  const { lang } = useLang()
  useContent(lang, [Number(jahrgangId)])
  return <Lesson />
}

function Lesson() {
  const { jahrgangId, kapitelId, topicId } = useParams()
  const navigate = useNavigate()
  const jahrgang = getJahrgang(jahrgangId)
  const kapitel = getKapitel(jahrgangId, kapitelId)
  const topic = getTopic(jahrgangId, topicId)
  const { lang, t: tr } = useLang()
  const { inhalt, translated } = topic ? lessonOf(topicId, lang) : { inhalt: null, translated: true }
  // "Weitermachen" auf der Startseite übergibt den zuletzt gelesenen Schritt.
  const { state: navState } = useLocation()
  const steps = inhalt?.schritte.length ?? 0
  const [index, setIndex] = useState(() => Math.min(Math.max(0, navState?.step ?? 0), steps))
  const [dir, setDir] = useState(1)
  const { award, setLast } = useProgress()
  const deInhalt = topic ? deLesson(topicId) : null

  // Für "Weitermachen": Thema und aktuellen Schritt merken.
  useEffect(() => {
    if (!inhalt || !topic) return
    setLast({ jahrgangId: Number(jahrgangId), kapitelId, topicId, step: index, steps })
  }, [index, topicId]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback(
    (i) => {
      setDir(i > index ? 1 : -1)
      setIndex(i)
      window.scrollTo({ top: 0 })
    },
    [index],
  )

  // XP und "gelesen" nur beim Weiterblättern: jeder gelesene Schritt einmal, die Zusammenfassung,
  // wenn man vom letzten Schritt aus dort ankommt.
  const forward = useCallback(() => {
    if (index >= steps) return
    award(`step:${topicId}:${index}`, XP.step)
    if (index + 1 === steps) award(`summary:${topicId}`, XP.summary)
    go(index + 1)
  }, [index, steps, topicId, award, go])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return
      if (e.key === 'ArrowRight') forward()
      if (e.key === 'ArrowLeft' && index > 0) go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [forward, go, index])

  if (!jahrgang || !kapitel || !topic) {
    return (
      <Page title={tr('learn')} back="/themen">
        <p className="text-label2">{tr('noTopic')}</p>
      </Page>
    )
  }

  const backTo = topicLink(jahrgang.id, kapitel.id, topic.id)
  if (!inhalt) {
    return (
      <Page title={titleOf(topic, lang)} back={backTo}>
        <p className="text-label2">{tr('noLesson')}</p>
      </Page>
    )
  }

  const t = theme()
  const total = steps + 1
  const isSummary = index === steps
  const schritt = inhalt.schritte[index]
  const hasCards = cardsOfTopic(topicId, 'de').length > 0

  return (
    <Page
      title={titleOf(topic, lang)}
      back={backTo}
      inline
      bar={
        <div className="flex gap-3">
          {index > 0 && (
            <button
              onClick={() => go(index - 1)}
              aria-label={tr('previousStep')}
              className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-fill/[0.14] text-accent-text active:scale-95 active:opacity-70"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {isSummary ? (
            <Button onClick={() => navigate(`/ueben/${jahrgang.id}/${kapitel.id}/${topic.id}`)} className="flex-1">
              {tr('practiceNow')}
            </Button>
          ) : (
            <Button onClick={forward} className="flex-1">
              {index + 1 === steps ? tr('toSummary') : tr('next')}
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-2 flex justify-end text-[13px] font-semibold text-label2 tabular">
        {isSummary ? tr('summary') : tr('stepOf', { n: index + 1, total: steps })}
      </div>
      {/* Fortschritt: nur Anzeige (Schritte werden über Weiter erreicht) */}
      <div className="mb-7 flex gap-1" role="progressbar" aria-label={tr('progress')} aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-fill/20">
            <motion.span
              className="block h-full rounded-full bg-accent"
              initial={false}
              animate={{ width: i <= index ? '100%' : '0%' }}
              transition={SPRING}
            />
          </span>
        ))}
      </div>

      {!translated && <p className="mb-6 rounded-control bg-fill/[0.12] px-4 py-2.5 text-[15px] text-label2">{tr('notTranslated')}</p>}

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          initial={{ opacity: 0, x: 18 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 * dir }}
          transition={QUICK}
        >
          {isSummary ? (
            <Zusammenfassung abschnitte={inhalt.zusammenfassung} t={t} />
          ) : (
            <>
              <h1 className="mb-5 text-[28px] font-bold leading-[34px] text-label [hyphens:auto]">{schritt.titel}</h1>
              <div className="flex flex-col gap-4">
                {schritt.blocks.map((block, i) => (
                  <Block key={i} block={block} deBlock={deInhalt?.schritte[index]?.blocks[i]} t={t} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {isSummary && hasCards && (
        <Button variant="secondary" onClick={() => navigate(`/karten/${jahrgang.id}/${kapitel.id}/${topic.id}`)} className="mt-6 w-full">
          <CardsIcon className="h-5 w-5" />
          {tr('cardsFromSummary')}
        </Button>
      )}
    </Page>
  )
}

function Block({ block, deBlock, t }) {
  const { t: tr } = useLang()
  switch (block.type) {
    case 'text':
      return <p className="text-[17px] leading-relaxed text-label">{block.text}</p>

    case 'begriff':
      return (
        <div className="rounded-card bg-surface p-5">
          <div className="mb-1.5">
            <span className="text-[20px] font-bold leading-tight text-accent-text">{block.term}</span>
            <DeTerm term={deBlock?.term} shown={block.term} className="mt-0.5" />
          </div>
          <p className="leading-relaxed text-label">{block.erklaerung}</p>
          {block.beispiel && (
            <p className="mt-2 text-[15px] text-label2">
              <span className="font-semibold">{tr('example')}</span> {block.beispiel}
            </p>
          )}
        </div>
      )

    case 'merke':
      return (
        <div className="rounded-control border-l-4 border-accent bg-accent/10 px-4 py-3 text-label">
          <span className="font-semibold text-accent-text">{tr('remember')} </span>
          {block.text}
        </div>
      )

    case 'pyramide':
      return (
        <div className="flex flex-col items-center gap-1.5 rounded-card bg-surface p-5">
          {block.stufen.map((stufe, i) => {
            const width = 45 + (i * 55) / (block.stufen.length - 1)
            return (
              <div key={stufe.name} style={{ width: `${width}%` }} className={`rounded-xl ${t.soft} px-3 py-2 text-center`}>
                <div className="font-bold leading-tight text-label">
                  {block.stufen.length - i}. {stufe.name}
                </div>
                <div className="text-[13px] text-label2">{stufe.beispiel}</div>
              </div>
            )
          })}
        </div>
      )

    case 'vergleich':
      return (
        <div>
          {block.frage && <p className="mb-2 font-semibold text-label">{block.frage}</p>}
          <div className="grid grid-cols-2 gap-3">
            {[block.links, block.rechts].map((seite) => (
              <div key={seite.titel} className="rounded-card bg-surface p-4">
                <div className={`mb-2 font-bold leading-tight ${t.text}`}>{seite.titel}</div>
                <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[15px] text-label marker:text-label3">
                  {seite.punkte.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'kette':
      return <Kette glieder={block.glieder} t={t} />
    case 'entscheidung':
      return <Entscheidung titel={block.titel} schritte={block.schritte} t={t} />
    case 'prinzip':
      return <Prinzip minimal={block.minimal} maximal={block.maximal} t={t} />
    case 'kreislaufDiagramm':
      return <KreislaufDiagramm t={t} />
    case 'ablauf':
      return <Ablauf titel={block.titel} schritte={block.schritte} t={t} />
    case 'tabelle':
      return <Tabelle spalten={block.spalten} zeilen={block.zeilen} deZeilen={deBlock?.zeilen} t={t} />
    case 'marktdiagramm':
      return <Marktdiagramm t={t} />
    case 'transportweg':
      return <Transportweg titel={block.titel} stationen={block.stationen} risiko={block.risiko} kosten={block.kosten} t={t} />
    case 'organe':
      return <Organe oben={block.oben} links={block.links} rechts={block.rechts} pfeile={block.pfeile} t={t} />
    case 'formel':
      return <Formel {...block} t={t} />
    case 'zyklus':
      return <Zyklus mitte={block.mitte} schritte={block.schritte} t={t} />
    default:
      return null
  }
}

function Zusammenfassung({ abschnitte, t }) {
  const { t: tr } = useLang()
  return (
    <>
      <h1 className="mb-5 text-[28px] font-bold leading-[34px] text-label">{tr('summary')}</h1>
      <div className="flex flex-col gap-4">
        {abschnitte.map((a) => (
          <div key={a.titel} className="rounded-card bg-surface p-5">
            <div className={`mb-2 text-[17px] font-bold ${t.text}`}>{a.titel}</div>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-label marker:text-accent-text">
              {a.punkte.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}
