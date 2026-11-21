// A stand-in for Cloudflare D1 on Node's built-in SQLite, with all of Blank's migrations applied, so the Worker's
// real SQL runs in the tests. Same API as D1: prepare().bind().first()/all()/run(), and batch() as one transaction.
import { DatabaseSync } from 'node:sqlite'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const MIGRATIONS = fileURLToPath(new URL('../../worker/migrations/', import.meta.url))

export function makeDB() {
  const sqlite = new DatabaseSync(':memory:')
  for (const f of readdirSync(MIGRATIONS).filter((f) => /^0\d+_blank_.*\.sql$/.test(f)).sort()) sqlite.exec(readFileSync(MIGRATIONS + f, 'utf8'))
  // limits.js keeps its counters here; created on first use in production
  sqlite.exec('CREATE TABLE IF NOT EXISTS usage (period TEXT NOT NULL, key TEXT NOT NULL, n REAL NOT NULL DEFAULT 0, warned INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (period, key))')

  // D1 accepts numbered parameters used more than once (?3 … ?3); Node's SQLite doesn't, so spell them out as plain ?
  const numbered = (sql, p) => {
    if (!/\?\d/.test(sql)) return [sql, p]
    const out = []
    return [sql.replace(/\?(\d+)/g, (_, n) => (out.push(p[n - 1]), '?')), out]
  }
  const statement = (rawSql, rawParams = []) => {
    const [sql, params] = numbered(rawSql, rawParams)
    return {
    sql,
    params,
    bind: (...p) => statement(rawSql, p.map((v) => (typeof v === 'boolean' ? Number(v) : v === undefined ? null : v))),
    first() {
      return Promise.resolve(sqlite.prepare(sql).get(...params) ?? null)
    },
    all() {
      return Promise.resolve({ results: sqlite.prepare(sql).all(...params), success: true })
    },
    run() {
      const r = sqlite.prepare(sql).run(...params)
      return Promise.resolve({ success: true, meta: { changes: Number(r.changes) } })
    },
    // inside batch(): SELECTs give rows, everything else its changes
    exec() {
      const s = sqlite.prepare(sql)
      if (/^\s*(select|with)\b/i.test(sql) || /\breturning\b/i.test(sql)) return { results: s.all(...params), success: true }
      return { success: true, meta: { changes: Number(s.run(...params).changes) } }
    },
  }
  }
  return {
    sqlite,
    prepare: (sql) => statement(sql),
    async batch(list) {
      sqlite.exec('BEGIN')
      try {
        const out = list.map((s) => s.exec())
        sqlite.exec('COMMIT')
        return out
      } catch (e) {
        sqlite.exec('ROLLBACK')
        throw e
      }
    },
  }
}

// R2 in memory
export function makeBucket() {
  const store = new Map()
  return {
    store,
    async put(key, body, opts) {
      store.set(key, { body, httpMetadata: opts?.httpMetadata })
    },
    async get(key) {
      const o = store.get(key)
      return o ? { body: o.body, httpMetadata: o.httpMetadata } : null
    },
    async delete(keys) {
      for (const k of [].concat(keys)) store.delete(k)
    },
    async list({ prefix = '' } = {}) {
      return { objects: [...store.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })), truncated: false }
    },
  }
}

export function makeEnv(extra = {}) {
  const waits = []
  return {
    env: { DB: makeDB(), PHOTOS: makeBucket(), ...extra },
    ctx: { waitUntil: (p) => waits.push(p), done: () => Promise.allSettled(waits) },
  }
}
