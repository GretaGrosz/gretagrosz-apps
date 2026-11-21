// Records the demo voices with macOS `say`, converts them to AAC (.m4a) in public/seed/,
// and writes the seed migrations (bot users, posts, replies, reactions, captions, voice bios)
// plus the German welcome. (The daily questions are text now: worker/yap-prompts.js.)
// Run once: node yap-app/scripts/make-seed.mjs
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public/seed')
const tmp = mkdtempSync(join(tmpdir(), 'yap-seed-'))

const bots = [
  { id: 'bot_yap', handle: 'yap', name: 'Yap', emoji: '🎙️', hue: 275 },
  { id: 'bot_luna', handle: 'luna', name: 'Luna', emoji: '🌙', hue: 225 },
  { id: 'bot_max', handle: 'max', name: 'Max', emoji: '🥣', hue: 25 },
  { id: 'bot_rose', handle: 'grandma_rose', name: 'Grandma Rose', emoji: '🍪', hue: 340 },
  { id: 'bot_rocko', handle: 'chef_rocko', name: 'Chef Rocko', emoji: '🍞', hue: 45 },
  { id: 'bot_moira', handle: 'moira', name: 'Moira', emoji: '☘️', hue: 140 },
  { id: 'bot_tessa', handle: 'tessa', name: 'Tessa', emoji: '🦒', hue: 95 },
  { id: 'bot_bubbles', handle: 'bubbles', name: 'Bubbles', emoji: '🐠', hue: 190 },
  { id: 'bot_reed', handle: 'reed', name: 'Reed', emoji: '💧', hue: 200 },
]

// [file, bot, voice, text, minutes ago, reply to]
const clips = [
  ['welcome', 'bot_yap', 'Samantha', "Hey, welcome to Yap! There's no typing here. Ever. Tap the big button, say something, and tap again. That's it. Your friends hear you, you hear them. Go on, say hi.", 3],
  ['octopus', 'bot_luna', 'Flo (English (US))', 'Okay, so I just found out that octopuses have three hearts. Three! And I can barely manage one. Anyway. Good morning, everybody.', 22],
  ['cereal', 'bot_max', 'Daniel', 'Hot take. Cereal is a soup. It is a cold soup. I will not be taking questions at this time.', 47],
  ['cereal-rose', 'bot_rose', 'Grandma (English (US))', 'Max. Dear. No.', 41, 'cereal'],
  ['cereal-luna', 'bot_luna', 'Flo (English (US))', "I mean... he's not wrong though?", 38, 'cereal'],
  ['cookies', 'bot_rose', 'Grandma (English (US))', "Hello, dears. Is this thing on? My grandson set this up for me. I made cookies. That's all. Bye bye.", 95],
  ['toast', 'bot_rocko', 'Rocko (English (US))', "Today's recipe: toast. Step one, bread. Step two, toaster. Step three, wait. Step four, success. You're welcome.", 160],
  ['clever', 'bot_moira', 'Moira', "I've been sitting here for twenty minutes trying to think of something clever to say. Nothing. Absolutely nothing. So here's this. Enjoy.", 240],
  ['giraffe', 'bot_tessa', 'Tessa', "Fun fact. A giraffe's tongue is about half a metre long. And it's purple. Look it up. Actually, don't. Just trust me.", 330],
  ['underwater', 'bot_bubbles', 'Bubbles', 'Hello from under the water. It is very wet down here.', 420],
  ['water', 'bot_reed', 'Reed (English (US))', "Daily reminder. Drink some water, stretch your back, and stop texting people. Yap them instead.", 600],
]
// Yap answers anyone who sends it a voice message

// Each bot's voice bio on its profile
const bios = {
  bot_yap: ['Samantha', "Hi, I'm Yap. Send me a voice message and I'll answer. I'm a very good listener."],
  bot_luna: ['Flo (English (US))', "I'm Luna. Night owl, animal facts, way too much tea."],
  bot_max: ['Daniel', 'Max here. I have opinions about breakfast. Strong ones.'],
  bot_rose: ['Grandma (English (US))', "Hello, dear. It's Grandma Rose. I bake, and I'm still figuring out this phone."],
  bot_rocko: ['Rocko (English (US))', 'Chef Rocko. Five star recipes. Two ingredients, max.'],
  bot_moira: ['Moira', "Hi, I'm Moira. I overthink everything. Including this."],
  bot_tessa: ['Tessa', 'Tessa. Big giraffe fan. Ask me anything about giraffes. Anything.'],
  bot_bubbles: ['Bubbles', "Blub. I'm Bubbles. I live in a tank. It's nice."],
  bot_reed: ['Reed (English (US))', 'Reed. Your daily reminder to drink some water. Hi.'],
}
// One question a day, read out by Yap; the worker picks today's

