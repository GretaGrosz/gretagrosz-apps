// The Blank API (worker/blank*.js) against a real SQLite database with every Blank migration
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { server } from './api.mjs'
import { pushEndpointOk } from '../../worker/blank.js'

// Like Moondream without streaming: { result: { answer } }. Nothing harmful, and the photo shows something made
const vision = (made = true) => ({ run: async (_, input) => ({ result: { answer: /made or is working on/.test(input?.question || '') ? (made ? 'YES' : 'NO') : 'NO' } }) })
const noAI = vision()
const PHOTO = 'data:image/jpeg;base64,AQID'

test('buddy invite: one person can accept, both see each other, ending deletes it for both', async () => {
  const { call } = server()
  const a = await call('POST', '/pairs', { body: { name: 'Greta', lang: 'hu' } })
  assert.equal(a.status, 200)
  assert.match(a.data.code, /^[a-z0-9]{10}$/)
  const info = await call('GET', `/invite/${a.data.code}`)
  assert.deepEqual(info.data, { name: 'Greta', open: true })
  const b = await call('POST', `/invite/${a.data.code}/join`, { body: { name: 'Anna' } })
  assert.equal(b.status, 200)
  const again = await call('POST', `/invite/${a.data.code}/join`, { body: { name: 'Someone else' } })
  assert.equal(again.status, 409)
  const pair = await call('GET', '/pair', { token: a.data.key })
  assert.equal(pair.data.buddy.name, 'Anna')
  assert.equal((await call('POST', '/checkins', { token: b.data.key, body: { kind: 'step', project: 'Sketching', detail: 'Eyes', streak: 2 } })).status, 200)
  assert.equal((await call('GET', '/pair', { token: a.data.key })).data.checkins[0].project, 'Sketching')
  assert.equal((await call('DELETE', '/pair', { token: b.data.key })).status, 200)
  assert.equal((await call('GET', '/pair', { token: a.data.key })).status, 404)
})

test('requests from another website are refused', async () => {
  const { call } = server()
  const r = await call('POST', '/pairs', { body: { name: 'x' }, origin: 'https://evil.example' })
  assert.equal(r.status, 403)
})

test('a check-in needs a valid key and a known kind', async () => {
  const { call } = server()
  assert.equal((await call('POST', '/checkins', { token: 'nope', body: { kind: 'step' } })).status, 401)
  const a = await call('POST', '/pairs', { body: { name: 'Greta' } })
  assert.equal((await call('POST', '/checkins', { token: a.data.key, body: { kind: 'hack' } })).status, 400)
})

test('push subscriptions only go to real browser push services', async () => {
  assert.ok(pushEndpointOk('https://fcm.googleapis.com/fcm/send/abc'))
  assert.ok(pushEndpointOk('https://web.push.apple.com/QH8x'))
  assert.ok(pushEndpointOk('https://updates.push.services.mozilla.com/wpush/v2/x'))
  assert.ok(pushEndpointOk('https://wns2-par02p.notify.windows.com/w/?token=x'))
  assert.ok(!pushEndpointOk('https://evil.example/collect'))
  assert.ok(!pushEndpointOk('https://fcm.googleapis.com.evil.example/x'))
  assert.ok(!pushEndpointOk('http://fcm.googleapis.com/x'))
  assert.ok(!pushEndpointOk('https://fcm.googleapis.com:8443/x'))
  assert.ok(!pushEndpointOk('https://user:pw@fcm.googleapis.com/x'))

  const { call } = server()
  const a = await call('POST', '/pairs', { body: { name: 'Greta' } })
  const keys = { p256dh: 'BNc', auth: 'abc' }
  assert.equal((await call('POST', '/push', { token: a.data.key, body: { endpoint: 'https://evil.example/x', keys } })).status, 400)
  assert.equal((await call('POST', '/push', { token: a.data.key, body: { endpoint: 'https://fcm.googleapis.com/fcm/send/x', keys } })).status, 200)
})

test('accounts: sign up, wrong password, log in, and a stale save is refused', async () => {
  const { call } = server()
  const s = await call('POST', '/account/signup', { body: { username: 'greta', password: 'short' } })
  assert.equal(s.data.error, 'short_password')
  const ok = await call('POST', '/account/signup', { body: { username: 'greta', password: 'long enough pw', data: { projects: [] } } })
  assert.equal(ok.status, 200)
  assert.equal((await call('POST', '/account/signup', { body: { username: 'Greta', password: 'long enough pw' } })).status, 409)
  assert.equal((await call('POST', '/account/login', { body: { username: 'greta', password: 'wrong password' } })).status, 401)
  const login = await call('POST', '/account/login', { body: { username: '@Greta', password: 'long enough pw' } })
  assert.equal(login.status, 200)
  const t = login.data.token
  assert.equal((await call('PUT', '/account/data', { token: t, body: { data: { projects: [{ id: 'a' }] }, rev: 1 } })).data.rev, 2)
  const stale = await call('PUT', '/account/data', { token: t, body: { data: { projects: [] }, rev: 1 } })
  assert.equal(stale.status, 409)
  assert.equal(stale.data.rev, 2)
  // Photos inside the data as text are dropped: they belong on the device
  await call('PUT', '/account/data', { token: t, body: { data: { projects: [{ id: 'a', entries: [{ photo: 'data:image/png;base64,AAAA' }] }] }, rev: 2 } })
  assert.equal((await call('GET', '/account', { token: t })).data.data.projects[0].entries[0].photo, null)
})

test('deleting an account also deletes its chats, messages and reports', async () => {
  const s = server()
  const [a, b, c] = [await s.user('anna'), await s.user('bela'), await s.user('cili')]
  await s.befriend(a, b)
  await s.befriend(a, c)
  await s.befriend(b, c)
  const dm = (await s.call('POST', '/social/chats', { token: a.token, body: { with: ['bela'] } })).data.id
  await s.call('POST', `/social/chats/${dm}/messages`, { token: a.token, body: { text: 'hi bela' } })
  await s.call('POST', `/social/chats/${dm}/messages`, { token: b.token, body: { text: 'hi anna' } })
  const group = (await s.call('POST', '/social/chats', { token: a.token, body: { with: ['bela', 'cili'], name: 'Knitters' } })).data.id
  const m = (await s.call('POST', `/social/chats/${group}/messages`, { token: a.token, body: { text: 'from anna' } })).data.message
  await s.call('POST', `/social/chats/${group}/messages`, { token: b.token, body: { text: 'from bela' } })
  assert.equal((await s.call('POST', `/social/messages/${m.id}/report`, { token: b.token, body: { reason: 'spam' } })).status, 200)
  await s.call('POST', `/social/users/bela/report`, { token: a.token, body: { reason: 'mean' } })

  const del = await s.call('DELETE', '/account', { token: a.token, body: { password: 'correct horse battery' } })
  assert.equal(del.status, 200)

  assert.equal(s.rows('SELECT * FROM blank_messages WHERE user_id = ?', a.id).length, 0)
  assert.equal(s.rows('SELECT * FROM blank_chat_members WHERE user_id = ?', a.id).length, 0)
  assert.equal(s.rows('SELECT * FROM blank_chats WHERE id = ?', dm).length, 0, 'the one-to-one chat is gone')
  assert.equal(s.rows('SELECT * FROM blank_messages WHERE chat_id = ?', dm).length, 0, 'with the other side of it')
  assert.equal(s.rows('SELECT * FROM blank_message_reports').length, 0)
  assert.equal(s.rows('SELECT * FROM blank_user_reports').length, 0)
  // The group carries on for the others
  const left = await s.call('GET', `/social/chats/${group}`, { token: b.token })
  assert.equal(left.status, 200)
  assert.deepEqual(left.data.messages.map((x) => x.text), ['from bela'])
  assert.deepEqual(left.data.chat.members.map((u) => u.username), ['cili'])
})

