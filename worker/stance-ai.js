// Everything Stance asks Workers AI: transcripts (Whisper), the speaking coach, and Argue back (the sparring
// partner and its judge), all on Llama 3.3. Callers get real errors: a failed call throws AiError, so nothing is
// ever saved as if it had been analysed.
import { fakeAI } from './stance-fake-ai.js'

const WHISPER = '@cf/openai/whisper-large-v3-turbo'
const LLM = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

export class AiError extends Error {}

/**
 * The AI binding for this request. Locally (wrangler dev) Workers AI is not available, so a fake one can stand in,
 * but only when BOTH the STANCE_FAKE_AI var is set (wrangler dev --var STANCE_FAKE_AI:1) AND the request is for
 * localhost. On gretagrosz.com or workers.dev the hostname check alone keeps it off, whatever the vars say.
 */
export function aiFor(env, url, request) {
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (env.STANCE_FAKE_AI === '1' && local) return fakeAI(request.headers.get('x-fake-ai') || '')
  return env.AI || null
}

// Words that are fillers wherever they appear. English skips "like" and "kind of" (often real words).
export const FILLERS = {
  en: ['um', 'uh', 'erm', 'er', 'hmm', 'you know', 'i mean', 'basically', 'literally', 'so yeah'],
  de: ['äh', 'ähm', 'öh', 'öhm', 'hm', 'hmm', 'halt', 'sozusagen', 'quasi', 'irgendwie'],
}

/** Whisper. Returns the text ('' when it heard no speech); throws AiError when the call itself failed. */
export async function transcribe(ai, audio, lang) {
  if (!ai) throw new AiError('no AI binding')
  const bytes = new Uint8Array(audio)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  const input = { audio: btoa(bin), language: lang === 'de' ? 'de' : 'en', vad_filter: true }
  const run = () => ai.run(WHISPER, input)
  let out
  try {
    out = await run().catch(() => new Promise(r => setTimeout(r, 1500)).then(run))
  } catch (e) {
    console.error('transcribe', e)
    throw new AiError('transcription failed')
  }
  return String(out?.text || '').replace(/\s+/g, ' ').trim().slice(0, 9000)
}

