import { useState } from 'react'
import { Cover, Icon, time } from './ui.jsx'

// The bar above the bottom edge: what's playing, play/pause and skip. Tapping it opens the full player.
export function MiniPlayer({ player, onOpen }) {
  const { current, playing, time: t, duration } = player
  if (!current) return null
  return (
    <div className="fixed left-0 right-0 bottom-0 z-30 px-3 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="glass mx-auto max-w-[600px] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-2 pr-1">
          <button onClick={onOpen} className="flex items-center gap-3 min-w-0 flex-1 text-left" aria-label="Open player">
            <Cover blob={current.cover} size={44} radius={8} />
            <div className="min-w-0">
              <div className="font-medium truncate">{current.title}</div>
              <div className="text-sm text-fg2 truncate">{current.artist || 'Unknown artist'}</div>
            </div>
          </button>
          <button onClick={player.toggle} className="w-11 h-11 grid place-items-center active:opacity-50" aria-label={playing ? 'Pause' : 'Play'}>
            <Icon name={playing ? 'pause' : 'play'} size={28} />
          </button>
          <button onClick={player.next} className="w-11 h-11 grid place-items-center active:opacity-50" aria-label="Next song">
            <Icon name="next" size={26} />
          </button>
        </div>
        <div className="h-[2px] bg-fill">
          <div className="h-full bg-accent" style={{ width: duration ? `${(t / duration) * 100}%` : 0 }} />
        </div>
      </div>
    </div>
  )
}

export function FullPlayer({ player, tracksById, onClose }) {
  const { current, playing, time: t, duration, shuffle, repeat, queue, index } = player
  const [scrub, setScrub] = useState(null)
  const [showQueue, setShowQueue] = useState(false)
  if (!current) return null
  const shown = scrub ?? t
  const upNext = queue.slice(index + 1).map((id) => tracksById[id]).filter(Boolean)

  return (
    <div className="flex flex-col h-full px-6 pb-[max(20px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between pt-2 -mx-2">
        <button onClick={onClose} className="w-11 h-11 grid place-items-center text-fg2 active:opacity-50" aria-label="Close player">
          <Icon name="down" size={28} />
        </button>
        <div className="text-xs font-semibold uppercase tracking-wide text-fg2">{showQueue ? 'Up next' : 'Now playing'}</div>
        <button
          onClick={() => setShowQueue((s) => !s)}
          className={`h-11 px-3 rounded-full text-sm font-medium active:opacity-50 ${showQueue ? 'text-accent-ink' : 'text-fg2'}`}
        >
          {showQueue ? 'Done' : 'Queue'}
        </button>
      </div>

      {showQueue ? (
        <div className="flex-1 overflow-y-auto -mx-2 py-2">
          {upNext.length ? (
            upNext.map((s, i) => (
              <button key={s.id + i} onClick={() => player.goTo(index + 1 + i)} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left active:bg-fill">
                <Cover blob={s.cover} size={40} radius={6} />
                <div className="min-w-0">
                  <div className="truncate">{s.title}</div>
                  <div className="text-sm text-fg2 truncate">{s.artist || 'Unknown artist'}</div>
                </div>
              </button>
            ))
          ) : (
            <p className="text-fg2 text-center mt-10">Nothing after this song{repeat === 'all' ? ' — the queue starts again.' : '.'}</p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center py-4 min-h-0">
          <div className={`w-full max-w-[min(340px,42vh)] aspect-square transition-transform duration-500 ${playing ? 'scale-100' : 'scale-[.86]'}`} style={{ transitionTimingFunction: 'var(--spring)' }}>
            <Cover blob={current.cover} size="100%" radius={18} className="shadow-2xl" />
          </div>
        </div>
      )}

      <div className="pt-2">
        <div className="text-[22px] font-semibold leading-tight truncate">{current.title}</div>
        <div className="text-[17px] text-fg2 truncate">{[current.artist || 'Unknown artist', current.album].filter(Boolean).join(' · ')}</div>
      </div>

      <div className="mt-5">
        <input
          type="range"
          className="scrubber w-full"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(shown, duration || 1)}
          style={{ '--p': duration ? `${(shown / duration) * 100}%` : '0%' }}
          onChange={(e) => setScrub(Number(e.target.value))}
          onPointerUp={() => { if (scrub != null) { player.seek(scrub); setScrub(null) } }}
          onKeyUp={() => { if (scrub != null) { player.seek(scrub); setScrub(null) } }}
          aria-label="Position in song"
        />
        <div className="flex justify-between text-xs text-fg2 tabular-nums mt-1">
          <span>{time(shown)}</span>
          <span>-{time(Math.max(0, duration - shown))}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button onClick={player.toggleShuffle} className={`w-12 h-12 grid place-items-center rounded-full ${shuffle ? 'text-accent-ink bg-accent/15' : 'text-fg2'}`} aria-label="Shuffle" aria-pressed={shuffle}>
          <Icon name="shuffle" size={22} />
        </button>
        <button onClick={player.prev} className="w-16 h-16 grid place-items-center active:opacity-50" aria-label="Previous song">
          <Icon name="prev" size={38} />
        </button>
        <button onClick={player.toggle} className="w-[76px] h-[76px] grid place-items-center rounded-full bg-accent text-white active:scale-95 transition-transform" aria-label={playing ? 'Pause' : 'Play'}>
          <Icon name={playing ? 'pause' : 'play'} size={38} />
        </button>
        <button onClick={player.next} className="w-16 h-16 grid place-items-center active:opacity-50" aria-label="Next song">
          <Icon name="next" size={38} />
        </button>
        <button
          onClick={player.cycleRepeat}
          className={`w-12 h-12 grid place-items-center rounded-full ${repeat !== 'off' ? 'text-accent-ink bg-accent/15' : 'text-fg2'}`}
          aria-label={`Repeat: ${repeat === 'one' ? 'this song' : repeat === 'all' ? 'all' : 'off'}`}
        >
          <Icon name={repeat === 'one' ? 'repeat1' : 'repeat'} size={22} />
        </button>
      </div>
    </div>
  )
}
