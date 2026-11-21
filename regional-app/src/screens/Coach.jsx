import { useEffect, useRef, useState } from 'react'
import { askCoach, readPhoto } from '../ai'
import { t } from '../i18n'
import { CameraIcon, Icon, PhotoStrip, Rich } from '../ui'

// The coach: a chat about one problem, or about a plan day's topic ({ topic: { title, items } })
export function CoachSheet({ problem, topic, grade, ai, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const end = useRef(null)
  const field = useRef(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'end' })
  }, [messages, busy])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const subject = topic ? { q: [topic.title, ...topic.items].join(', ') } : problem

  const send = async (say) => {
    const body = (say ?? text).trim()
    if ((!body && !photos.length) || busy) return
    const next = [...messages, { role: 'user', text: body, photos: say ? [] : photos }]
    setMessages(next)
    if (!say) {
      setText('')
      setPhotos([])
    }
    setBusy(true)
    setError('')
    try {
      const reply = await askCoach(subject, next, grade, !!topic)
      setMessages((m) => [...m, { role: 'assistant', text: reply }])
    } catch (err) {
      setError(err.message)
      // Put the message back so nothing typed is lost
      setMessages(messages)
      if (!say) {
        setText(body)
        setPhotos(next[next.length - 1].photos)
      }
    }
    setBusy(false)
  }

  const STARTERS = topic
    ? ['Explain the main idea with an example.', 'Give me a practice problem.', 'Which mistakes do people make here?']
    : ['I don’t know how to start.', 'Give me a small hint.', 'Is my idea going the right way?']
  const out = ai.mode === 'hosted' && ai.chatsLeft === 0 && !ai.own

  return (
    <div className="fixed inset-0 z-40 flex flex-col lg:items-end" role="dialog" aria-modal="true" aria-label={t('Coach')}>
      <div className="fade-in absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="sheet sheet-up relative mt-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[20px] lg:mt-0 lg:h-full lg:w-[440px] lg:flex-none lg:rounded-none">
        <div className="mx-auto mt-1.5 h-[5px] w-9 rounded-full lg:hidden" style={{ background: 'var(--tertiary)' }} />
        <div className="flex h-11 w-full items-center justify-between px-4">
          <span className="min-w-[60px]" />
          <span className="headline">{t('Coach')}</span>
          <button onClick={onClose} className="link flex h-11 min-w-[60px] items-center justify-end font-semibold active:opacity-50">
            {t('Done')}
          </button>
        </div>
        <div className="w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pb-4">
          <details className="card p-4">
            <summary className="subhead cursor-pointer font-semibold">{topic ? topic.title : t('The problem')}</summary>
            {topic ? (
              topic.items.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5" lang="de">
                {topic.items.map((x) => (
                  <span key={x} className="subhead rounded-full px-3 py-1" style={{ background: 'var(--fill)' }}>
                    {x}
                  </span>
                ))}
              </div>
            ) : (
              <Rich text={problem.q} className="problem mt-2" />
            )}
          </details>
          {messages.length === 0 && (
            <div className="mt-6">
              <div className="flex flex-col gap-2">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(t(s))} disabled={busy || out} className="btn btn-tinted h-auto min-h-[44px] justify-start whitespace-normal px-4 py-2.5 text-left text-[16px] font-medium leading-5">
                    {t(s)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`rise flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] whitespace-pre-line rounded-[20px] px-4 py-2.5 text-[16px] leading-[22px]"
                  style={m.role === 'user' ? { background: 'var(--accent)', color: '#FFFFFF' } : { background: 'var(--surface)', color: 'var(--label)' }}
                >
                  {m.photos?.length > 0 && (
                    <span className="mb-2 flex gap-1">
                      {m.photos.map((p, j) => (
                        <img key={j} src={p.dataUrl} alt="" className="h-20 w-14 rounded-lg object-cover" />
                      ))}
                    </span>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex" aria-label={t('The coach is writing')}>
                <span className="flex gap-1 rounded-[20px] px-4 py-3" style={{ background: 'var(--surface)' }}>
                  {[0, 1, 2].map((j) => (
                    <span key={j} className="typing-dot h-2 w-2 rounded-full" style={{ background: 'var(--tertiary)', animationDelay: `${j * 0.15}s` }} />
                  ))}
                </span>
              </div>
            )}
            {(error || out) && (
              <p className="footnote px-2" style={{ color: 'var(--red)' }} role="alert">
                {error || t('No coach messages left today. More tomorrow.')}
              </p>
            )}
            <div ref={end} />
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="bar w-full px-3 pb-3 pt-2"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          {photos.length > 0 && (
            <div className="mb-2">
              <PhotoStrip photos={photos} setPhotos={setPhotos} onError={setError} />
            </div>
          )}
          <div className="flex items-end gap-2">
            <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full" style={{ background: 'var(--fill)', color: 'var(--link)' }} aria-label={t('Add a photo')}>
              <CameraIcon className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = [...e.target.files]
                  e.target.value = ''
                  try {
                    const read = await Promise.all(files.map((f) => readPhoto(f)))
                    setPhotos((p) => [...p, ...read].slice(0, 4))
                  } catch (err) {
                    setError(err.message)
                  }
                }}
              />
            </label>
            <textarea
              ref={field}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder={t('Message')}
              aria-label={t('Message')}
              className="min-h-[44px] flex-1 resize-none rounded-[22px] px-4 py-[10px] text-[17px] leading-[22px] outline-none placeholder:text-[var(--label-2)]"
              style={{ background: 'var(--surface)', color: 'var(--label)', boxShadow: 'inset 0 0 0 0.5px var(--sep)' }}
            />
            <button
              disabled={busy || out || (!text.trim() && !photos.length)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-30"
              style={{ background: 'var(--accent)' }}
              aria-label={t('Send')}
            >
              <Icon className="h-5 w-5" strokeWidth={2.6} d={<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