export function speechStats(text, lang) {
  const lower = ' ' + String(text || '').toLowerCase().replace(/[^\p{L}' ]+/gu, ' ').replace(/\s+/g, ' ') + ' '
  const words = lower.trim() ? lower.trim().split(' ').length : 0
  const found = {}
  let fillers = 0
  for (const f of FILLERS[lang] || FILLERS.en) {
    const n = lower.split(' ' + f + ' ').length - 1
    if (n) { found[f] = n; fillers += n }
  }
  return { words, fillers, found }
}

// At most `n` sentences, always ending with a full stop
function sentences(text, n) {
  const t = String(text || '').replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim()
  const kept = (t.match(/[^.!?]+[.!?]+["”“')]*/g) || [t]).slice(0, n).map(x => x.trim()).join(' ').slice(0, 420)
  return kept && !/[.!?…"”“')]$/.test(kept) ? kept + '.' : kept
}
const score = v => Math.max(1, Math.min(10, Math.round(Number(v) || 5)))
const parse = out => (typeof out?.response === 'string' ? JSON.parse(out.response) : out?.response)

/**
 * The coach's note on one talk. `previous` is the last "next time" note, so the coach can say whether it was acted on.
 * Returns null when the coach call failed (the transcript and the numbers still stand).
 */
export async function coach(ai, { topic, transcript, duration, length, stats, lang, previous }) {
  if (!ai) return null
  const de = lang === 'de'
  const wpm = Math.round(stats.words / (duration / 60))
  const prompt = `Topic: "${topic}"
Target length: ${Math.round(length / 60)} minute(s). Spoken: ${Math.round(duration)} seconds, ${stats.words} words (${wpm} words per minute), ${stats.fillers} filler words.
${previous ? `Last time the coach told them: "${previous}"\n` : ''}Transcript (automatic, may contain small errors):
"""${transcript}"""`
  const system = `You are a sharp, warm speaking coach for students practising for an oral exam (the Austrian Matura: a prepared or impromptu monologue on a topic). Judge the talk on structure (a clear point, a progression, an ending), clarity (precise, easy to follow) and depth (an actual idea, an example, a distinction). For talks of three minutes or more, structure also means signposting and covering more than one aspect. Be specific to what they said; quote a few words where useful. Never invent things they did not say. Speak to them directly ("you"/"du"), never "the speaker". Scores must agree with your words: 9-10 is rare and excellent, 5 is average, and a talk that wanders off the topic gets 4 or lower for structure and depth. A talk much shorter than the target cannot score above 6 for depth. No flattery, no emojis. Write every text field in ${de ? 'German (du-Form, natural Austrian-friendly standard German)' : 'plain English'}. Reply only with JSON.`
  const properties = {
    summary: { type: 'string', description: de ? 'Ein Satz an sie: was dein Vortrag vertreten hat (beginne mit "Du")' : 'One sentence to them: what your talk argued (start with "You")' },
    strength: { type: 'string', description: 'The best thing about it, specific, one or two sentences' },
    improve: { type: 'string', description: 'The single most useful change for next time, specific and actionable, one or two sentences' },
    structure: { type: 'integer', minimum: 1, maximum: 10 },
    clarity: { type: 'integer', minimum: 1, maximum: 10 },
    depth: { type: 'integer', minimum: 1, maximum: 10 },
  }
  if (previous) properties.followed = { type: 'string', description: 'One short sentence: did they act on last time\'s note? Be concrete.' }
  try {
    const r = parse(await ai.run(LLM, {
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      response_format: { type: 'json_schema', json_schema: { type: 'object', properties, required: Object.keys(properties) } },
      max_tokens: 600,
    }))
    return {
      summary: sentences(r.summary, 1), strength: sentences(r.strength, 2), improve: sentences(r.improve, 2),
      followed: previous ? sentences(r.followed, 1) : '',
      scores: { structure: score(r.structure), clarity: score(r.clarity), depth: score(r.depth) },
      fillerWords: stats.found,
    }
  } catch (e) {
    console.error('coach', e)
    return null
  }
}

// ---------- Argue back ----------

const words = (s, n) => String(s || '').trim().split(/\s+/).slice(0, n).join(' ')

function sparSystem(q, side, round, lang) {
  const theirs = q.sides[1 - side]
  return `You are the sparring partner in Agora, a debating app for students. Today's question: "${q.question}"
Background: ${q.context}
The student argues "${q.sides[side]}". You argue "${theirs}", as strongly and honestly as you can.
Rules: answer what they actually wrote, quote a few of their words, and press the weakest link in their reasoning. ${round === 1 ? 'This is your rebuttal to their opening: take apart their main reason and give the single strongest reason for your side.' : 'This is your second reply: answer their latest point directly, then add one consideration they have not dealt with yet.'} Do not concede your side. 80 to 140 words, plain conversational prose, no lists, no headings, no greeting, no compliments, no emojis, never mention being an AI or a language model. Write in ${lang === 'de' ? 'German (du-Form)' : 'English'}, unless the student writes in the other of these two languages, then use theirs.`
}

/** The sparring partner's next reply. turns: [{ role: 'you'|'them', text }] so far, ending with the student. */
export async function sparReply(ai, { q, side, turns, lang }) {
  if (!ai) throw new AiError('no AI binding')
  const round = turns.filter(t => t.role === 'them').length + 1
  const messages = [{ role: 'system', content: sparSystem(q, side, round, lang) }, ...turns.map(t => ({ role: t.role === 'you' ? 'user' : 'assistant', content: t.text }))]
  let text
  try {
    const out = await ai.run(LLM, { messages, max_tokens: 400 })
    text = String(out?.response || '').replace(/^\s*["“]|["”]\s*$/g, '').replace(/\n{3,}/g, '\n\n').trim()
  } catch (e) {
    console.error('spar', e)
    throw new AiError('spar failed')
  }
  if (text.length < 20) throw new AiError('spar reply empty')
  return text.slice(0, 1500)
}

/** Who argued better, judged on the arguments, plus the one point the student never answered */
export async function sparJudge(ai, { q, side, turns, lang }) {
  if (!ai) throw new AiError('no AI binding')
  const de = lang === 'de'
  const transcript = turns.map(t => `${t.role === 'you' ? 'STUDENT' : 'OPPONENT'}: ${t.text}`).join('\n\n')
  const system = `You judge a short written debate between a student and an opponent. Question: "${q.question}". The student argues "${q.sides[side]}", the opponent "${q.sides[1 - side]}". Decide who ARGUED better, not who is right: who answered the other side's strongest points, gave reasons and examples, and stayed on the question. Be fair; the student wins when they earned it. Address the student directly ("you"/"du"). Quote their own words for "strongest". Write every text field in ${de ? 'German (du-Form)' : 'plain English'}. No flattery, no emojis. Reply only with JSON.`
  const schema = {
    type: 'object',
    properties: {
      winner: { type: 'string', enum: ['you', 'them', 'tie'] },
      reason: { type: 'string', description: 'Two sentences: why that side argued better' },
      strongest: { type: 'string', description: 'The student\'s strongest line, quoted word for word from what they wrote (max 25 words)' },
      unanswered: { type: 'string', description: 'The opponent\'s point the student never really answered, in one sentence' },
      tip: { type: 'string', description: 'One concrete thing to do better next time, one sentence' },
    },
    required: ['winner', 'reason', 'strongest', 'unanswered', 'tip'],
  }
  try {
    const r = parse(await ai.run(LLM, {
      messages: [{ role: 'system', content: system }, { role: 'user', content: transcript }],
      response_format: { type: 'json_schema', json_schema: schema },
      max_tokens: 500,
    }))
    const winner = ['you', 'them', 'tie'].includes(r.winner) ? r.winner : 'tie'
    return {
      winner, reason: sentences(r.reason, 2), strongest: words(String(r.strongest || '').replace(/^["“„]|["”“]$/g, ''), 30),
      unanswered: sentences(r.unanswered, 1), tip: sentences(r.tip, 1),
    }
  } catch (e) {
    console.error('judge', e)
    throw new AiError('judge failed')
  }
}
