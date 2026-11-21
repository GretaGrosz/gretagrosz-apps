// Reads title, artist, album and cover art from a song file without any library: ID3v2 (MP3) and MP4 (M4A/AAC).
// Anything else, or a file without tags, falls back to the file name ("Artist - Title.mp3").

export async function readTags(file) {
  const fromName = nameTags(file.name)
  try {
    const head = new Uint8Array(await file.slice(0, 10).arrayBuffer())
    if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return { ...fromName, ...(await id3(file, head)) }
    if (String.fromCharCode(...head.slice(4, 8)) === 'ftyp') return { ...fromName, ...(await mp4(file)) }
  } catch {
    /* broken tags: the file name will do */
  }
  return fromName
}

function nameTags(name) {
  const base = name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').replace(/^\d{1,3}[\s.-]+/, '').trim()
  const parts = base.split(/\s+[-–]\s+/)
  if (parts.length >= 2) return { artist: parts[0], title: parts.slice(1).join(' - ') }
  return { title: base || name }
}

// --- ID3v2 ---

const syncsafe = (b, i) => (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3]
const uint32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0

async function id3(file, head) {
  const version = head[3]
  const size = syncsafe(head, 6)
  const b = new Uint8Array(await file.slice(10, 10 + size).arrayBuffer())
  const tags = {}
  let i = 0
  // Skip the extended header
  if (head[5] & 0x40) i = version === 4 ? syncsafe(b, 0) : uint32(b, 0) + 4
  const idLen = version === 2 ? 3 : 4
  const hdrLen = version === 2 ? 6 : 10
  while (i + hdrLen < b.length) {
    const id = String.fromCharCode(...b.slice(i, i + idLen))
    if (!/^[A-Z0-9]+$/.test(id)) break
    const len = version === 2 ? (b[i + 3] << 16) | (b[i + 4] << 8) | b[i + 5] : version === 4 ? syncsafe(b, i + 4) : uint32(b, i + 4)
    const data = b.subarray(i + hdrLen, i + hdrLen + len)
    i += hdrLen + len
    if (!len) continue
    const key = { TIT2: 'title', TT2: 'title', TPE1: 'artist', TP1: 'artist', TALB: 'album', TAL: 'album' }[id]
    if (key) {
      const text = decode(data.subarray(1), data[0]).replace(/\0.*$/s, '').trim()
      if (text) tags[key] = text
    } else if ((id === 'APIC' || id === 'PIC') && !tags.cover) {
      tags.cover = picture(data, id === 'PIC')
    }
  }
  return tags
}

function decode(bytes, enc) {
  if (enc === 0) return new TextDecoder('latin1').decode(bytes)
  if (enc === 1) return new TextDecoder(bytes[0] === 0xfe ? 'utf-16be' : 'utf-16le').decode(bytes)
  if (enc === 2) return new TextDecoder('utf-16be').decode(bytes)
  return new TextDecoder('utf-8').decode(bytes)
}

function picture(data, v22) {
  const enc = data[0]
  let i = 1
  let mime
  if (v22) {
    mime = String.fromCharCode(...data.slice(1, 4)).toLowerCase() === 'png' ? 'image/png' : 'image/jpeg'
    i = 4
  } else {
    while (i < data.length && data[i] !== 0) i++
    mime = new TextDecoder('latin1').decode(data.subarray(1, i)) || 'image/jpeg'
    if (!mime.includes('/')) mime = 'image/' + mime.toLowerCase()
    i++
  }
  i++ // picture type
  // Description, ended by one zero byte, or two in UTF-16
  if (enc === 1 || enc === 2) {
    while (i + 1 < data.length && !(data[i] === 0 && data[i + 1] === 0)) i += 2
    i += 2
  } else {
    while (i < data.length && data[i] !== 0) i++
    i++
  }
  return new Blob([data.slice(i)], { type: mime })
}

// --- MP4 / M4A: moov > udta > meta > ilst ---

async function mp4(file) {
  const moov = await findAtom(file, 0, file.size, 'moov')
  if (!moov) return {}
  const b = new Uint8Array(await file.slice(moov.start, moov.end).arrayBuffer())
  const udta = child(b, 8, b.length, 'udta')
  const meta = udta && child(b, udta.start + 8, udta.end, 'meta')
  const ilst = meta && child(b, meta.start + 12, meta.end, 'ilst')
  if (!ilst) return {}
  const tags = {}
  for (let i = ilst.start + 8; i + 8 <= ilst.end; ) {
    const len = uint32(b, i)
    if (len < 8) break
    const name = new TextDecoder('latin1').decode(b.subarray(i + 4, i + 8))
    const data = child(b, i + 8, i + len, 'data')
    if (data) {
      const type = uint32(b, data.start + 8) & 0xffffff
      const value = b.subarray(data.start + 16, data.end)
      const key = { '©nam': 'title', '©ART': 'artist', aART: 'artist', '©alb': 'album' }[name]
      if (key && !tags[key]) tags[key] = new TextDecoder('utf-8').decode(value).trim()
      if (name === 'covr' && !tags.cover) tags.cover = new Blob([value.slice()], { type: type === 14 ? 'image/png' : 'image/jpeg' })
    }
    i += len
  }
  return tags
}

function child(b, from, to, name) {
  for (let i = from; i + 8 <= to; ) {
    const len = uint32(b, i)
    if (len < 8) return null
    if (String.fromCharCode(...b.subarray(i + 4, i + 8)) === name) return { start: i, end: Math.min(i + len, to) }
    i += len
  }
  return null
}

// Top-level atoms can sit anywhere in a big file, so only their 8-byte headers are read while looking
async function findAtom(file, from, to, name) {
  for (let i = from; i + 8 <= to; ) {
    const h = new Uint8Array(await file.slice(i, i + 16).arrayBuffer())
    let len = uint32(h, 0)
    if (len === 1) len = uint32(h, 8) * 2 ** 32 + uint32(h, 12)
    else if (len === 0) len = to - i
    if (len < 8) return null
    if (String.fromCharCode(...h.subarray(4, 8)) === name) return { start: i, end: i + len }
    i += len
  }
  return null
}

// Length in seconds, read by the browser itself
export function readDuration(file) {
  return new Promise((resolve) => {
    const a = new Audio()
    const url = URL.createObjectURL(file)
    const finish = (d) => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(d) ? d : 0)
    }
    a.preload = 'metadata'
    a.onloadedmetadata = () => finish(a.duration)
    a.onerror = () => finish(0)
    setTimeout(() => finish(a.duration), 8000)
    a.src = url
  })
}

// Can this browser play the file at all? (FLAC and OGG don't play everywhere, e.g. older iPhones)
export function canPlay(file) {
  const byName = { flac: 'audio/flac', ogg: 'audio/ogg', opus: 'audio/ogg', m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac' }[file.name.split('.').pop().toLowerCase()]
  const a = new Audio()
  return [file.type, byName].some((t) => t && a.canPlayType(t) !== '')
}
