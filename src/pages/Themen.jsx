import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getJahrgang, getKapitel, getKapitelList, getKapitelTopics, getTopic, jahrgaenge } from '../data/curriculum.js'
import { useContent, lessonOf } from '../data/content.js'
import { cardsOfTopic } from '../data/flashcards.js'
import { titleOf } from '../data/translate.js'
import { chapterLink } from '../data/links.js'
import { questionCount } from '../data/questions.js'
import { isKnown } from '../data/srs.js'
import { useLang } from '../i18n.jsx'
import { useProgress } from '../progress.jsx'
import Page from '../components/Page.jsx'
import Segmented from '../components/Segmented.jsx'
import { IconTile, ListGroup, ListRow } from '../components/List.jsx'
import { BookIcon, CardsIcon, CheckIcon, QuizIcon } from '../components/Icons.jsx'

// Ein Ablauf für alles: Jahrgang (einmal gewählt) → Kapitel → Thema → Lernen / Üben / Karteikarten.

function Done({ label }) {
  return <CheckIcon className="h-5 w-5 text-accent-text" label={label} />
}

// Ein Thema gilt als gelesen, wenn die Zusammenfassung über "Weiter" erreicht wurde.
const isRead = (done, topicId) => Boolean(done[`summary:${topicId}`])

// /themen – öffnet direkt den eigenen Jahrgang
export function ThemenStart() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { myYear, setMyYear } = useProgress()

  if (myYear && getJahrgang(myYear)) return <Navigate to={`/themen/${myYear}`} replace />

  return (
    <Page title={t('topics')}>
      <ListGroup header={t('chooseYear')}>
        {jahrgaenge.map((j) => (
          <ListRow
            key={j.id}
            title={t('yearLabel', { n: j.id })}
            onClick={() => {
              setMyYear(j.id)
              navigate(`/themen/${j.id}`)
            }}
          />
        ))}
      </ListGroup>
    </Page>
  )
}

// /themen/:jahrgangId – Kapitel des Jahrgangs. Der Schalter oben wechselt nur die Ansicht,
// "Mein Jahrgang" bleibt (der wird in den Einstellungen geändert).
export function ThemenJahrgang() {
  const { jahrgangId } = useParams()
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { done } = useProgress()
  const jahrgang = getJahrgang(jahrgangId)

  if (!jahrgang) return <Navigate to="/themen" replace />

  return (
    <Page title={t('yearLabel', { n: jahrgang.id })}>
      <Segmented
        id="year"
        label={t('chooseYear')}
        options={jahrgaenge.map((j) => ({ value: j.id, label: t('yearShort', { n: j.id }) }))}
        value={jahrgang.id}
        onChange={(v) => navigate(`/themen/${v}`, { replace: true })}
      />
      <ListGroup>
        {getKapitelList(jahrgang.id).map((kapitel) => {
          const topics = getKapitelTopics(jahrgang.id, kapitel.id)
          const read = topics.filter((x) => isRead(done, x.id)).length
          return (
            <ListRow
              key={kapitel.id}
              title={titleOf(kapitel, lang)}
              right={read === topics.length ? <Done label={t('read')} /> : read > 0 ? <span className="tabular">{`${read}/${topics.length}`}</span> : null}
              onClick={() => navigate(`/themen/${jahrgang.id}/${kapitel.id}`)}
            />
          )
        })}
      </ListGroup>
    </Page>
  )
}

