// Calls the Worker's Blank routes the way the app does
import { blank } from '../../worker/blank.js'
import { makeEnv } from './d1.mjs'

export function server(extra) {
  const { env, ctx } = makeEnv(extra)
  const call = async (method, path, { body, token, origin, raw, type } = {}) => {
    const url = new URL(`https://gretagrosz.com/blank/api${path}`)
    const headers = {}
    if (token) headers.authorization = `Bearer ${token}`
    if (origin) headers.origin = origin
    if (body !== undefined || raw !== undefined) headers['content-type'] = type || 'application/json'
    const req = new Request(url, { method, headers, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) })
    const res = await blank(req, env, ctx, url)
    const text = await res.text()
    let data = null
    try {
      data = JSON.parse(text)
    } catch {}
    return { status: res.status, data }
  }
  // A new account, logged in, with the rules accepted
  const user = async (username) => {
    const r = await call('POST', '/account/signup', { body: { username, password: 'correct horse battery' } })
    if (r.status !== 200) throw new Error(`signup ${username}: ${r.status} ${JSON.stringify(r.data)}`)
    await call('POST', '/social/me/rules', { token: r.data.token })
    const id = env.DB.sqlite.prepare('SELECT id FROM blank_users WHERE username = ?').get(username).id
    return { username, token: r.data.token, id }
  }
  // Friends right away, through a's invite link
  const befriend = async (a, b) => {
    const { data } = await call('GET', '/social/invite', { token: a.token })
    const r = await call('POST', `/social/friends/${a.username}`, { token: b.token, body: { invite: data.code } })
    if (r.data?.relation !== 'friends') throw new Error('befriend failed')
  }
  const rows = (sql, ...p) => env.DB.sqlite.prepare(sql).all(...p)
  return { env, ctx, call, user, befriend, rows }
}
