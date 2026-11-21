// The reel sheet: plays the project's before→after video and records it at the same time,
// so by the time you've watched it once, it's ready to share.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { slug } from '../data'
import { H, W, buildScenes, drawAt, drawStill, loadFrames, loadLogo, recorderMime, totalDuration } from '../reel'
import { shareOrDownload } from '../backup'
import { Icon, Sheet, SheetHeader, Spinner } from './ui'

export default function ProgressReel({ project, onClose }) {
  const { actions, data } = useStore()
  const { t, tn } = useT()
  const canvasRef = useRef(null)
  const barRef = useRef(null)
  const run = useRef({ raf: 0, rec: null, cancelled: false })
  const assets = useRef(null)
  const [phase, setPhase] = useState('loading') // loading | playing | ready | interrupted | error
  const [video, setVideo] = useState(null) // { blob, ext }
  const [busy, setBusy] = useState(null)
  const mime = useRef(recorderMime()).current

  const stop = useCallback(() => {
    cancelAnimationFrame(run.current.raf)
    const rec = run.current.rec
    run.current.rec = null
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null
      try {
        rec.stop()
      } catch {}
    }
  }, [])

  const play = useCallback(
    (record) => {
      const canvas = canvasRef.current
      const a = assets.current
      if (!canvas || !a) return
      stop()
      const ctx = canvas.getContext('2d')
      const scenes = a.scenes
      const total = totalDuration(scenes)
      drawAt(ctx, scenes, 0)
      let rec = null
      const chunks = []
      if (record && mime) {
        try {
          const stream = canvas.captureStream(30)
          rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 })
          rec.ondataavailable = (e) => e.data?.size && chunks.push(e.data)
          rec.onstop = () => {
            stream.getTracks().forEach((tr) => tr.stop())
            const type = mime.split(';')[0]
            const blob = new Blob(chunks, { type })
            if (blob.size > 0) setVideo({ blob, ext: type === 'video/mp4' ? 'mp4' : 'webm' })
            setPhase('ready')
          }
          rec.start(250)
          run.current.rec = rec
        } catch {
          rec = null
        }
      }
      setPhase('playing')
      const start = performance.now()
      const frame = (now) => {
        const ms = now - start
        drawAt(ctx, scenes, Math.min(ms, total))
        if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(1, ms / total)})`
        if (ms < total) {
          run.current.raf = requestAnimationFrame(frame)
        } else if (rec) {
          // Hold the last frame a moment so the video doesn't cut off mid-fade
          setTimeout(() => rec.state !== 'inactive' && rec.stop(), 150)
        } else {
          setPhase('ready')
        }
      }
      run.current.raf = requestAnimationFrame(frame)
    },
    [mime, stop],
  )

  // Load the photos, then play and record
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [frames, logo] = await Promise.all([loadFrames(project), loadLogo()])
        if (!alive) return
        const scenes = buildScenes({ project, frames, logo, t, tn, name: data.me.name })
        assets.current = { frames, logo, scenes }
        play(true)
      } catch {
        if (alive) setPhase('error')
      }
    })()
    return () => {
      alive = false
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  // Recording needs the page in front: if you switch apps mid-way, it starts over cleanly
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && run.current.rec) {
        stop()
        setPhase('interrupted')
      }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [stop])

  const name = `blank-${slug(project.title)}`
  const shareVideo = async () => {
    if (!video) return
    setBusy('video')
    try {
      const res = await shareOrDownload(video.blob, `${name}.${video.ext}`, { title: project.title })
      if (res === 'downloaded') actions.toast({ text: 'Video saved' })
    } finally {
      setBusy(null)
    }
  }
  const shareImage = async () => {
    const a = assets.current
    if (!a) return
    setBusy('image')
    try {
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      drawStill(c.getContext('2d'), { project, frames: a.frames, logo: a.logo, t, tn, name: data.me.name })
      const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.92))
      if (!blob) throw new Error('canvas')
      const res = await shareOrDownload(blob, `${name}.jpg`, { title: project.title })
      if (res === 'downloaded') actions.toast({ text: 'Image saved' })
    } catch {
      actions.toast({ text: 'The image couldn’t be made. Try again.' })
    } finally {
      setBusy(null)
    }
  }

  const canRecord = !!mime
  return (
    <Sheet onClose={onClose} label={t('Reel')}>
      <SheetHeader title={project.title} onClose={onClose} />
      <div className="px-5 pt-1">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[18px] bg-black">
          <canvas ref={canvasRef} width={W} height={H} className="h-full w-full" aria-label={t('Reel preview')} />
          {phase === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Spinner className="h-7 w-7" />
            </div>
          )}
          {(phase === 'ready' || phase === 'interrupted') && (
            <button
              onClick={() => play(phase === 'interrupted' || !video)}
              className="absolute inset-0 flex animate-fade items-center justify-center bg-black/25 text-white"
              aria-label={phase === 'interrupted' ? t('Try again') : t('Play again')}
            >
              <span className="bar flex h-16 w-16 items-center justify-center rounded-full !bg-black/50 text-white">
                <Icon name="replay" className="h-7 w-7" />
              </span>
            </button>
          )}
          <div className="absolute inset-x-3 top-3 h-[3px] overflow-hidden rounded-full bg-white/30">
            <div ref={barRef} className="h-full origin-left scale-x-0 rounded-full bg-white" />
          </div>
        </div>
        <p className="mt-3 min-h-[20px] text-center text-[13px] text-sub" aria-live="polite">
          {phase === 'interrupted'
            ? t('Recording stopped when you left the app.')
            : phase === 'error'
              ? t('The photos couldn’t be loaded.')
              : phase === 'playing' && canRecord
                ? t('Recording…')
                : ''}
        </p>
      </div>
      <div className="flex flex-col gap-2 px-5 pt-2">
        {canRecord && (
          <button onClick={shareVideo} disabled={!video || !!busy} className="btn-primary btn-lg" data-autofocus>
            {busy === 'video' ? <Spinner /> : <Icon name="share" className="h-5 w-5" />} {t('Share video')}
          </button>
        )}
        <button onClick={shareImage} disabled={phase === 'loading' || !!busy} className={canRecord ? 'btn-plain btn-lg' : 'btn-primary btn-lg'}>
          {busy === 'image' ? <Spinner /> : <Icon name="image" className="h-5 w-5" />} {t('Share image')}
        </button>
      </div>
    </Sheet>
  )
}
