import { useCallback, useEffect, useRef, useState } from 'react'
import { audioFor } from './db.js'

// One <audio> element for the whole app. The queue is a list of song ids; the position in it, shuffle and repeat
// are remembered, so the app opens where you left off. Lock screen and headphone buttons work through Media Session.

const SAVED = 'tape-player'
// A tiny silent WAV: played inside the first tap so iPhones allow every later play() that comes after a database read
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

function load() {
  try {
    return JSON.parse(localStorage.getItem(SAVED)) || {}
  } catch {
    return {}
  }
}

function shuffled(ids, first) {
  const rest = ids.filter((id) => id !== first)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return first == null ? rest : [first, ...rest]
}

export function usePlayer(tracks, ready) {
  const audio = useRef(null)
  if (!audio.current) audio.current = new Audio()
  const saved = useRef(load()).current
  const [queue, setQueue] = useState(saved.queue || [])
  const [order, setOrder] = useState(saved.order || saved.queue || []) // the queue before shuffling
  const [index, setIndex] = useState(saved.index ?? -1)
  const [shuffle, setShuffle] = useState(!!saved.shuffle)
  const [repeat, setRepeat] = useState(saved.repeat || 'off') // off | all | one
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const loaded = useRef(null) // id of the song in the element
  const url = useRef(null)
  const unlocked = useRef(false)
  const resumeAt = useRef(saved.time || 0)
  const byId = useRef({})
  byId.current = Object.fromEntries(tracks.map((t) => [t.id, t]))

  const id = queue[index]
  const current = byId.current[id] || null

  // Songs deleted from the library leave the queue
  useEffect(() => {
    if (!ready) return
    const known = new Set(tracks.map((t) => t.id))
    if (queue.every((q) => known.has(q))) return
    const keep = queue.filter((q) => known.has(q))
    const stillCurrent = known.has(id)
    setQueue(keep)
    setOrder((o) => o.filter((q) => known.has(q)))
    setIndex(stillCurrent ? keep.indexOf(id) : Math.min(index, keep.length - 1))
    if (!stillCurrent) loaded.current = null
  }, [tracks, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(SAVED, JSON.stringify({ queue, order, index, shuffle, repeat, time: audio.current.currentTime || resumeAt.current }))
    } catch {
      /* private mode */
    }
  }, [queue, order, index, shuffle, repeat, playing])

  const unlock = () => {
    if (unlocked.current) return
    unlocked.current = true
    const a = audio.current
    if (loaded.current) resumeAt.current = a.currentTime || resumeAt.current
    loaded.current = null
    a.src = SILENCE
    a.play().catch(() => {})
  }

  // Put the song at `index` into the element; play it if asked
  const start = useCallback(async (songId, play) => {
    const a = audio.current
    if (loaded.current !== songId) {
      loaded.current = songId
      const blob = await audioFor(songId)
      if (loaded.current !== songId) return // another song was picked meanwhile
      if (!blob) return
      if (url.current) URL.revokeObjectURL(url.current)
      url.current = URL.createObjectURL(blob)
      a.src = url.current
      if (resumeAt.current) {
        const at = resumeAt.current
        resumeAt.current = 0
        a.addEventListener('loadedmetadata', () => (a.currentTime = at), { once: true })
      }
    }
    if (play) a.play().catch(() => setPlaying(false))
  }, [])

  // Load the remembered song (paused) when the library arrives
  useEffect(() => {
    if (current && !loaded.current) start(current.id, false)
  }, [current, start])

  // `shuffleOn` = the Shuffle button: turns shuffle on and starts at a random song
  const playQueue = (ids, at = 0, shuffleOn = false) => {
    unlock()
    if (!ids.length) return
    if (shuffleOn) setShuffle(true)
    const first = ids[at]
    const q = shuffle || shuffleOn ? shuffled(ids, first) : ids
    setOrder(ids)
    setQueue(q)
    setIndex(q.indexOf(first))
    resumeAt.current = 0
    loaded.current = null
    start(first, true)
  }

  const goTo = (i, play = true) => {
    unlock()
    setIndex(i)
    resumeAt.current = 0
    if (queue[i] === loaded.current) {
      audio.current.currentTime = 0
      if (play) audio.current.play().catch(() => {})
    } else start(queue[i], play)
  }

  const next = (auto = false) => {
    if (!queue.length) return
    if (auto && repeat === 'one') return goTo(index)
    if (index + 1 < queue.length) return goTo(index + 1)
    if (repeat === 'all' || !auto) return goTo(0, repeat === 'all' || !auto)
    // End of the queue: stop on the first song
    setPlaying(false)
    goTo(0, false)
  }

  const prev = () => {
    if (!queue.length) return
    // Like every music app: back to the start first, the previous song on a second press
    if (audio.current.currentTime > 3 || index === 0) goTo(index)
    else goTo(index - 1)
  }

  const toggle = () => {
    unlock()
    const a = audio.current
    if (!current) return tracks.length && playQueue(tracks.map((t) => t.id))
    if (loaded.current !== current.id) return start(current.id, true)
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }

  const seek = (s) => {
    audio.current.currentTime = s
    setTime(s)
  }

  const toggleShuffle = () => {
    const on = !shuffle
    setShuffle(on)
    if (!queue.length) return
    const q = on ? shuffled(order, id) : order
    setQueue(q)
    setIndex(q.indexOf(id))
  }

  const cycleRepeat = () => setRepeat((r) => ({ off: 'all', all: 'one', one: 'off' })[r])

  const playNext = (songId) => {
    if (!queue.length) return playQueue([songId])
    const q = queue.filter((x) => x !== songId)
    const at = q.indexOf(id) + 1
    q.splice(at, 0, songId)
    setQueue(q)
    setOrder((o) => (o.includes(songId) ? o : [...o, songId]))
    setIndex(q.indexOf(id))
  }

  // Element events
  const nextRef = useRef(next)
  nextRef.current = next
  useEffect(() => {
    const a = audio.current
    const on = {
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      timeupdate: () => setTime(a.currentTime),
      durationchange: () => setDuration(Number.isFinite(a.duration) ? a.duration : 0),
      ended: () => a.src !== SILENCE && nextRef.current(true),
    }
    for (const k in on) a.addEventListener(k, on[k])
    const save = () => {
      try {
        const s = JSON.parse(localStorage.getItem(SAVED) || '{}')
        localStorage.setItem(SAVED, JSON.stringify({ ...s, time: a.currentTime }))
      } catch {
        /* private mode */
      }
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', save)
    return () => {
      for (const k in on) a.removeEventListener(k, on[k])
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', save)
    }
  }, [])

  // Lock screen, Control Centre, headphones
  const ms = typeof navigator !== 'undefined' && navigator.mediaSession
  const coverUrl = useCoverUrl(current?.cover)
  useEffect(() => {
    if (!ms) return
    ms.metadata = current
      ? new MediaMetadata({
          title: current.title,
          artist: current.artist || '',
          album: current.album || '',
          artwork: coverUrl ? [{ src: coverUrl, sizes: '512x512', type: current.cover.type }] : [{ src: '/music/icon-512.png', sizes: '512x512', type: 'image/png' }],
        })
      : null
  }, [current, coverUrl, ms])
  const actions = useRef({})
  actions.current = { play: toggle, pause: toggle, nexttrack: () => next(), previoustrack: prev }
  useEffect(() => {
    if (!ms) return
    const set = (k, fn) => {
      try {
        ms.setActionHandler(k, fn)
      } catch {
        /* action not supported */
      }
    }
    for (const k of ['play', 'pause', 'nexttrack', 'previoustrack']) set(k, () => actions.current[k]())
    set('seekto', (e) => (audio.current.currentTime = e.seekTime))
  }, [ms])
  useEffect(() => {
    if (ms) ms.playbackState = playing ? 'playing' : 'paused'
  }, [playing, ms])

  return {
    current, queue, index, playing, time, duration, shuffle, repeat,
    playQueue, goTo, next: () => next(), prev, toggle, seek, toggleShuffle, cycleRepeat, playNext,
  }
}

// An object URL for a cover Blob that lives as long as the component showing it
export function useCoverUrl(blob) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!blob) return setSrc(null)
    const u = URL.createObjectURL(blob)
    setSrc(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return src
}
