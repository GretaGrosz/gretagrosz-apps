// Hard limits, so gretagrosz.com stays inside the free tiers and never runs up a bill.
// Every service that could cost money goes through here: Workers AI (every app's AI calls), R2 (Blank's photos)
// and Resend (Blank's emails). Each has a ceiling a little UNDER the free amount; at the ceiling that feature pauses
// (an AI answer says "try later", a photo upload says "storage full", an email isn't sent) instead of costing money.
// When a counter passes 80% of its ceiling, one warning email goes to ALERT_EMAIL (a secret: npx wrangler secret put
// ALERT_EMAIL), or to every Blank admin with an email if it isn't set, so Greta always hears about it first. Counters reset with Cloudflare's own counts (00:00 UTC, 1st of the month).
//
//   what                  free (Oct 2026)        ceiling here
//   Workers AI            10,000 neurons/day     9,000 / day     estimated per call on the high side (see estimate()), then corrected to the real token count when the model reports it
//   R2 storage            10 GB                  9 GB            every byte uploaded, minus what is deleted
//   R2 Class A (uploads)  1,000,000 / month      900,000 / month put and list
//   R2 Class B (loads)    10,000,000 / month     9,000,000 / mo  get and head (counted in samples of 10 to spare D1)
//   Resend emails         100 / day, 3,000 / mo  90 / day, 2,800 / month
//
// Workers AI per app (Greta, Oct 23): Yap and Agora get 0, so Blank has the whole 9,000. Their calls are refused before
// they touch the shared counter (Yap posts just come without captions; Agora's transcripts, coach and Argue back say
// "try later"). To give one of them some again, set LIMIT_AI_YAP or LIMIT_AI_AGORA; it still comes out of the 9,000.
//
// Workers requests and D1 have no ceiling here: on the Workers Free plan they stop by themselves at the free limit and
// can't be billed. Change a ceiling with a var, e.g. LIMIT_AI_NEURONS=5000 in wrangler.jsonc ("vars").
// Prices: developers.cloudflare.com/workers-ai/platform/pricing, developers.cloudflare.com/r2/pricing, resend.com/pricing
// Table: usage (created here on first use; yap database, binding DB).
export const LIMITS = {
  ai_neurons: { period: 'day', max: 9000, env: 'LIMIT_AI_NEURONS', what: 'Workers AI (Blank, Yap, Agora)', unit: 'neurons', free: '10,000 a day' },
  ai_yap: { period: 'day', max: 0, env: 'LIMIT_AI_YAP', what: 'Workers AI for Yap', unit: 'neurons', free: 'part of the 10,000 a day' },
  ai_agora: { period: 'day', max: 0, env: 'LIMIT_AI_AGORA', what: 'Workers AI for Agora', unit: 'neurons', free: 'part of the 10,000 a day' },
  r2_bytes: { period: 'all', max: 9e9, env: 'LIMIT_R2_BYTES', what: 'R2 photo storage', unit: 'bytes', free: '10 GB' },
  r2_class_a: { period: 'month', max: 900_000, env: 'LIMIT_R2_CLASS_A', what: 'R2 uploads (Class A)', unit: 'operations', free: '1,000,000 a month' },
  r2_class_b: { period: 'month', max: 9_000_000, env: 'LIMIT_R2_CLASS_B', what: 'R2 photo loads (Class B)', unit: 'operations', free: '10,000,000 a month' },
  email_day: { period: 'day', max: 90, env: 'LIMIT_EMAIL_DAY', what: 'Emails (Resend)', unit: 'emails today', free: '100 a day' },
  email_month: { period: 'month', max: 2800, env: 'LIMIT_EMAIL_MONTH', what: 'Emails (Resend)', unit: 'emails this month', free: '3,000 a month' },
}
const WARN_AT = 0.8

export class LimitError extends Error {
  constructor(key) {
    super('limit')
    this.name = 'LimitError'
    this.key = key
  }
}

const periodOf = (period, now = new Date()) =>
  period === 'day' ? now.toISOString().slice(0, 10) : period === 'month' ? now.toISOString().slice(0, 7) : 'all'
const maxOf = (env, key) => (Number(env[LIMITS[key].env]) > 0 ? Number(env[LIMITS[key].env]) : LIMITS[key].max)

