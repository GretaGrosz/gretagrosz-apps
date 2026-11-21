import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as db from './db.js'
import { canPlay, readDuration, readTags } from './tags.js'
import { usePlayer } from './player.js'
import { Actions, Cover, Icon, Sheet, bytes, time } from './ui.jsx'
import { FullPlayer, MiniPlayer } from './NowPlaying.jsx'
import { THEMES, applyTheme, savedTheme } from './themes.js'

const byTitle = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true })

export default function App() {
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('songs')
  const [query, setQuery] = useState('')
  const [openList, setOpenList] = useState(null) // id of the playlist on screen
  const [full, setFull] = useState(false)
  const [menu, setMenu] = useState(null) // { song, playlist? }
  const [picker, setPicker] = useState(null) // { song } → choose a playlist
  const [adder, setAdder] = useState(null) // playlist id → choose songs
  const [naming, setNaming] = useState(null) // { id?, name, then? }
  const [importing, setImporting] = useState(null) // { done, total, skipped }
  const [note, setNote] = useState('')
  const [usage, setUsage] = useState(null)
  const [theme, setTheme] = useState(savedTheme)
  const [themes, setThemes] = useState(false) // the theme picker is open
  const fileInput = useRef(null)

  const refresh = useCallback(async () => {
    const [t, p] = await Promise.all([db.allTracks(), db.allPlaylists()])
    setTracks(t.sort(byTitle))
    setPlaylists(p.sort((a, b) => a.name.localeCompare(b.name)))
    setReady(true)
    db.storageUse().then(setUsage)
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const player = usePlayer(tracks, ready)
  useEffect(() => applyTheme(theme), [theme])
  const tracksById = useMemo(() => Object.fromEntries(tracks.map((t) => [t.id, t])), [tracks])

  const noteTimer = useRef(0)
  const say = (text) => {
    setNote(text)
    clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(''), 3500)
  }

  async function importFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i.test(f.name))
    if (!files.length) return say('No songs in that selection.')
    db.keepStorage()
    const have = new Set(tracks.map((t) => `${t.fileName}|${t.size}`))
    let added = 0
    let skipped = 0
    setImporting({ done: 0, total: files.length })
    for (const [i, file] of files.entries()) {
      try {
        if (have.has(`${file.name}|${file.size}`) || !canPlay(file)) {
          skipped++
        } else {
          const [tags, duration] = await Promise.all([readTags(file), readDuration(file)])
          // A copy in memory: some browsers lose a picked file once the picker is gone
          const blob = new Blob([await file.arrayBuffer()], { type: file.type || 'audio/mpeg' })
          await db.addTrack({
            id: crypto.randomUUID?.() || String(Date.now()) + Math.random(),
            title: tags.title || file.name,
            artist: tags.artist || '',
            album: tags.album || '',
            cover: tags.cover || null,
            duration,
            fileName: file.name,
            size: file.size,
            added: Date.now(),
          }, blob)
          have.add(`${file.name}|${file.size}`)
          added++
        }
      } catch (e) {
        skipped++
        if (e?.name === 'QuotaExceededError') {
          setImporting(null)
          await refresh()
          return say(`This device is out of space for songs. ${added} added.`)
        }
      }
      setImporting({ done: i + 1, total: files.length })
    }
    setImporting(null)
    await refresh()
    say(`${added} ${added === 1 ? 'song' : 'songs'} added${skipped ? `, ${skipped} skipped (already here or can't play on this device)` : ''}.`)
  }

  async function removeSong(song) {
    await db.deleteTrack(song.id)
    await refresh()
    say(`“${song.title}” deleted from this device.`)
  }

  async function addToPlaylist(playlistId, ids) {
    const p = playlists.find((x) => x.id === playlistId)
    if (!p) return
    const fresh = ids.filter((id) => !p.trackIds.includes(id))
    await db.savePlaylist({ ...p, trackIds: [...p.trackIds, ...fresh] })
    await refresh()
    say(fresh.length ? `Added to ${p.name}.` : `Already in ${p.name}.`)
  }

  async function removeFromPlaylist(playlistId, songId) {
    const p = playlists.find((x) => x.id === playlistId)
    await db.savePlaylist({ ...p, trackIds: p.trackIds.filter((id) => id !== songId) })
    await refresh()
  }

  async function saveName() {
    const name = naming.name.trim()
    if (!name) return
    if (naming.id) {
      const p = playlists.find((x) => x.id === naming.id)
      await db.savePlaylist({ ...p, name })
    } else {
      const id = crypto.randomUUID?.() || String(Date.now())
      await db.savePlaylist({ id, name, trackIds: naming.songId ? [naming.songId] : [], created: Date.now() })
      if (!naming.songId) setOpenList(id)
      else say(`Added to ${name}.`)
    }
    setNaming(null)
    await refresh()
  }

  async function removePlaylist(p) {
    await db.deletePlaylist(p.id)
    setOpenList(null)
    await refresh()
  }

  const q = query.trim().toLowerCase()
  const shown = q ? tracks.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q)) : tracks
  const list = playlists.find((p) => p.id === openList)
  const listSongs = list ? list.trackIds.map((id) => tracksById[id]).filter(Boolean) : []
  const totalTime = tracks.reduce((s, t) => s + (t.duration || 0), 0)

  const songMenu = menu && [
    { label: 'Play next', run: () => { player.playNext(menu.song.id); say('Plays after this song.') } },
    { label: 'Add to a playlist…', run: () => setPicker({ song: menu.song }) },
    ...(menu.playlist ? [{ label: `Remove from ${menu.playlist.name}`, run: () => removeFromPlaylist(menu.playlist.id, menu.song.id) }] : []),
    { label: 'Delete from this device', danger: true, run: () => removeSong(menu.song) },
  ]

  return (
    <div className="mx-auto max-w-[600px] min-h-screen px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+110px)]">
      <input
        ref={fileInput}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.opus"
        multiple
        hidden
        onChange={(e) => { importFiles(e.target.files); e.target.value = '' }}
      />

      {list ? (
        <PlaylistPage
          list={list}
          songs={listSongs}
          player={player}
          onBack={() => setOpenList(null)}
          onMore={(song) => setMenu({ song, playlist: list })}
          onAdd={() => setAdder(list.id)}
          onRename={() => setNaming({ id: list.id, name: list.name })}
          onDelete={() => removePlaylist(list)}
        />
      ) : (
        <>
          <header className="flex items-end justify-between pt-6 pb-3">
            <h1 className="text-[34px] font-bold tracking-tight leading-none">{tab === 'songs' ? 'Songs' : 'Playlists'}</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setThemes(true)} className="w-9 h-9 rounded-full card grid place-items-center text-accent-ink active:opacity-60" aria-label="Themes">
                <Icon name="palette" size={21} />
              </button>
              <button
                onClick={() => (tab === 'songs' ? fileInput.current.click() : setNaming({ name: '' }))}
                className="h-9 pl-3 pr-4 rounded-full bg-accent text-white font-semibold flex items-center gap-1 active:opacity-80"
              >
                <Icon name="plus" size={20} /> {tab === 'songs' ? 'Add songs' : 'New'}
              </button>
            </div>
          </header>

          <div className="flex p-0.5 rounded-[calc(9px*var(--round,1))] bg-fill mb-3" role="tablist">
            {[['songs', 'Songs'], ['playlists', 'Playlists']].map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`flex-1 py-1.5 rounded-[calc(7px*var(--round,1))] text-[13px] font-semibold transition ${tab === k ? 'seg-on' : 'text-fg2'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'songs' ? (
            !ready ? null : tracks.length === 0 ? (
              <Empty onAdd={() => fileInput.current.click()} />
            ) : (
              <>
                <label className="flex items-center gap-2 h-9 px-2.5 rounded-[calc(10px*var(--round,1))] bg-fill text-fg2 mb-3">
                  <Icon name="search" size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search your songs"
                    className="flex-1 bg-transparent outline-none text-fg placeholder:text-fg3 !text-[16px]"
                    type="search"
                  />
                </label>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => player.playQueue(shown.map((t) => t.id))} className="flex-1 h-11 rounded-xl card font-semibold text-accent-ink flex items-center justify-center gap-1.5 active:bg-fill">
                    <Icon name="play" size={18} /> Play
                  </button>
                  <button
                    onClick={() => player.playQueue(shown.map((t) => t.id), Math.floor(Math.random() * shown.length), true)}
                    className="flex-1 h-11 rounded-xl card font-semibold text-accent-ink flex items-center justify-center gap-1.5 active:bg-fill"
                  >
                    <Icon name="shuffle" size={18} /> Shuffle
                  </button>
                </div>
                <SongList songs={shown} player={player} onMore={(song) => setMenu({ song })} />
                {!shown.length && <p className="text-center text-fg2 mt-8">No songs match “{query}”.</p>}
                <p className="text-center text-xs text-fg2 mt-6">
                  {tracks.length} {tracks.length === 1 ? 'song' : 'songs'} · {Math.round(totalTime / 60)} min
                  {usage?.usage ? ` · ${bytes(usage.usage)} on this device` : ''}
                </p>
              </>
            )
          ) : playlists.length === 0 ? (
            <div className="text-center mt-16 px-6">
              <p className="text-[17px] font-semibold">No playlists yet</p>
              <p className="text-fg2 mt-1">Make one, then add songs from your library.</p>
            </div>
          ) : (
            <div className="card rounded-2xl overflow-hidden">
              {playlists.map((p, i) => {
                const first = tracksById[p.trackIds.find((id) => tracksById[id]?.cover)]
                const n = p.trackIds.filter((id) => tracksById[id]).length
                return (
                  <button key={p.id} onClick={() => setOpenList(p.id)} className={`w-full flex items-center gap-3 p-3 text-left active:bg-fill ${i ? 'border-t border-line' : ''}`}>
                    <Cover blob={first?.cover} size={56} radius={10} />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-sm text-fg2">{n} {n === 1 ? 'song' : 'songs'}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      <MiniPlayer player={player} onOpen={() => setFull(true)} />

      <Sheet open={full} onClose={() => setFull(false)} full label="Now playing">
        <FullPlayer player={player} tracksById={tracksById} onClose={() => setFull(false)} />
      </Sheet>

      <Sheet open={!!menu} onClose={() => setMenu(null)} label="Song options">
        {menu && <Actions title={menu.song.title} subtitle={menu.song.artist} items={songMenu} onClose={() => setMenu(null)} />}
      </Sheet>

      <Sheet open={!!picker} onClose={() => setPicker(null)} label="Add to a playlist">
        {picker && (
          <Actions
            title="Add to a playlist"
            subtitle={picker.song.title}
            items={[
              ...playlists.map((p) => ({ label: p.name, run: () => addToPlaylist(p.id, [picker.song.id]) })),
              { label: 'New playlist…', run: () => setNaming({ name: '', songId: picker.song.id }) },
            ]}
            onClose={() => setPicker(null)}
          />
        )}
      </Sheet>

      <Sheet open={!!adder} onClose={() => setAdder(null)} full label="Add songs">
        {adder && <SongPicker tracks={tracks} already={playlists.find((p) => p.id === adder)?.trackIds || []} onDone={(ids) => { setAdder(null); if (ids.length) addToPlaylist(adder, ids) }} />}
      </Sheet>

      <Sheet open={themes} onClose={() => setThemes(false)} label="Themes">
        {themes && <ThemePicker current={theme} onPick={setTheme} onClose={() => setThemes(false)} />}
      </Sheet>

      <Sheet open={!!naming} onClose={() => setNaming(null)} label="Playlist name">
        {naming && (
          <form className="p-5 pb-[max(20px,env(safe-area-inset-bottom))]" onSubmit={(e) => { e.preventDefault(); saveName() }}>
            <div className="font-semibold text-center mb-4">{naming.id ? 'Rename playlist' : 'New playlist'}</div>
            <input
              autoFocus
              value={naming.name}
              onChange={(e) => setNaming({ ...naming, name: e.target.value })}
              placeholder="Name"
              maxLength={60}
              className="card w-full h-12 px-4 rounded-xl outline-none placeholder:text-fg3"
            />
            <button disabled={!naming.name.trim()} className="mt-3 w-full h-12 rounded-xl bg-accent text-white font-semibold disabled:opacity-40">
              {naming.id ? 'Save' : 'Create'}
            </button>
          </form>
        )}
      </Sheet>

      {(importing || note) && (
        <div className="fixed left-0 right-0 z-50 flex justify-center px-4 pointer-events-none" style={{ bottom: `calc(env(safe-area-inset-bottom) + ${player.current ? 92 : 24}px)` }}>
          <div className="rounded-full bg-fg text-bg text-sm font-medium px-4 py-2.5 shadow-lg max-w-full text-center" role="status">
            {importing ? `Adding ${importing.done} of ${importing.total}…` : note}
          </div>
        </div>
      )}
    </div>
  )
}

// Each preview carries its own data-theme, so it is drawn with that theme's real colours, fonts and corners
function ThemePicker({ current, onPick, onClose }) {
  return (
    <div className="flex flex-col min-h-0 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="text-[20px] font-bold">Themes</div>
        <button onClick={onClose} className="h-9 px-1 text-[17px] font-semibold text-accent-ink">Done</button>
      </div>
      <div className="overflow-y-auto px-4 grid grid-cols-2 gap-3">
        {THEMES.map((t) => {
          const on = t.id === current
          return (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className={`text-left rounded-2xl p-1 transition ${on ? 'ring-[3px] ring-accent' : 'ring-1 ring-line'}`}
              aria-pressed={on}
            >
              <div data-theme={t.id} className="themed-bg rounded-xl overflow-hidden p-2.5 h-[132px] flex flex-col gap-1.5" aria-hidden="true">
                <h1 className="text-[17px] font-bold leading-tight truncate">{t.name}</h1>
                <div className="card rounded-lg flex items-center gap-2 p-1.5">
                  <Cover size={22} radius={5} theme={t.id} />
                  <div className="flex-1 min-w-0">
                    <div className="h-[6px] w-4/5 rounded bg-fg/70" />
                    <div className="h-[5px] w-1/2 rounded bg-fg2/60 mt-1" />
                  </div>
                </div>
                <div className="mt-auto glass rounded-lg flex items-center gap-2 p-1.5">
                  <div className="h-[6px] flex-1 rounded bg-fg/60" />
                  <span className="w-6 h-6 rounded-full bg-accent text-white grid place-items-center"><Icon name="play" size={13} /></span>
                </div>
              </div>
              <div className="px-1.5 pt-2 pb-1">
                <div className="font-semibold text-[15px] flex items-center gap-1">
                  {t.name} {on && <Icon name="check" size={16} className="text-accent-ink" />}
                </div>
                <div className="text-xs text-fg2 leading-snug">{t.blurb}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Empty({ onAdd }) {
  return (
    <div className="text-center mt-14 px-6">
      <div className="mx-auto w-20 h-20 rounded-[calc(22px*var(--round,1))] bg-accent/15 text-accent-ink grid place-items-center">
        <Icon name="note" size={38} />
      </div>
      <p className="text-[20px] font-semibold mt-5">Your music, no internet needed</p>
      <p className="text-fg2 mt-2 leading-relaxed">
        Add songs from your phone or computer (MP3, M4A, WAV…). They're saved in this app, on this device, and play
        anywhere — on a plane, on the bus, with data off.
      </p>
      <button onClick={onAdd} className="mt-6 h-12 px-6 rounded-xl bg-accent text-white font-semibold active:opacity-80">
        Add songs
      </button>
      <p className="text-xs text-fg3 mt-6">Tip: add this page to your Home Screen so it opens like an app.</p>
    </div>
  )
}

function SongList({ songs, player, onMore }) {
  const ids = songs.map((s) => s.id)
  return (
    <div className="card rounded-2xl overflow-hidden">
      {songs.map((s, i) => {
        const on = player.current?.id === s.id
        return (
          <div key={s.id} className={`flex items-center ${i ? 'border-t border-line' : ''}`}>
            <button onClick={() => player.playQueue(ids, i)} className="flex-1 min-w-0 flex items-center gap-3 pl-3 py-2 text-left active:bg-fill">
              <div className="relative">
                <Cover blob={s.cover} size={44} radius={7} />
                {on && (
                  <div className="absolute inset-0 rounded-[calc(7px*var(--round,1))] bg-black/45 grid place-items-center text-white">
                    <Bars playing={player.playing} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate ${on ? 'text-accent-ink font-medium' : ''}`}>{s.title}</div>
                <div className="text-sm text-fg2 truncate">
                  {s.artist || 'Unknown artist'}
                  {s.duration ? ` · ${time(s.duration)}` : ''}
                </div>
              </div>
            </button>
            <button onClick={() => onMore(s)} className="w-11 h-14 grid place-items-center text-fg2 active:opacity-50" aria-label={`More for ${s.title}`}>
              <Icon name="more" size={22} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function Bars({ playing }) {
  return (
    <div className={`flex items-end gap-[2px] h-3.5 ${playing ? 'bars-on' : ''}`} aria-hidden="true">
      {[0, 1, 2].map((i) => <span key={i} className="bar w-[3px] rounded-sm bg-white" style={{ animationDelay: `${i * 0.18}s` }} />)}
    </div>
  )
}

function PlaylistPage({ list, songs, player, onBack, onMore, onAdd, onRename, onDelete }) {
  const [sure, setSure] = useState(false)
  const ids = songs.map((s) => s.id)
  const mins = Math.round(songs.reduce((s, t) => s + (t.duration || 0), 0) / 60)
  return (
    <>
      <div className="flex items-center justify-between -mx-2 mb-2">
        <button onClick={onBack} className="h-11 pl-1 pr-3 flex items-center text-accent-ink text-[17px] active:opacity-50">
          <Icon name="back" size={26} /> Playlists
        </button>
        <button onClick={onAdd} className="h-11 px-3 text-accent-ink text-[17px] font-medium active:opacity-50">Add songs</button>
      </div>
      <div className="flex flex-col items-center text-center pb-4">
        <Cover blob={songs.find((s) => s.cover)?.cover} size={176} radius={16} className="shadow-lg" />
        <h1 className="text-[24px] font-bold mt-4 prose-wrap">{list.name}</h1>
        <p className="text-sm text-fg2">{songs.length} {songs.length === 1 ? 'song' : 'songs'}{mins ? ` · ${mins} min` : ''}</p>
      </div>
      {songs.length ? (
        <>
          <div className="flex gap-2 mb-3">
            <button onClick={() => player.playQueue(ids)} className="flex-1 h-11 rounded-xl card font-semibold text-accent-ink flex items-center justify-center gap-1.5 active:bg-fill">
              <Icon name="play" size={18} /> Play
            </button>
            <button
              onClick={() => player.playQueue(ids, Math.floor(Math.random() * ids.length), true)}
              className="flex-1 h-11 rounded-xl card font-semibold text-accent-ink flex items-center justify-center gap-1.5 active:bg-fill"
            >
              <Icon name="shuffle" size={18} /> Shuffle
            </button>
          </div>
          <SongList songs={songs} player={player} onMore={onMore} />
        </>
      ) : (
        <p className="text-center text-fg2 mt-4">Empty for now. Tap “Add songs”.</p>
      )}
      <div className="flex justify-center gap-6 mt-8 text-[15px]">
        <button onClick={onRename} className="text-accent-ink active:opacity-50">Rename</button>
        {sure ? (
          <button onClick={onDelete} className="text-danger font-semibold active:opacity-50">Tap again to delete</button>
        ) : (
          <button onClick={() => setSure(true)} className="text-danger active:opacity-50">Delete playlist</button>
        )}
      </div>
      <p className="text-center text-xs text-fg3 mt-2">Deleting a playlist keeps its songs in your library.</p>
    </>
  )
}

function SongPicker({ tracks, already, onDone }) {
  const [picked, setPicked] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = (q ? tracks.filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(q)) : tracks)
  const flip = (id) => setPicked((p) => {
    const n = new Set(p)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button onClick={() => onDone([])} className="h-11 text-[17px] text-accent-ink">Cancel</button>
        <div className="font-semibold">Add songs</div>
        <button onClick={() => onDone([...picked])} className="h-11 text-[17px] font-semibold text-accent-ink">Add{picked.size ? ` ${picked.size}` : ''}</button>
      </div>
      <div className="px-4 pb-2">
        <label className="flex items-center gap-2 h-9 px-2.5 rounded-[calc(10px*var(--round,1))] bg-fill text-fg2">
          <Icon name="search" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="flex-1 bg-transparent outline-none text-fg placeholder:text-fg3" type="search" />
        </label>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {tracks.length === 0 && <p className="text-center text-fg2 mt-10">Add songs to your library first.</p>}
        <div className="card rounded-2xl overflow-hidden">
          {shown.map((s, i) => {
            const inList = already.includes(s.id)
            const on = picked.has(s.id)
            return (
              <button key={s.id} disabled={inList} onClick={() => flip(s.id)} className={`w-full flex items-center gap-3 p-2 pl-3 text-left active:bg-fill disabled:opacity-45 ${i ? 'border-t border-line' : ''}`}>
                <Cover blob={s.cover} size={40} radius={6} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{s.title}</div>
                  <div className="text-sm text-fg2 truncate">{inList ? 'Already in this playlist' : s.artist || 'Unknown artist'}</div>
                </div>
                <span className={`w-6 h-6 mr-1 rounded-full grid place-items-center border-2 ${on || inList ? 'bg-accent border-accent text-white' : 'border-fg3'}`}>
                  {(on || inList) && <Icon name="check" size={16} />}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