function record(name, voice, text) {
  const aiff = join(tmp, name + '.aiff'), wav = join(tmp, name + '.wav'), m4a = join(out, name + '.m4a')
  execFileSync('say', ['-v', voice, '-o', aiff, text])
  execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@22050', '-c', '1', aiff, wav])
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', '-c', '1', aiff, m4a])
  return analyse(readFileSync(wav))
}

// Duration and a 40-bar waveform (0-99) from a 16-bit mono WAV
function analyse(buf) {
  let off = 12, data, rate = 22050
  while (off < buf.length) {
    const id = buf.toString('ascii', off, off + 4), size = buf.readUInt32LE(off + 4)
    if (id === 'fmt ') rate = buf.readUInt32LE(off + 12)
    if (id === 'data') { data = buf.subarray(off + 8, off + 8 + size); break }
    off += 8 + size
  }
  const n = data.length / 2, bars = 40, per = Math.floor(n / bars), peaks = []
  for (let b = 0; b < bars; b++) {
    let sum = 0
    for (let i = 0; i < per; i++) { const v = data.readInt16LE((b * per + i) * 2) / 32768; sum += v * v }
    peaks.push(Math.sqrt(sum / per))
  }
  const max = Math.max(...peaks) || 1
  return { duration: +(n / rate).toFixed(2), wave: peaks.map(p => Math.round(Math.pow(p / max, 0.7) * 99)) }
}

const q = s => "'" + String(s).replace(/'/g, "''") + "'"
const sql = ['-- Demo bots and their voice posts (generated by yap-app/scripts/make-seed.mjs)']
for (const b of bots)
  sql.push(`INSERT INTO users (id, handle, name, emoji, hue, bot, token_hash, created) VALUES (${q(b.id)}, ${q(b.handle)}, ${q(b.name)}, ${q(b.emoji)}, ${b.hue}, 1, '', 0);`)
for (const [file, bot, voice, text, ago, parent] of clips) {
  const { duration, wave } = record(file, voice, text)
  sql.push(`INSERT INTO posts (id, user_id, reply_to, audio_url, mime, duration, wave, fx, created) VALUES (${q('seed_' + file)}, ${q(bot)}, ${parent ? q('seed_' + parent) : 'NULL'}, ${q('/yap/seed/' + file + '.m4a')}, 'audio/mp4', ${duration}, ${q(JSON.stringify(wave))}, '', unixepoch() * 1000 - ${ago * 60000});`)
  console.log(file, duration + 's')
}
const reacts = { welcome: ['😍', '🔥', '👏'], octopus: ['😮', '😮', '😂'], cereal: ['😂', '😂', '😂', '🔥'], cookies: ['😍', '😍'], toast: ['😂', '👏'], giraffe: ['😮'], water: ['👏', '🔥'] }
for (const [post, emojis] of Object.entries(reacts))
  emojis.forEach((e, i) => sql.push(`INSERT INTO reactions (post_id, user_id, emoji, created) VALUES (${q('seed_' + post)}, ${q(bots[(i + 1) % bots.length].id)}, ${q(e)}, 0);`))
// The welcome in German, for German-speaking visitors (worker/yap.js, WELCOME_DE)
console.log('welcome-de', record('welcome-de', 'Anna', 'Hey, willkommen bei Yap! Hier wird nicht getippt. Nie. Tipp auf den großen Knopf, sag etwas, und tipp nochmal. Das war’s. Deine Freunde hören dich, und du hörst sie.').duration + 's')

const more = ['-- Captions for the demo posts and the bots\' voice bios (generated by yap-app/scripts/make-seed.mjs)']
for (const [file, , , text] of clips) more.push(`UPDATE posts SET transcript = ${q(text)} WHERE id = ${q('seed_' + file)};`)
for (const [id, [voice, text]] of Object.entries(bios)) {
  const file = 'bio-' + id.slice(4)
  const { duration, wave } = record(file, voice, text)
  more.push(`UPDATE users SET bio_url = ${q('/yap/seed/' + file + '.m4a')}, bio_mime = 'audio/mp4', bio_duration = ${duration}, bio_wave = ${q(JSON.stringify(wave))}, bio_fx = '', bio_transcript = ${q(text)} WHERE id = ${q(id)};`)
}
writeFileSync(join(root, '../worker/migrations/0004_seed_more.sql'), more.join('\n') + '\n')
writeFileSync(join(root, '../worker/migrations/0002_seed.sql'), sql.join('\n') + '\n')
rmSync(tmp, { recursive: true })