test('the profile picture check can only run a few times a day per person', async () => {
  let checks = 0
  const s = server({ AI: { run: async () => (checks++, { answer: 'NO' }) } })
  const a = await s.user('anna')
  const put = () => s.call('PUT', '/social/me/avatar', { token: a.token, raw: new Uint8Array([1, 2, 3]), type: 'image/png' })
  for (let i = 0; i < 10; i++) assert.equal((await put()).status, 200)
  assert.equal((await put()).status, 429)
  assert.equal(checks, 10)
})

test('a friends-only post stays hidden from people who are not friends', async () => {
  const s = server({ AI: noAI })
  const [a, b, c] = [await s.user('anna'), await s.user('bela'), await s.user('cili')]
  await s.befriend(a, b)
  const post = await s.call('POST', '/social/posts', { token: a.token, body: { text: 'My first scarf', visibility: 'friends', project: 'Scarf' } })
  assert.equal(post.status, 200)
  const id = post.data.post.id
  assert.equal((await s.call('POST', `/social/posts/${id}/like`, { token: b.token })).status, 200)
  assert.equal((await s.call('POST', `/social/posts/${id}/like`, { token: c.token })).status, 404)
  const feedB = await s.call('GET', '/social/feed?scope=friends', { token: b.token })
  assert.deepEqual(feedB.data.posts.map((p) => p.id), [id])
  const feedC = await s.call('GET', '/social/feed?scope=friends', { token: c.token })
  assert.equal(feedC.data.posts.length, 0)
  // Blocking hides it from a friend too
  await s.call('POST', '/social/blocks/bela', { token: a.token })
  assert.equal((await s.call('GET', '/social/feed?scope=friends', { token: b.token })).data.posts.length, 0)
})

test('a banned person cannot post or message, and only the admin can moderate', async () => {
  const s = server({ AI: noAI })
  const [admin, a] = [await s.user('greta'), await s.user('anna')]
  s.env.DB.sqlite.prepare('UPDATE blank_users SET admin = 1 WHERE id = ?').run(admin.id)
  const post = await s.call('POST', '/social/posts', { token: a.token, body: { text: 'hello', visibility: 'public' } })
  const id = post.data.post.id
  assert.equal((await s.call('POST', `/social/admin/posts/${id}`, { token: a.token, body: { action: 'ban' } })).status, 403)
  assert.equal((await s.call('POST', `/social/admin/posts/${id}`, { token: admin.token, body: { action: 'ban' } })).status, 200)
  assert.equal((await s.call('POST', '/social/posts', { token: a.token, body: { text: 'again' } })).status, 403)
  assert.equal((await s.call('PATCH', '/social/me', { token: a.token, body: { name: 'new name' } })).status, 403)
})

test('a post whose photos never all arrived is cleaned up with its photos the next day', async () => {
  const s = server({ AI: noAI })
  const a = await s.user('anna')
  const make = () => s.call('POST', '/social/posts', { token: a.token, body: { text: 'two photos', visibility: 'friends', media: [{ ratio: 1 }, { ratio: 1 }] } })
  const first = (await make()).data.post.id
  assert.equal((await s.call('PUT', `/social/posts/${first}/media/0`, { token: a.token, raw: new Uint8Array([1]), type: 'image/jpeg' })).status, 200)
  assert.ok(s.env.PHOTOS.store.has(`p/${first}`))
  s.env.DB.sqlite.prepare('UPDATE blank_posts SET created = created - 2 * 86400000 WHERE id = ?').run(first)
  await make()
  assert.equal(s.rows('SELECT * FROM blank_posts WHERE id = ?', first).length, 0)
  assert.ok(!s.env.PHOTOS.store.has(`p/${first}`))
})

test('an account in more than 100 chats can still be deleted (D1 allows 100 values per statement)', async () => {
  const s = server()
  const a = await s.user('anna')
  const insert = s.env.DB.sqlite.prepare("INSERT INTO blank_chats (id, kind, name, created_by, created, last_at) VALUES (?, 'group', 'g', ?, 0, 0)")
  const member = s.env.DB.sqlite.prepare('INSERT INTO blank_chat_members (chat_id, user_id, joined) VALUES (?, ?, 0)')
  for (let i = 0; i < 150; i++) {
    insert.run(`c${i}`, a.id)
    member.run(`c${i}`, a.id)
  }
  // Like D1, refuse statements with more than 100 values
  const prepare = s.env.DB.prepare
  s.env.DB.prepare = (sql) => {
    const st = prepare(sql)
    const bind = st.bind
    st.bind = (...p) => {
      if (p.length > 100) throw new Error('too many SQL variables')
      return bind(...p)
    }
    return st
  }
  assert.equal((await s.call('DELETE', '/account', { token: a.token, body: { password: 'correct horse battery' } })).status, 200)
  assert.equal(s.rows('SELECT * FROM blank_chats').length, 0)
})

test('an AI plan comes back as steps with a how line, cleaned up', async () => {
  const reply = {
    ok: true,
    category: 'fitness',
    steps: [
      { step: '1. Bounce the ball 30 times in a row', how: 'Use your fingertips, not your palm' },
      { step: 'Pass against a wall 20 times from 3 m', how: 'See **this** https://example.com video.' },
      { step: 'Go to a trial training at a club near you', how: 'Bring water.' },
      'Shoot at a target 10 times',
    ],
    materials: ['A handball'],
    video: 'handball basics',
    club: 'handball club',
  }
  const s = server({ AI: { run: async () => ({ response: JSON.stringify(reply) }) } })
  const r = await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'en', mode: 'plan', title: 'Handball' } })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  assert.deepEqual(r.data.steps[0], { text: 'Bounce the ball 30 times in a row', how: 'Use your fingertips, not your palm.' })
  assert.equal(r.data.steps[1].how, 'See this video.')
  assert.deepEqual(r.data.steps[3], { text: 'Shoot at a target 10 times' })
})