let ready = false
async function add(db, key, period, n) {
  if (!ready) {
    await db.prepare('CREATE TABLE IF NOT EXISTS usage (period TEXT NOT NULL, key TEXT NOT NULL, n REAL NOT NULL DEFAULT 0, warned INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (period, key))').run()
    ready = true
  }
  const row = await db
    .prepare('INSERT INTO usage (period, key, n) VALUES (?1, ?2, ?3) ON CONFLICT (period, key) DO UPDATE SET n = MAX(0, n + ?3) RETURNING n, warned')
    .bind(period, key, n)
    .first()
  return row || { n, warned: 0 }
}

// The last value seen per counter, so sampled counters can still refuse between their database writes
const seen = new Map()

// Reserve `amount` of a limited thing; throws LimitError (and reserves nothing) if it would pass the ceiling
export async function use(env, key, amount = 1, ctx) {
  if (!env.DB || !LIMITS[key]) return
  const period = periodOf(LIMITS[key].period)
  const max = maxOf(env, key)
  if (max <= 0) throw new LimitError(key) // switched off: nothing to count
  const row = await add(env.DB, key, period, amount)
  seen.set(key, { period, n: row.n })
  if (row.n > max) {
    await add(env.DB, key, period, -amount)
    throw new LimitError(key)
  }
  if (row.n >= max * WARN_AT && !row.warned) {
    const claimed = await env.DB.prepare('UPDATE usage SET warned = 1 WHERE period = ? AND key = ? AND warned = 0 RETURNING n').bind(period, key).first()
    if (claimed) {
      const p = warn(env, key, row.n, max).catch((e) => console.error('limit warning', e))
      if (ctx) ctx.waitUntil(p)
      else await p
    }
  }
}

// Give back (a deleted photo's bytes)
export async function release(env, key, amount) {
  if (!env.DB || !LIMITS[key] || !(amount > 0)) return
  await add(env.DB, key, periodOf(LIMITS[key].period), -amount)
}

// For very frequent, tiny things (photo loads): writes 1 in `every` times, counting `every` each time
async function useSampled(env, key, every, ctx) {
  const max = maxOf(env, key)
  const last = seen.get(key)
  if (last && last.period === periodOf(LIMITS[key].period) && last.n >= max) throw new LimitError(key)
  if (Math.random() < 1 / every) await use(env, key, every, ctx)
}

const fmt = (key, n) => (LIMITS[key].unit === 'bytes' ? `${(n / 1e9).toFixed(2)} GB` : `${Math.round(n).toLocaleString('en')} ${LIMITS[key].unit}`)

async function warn(env, key, n, max) {
  const to = await alertRecipients(env)
  if (!to.length || !env.RESEND_KEY) return
  const l = LIMITS[key]
  const line = `${l.what} is at ${Math.round((n / max) * 100)}% of its ceiling: ${fmt(key, n)} of ${fmt(key, max)} (Cloudflare/Resend free amount: ${l.free}).`
  const next = `At 100% it pauses until the counter resets${l.period === 'all' ? ' (storage only frees up when photos are deleted)' : l.period === 'day' ? ' at midnight UTC' : ' on the 1st of the month'}. Nothing will be charged. If you want more, raise ${l.env} in wrangler.jsonc, but only after checking the price.`
  // Straight to Resend: a warning about emails must not be stopped by the email limit itself
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: 'Blank <blank@gretagrosz.com>', to, subject: `gretagrosz.com: ${l.what} at 80% of the free limit`, text: `${line}\n\n${next}` }),
  })
  if (!res.ok) throw new Error(`resend ${res.status}`)
}