// /themen/:jahrgangId/:kapitelId – Themen eines Kapitels plus Kapitel-Quiz und alle Karten
export function ThemenKapitel() {
  const { jahrgangId, kapitelId } = useParams()
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { done } = useProgress()
  const jahrgang = getJahrgang(jahrgangId)
  const kapitel = getKapitel(jahrgangId, kapitelId)

  if (!jahrgang || !kapitel) return <Navigate to={jahrgang ? `/themen/${jahrgang.id}` : '/themen'} replace />

  const topics = getKapitelTopics(jahrgang.id, kapitel.id)
  const base = `/themen/${jahrgang.id}/${kapitel.id}`

  return (
    <Page title={titleOf(kapitel, lang)} back={`/themen/${jahrgang.id}`}>
      <ListGroup>
        {topics.map((topic) => (
          <ListRow
            key={topic.id}
            title={titleOf(topic, lang)}
            right={isRead(done, topic.id) ? <Done label={t('read')} /> : null}
            onClick={() => navigate(`${base}/${topic.id}`)}
          />
        ))}
      </ListGroup>

      {topics.length > 1 && (
        <ListGroup header={t('wholeChapterHeader')}>
          <ListRow
            title={t('chapterQuiz')}
            left={<IconTile><QuizIcon className="h-5 w-5" /></IconTile>}
            onClick={() => navigate(`/ueben/${jahrgang.id}/${kapitel.id}/gesamt`)}
          />
          <ListRow
            title={t('allChapterCards')}
            left={<IconTile><CardsIcon className="h-5 w-5" /></IconTile>}
            onClick={() => navigate(`/karten/${jahrgang.id}/${kapitel.id}/gesamt`)}
          />
        </ListGroup>
      )}
    </Page>
  )
}

// /themen/:jahrgangId/:kapitelId/:topicId – ein Thema: Lernen, Üben oder Karteikarten
export function ThemaSeite() {
  const { jahrgangId, kapitelId, topicId } = useParams()
  const { lang, t } = useLang()
  const jahrgang = getJahrgang(jahrgangId)
  const kapitel = getKapitel(jahrgangId, kapitelId)
  const topic = getTopic(jahrgangId, topicId)
  useContent(lang, jahrgang ? [jahrgang.id] : [])

  if (!jahrgang || !kapitel || !topic) return <Navigate to="/themen" replace />
  return <TopicActions jahrgang={jahrgang} kapitel={kapitel} topic={topic} />
}

function TopicActions({ jahrgang, kapitel, topic }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { done, srs, results } = useProgress()
  const path = `${jahrgang.id}/${kapitel.id}/${topic.id}`
  const { inhalt } = lessonOf(topic.id, lang)
  const steps = inhalt?.schritte.length ?? 0
  const qCount = questionCount(topic.id)
  const cards = cardsOfTopic(topic.id, 'de')
  const known = cards.filter((c) => isKnown(srs[c.id])).length
  const last = results[`${jahrgang.id}|${kapitel.id}|${topic.id}`]?.last ?? []
  const accuracy = last.length >= 3 ? Math.round((last.reduce((s, x) => s + x, 0) / last.length) * 100) : null

  return (
    <Page title={titleOf(topic, lang)} back={chapterLink(jahrgang.id, kapitel.id)}>
      <ListGroup>
        <ListRow
          title={t('learn')}
          subtitle={t('stepsCount', { n: steps })}
          left={<IconTile><BookIcon className="h-5 w-5" /></IconTile>}
          disabled={!inhalt}
          right={isRead(done, topic.id) ? <Done label={t('read')} /> : null}
          onClick={() => navigate(`/lernen/${path}`)}
        />
        <ListRow
          title={t('practice')}
          subtitle={accuracy !== null ? t('questionsWithScore', { n: qCount, pct: accuracy }) : t('questionsCount', { n: qCount })}
          left={<IconTile><QuizIcon className="h-5 w-5" /></IconTile>}
          disabled={qCount === 0}
          right={done[`quizpass:${jahrgang.id}|${topic.id}`] ? <Done label={t('passed')} /> : null}
          onClick={() => navigate(`/ueben/${path}`)}
        />
        <ListRow
          title={t('flashcards')}
          subtitle={known > 0 ? t('cardsKnown', { known, total: cards.length }) : t('cardsCount', { n: cards.length })}
          left={<IconTile><CardsIcon className="h-5 w-5" /></IconTile>}
          disabled={cards.length === 0}
          right={cards.length > 0 && known === cards.length ? <Done label={t('allKnown')} /> : null}
          onClick={() => navigate(`/karten/${path}`)}
        />
      </ListGroup>
    </Page>
  )
}

// Alte Adressen (/lernen/2, /ueben/2/kapitel …) führen auf die neuen Themen-Seiten.
export function ToThemen() {
  const { jahrgangId, kapitelId } = useParams()
  const to = ['/themen', jahrgangId, kapitelId].filter(Boolean).join('/')
  return <Navigate to={to} replace />
}