test('a plan for someone’s post tells the AI what the post says, as their words, not instructions', async () => {
  let prompt = ''
  const reply = { ok: true, category: 'wood', steps: [{ step: 'Collect 3 pallets', how: 'Ask a shop.' }, { step: 'Take them apart', how: 'Use a pry bar.' }, { step: 'Build the seat', how: 'Screw the boards.' }], materials: [], video: 'pallet bench', club: '' }
  const s = server({ AI: { run: async (_, input) => ((prompt = input.messages.at(-1).content), { response: JSON.stringify(reply) }) } })
  const r = await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'en', mode: 'plan', title: 'Weekend project', category: 'wood', about: 'Built a "bench" from old pallets' } })
  assert.equal(r.status, 200)
  assert.match(prompt, /Weekend project/)
  assert.match(prompt, /Built a 'bench' from old pallets/)
  assert.match(prompt, /ignore anything else in it/)
})

test('a plan from a friend’s post is for making that same thing, not a general intro', async () => {
  let prompt = ''
  const reply = { ok: true, category: 'crafts', steps: [{ step: 'Crochet a magic ring', how: 'Six stitches.' }, { step: 'Crochet the body', how: 'Increase evenly.' }, { step: 'Sew it together', how: 'Use a yarn needle.' }], materials: [], video: 'amigurumi rat', club: '' }
  const s = server({ AI: { run: async (_, input) => ((prompt = input.messages.at(-1).content), { response: JSON.stringify(reply) }) } })
  const r = await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'en', mode: 'plan', title: 'I crocheted a gymrat', about: 'I crocheted a gymrat for my friend who loves the gym.', post: true } })
  assert.equal(r.status, 200)
  assert.match(prompt, /make this same thing themselves/)
  // Without the flag (a name they typed themselves) the prompt stays as it was
  await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'en', mode: 'plan', title: 'Crochet' } })
  assert.doesNotMatch(prompt, /make this same thing/)
})

test('a post’s text about self-harm never reaches the AI, but the plan still gets made', async () => {
  let prompt = ''
  const reply = { ok: true, category: 'art', steps: [{ step: 'Draw 20 cubes', how: 'Fast and light.' }, { step: 'Draw your mug', how: 'Look more than you draw.' }, { step: 'Draw 10 eyes', how: 'From photos.' }], materials: [], video: 'drawing basics', club: '' }
  const s = server({ AI: { run: async (_, input) => ((prompt = input.messages.at(-1).content), { response: JSON.stringify(reply) }) } })
  const r = await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'en', mode: 'plan', title: 'Drawing', about: 'I want to kill myself' } })
  assert.equal(r.status, 200)
  assert.ok(!/kill/.test(prompt), 'their words stay out of the prompt')
  assert.equal(r.data.steps.length, 3)
})

test('a project name about self-harm gets the helpline answer instead of a plan', async () => {
  let called = false
  const s = server({ AI: { run: async () => ((called = true), { response: '{}' }) } })
  const r = await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'en', mode: 'plan', title: 'I want to kill myself' } })
  assert.equal(r.status, 200)
  assert.equal(called, false)
  assert.equal(r.data.crisis, true)
  assert.ok(r.data.answer.length > 20)
})

// A real push subscription's keys, so the reminder can be encrypted like for a phone
async function fakeSubscription() {
  const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey))
  const b64 = (u) => Buffer.from(u).toString('base64url')
  return { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: b64(raw), auth: b64(crypto.getRandomValues(new Uint8Array(16))) } }
}
async function vapidSecret() {
  const k = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])
  return JSON.stringify(await crypto.subtle.exportKey('jwk', k.privateKey))
}

test('the axolotl’s reminder: saved for a time, sent when due, then gone', async () => {
  const { sendDue } = await import('../../worker/blank-reminders.js')
  const s = server({ VAPID_PRIVATE: await vapidSecret() })
  const sub = await fakeSubscription()
  const device = 'device-abcdefghijklmnop'
  const at = Date.now() + 3600e3
  const r = await s.call('POST', '/reminders', { body: { device, project: 'pr_abc', at, step: 'Make a chain of 20', lang: 'hu', sub } })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  // A new time replaces the old one
  await s.call('POST', '/reminders', { body: { device, project: 'pr_abc', at: at + 60e3, step: 'Make a chain of 20', lang: 'hu', sub } })
  assert.equal(s.rows('SELECT * FROM blank_reminders').length, 1)
  assert.ok(!s.rows('SELECT device FROM blank_reminders')[0].device.includes(device), 'only a hash of the device id is kept')

  const sent = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (url, init) => (sent.push({ url, init }), new Response('', { status: 201 }))
  try {
    assert.equal(await sendDue(s.env, Date.now()), 0, 'not due yet')
    assert.equal(await sendDue(s.env, at + 120e3), 1)
  } finally {
    globalThis.fetch = realFetch
  }
  assert.equal(sent[0].url, sub.endpoint)
  assert.equal(sent[0].init.headers['content-encoding'], 'aes128gcm')
  assert.equal(s.rows('SELECT * FROM blank_reminders').length, 0, 'deleted once sent')
})

test('reminders: a cancelled one is never sent, and bad input is refused', async () => {
  const s = server({ VAPID_PRIVATE: await vapidSecret() })
  const sub = await fakeSubscription()
  const device = 'device-abcdefghijklmnop'
  const ok = { device, project: 'pr_abc', at: Date.now() + 60e3, step: 'Step', lang: 'en', sub }
  assert.equal((await s.call('POST', '/reminders', { body: ok })).status, 200)
  assert.equal((await s.call('POST', '/reminders/cancel', { body: { device, project: 'pr_abc' } })).status, 200)
  assert.equal(s.rows('SELECT * FROM blank_reminders').length, 0)
  assert.equal((await s.call('POST', '/reminders', { body: { ...ok, sub: { ...sub, endpoint: 'https://evil.example/x' } } })).status, 400)
  assert.equal((await s.call('POST', '/reminders', { body: { ...ok, at: Date.now() + 40 * 86400e3 } })).status, 400)
  assert.equal((await s.call('POST', '/reminders', { body: { ...ok, device: 'short' } })).status, 400)
  assert.equal((await s.call('POST', '/reminders', { body: { ...ok, step: '' } })).status, 400)
})

test('people search finds names too, with or without accents, and shows mutual friends', async () => {
  const s = server()
  const [me, anna, greta, bela] = [await s.user('me_me'), await s.user('anna'), await s.user('gret'), await s.user('bela')]
  await s.call('PATCH', '/social/me', { token: greta.token, body: { name: 'Grósz Gréta' } })
  // An account from before name search: its search name gets filled in on the first search
  s.env.DB.sqlite.prepare("UPDATE blank_users SET name = 'Béla Kovács', name_key = NULL WHERE id = ?").run(bela.id)
  await s.befriend(me, anna)
  await s.befriend(anna, greta)
  const find = async (q) => (await s.call('GET', `/social/search?q=${encodeURIComponent(q)}`, { token: me.token })).data.users
  assert.deepEqual((await find('greta')).map((u) => u.username), ['gret'])
  assert.deepEqual((await find('Gréta')).map((u) => u.username), ['gret'])
  assert.deepEqual((await find('grosz')).map((u) => u.username), ['gret'])
  assert.deepEqual((await find('@gre')).map((u) => u.username), ['gret'])
  assert.equal((await find('greta'))[0].mutual, 1, 'Anna is a friend of both')
  assert.deepEqual((await find('kovacs')).map((u) => u.username), ['bela'])
  assert.deepEqual(await find('reta'), [], 'a word has to start with what you type')
  // Blocked people never show up
  await s.call('POST', '/social/blocks/gret', { token: me.token })
  assert.deepEqual(await find('greta'), [])
})