// Where warnings go: the ALERT_EMAIL secret if set, otherwise every Blank admin with an email on their account
export async function alertRecipients(env) {
  const set = String(env.ALERT_EMAIL || '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(x))
  if (set.length) return set
  const r = await env.DB.prepare('SELECT email FROM blank_users WHERE admin = 1 AND email IS NOT NULL').all().catch(() => ({ results: [] }))
  return (r.results || []).map((x) => x.email)
}

// ---------- Workers AI ----------
const NEURONS_PER_DOLLAR = 1000 / 0.011
function estimate(model, input = {}) {
  if (/llama/i.test(model)) {
    const text = JSON.stringify(input.messages || input.prompt || '')
    const inTokens = text.length / 3.5 // tokens are ~4 characters; 3.5 errs high
    const outTokens = input.max_tokens || 256
    return ((inTokens * 0.293 + outTokens * 2.253) / 1e6) * NEURONS_PER_DOLLAR // Llama 3.3 70B fp8-fast prices
  }
  if (/whisper/i.test(model)) {
    const b64 = typeof input.audio === 'string' ? input.audio.length : 0
    const bytes = b64 ? (b64 * 3) / 4 : input.audio?.length || 0
    const minutes = Math.max(0.25, bytes / 90_000) // assumes a low 12 kbit/s, so real recordings cost less than counted
    return minutes * 0.00051 * NEURONS_PER_DOLLAR // Whisper large v3 turbo: $0.00051 per audio minute
  }
  // Blank's photo check (Moondream 3.1: $0.30 per M input tokens, $1.00 per M output). How many tokens a photo is
  // isn't published, so it's reserved as 2,000 plus the question (~57 neurons); actual() then sets it to the real count.
  if (/moondream/i.test(model)) {
    const inTokens = 2000 + String(input.question || '').length / 3.5
    return moondream(inTokens, input.max_tokens || 256)
  }
  return 150 // anything else: a flat, generous guess per call
}

const moondream = (inTokens, outTokens) => ((inTokens * 0.3 + outTokens * 1.0) / 1e6) * NEURONS_PER_DOLLAR
// What a call really cost, when the model says how many tokens it used (Moondream's metrics); null = keep the estimate
function actual(model, out) {
  const m = out?.result?.metrics || out?.metrics // Moondream without streaming: { result: { answer, metrics } }
  if (/moondream/i.test(model) && Number.isFinite(m?.input_tokens) && Number.isFinite(m?.output_tokens)) return moondream(m.input_tokens, m.output_tokens)
  return null
}

// app: 'yap' or 'agora' also checks that app's own ceiling first (LIMITS.ai_yap, ai_agora)
function limitedAI(env, ai, ctx, app) {
  return {
    limited: true,
    async run(model, input, options) {
      const neurons = estimate(model, input)
      if (LIMITS[`ai_${app}`]) await use(env, `ai_${app}`, neurons, ctx)
      try {
        await use(env, 'ai_neurons', neurons, ctx)
      } catch (e) {
        if (LIMITS[`ai_${app}`]) await release(env, `ai_${app}`, neurons)
        throw e
      }
      const out = await ai.run(model, input, options)
      // Correct the counter to the real cost. More than reserved is still counted (it was spent), so the ceiling
      // can be passed by at most one call and then refuses the next ones.
      const real = actual(model, out)
      if (real != null && env.DB) {
        const diff = real - neurons
        try {
          for (const key of ['ai_neurons', ...(LIMITS[`ai_${app}`] ? [`ai_${app}`] : [])]) {
            if (diff > 0) await add(env.DB, key, periodOf(LIMITS[key].period), diff)
            else await release(env, key, -diff)
          }
        } catch (e) {
          console.error('ai usage correction', e)
        }
      }
      return out
    },
  }
}

// ---------- R2 (Blank's photos) ----------
const sizeOf = (body) => body?.byteLength ?? body?.length ?? body?.size ?? 0
function limitedR2(env, r2, ctx) {
  return {
    limited: true,
    async put(key, body, options) {
      await use(env, 'r2_class_a', 1, ctx)
      const size = sizeOf(body)
      const old = await r2.head(key) // replacing a photo (a profile picture) only counts the difference
      const delta = size - (old?.size || 0)
      if (delta > 0) await use(env, 'r2_bytes', delta, ctx)
      try {
        return await r2.put(key, body, options)
      } catch (e) {
        if (delta > 0) await release(env, 'r2_bytes', delta)
        throw e
      }
    },
    async get(key, options) {
      await useSampled(env, 'r2_class_b', 10, ctx)
      return r2.get(key, options)
    },
    async head(key) {
      await useSampled(env, 'r2_class_b', 10, ctx)
      return r2.head(key)
    },
    async delete(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      let freed = 0
      for (const k of list) freed += (await r2.head(k))?.size || 0
      await r2.delete(keys) // deleting is free
      await release(env, 'r2_bytes', freed)
    },
    async list(options) {
      await use(env, 'r2_class_a', 1, ctx)
      return r2.list(options)
    },
  }
}

// env with its AI and photo bindings behind the ceilings; everything else unchanged. app: see limitedAI
export function withLimits(env, ctx, app) {
  if (env.__limited) return env
  const ai = env.AI ? limitedAI(env, env.AI, ctx, app) : undefined
  const photos = env.PHOTOS ? limitedR2(env, env.PHOTOS, ctx) : undefined
  return new Proxy(env, {
    get: (target, key) => (key === '__limited' ? true : key === 'AI' && ai ? ai : key === 'PHOTOS' && photos ? photos : target[key]),
  })
}
