import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { yearOfTopic } from '../data/curriculum.js'
import { useContent } from '../data/content.js'
import { cardById } from '../data/flashcards.js'
import { addDays, dayKey } from '../data/questions.js'
import { dueIds } from '../data/srs.js'
import { useLang } from '../i18n.jsx'
import { useProgress } from '../progress.jsx'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { CheckIcon } from '../components/Icons.jsx'
import { CardSession } from './Karten.jsx'
import { formatShort } from '../format.js'

// /wiederholen – alle heute fälligen Karteikarten aus dem Karteikasten, egal aus welchem Thema
export default function Wiederholen() {
  const { lang } = useLang()
  const { srs } = useProgress()
  // Die fälligen Karten beim Öffnen festhalten (beantwortete Karten verschwinden sonst sofort)
  const [ids] = useState(() => dueIds(srs))
  const years = useMemo(() => [...new Set(ids.map((id) => yearOfTopic(id.split('#')[0])).filter(Boolean))], [ids])
  useContent(lang, years)
  return <Session ids={ids} />
}

function Session({ ids }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { srs } = useProgress()
  const cards = useMemo(() => ids.map((id) => cardById(id, lang)).filter(Boolean), [ids, lang])

  if (cards.length === 0) {
    const tomorrow = addDays(dayKey(), 1)
    const next = Object.values(srs).map((e) => e.due).filter((d) => d > dayKey()).sort()[0]
    const nextCount = next ? Object.values(srs).filter((e) => e.due === next).length : 0
    return (
      <Page title={t('review')} back="/">
        <div className="flex flex-col items-center pt-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckIcon className="h-8 w-8" />
          </span>
          <p className="mt-4 text-[20px] font-semibold text-label">{t('nothingDue')}</p>
          {next && (
            <p className="mt-1 text-[15px] text-label2">
              {next === tomorrow ? t('nextDueTomorrow', { n: nextCount }) : t('nextDueOn', { n: nextCount, date: formatShort(next, lang) })}
            </p>
          )}
          <Button onClick={() => navigate('/themen')} className="mt-6 min-w-[200px]">
            {t('flashcards')}
          </Button>
        </div>
      </Page>
    )
  }

  return (
    <CardSession
      review
      title={t('review')}
      back="/"
      cards={cards}
      initialOrder={(list) => list}
      showTopic={null}
      done={() => (
        <Button onClick={() => navigate('/', { replace: true })} className="w-full">
          {t('toHome')}
        </Button>
      )}
    />
  )
}