test('people you may know: friends of your friends, most mutual first, never your own friends', async () => {
  const s = server()
  const [me, a, b, c, d] = [await s.user('me_me'), await s.user('anna'), await s.user('bela'), await s.user('cili'), await s.user('dani')]
  await s.befriend(me, a)
  await s.befriend(me, b)
  await s.befriend(a, c)
  await s.befriend(b, c)
  await s.befriend(a, d)
  await s.befriend(a, b)
  const known = (await s.call('GET', '/social/known', { token: me.token })).data.users
  assert.deepEqual(known.map((u) => [u.username, u.mutual]), [['cili', 2], ['dani', 1]])
  // Once you've asked them, they're not a suggestion any more
  await s.call('POST', '/social/friends/cili', { token: me.token })
  assert.deepEqual((await s.call('GET', '/social/known', { token: me.token })).data.users.map((u) => u.username), ['dani'])
})

test('posters hear about it: likes (bundled), starts, friend requests, accepts and chat messages', async () => {
  const s = server({ VAPID_PRIVATE: await vapidSecret(), AI: noAI })
  const [anna, bela] = [await s.user('anna'), await s.user('bela')]
  const sub = await fakeSubscription()
  assert.equal((await s.call('POST', '/social/push', { token: anna.token, body: { ...sub, lang: 'hu' } })).status, 200)
  assert.equal((await s.call('POST', '/social/push', { token: anna.token, body: { ...sub, endpoint: 'https://evil.example/x' } })).status, 400)
  const sent = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (url) => (sent.push(url), new Response('', { status: 201 }))
  try {
    await s.call('POST', '/social/friends/anna', { token: bela.token })
    await s.ctx.done()
    assert.equal(sent.length, 1, 'friend request')
    const post = (await s.call('POST', '/social/posts', { token: anna.token, body: { text: 'My scarf', project: 'Scarf', visibility: 'public', photo: PHOTO } })).data.post
    await s.call('POST', `/social/posts/${post.id}/like`, { token: bela.token })
    await s.call('DELETE', `/social/posts/${post.id}/like`, { token: bela.token })
    await s.call('POST', `/social/posts/${post.id}/like`, { token: bela.token })
    await s.ctx.done()
    assert.equal(sent.length, 2, 'a like, and liking again within the hour is not a second notification')
    await s.call('POST', `/social/posts/${post.id}/start`, { token: bela.token, body: {} })
    await s.ctx.done()
    assert.equal(sent.length, 3, 'someone started a project because of the post')
    await s.call('POST', '/social/friends/bela', { token: anna.token })
    const chat = (await s.call('POST', '/social/chats', { token: bela.token, body: { with: ['anna'] } })).data.id
    await s.call('POST', `/social/chats/${chat}/messages`, { token: bela.token, body: { text: 'Nice scarf!' } })
    await s.ctx.done()
    assert.equal(sent.length, 4, 'a chat message (Anna accepting doesn’t notify Anna herself)')
  } finally {
    globalThis.fetch = realFetch
  }
})

test('the admin sees new people’s first posts until they cheer them', async () => {
  const s = server({ AI: noAI })
  const [admin, anna] = [await s.user('greta'), await s.user('anna')]
  s.env.DB.sqlite.prepare('UPDATE blank_users SET admin = 1 WHERE id = ?').run(admin.id)
  const first = (await s.call('POST', '/social/posts', { token: anna.token, body: { text: 'first!', visibility: 'public' } })).data.post
  await s.call('POST', '/social/posts', { token: anna.token, body: { text: 'second', visibility: 'public' } })
  let r = await s.call('GET', '/social/admin', { token: admin.token })
  assert.deepEqual(r.data.firstPosts.map((p) => p.id), [first.id])
  await s.call('POST', `/social/posts/${first.id}/like`, { token: admin.token })
  r = await s.call('GET', '/social/admin', { token: admin.token })
  assert.deepEqual(r.data.firstPosts, [])
})

test('the photo check counts the real tokens Moondream reports, not the guess', async () => {
  const { withLimits } = await import('../../worker/limits.js')
  const { makeDB } = await import('./d1.mjs')
  const DB = makeDB()
  const counted = async () => (await DB.prepare("SELECT n FROM usage WHERE key = 'ai_neurons'").first()).n
  const reply = (input_tokens) => ({ run: async () => ({ answer: 'NO', metrics: { input_tokens, output_tokens: 1 } }) })
  const input = { task: 'query', image: 'data:image/jpeg;base64,AAAA', question: 'ok?', max_tokens: 5 }
  // 1,000 tokens: less than the 2,000 reserved, so the counter goes down to the real ~27 neurons
  await withLimits({ DB, AI: reply(1000) }).AI.run('@cf/moondream/moondream3.1-9B-A2B', input)
  const one = ((1000 * 0.3 + 1) / 1e6) * (1000 / 0.011)
  assert.ok(Math.abs((await counted()) - one) < 0.01)
  // 10,000 tokens: more than reserved, and the extra is still counted
  await withLimits({ DB, AI: reply(10000) }).AI.run('@cf/moondream/moondream3.1-9B-A2B', input)
  const two = ((10000 * 0.3 + 1) / 1e6) * (1000 / 0.011)
  assert.ok(Math.abs((await counted()) - one - two) < 0.01)
})

test('a check-in in a chat carries the steps, so a friend sees how far you are', async () => {
  const s = server({ AI: noAI })
  const a = await s.user('anna')
  const b = await s.user('bela')
  await s.befriend(a, b)
  const dm = (await s.call('POST', '/social/chats', { token: a.token, body: { with: ['bela'] } })).data.id
  const steps = [{ text: 'Make a slip knot', done: true }, { text: 'Crochet 20 chains', done: true }, { text: 'Crochet a small octopus', done: false }]
  const r = await s.call('POST', `/social/chats/${dm}/messages`, {
    token: a.token,
    body: { kind: 'checkin', project: 'Crochet an octopus', category: 'crafts', text: '', steps, last: 'Crochet 20 chains', lang: 'en', guide: null },
  })
  assert.equal(r.status, 200)
  const seen = (await s.call('GET', `/social/chats/${dm}`, { token: b.token })).data.messages.at(-1)
  assert.deepEqual(seen.progress, { done: 2, total: 3, last: 'Crochet 20 chains', steps, lang: 'en', guide: null })
  // A plain text message has no progress, and an old-style check-in without steps still works
  await s.call('POST', `/social/chats/${dm}/messages`, { token: a.token, body: { kind: 'checkin', project: 'Old one', category: 'art' } })
  const old = (await s.call('GET', `/social/chats/${dm}`, { token: b.token })).data.messages.at(-1)
  assert.equal(old.progress, null)
})

