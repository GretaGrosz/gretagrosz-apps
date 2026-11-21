// First run (two steps: languages, then level) and Settings
import { useState } from 'react'
import { LANGUAGE_IDS, LEVELS, levelIndexOf } from '../lexicon'
import { useT } from '../i18n'
import { CheckIcon, Chevron, NavBar, Picker, Toggle } from '../ui'

// Default languages from the phone: a German speaker learns English, anyone else starts with their own language picked
function defaults(state) {
  if (state.from) return { from: state.from, lang: state.lang }
  const code = String((navigator.languages || [navigator.language || 'en'])[0]).slice(0, 2).toLowerCase()
  const from = LANGUAGE_IDS.includes(code) ? code : 'en'
  return { from, lang: from === 'de' ? 'en' : from === 'en' ? null : 'en' }
}

export default function Setup({ state, ui, draft, firstRun, onUi, onDone, onCancel, onFindLevel }) {
  const t = useT()
  const start = draft || defaults(state)
  const [from, setFrom] = useState(start.from)
  const [lang, setLang] = useState(start.lang)
  const [step, setStep] = useState(draft?.step || 1)
  const currentLevel = levelIndexOf(state.course[lang]?.day || 0)
  const [level, setLevel] = useState(draft?.level ?? null) // null = keep where you are
  const shownLevel = level ?? currentLevel
  const valid = from && lang && from !== lang
  const languageOptions = LANGUAGE_IDS.map((id) => ({ value: id, label: t.languages[id] }))

  // The two can't be the same: picking the same one swaps them
  const pickFrom = (id) => {
    if (id === lang) setLang(from)
    setFrom(id)
    if (id === 'de' || id === 'en') onUi(id) // your language is the app's language
  }
  const pickLang = (id) => {
    if (id === from) setFrom(lang || (id === 'en' ? 'de' : 'en'))
    setLang(id)
    setLevel(null) // each language keeps its own place
  }

  const save = () => {
    const choice = { from, lang }
    if (level !== null && (firstRun || level !== currentLevel)) choice.startDay = LEVELS[level].start
    onDone(choice)
  }

  const levelRows = (
    <div className="group">
      {LEVELS.map((lv, i) => (
        <button key={lv.id} className="row" onClick={() => setLevel(i)} aria-pressed={shownLevel === i}>
          <span className="headline w-9">{lv.name}</span>
          <span className="body secondary flex-1">{t.levelNames[i]}</span>
          {shownLevel === i && (
            <span style={{ color: 'var(--link)' }}>
              <CheckIcon />
            </span>
          )}
        </button>
      ))}
    </div>
  )
  const findRow = (
    <div className="group mt-6">
      <button onClick={() => onFindLevel({ from, lang, step: 2 })} className="row" disabled={!valid}>
        <span className="body flex-1" style={{ color: 'var(--link)' }}>
          {t.findLevel}
        </span>
        <span className="secondary">
          <Chevron />
        </span>
      </button>
    </div>
  )

  if (firstRun) {
    return (
      <main className="page page-fill">
        <NavBar plain left={step === 2 ? <button className="link -ml-1" onClick={() => setStep(1)}><Chevron left /> {t.back}</button> : null} />
        {step === 1 ? (
          <div key="s1" className="rise flex flex-1 flex-col">
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width="72" height="72" className="mt-4 rounded-[18px]" />
            <h1 className="large-title mt-4">Deca</h1>
            <p className="caption mb-2 mt-8 px-4">{t.languagesCaption}</p>
            <div className="group">
              <Picker label={t.speak} value={from} onChange={pickFrom} placeholder={t.choose} options={languageOptions} />
              <Picker label={t.learn} value={lang} onChange={pickLang} placeholder={t.choose} options={languageOptions} />
            </div>
            <button disabled={!valid} onClick={() => setStep(2)} className="btn btn-filled mt-auto w-full">
              {t.next}
            </button>
          </div>
        ) : (
          <div key="s2" className="rise flex flex-1 flex-col">
            <h1 className="large-title mt-2">{t.levelCaption}</h1>
            <p className="caption mb-2 mt-6 px-4">{t.languages[lang]}</p>
            {levelRows}
            {findRow}
            <button onClick={save} className="btn btn-filled mt-auto w-full">
              {t.start}
            </button>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="page">
      <NavBar
        left={
          <button onClick={onCancel} className="link -ml-1">
            {t.cancel}
          </button>
        }
        title={t.settings}
        right={
          <button onClick={save} disabled={!valid} className="link pr-2 font-semibold">
            {t.done}
          </button>
        }
      />
      <p className="caption mb-2 mt-6 px-4">{t.languagesCaption}</p>
      <div className="group">
        <Picker label={t.speak} value={from} onChange={pickFrom} placeholder={t.choose} options={languageOptions} />
        <Picker label={t.learn} value={lang} onChange={pickLang} placeholder={t.choose} options={languageOptions} />
      </div>

      <p className="caption mb-2 mt-8 px-4">
        {t.levelCaption} · {t.languages[lang]}
      </p>
      {levelRows}
      {findRow}

      <div className="group mt-8">
        <Picker label={t.appLanguage} value={ui} onChange={onUi} options={[{ value: 'en', label: 'English' }, { value: 'de', label: 'Deutsch' }]} />
        <Toggle label={t.sound} checked={state.sound !== false} onChange={(on) => onDone({ sound: on }, true)} />
      </div>
    </main>
  )
}