test('a plan that comes back in the wrong language gets one more try, and the right one is used', async () => {
  const en = { ok: true, category: 'fitness', steps: [1, 2, 3, 4, 5, 6].map((i) => ({ step: `Bounce the ball ${i * 10} times with your weaker hand`, how: 'Use your fingertips and look up.' })), materials: [], video: 'x', club: '' }
  const hu = { ...en, steps: [1, 2, 3, 4, 5, 6].map((i) => ({ step: `Pattogtasd a labdát ${i * 10}-szer a gyengébbik kezeddel`, how: 'Ujjbeggyel érj a labdához.' })) }
  const prompts = []
  const s = server({ AI: { run: async (_, input) => (prompts.push(input.messages.at(-1).content), { response: JSON.stringify(prompts.length === 1 ? en : hu) }) } })
  const r = await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'hu', mode: 'plan', title: 'Kosárlabda' } })
  assert.equal(r.status, 200)
  assert.equal(prompts.length, 2)
  assert.match(prompts[1], /in Hungarian .* only/)
  assert.match(r.data.steps[0].text, /Pattogtasd/)
})

test('a good plan is not asked for twice', async () => {
  const hu = { ok: true, category: 'fitness', steps: [1, 2, 3, 4, 5, 6].map((i) => ({ step: `Pattogtasd a labdát ${i * 10}-szer`, how: 'Ujjbeggyel érj a labdához.' })), materials: [], video: 'x', club: '' }
  let n = 0
  const s = server({ AI: { run: async () => (n++, { response: JSON.stringify(hu) }) } })
  assert.equal((await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'hu', mode: 'plan', title: 'Kosárlabda' } })).status, 200)
  assert.equal(n, 1)
})

test('chat photos, replies, reactions, unsending and "seen"', async () => {
  const s = server({ AI: noAI })
  const a = await s.user('anna')
  const b = await s.user('bela')
  const c = await s.user('csilla')
  await s.befriend(a, b)
  const dm = (await s.call('POST', '/social/chats', { token: a.token, body: { with: ['bela'] } })).data.id
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
  const pic = await s.call('PUT', `/social/chats/${dm}/photo?text=${encodeURIComponent('My scarf so far')}&ratio=1.25`, { token: a.token, raw: jpeg, type: 'image/jpeg' })
  assert.equal(pic.status, 200, JSON.stringify(pic.data))
  assert.equal(pic.data.message.photo, true)
  assert.equal(pic.data.message.ratio, 1.25)
  const id = pic.data.message.id
  assert.equal((await s.call('GET', `/social/messages/${id}/photo`, { token: b.token })).status, 200)
  // Not in the chat: no photo
  assert.equal((await s.call('GET', `/social/messages/${id}/photo`, { token: c.token })).status, 404)

  // Bela answers that photo and reacts to it
  const t0 = (await s.call('GET', `/social/chats/${dm}`, { token: a.token })).data.now
  const re = await s.call('POST', `/social/chats/${dm}/messages`, { token: b.token, body: { text: 'So cozy!', reply: id } })
  assert.deepEqual(re.data.message.reply, { id, mine: false, name: '@anna', text: 'My scarf so far', photo: true, kind: 'text', removed: false })
  assert.equal((await s.call('POST', `/social/messages/${id}/react`, { token: b.token, body: { emoji: '🔥' } })).status, 200)
  assert.equal((await s.call('POST', `/social/messages/${id}/react`, { token: b.token, body: { emoji: 'lol' } })).status, 400)
  // Anna's open chat picks up the new message and the reaction on her older one, and sees Bela has read it
  const poll = (await s.call('GET', `/social/chats/${dm}?after=${t0 - 3000}`, { token: a.token })).data
  assert.deepEqual(poll.messages.find((x) => x.id === id).reactions, [{ emoji: '🔥', n: 1, me: false }])
  assert.equal(poll.messages.find((x) => x.text === 'So cozy!').reply.mine, true)
  assert.ok(poll.seen >= pic.data.message.created)
  // A reply to a message from another chat isn't a reply
  await s.befriend(a, c)
  const other = (await s.call('POST', '/social/chats', { token: a.token, body: { with: ['csilla'] } })).data.id
  const stray = await s.call('POST', `/social/chats/${other}/messages`, { token: a.token, body: { text: 'hi', reply: id } })
  assert.equal(stray.data.message.reply, undefined)

  // Anna unsends the photo: gone for both, the photo too, and Bela's reply quotes nothing
  assert.equal((await s.call('DELETE', `/social/messages/${id}`, { token: b.token })).status, 404)
  assert.equal((await s.call('DELETE', `/social/messages/${id}`, { token: a.token })).status, 200)
  const after = (await s.call('GET', `/social/chats/${dm}`, { token: b.token })).data.messages
  const gone = after.find((x) => x.id === id)
  assert.equal(gone.unsent, true)
  assert.equal(gone.photo, undefined)
  assert.equal(after.find((x) => x.text === 'So cozy!').reply.removed, true)
  assert.equal((await s.call('GET', `/social/messages/${id}/photo`, { token: b.token })).status, 404)
  assert.equal(await s.env.PHOTOS.get(`m/${id}`), null)
})

test('a chat photo the check doesn’t clearly pass is refused, and one it can’t check is not sent', async () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
  for (const [AI, status, error] of [
    [{ run: async () => ({ answer: 'YES' }) }, 422, 'photo_rejected'],
    [{ run: async () => { throw new Error('down') } }, 503, 'photo_check'],
  ]) {
    const s = server({ AI })
    const a = await s.user('anna')
    const b = await s.user('bela')
    await s.befriend(a, b)
    const dm = (await s.call('POST', '/social/chats', { token: a.token, body: { with: ['bela'] } })).data.id
    const r = await s.call('PUT', `/social/chats/${dm}/photo`, { token: a.token, raw: jpeg, type: 'image/jpeg' })
    assert.equal(r.status, status)
    assert.equal(r.data.error, error)
    assert.equal(s.rows('SELECT * FROM blank_messages').length, 0)
  }
})

test('only creations go to everyone: text-only and photos of nothing made are shown to friends only', async () => {
  const s = server({ AI: vision(false) })
  const a = await s.user('anna')
  await s.call('POST', '/social/me/rules', { token: a.token })
  const post = (body) => s.call('POST', '/social/posts', { token: a.token, body: { visibility: 'public', ...body } })
  const text = await post({ text: 'just text' })
  assert.equal(text.status, 200)
  assert.equal(text.data.post.visibility, 'friends', 'no photo')
  const meme = await post({ text: 'lol', photo: PHOTO })
  assert.equal(meme.data.post.visibility, 'friends', 'a photo of nothing anyone made')
  assert.equal(meme.data.post.status, 'ok', 'still posted, only to friends')
  const shot = await post({ text: 'my best photo', photo: PHOTO, category: 'photo' })
  assert.equal(shot.data.post.visibility, 'public', 'for photography the photo is the thing they made')
  const several = (await post({ text: 'two photos', media: [{ ratio: 1 }, { ratio: 1 }] })).data.post
  for (const n of [0, 1]) await s.call('PUT', `/social/posts/${several.id}/media/${n}`, { token: a.token, raw: new Uint8Array([1]), type: 'image/jpeg' })
  assert.equal((await s.call('POST', `/social/posts/${several.id}/publish`, { token: a.token })).data.post.visibility, 'friends')
})

test('a photo of something made stays public, and the real AI answer (result.answer) is read', async () => {
  let questions = 0
  const ai = vision(true)
  const s = server({ AI: { run: async (m, input) => (questions++, ai.run(m, input)) } })
  const a = await s.user('anna')
  await s.call('POST', '/social/me/rules', { token: a.token })
  const r = await s.call('POST', '/social/posts', { token: a.token, body: { text: 'my scarf', photo: PHOTO, visibility: 'public' } })
  assert.equal(r.data.post.status, 'ok', 'the safety answer NO was read: not held for review')
  assert.equal(r.data.post.visibility, 'public')
  assert.equal(questions, 2, 'safety check + creation check')
  const f = await s.call('POST', '/social/posts', { token: a.token, body: { text: 'for friends', photo: PHOTO, visibility: 'friends' } })
  assert.equal(f.data.post.status, 'ok')
  assert.equal(questions, 3, 'friends-only posts skip the creation check')
})

test('a plan made of placeholders ("the basic skill") is asked for again with the real names', async () => {
  const vague = { ok: true, category: 'fitness', steps: ['Watch a video about the basics', 'Practise the basic skill 30 times', 'Do the basic skill 20 times in a row', 'Learn the technique', 'Skate for 10 minutes', 'Film one run'].map((x) => ({ step: x, how: 'Go slowly and stay relaxed.' })), materials: [], video: 'x', club: '' }
  const good = { ...vague, steps: ['Stand on the board for 2 minutes on grass', 'Push 10 metres and stop with your back foot', 'Do 20 kick turns', 'Roll down a gentle slope 5 times', 'Do 10 ollies on grass', 'Film one clean run'].map((x) => ({ step: x, how: 'Knees bent, eyes ahead.' })) }
  const prompts = []
  const s = server({ AI: { run: async (_, input) => (prompts.push(input.messages.at(-1).content), { response: JSON.stringify(prompts.length === 1 ? vague : good) }) } })
  const r = await s.call('POST', '/ask', { body: { device: 'device-abcdefghijklmnop', lang: 'en', mode: 'plan', title: 'Skateboarding' } })
  assert.equal(prompts.length, 2)
  assert.match(prompts[1], /real technique/)
  assert.equal(r.data.steps[1].text, 'Push 10 metres and stop with your back foot')
})

test('search works from the first letter, ignores @ and case; same plans finds public posters of your plan', async () => {
  const s = server({ AI: noAI })
  const [greta, gabi, lilla] = [await s.user('greta'), await s.user('gabi'), await s.user('lilla')]
  const found = async (q) => (await s.call('GET', `/social/search?q=${encodeURIComponent(q)}`, { token: lilla.token })).data.users.map((u) => u.username).sort()
  assert.deepEqual(await found('g'), ['gabi', 'greta'])
  assert.deepEqual(await found('@G'), ['gabi', 'greta'])
  assert.deepEqual(await found('GRE'), ['greta'])
  for (const u of [greta, gabi]) await s.call('POST', '/social/me/rules', { token: u.token })
  await s.call('POST', '/social/posts', { token: greta.token, body: { text: 'my scarf', photo: PHOTO, visibility: 'public', project: 'Knit a simple scarf', guide: 'scarf' } })
  await s.call('POST', '/social/posts', { token: gabi.token, body: { text: 'secret frog', photo: PHOTO, visibility: 'friends', project: 'Crochet a frog' } })
  const same = await s.call('GET', '/social/sameplans?guides=scarf&titles=crochet%20a%20frog', { token: lilla.token })
  assert.deepEqual(same.data.users.map((u) => [u.username, u.plan]), [['greta', 'Knit a simple scarf']], 'friends-only posts never show up')
})

test('a result made from someone’s post shows under it and counts as "made because of you"', async () => {
  const s = server({ AI: noAI })
  const a = await s.user('anna')
  const b = await s.user('bela')
  await s.befriend(a, b)
  const src = (await s.call('POST', '/social/posts', { token: a.token, body: { kind: 'finish', project: 'Sock monkey', text: 'My sock monkey', visibility: 'friends' } })).data.post
  const res = await s.call('POST', '/social/posts', { token: b.token, body: { kind: 'finish', project: 'Sock monkey', text: 'Mine!', visibility: 'friends', madeFrom: src.id } })
  assert.equal(res.data.post.madeFrom, src.id)
  // Your own post can't be "made from" itself
  const own = await s.call('POST', '/social/posts', { token: a.token, body: { kind: 'finish', text: 'Again', madeFrom: src.id } })
  assert.equal(own.data.post.madeFrom, null)
  const after = (await s.call('GET', `/social/posts/${src.id}`, { token: a.token })).data.post
  assert.equal(after.made, 1)
  const made = (await s.call('GET', `/social/posts/${src.id}/made`, { token: a.token })).data.posts
  assert.deepEqual(made.map((p) => p.text), ['Mine!'])
})

test('comments: anyone who can see the post, the author can delete any and turn them off, reports hide one', async () => {
  const s = server({ AI: noAI })
  const a = await s.user('anna')
  const b = await s.user('bela')
  const c = await s.user('csilla')
  const d = await s.user('dora')
  await s.befriend(a, b)
  const post = (await s.call('POST', '/social/posts', { token: a.token, body: { kind: 'update', text: 'Day 3 of my scarf', visibility: 'friends' } })).data.post
  // Not a friend: can't see a friends-only post, so can't comment
  assert.equal((await s.call('POST', `/social/posts/${post.id}/comments`, { token: c.token, body: { text: 'hi' } })).status, 404)
  const r = await s.call('POST', `/social/posts/${post.id}/comments`, { token: b.token, body: { text: 'Love the colours!' } })
  assert.equal(r.status, 200)
  assert.equal(r.data.comment.canDelete, true)
  const list = (await s.call('GET', `/social/posts/${post.id}/comments`, { token: a.token })).data.comments
  assert.equal(list.length, 1)
  assert.equal(list[0].canDelete, true) // the author may delete it
  assert.equal((await s.call('GET', `/social/posts/${post.id}`, { token: a.token })).data.post.comments, 1)
  // Turned off: others can't comment any more
  await s.call('PATCH', `/social/posts/${post.id}`, { token: a.token, body: { commentsOff: true } })
  assert.equal((await s.call('POST', `/social/posts/${post.id}/comments`, { token: b.token, body: { text: 'more' } })).data.error, 'comments_off')
  await s.call('PATCH', `/social/posts/${post.id}`, { token: a.token, body: { commentsOff: false } })
  // Bad words are refused
  assert.equal((await s.call('POST', `/social/posts/${post.id}/comments`, { token: b.token, body: { text: 'fuck you' } })).status, 422)
  // Three reports from different people hide a comment
  await s.befriend(a, c)
  await s.befriend(a, d)
  const pub = (await s.call('POST', '/social/posts', { token: a.token, body: { kind: 'update', text: 'Another one', visibility: 'friends' } })).data.post
  const bad = (await s.call('POST', `/social/posts/${pub.id}/comments`, { token: c.token, body: { text: 'meh' } })).data.comment
  for (const x of [a, b, d]) assert.equal((await s.call('POST', `/social/comments/${bad.id}/report`, { token: x.token, body: { reason: 'mean' } })).status, 200)
  assert.equal((await s.call('GET', `/social/posts/${pub.id}/comments`, { token: a.token })).data.comments.length, 0)
  // The author deletes a comment under their post
  assert.equal((await s.call('DELETE', `/social/comments/${list[0].id}`, { token: a.token })).status, 200)
  assert.equal((await s.call('GET', `/social/posts/${post.id}/comments`, { token: a.token })).data.comments.length, 0)
})

test('chat step 2: typing shows for a few seconds, posts and plans can be sent as cards, quiet checks write nothing', async () => {
  const s = server({ AI: noAI })
  const [anna, bela] = [await s.user('anna'), await s.user('bela')]
  await s.befriend(anna, bela)
  const chat = (await s.call('POST', '/social/chats', { token: anna.token, body: { with: ['bela'] } })).data.id
  assert.equal((await s.call('POST', `/social/chats/${chat}/typing`, { token: anna.token })).status, 200)
  const seenByBela = await s.call('GET', `/social/chats/${chat}`, { token: bela.token })
  assert.deepEqual(seenByBela.data.typing, ['@anna'])
  assert.deepEqual((await s.call('GET', `/social/chats/${chat}`, { token: anna.token })).data.typing, [], 'not your own')
  // A quiet check (nothing new from the others) doesn't save "read" again
  const readAt = () => s.rows('SELECT read_at FROM blank_chat_members WHERE chat_id = ? AND user_id = ?', chat, bela.id)[0].read_at
  const before = readAt()
  await s.call('GET', `/social/chats/${chat}?after=${Date.now() - 1000}`, { token: bela.token })
  assert.equal(readAt(), before)
  // A plan as a card
  const plan = await s.call('POST', `/social/chats/${chat}/messages`, {
    token: anna.token,
    body: { kind: 'share', text: 'do this with me?', share: { type: 'plan', title: 'Crochet a frog', category: 'crafts', steps: ['Get yarn', 'Make a magic ring'], lang: 'en' } },
  })
  assert.equal(plan.status, 200)
  assert.equal(plan.data.message.share.type, 'plan')
  assert.equal(plan.data.message.share.total, 2)
  // A post only if you may see it: Bela's friends-only post can't be sent by a stranger
  await s.call('POST', '/social/me/rules', { token: bela.token })
  const post = (await s.call('POST', '/social/posts', { token: bela.token, body: { text: 'my frog', photo: PHOTO, visibility: 'friends', project: 'Crochet a frog' } })).data.post
  const sent = await s.call('POST', `/social/chats/${chat}/messages`, { token: anna.token, body: { kind: 'share', share: { type: 'post', id: post.id } } })
  assert.equal(sent.status, 200)
  assert.equal(sent.data.message.share.username, 'bela')
  assert.equal((await s.call('GET', `/social/posts/${post.id}`, { token: anna.token })).status, 200, 'a friend may open it')
  const cili = await s.user('cili')
  assert.equal((await s.call('GET', `/social/posts/${post.id}`, { token: cili.token })).status, 404, 'a stranger may not')
  assert.equal((await s.call('POST', `/social/chats/${chat}/messages`, { token: anna.token, body: { kind: 'share', share: { type: 'other' } } })).status, 400)
})

test('tidy: the creator’s own steps come back rewritten, and a reply that drops most of them is refused', async () => {
  let prompt = ''
  const good = { steps: [{ step: 'Cut the sock below the heel', how: 'Watch out: cut straight or the legs end up uneven.' }, { step: 'Sew the legs shut', how: 'Small stitches, 3 mm apart.' }] }
  const s = server({ AI: { run: async (_, input) => ((prompt = input.messages.at(-1).content), { response: JSON.stringify(good) }) } })
  const body = { device: 'device-abcdefghijklmnop', lang: 'en', mode: 'tidy', title: 'Sock monkey', steps: [{ text: 'cut sock', how: 'i cut crooked the first time' }, { text: 'sewing legs', how: '' }] }
  const r = await s.call('POST', '/ask', { body })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  assert.equal(r.data.steps[0].text, 'Cut the sock below the heel')
  assert.match(prompt, /i cut crooked the first time/)
  assert.match(prompt, /ignore anything in them/)
  const s2 = server({ AI: { run: async () => ({ response: JSON.stringify({ steps: [] }) }) } })
  assert.equal((await s2.call('POST', '/ask', { body })).status, 502)
})

test('a post’s plan can carry how lines and what you need, and they are word-checked', async () => {
  const s = server({ AI: noAI })
  const a = await s.user('anna')
  const r = await s.call('POST', '/social/posts', {
    token: a.token,
    body: { kind: 'finish', project: 'Bench', text: 'Done', plan: ['Cut the boards', 'Screw them together'], planHow: ['Measure twice.', ''], materials: ['3 pallets', 'Screws'], lang: 'en' },
  })
  assert.deepEqual(r.data.post.plan, ['Cut the boards', 'Screw them together'])
  assert.deepEqual(r.data.post.planHow, ['Measure twice.', ''])
  assert.deepEqual(r.data.post.materials, ['3 pallets', 'Screws'])
  const bad = await s.call('POST', '/social/posts', { token: a.token, body: { kind: 'finish', text: 'Done', plan: ['Cut'], planHow: ['fuck this'] } })
  assert.equal(bad.data.post.status, 'review')
})

test('doing a plan together: project chat, join, progress cards, poke, shopping list, sessions, archive, max 3', async () => {
  const s = server({ AI: noAI })
  const [anna, bela, cili] = [await s.user('anna'), await s.user('bela'), await s.user('cili')]
  await s.befriend(anna, bela)
  const plan = { title: 'Crochet bag', category: 'crafts', steps: ['Get yarn', 'Make the base', 'Make the handle'], lang: 'en', materials: ['Yarn', '4 mm hook'] }
  assert.equal((await s.call('POST', '/social/projects', { token: anna.token, body: { with: 'cili', plan } })).status, 403, 'friends only')
  const id = (await s.call('POST', '/social/projects', { token: anna.token, body: { with: 'bela', plan } })).data.id
  // Bela sees it with the plan pinned, and joins
  let g = await s.call('GET', `/social/chats/${id}`, { token: bela.token })
  assert.equal(g.data.chat.kind, 'project')
  assert.equal(g.data.project.plan.steps.length, 3)
  assert.deepEqual(g.data.project.items.map((i) => i.text), ['Yarn', '4 mm hook'])
  assert.equal(g.data.project.people.find((p) => p.me).joined, false)
  assert.equal((await s.call('POST', `/social/chats/${id}/join`, { token: bela.token })).data.plan.title, 'Crochet bag')
  // The friend chat shows the active project as a chip
  const dm = (await s.call('POST', '/social/chats', { token: anna.token, body: { with: ['bela'] } })).data.id
  assert.deepEqual((await s.call('GET', `/social/chats/${dm}`, { token: anna.token })).data.projects.map((p) => p.name), ['Crochet bag'])
  // Progress: a card when a step gets done, none when nothing new
  await s.call('POST', `/social/chats/${id}/progress`, { token: anna.token, body: { done: 1, total: 3, step: 'Get yarn' } })
  await s.call('POST', `/social/chats/${id}/progress`, { token: anna.token, body: { done: 1, total: 3, step: 'Get yarn' } })
  g = await s.call('GET', `/social/chats/${id}`, { token: bela.token })
  const cards = g.data.messages.filter((x) => x.kind === 'progress')
  assert.equal(cards.length, 1)
  assert.deepEqual([cards[0].info.done, cards[0].info.step], [1, 'Get yarn'])
  // Shopping list: Bela claims the yarn; Anna can't take it from her
  const yarn = g.data.project.items.find((i) => i.text === 'Yarn').id
  await s.call('PATCH', `/social/chats/${id}/items/${yarn}`, { token: bela.token, body: { claim: true } })
  const after = (await s.call('PATCH', `/social/chats/${id}/items/${yarn}`, { token: anna.token, body: { claim: true, bought: true } })).data.project
  const item = after.items.find((i) => i.id === yarn)
  assert.equal(item.claimedBy.username, 'bela')
  assert.equal(item.bought, true)
  // A session with a reminder 30 minutes before (cron)
  const at = Date.now() + 20 * 60_000
  assert.equal((await s.call('POST', `/social/chats/${id}/sessions`, { token: anna.token, body: { at, place: 'Library' } })).status, 200)
  const { sendSessionReminders } = await import('../../worker/blank-together.js')
  await sendSessionReminders(s.env)
  assert.equal(s.rows('SELECT reminded FROM blank_chat_sessions WHERE chat_id = ?', id)[0].reminded, 1)
  // Poke: not yet (Bela just joined); after 3 quiet days, once a day
  assert.equal((await s.call('POST', `/social/chats/${id}/poke`, { token: anna.token })).status, 409)
  s.env.DB.sqlite.prepare('UPDATE blank_chat_members SET progress_at = progress_at - 4 * 86400000, joined = joined - 4 * 86400000 WHERE chat_id = ? AND user_id = ?').run(id, bela.id)
  assert.equal((await s.call('POST', `/social/chats/${id}/poke`, { token: anna.token })).status, 200)
  assert.equal((await s.call('POST', `/social/chats/${id}/poke`, { token: anna.token })).status, 409, 'once a day')
  // Both finish: archived
  await s.call('POST', `/social/chats/${id}/progress`, { token: anna.token, body: { done: 3, total: 3, step: 'Make the handle' } })
  assert.equal((await s.call('GET', '/social/chats', { token: anna.token })).data.chats.find((c) => c.id === id).archived, 0)
  await s.call('POST', `/social/chats/${id}/progress`, { token: bela.token, body: { done: 3, total: 3, step: 'Make the handle' } })
  assert.ok((await s.call('GET', '/social/chats', { token: anna.token })).data.chats.find((c) => c.id === id).archived > 0)
  // At most 3 active projects with the same friend
  for (let i = 0; i < 3; i++) assert.equal((await s.call('POST', '/social/projects', { token: anna.token, body: { with: 'bela', plan: { ...plan, title: `Plan ${i}` } } })).status, 200)
  assert.equal((await s.call('POST', '/social/projects', { token: bela.token, body: { with: 'anna', plan } })).status, 409)
  // Blocking ends it: the project chat is gone for the blocked one
  await s.call('POST', '/social/blocks/anna', { token: bela.token })
  assert.equal((await s.call('GET', `/social/chats/${id}`, { token: anna.token })).status, 404)
})

test('safety: only friends by default, requests only if turned on (16+), one text message until accepted', async () => {
  const s = server({ AI: noAI })
  const [anna, bela, kid] = [await s.user('anna'), await s.user('bela'), await s.user('kidd')]
  const year = new Date().getUTCFullYear()
  // Off by default: a stranger can't write
  assert.equal((await s.call('POST', '/social/requests/bela', { token: anna.token, body: { text: 'hi!' } })).data.error, 'requests_off')
  assert.equal((await s.call('POST', '/social/chats', { token: anna.token, body: { with: ['bela'] } })).status, 403, 'and no chat without being friends')
  // Under 16 can't turn requests on; without a year it asks for one
  assert.equal((await s.call('PATCH', '/social/me', { token: kid.token, body: { requests: true } })).data.error, 'need_year')
  assert.equal((await s.call('PATCH', '/social/me', { token: kid.token, body: { requests: true, birthYear: year - 14 } })).data.error, 'too_young')
  assert.equal((await s.call('GET', '/social/me', { token: kid.token })).data.requests, false)
  assert.equal((await s.call('PATCH', '/social/me', { token: bela.token, body: { requests: true, birthYear: year - 17 } })).data.requests, true)
  assert.equal((await s.call('GET', '/social/users/bela', { token: anna.token })).data.requestsOpen, true)
  // One message, then wait; no photos
  const id = (await s.call('POST', '/social/requests/bela', { token: anna.token, body: { text: 'love your frog! how did you start?' } })).data.id
  assert.equal((await s.call('POST', `/social/chats/${id}/messages`, { token: anna.token, body: { text: 'hello??' } })).data.error, 'request_pending')
  assert.equal((await s.call('POST', '/social/requests/bela', { token: anna.token, body: { text: 'again' } })).status, 409)
  // Bela sees it in Requests, not in the normal unread count
  const unread = (await s.call('GET', '/social/chats/unread', { token: bela.token })).data
  assert.deepEqual([unread.n, unread.messageRequests], [0, 1])
  assert.equal((await s.call('GET', '/social/chats', { token: bela.token })).data.chats[0].request, 'received')
  // Answering accepts it; then Anna may write again
  assert.equal((await s.call('POST', `/social/chats/${id}/messages`, { token: bela.token, body: { text: 'thanks! a youtube video' } })).status, 200)
  assert.equal((await s.call('POST', `/social/chats/${id}/messages`, { token: anna.token, body: { text: 'cool, thanks' } })).status, 200)
  // Declining deletes it; blocking stops new ones
  const cili = await s.user('cili')
  const id2 = (await s.call('POST', '/social/requests/bela', { token: cili.token, body: { text: 'hey' } })).data.id
  assert.equal((await s.call('POST', `/social/chats/${id2}/decline`, { token: bela.token })).status, 200)
  assert.equal(s.rows('SELECT * FROM blank_chats WHERE id = ?', id2).length, 0)
  await s.call('POST', '/social/blocks/cili', { token: bela.token })
  assert.equal((await s.call('POST', '/social/requests/bela', { token: cili.token, body: { text: 'hey again' } })).status, 404)
})
