// Konto-Abgleich für BW Buddy (worker/bwbuddy-account.js). Ohne Konto ändert sich nichts: alles bleibt im Browser.
// Mit Konto liegt zusätzlich eine Kopie auf dem Server, damit der Fortschritt aufs nächste Handy mitkommt und nicht
// weg ist, wenn Safari den Speicher leert (passiert nach ~7 Tagen ohne Besuch).
//
// Was abgeglichen wird: ein Paket { progress, game } aus den beiden localStorage-Schlüsseln
// 'bw-buddy-progress' (progress.jsx) und 'loopy-shop-save' (das Spiel, game/Spiel.jsx).
//
// Sparsam, weil die Datenbank mit Yap, Blank und Agora geteilt ist (Gratis-Kontingent):
// - hochgeladen wird höchstens einmal pro Minute, solange die App offen ist, plus einmal beim Wegwechseln
//   (fetch mit keepalive) – und nur, wenn sich etwas geändert hat (Fingerabdruck)
// - geholt wird beim Öffnen und beim Zurückkommen (höchstens einmal pro Minute); der Server schickt die Daten nur,
//   wenn sie neuer sind als die hier bekannte Version (rev)
// Netzfehler halten nie etwas auf: dann wird es später nochmal versucht.
//
// Konflikte: der Server nimmt eine Speicherung nur mit der zuletzt gesehenen Version an. Hat ein anderes Gerät
// dazwischen gespeichert, kommt dessen Stand zurück, beide werden zusammengeführt (merge.js) und erneut gesendet.
// Neue Daten vom Server: der Lernstand wird übernommen, ohne neu zu laden (ein storage-Ereignis, auf das
// progress.jsx schon hört); nur wenn gerade das Spiel offen ist und sich der Spielstand geändert hat, lädt die Seite neu.
import { blobHash, compactProgress, hasGame, hasProgress, mergeBlob, stable } from './merge.js'

export const API = '/bwbuddy/api'
const ACCOUNT_KEY = 'bw-buddy-account' // { username, token, rev, hash, syncedAt, hasPassword }
const PROGRESS_KEY = 'bw-buddy-progress' // = STORAGE_KEY in progress.jsx
const GAME_KEY = 'loopy-shop-save' // = SAVE_KEY in game/Spiel.jsx
const MIN_GAP = 60_000 // höchstens ein Hochladen pro Minute, solange die App offen ist
const PULL_GAP = 60_000
const TICK = 20_000
const KEEPALIVE_MAX = 60_000 // Browser erlauben mit keepalive nur ~64 KB

// ---------- Server ----------
export class ApiError extends Error {
  constructor(code, status = 0, body = null) {
    super(code)
    this.code = code // offline | logged_out | wrong_password | taken | too_many | conflict | …
    this.status = status
    this.body = body
  }
}

export async function call(path, { method = 'GET', token, body, keepalive = false } = {}) {
  let res
  try {
    res = await fetch(API + path, {
      method,
      keepalive,
      headers: { ...(body !== undefined && { 'content-type': 'application/json' }), ...(token && { authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('offline')
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    /* keine JSON-Antwort (z. B. 404-Seite, wenn die API nicht erreichbar ist) */
  }
  if (!res.ok || !data) throw new ApiError(data?.error || (res.status >= 500 || !data ? 'server' : 'error'), res.status, data)
  return data
}

// ---------- lokaler Speicher ----------
const read = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null
  } catch {
    return null
  }
}
let memAccount = null // falls localStorage gesperrt ist
export function readAccount() {
  const a = read(ACCOUNT_KEY) ?? memAccount
  return a?.token && a?.username ? a : null
}
function writeAccount(a) {
  memAccount = a
  try {
    if (a) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a))
    else localStorage.removeItem(ACCOUNT_KEY)
  } catch {
    /* nur im Speicher */
  }
  emit()
}
const patchAccount = (changes) => {
  const a = readAccount()
  if (a) writeAccount({ ...a, ...changes })
}

const today = () => new Date().toISOString().slice(0, 10)
// Der Stand dieses Geräts, so wie er hochgeladen würde
export function readLocal() {
  return { progress: compactProgress(read(PROGRESS_KEY), today()), game: read(GAME_KEY) }
}
const sorted = (x) => (x == null ? null : JSON.parse(stable(x)))

// Schreibt einen Stand ins Gerät. Gibt zurück, was sich wirklich geändert hat.
function writeLocal(blob) {
  const cur = readLocal()
  const changes = { progress: false, game: false }
  const put = (key, value, which) => {
    if (value == null || stable(value) === stable(cur[which])) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
      changes[which] = true
    } catch {
      /* Speicher voll/gesperrt */
    }
  }
  put(PROGRESS_KEY, blob.progress, 'progress')
  put(GAME_KEY, blob.game, 'game')
  return changes
}

const onGame = () => /^#\/spiel(\b|\/|\?|$)/.test(window.location.hash || '')

// Neuer Stand liegt im Speicher: Lernstand per storage-Ereignis an progress.jsx, Spiel ggf. per Neuladen
function announce(changes) {
  // Mitten im Spiel nie neu laden (sonst wäre der laufende Spieltag weg); das Spiel liest den Stand beim nächsten Öffnen
  if (changes.game && onGame()) return
  if (changes.progress) {
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_KEY, newValue: localStorage.getItem(PROGRESS_KEY) }))
    } catch {
      window.location.reload()
    }
  }
}
function apply(blob) {
  const changes = writeLocal(blob)
  announce(changes)
  return changes.progress || changes.game
}

// ---------- Zustand für die Oberfläche ----------
// status: off | syncing | synced | offline | error | limit (Tageslimit erreicht) | full (zu groß)
let status = readAccount() ? 'syncing' : 'off'
let snapshot = null
const listeners = new Set()
function emit() {
  snapshot = null
  listeners.forEach((l) => l())
}
function setStatus(s) {
  if (s !== status) {
    status = s
    emit()
  }
}
export function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}
export function getSnapshot() {
  if (!snapshot) {
    const a = readAccount()
    snapshot = { account: a ? { username: a.username, hasPassword: a.hasPassword !== false, syncedAt: a.syncedAt || null } : null, status: a ? status : 'off' }
  }
  return snapshot
}

// ---------- Abgleich ----------
let busy = false
let again = false
let lastWrite = 0
let lastPull = 0
let blockedUntil = 0 // Tageslimit des Servers
let tooBigHash = null
let timer = null
let loggedOutHandler = () => {}

function loggedOut() {
  writeAccount(null)
  setStatus('off')
  loggedOutHandler()
}
function fail(e) {
  if (e.code === 'logged_out') return loggedOut()
  setStatus(e.code === 'offline' ? 'offline' : 'error')
}

// Hochladen, wenn sich seit dem letzten Abgleich etwas geändert hat.
// final: die Seite wird gerade verlassen (keepalive, Mindestabstand egal). force: Mindestabstand egal.
export async function push({ final = false, force = false } = {}) {
  const a = readAccount()
  if (!a) return
  if (busy) {
    if (!final) again = true
    return
  }
  const local = readLocal()
  const hash = blobHash(local)
  if (hash === a.hash) {
    if (status !== 'synced' && status !== 'limit') setStatus('synced')
    return
  }
  if (Date.now() < blockedUntil || hash === tooBigHash) return
  // Während des Spiels wartet der Abgleich (der Spielstand bleibt sicher am Gerät und geht danach hoch)
  if (!final && onGame()) return schedule(30_000)
  if (!final && !force && Date.now() - lastWrite < MIN_GAP) return schedule(lastWrite + MIN_GAP - Date.now())
  if (!hasProgress(local.progress) && !hasGame(local.game) && a.hash) return // ein leeres Gerät überschreibt nie das Konto

  const bodyOf = (rev, blob) => `{"rev":${Number(rev) || 0},"data":{"progress":${stable(blob.progress ?? null)},"game":${stable(blob.game ?? null)}}}`
  busy = true
  lastWrite = Date.now()
  if (!final) setStatus('syncing')
  try {
    for (let tries = 0; tries < 3; tries++) {
      const cur = readAccount()
      if (!cur) return
      const blob = tries ? readLocal() : local
      const body = bodyOf(cur.rev, blob)
      try {
        const r = await call('/account/data', { method: 'PUT', token: cur.token, body, keepalive: final && body.length < KEEPALIVE_MAX })
        // Der Server hat jetzt genau das Gesendete (Änderungen seither gehen beim nächsten Mal hoch)
        patchAccount({ rev: r.rev, hash: tries ? blobHash(blob) : hash, syncedAt: Date.now() })
        setStatus('synced')
        return
      } catch (e) {
        if (e.status === 409 && e.body) {
          // Ein anderes Gerät war schneller: zusammenführen, übernehmen, nochmal senden
          const remote = e.body.data
          patchAccount({ rev: e.body.rev, hash: remote ? blobHash(remote) : null })
          if (remote) apply(mergeBlob(readLocal(), remote))
          if (blobHash(readLocal()) === readAccount()?.hash) {
            patchAccount({ syncedAt: Date.now() })
            setStatus('synced')
            return
          }
          continue
        }
        if (e.status === 429) {
          blockedUntil = Date.now() + 60 * 60_000 // spätestens in einer Stunde wieder versuchen
          setStatus('limit')
          return
        }
        if (e.status === 413) {
          tooBigHash = hash
          setStatus('full')
          return
        }
        throw e
      }
    }
    setStatus('error')
  } catch (e) {
    fail(e)
  } finally {
    busy = false
    if (again) {
      again = false
      schedule(1000)
    }
  }
}

// Neuesten Stand holen (nur geschickt, wenn er neuer ist als der hier bekannte)
export async function pull({ force = false } = {}) {
  const a = readAccount()
  if (!a || busy) return
  if (!force && Date.now() - lastPull < PULL_GAP) return
  if (onGame()) return // nicht mitten im Spiel einen anderen Spielstand einspielen
  lastPull = Date.now()
  busy = true
  setStatus('syncing')
  let pushAfter = false
  try {
    const r = await call(`/account/data?rev=${Number(a.rev) || 0}`, { token: a.token })
    const local = readLocal()
    const localHash = blobHash(local)
    if (r.data && r.rev !== a.rev) {
      const remoteHash = blobHash(r.data)
      // Hier nichts geändert seit dem letzten Abgleich → Serverstand übernehmen; sonst zusammenführen
      const next = localHash === a.hash ? { progress: r.data.progress, game: r.data.game } : mergeBlob(local, r.data)
      patchAccount({ rev: r.rev, hash: remoteHash, syncedAt: Date.now() })
      apply(next)
      pushAfter = blobHash(readLocal()) !== remoteHash
    } else {
      patchAccount({ syncedAt: Date.now(), ...(r.rev !== a.rev && { rev: r.rev }) })
      pushAfter = localHash !== a.hash
    }
    setStatus('synced')
  } catch (e) {
    fail(e)
  } finally {
    busy = false
    if (pushAfter) schedule(500, true)
  }
}

function schedule(ms, force = false) {
  clearTimeout(timer)
  timer = setTimeout(() => push({ force }), Math.max(0, ms))
}

// Läuft einmal pro App-Start (AccountProvider)
let started = false
export function start({ onLoggedOut } = {}) {
  if (onLoggedOut) loggedOutHandler = onLoggedOut
  if (started) return
  started = true
  const visible = () => document.visibilityState === 'visible'
  if (readAccount()) pull({ force: true })
  setInterval(() => readAccount() && visible() && push(), TICK)
  document.addEventListener('visibilitychange', () => {
    if (!readAccount()) return
    if (visible()) pull()
    else push({ final: true })
  })
  window.addEventListener('pagehide', () => readAccount() && push({ final: true }))
  window.addEventListener('online', () => readAccount() && pull({ force: true }))
  // Ein anderer Tab hat sich an- oder abgemeldet
  window.addEventListener('storage', (e) => {
    if (e.key === ACCOUNT_KEY) emit()
  })
}

// ---------- Anmelden & Co. ----------
// Nach Registrierung/Anmeldung: Konto merken und mit dem Gerät abgleichen.
// r = Antwort des Servers ({ token, username, rev, data?, password? }); sentHash = was bei der Registrierung mitging
function begin(r, { sentHash = null, hasPassword = true } = {}) {
  lastWrite = 0
  blockedUntil = 0
  tooBigHash = null
  writeAccount({ username: r.username, token: r.token, rev: r.rev || 0, hash: sentHash, syncedAt: Date.now(), hasPassword })
  if (r.data) {
    const local = readLocal()
    const remoteHash = blobHash(r.data)
    patchAccount({ hash: remoteHash })
    // Gerät mit eigenem Fortschritt: beides zusammenführen (nichts geht verloren), sonst einfach den Kontostand
    const next = hasProgress(local.progress) || hasGame(local.game) ? mergeBlob(local, r.data) : { progress: r.data.progress, game: r.data.game }
    apply(next)
  }
  setStatus('synced')
  if (blobHash(readLocal()) !== readAccount()?.hash) schedule(300, true)
}

// Was ein neues Konto mitbekommt: der Stand dieses Geräts (falls es einen gibt)
function upload() {
  const local = readLocal()
  if (!hasProgress(local.progress) && !hasGame(local.game) && !local.progress?.onboarded) return { data: null, hash: null }
  return { data: { progress: sorted(local.progress), game: sorted(local.game) }, hash: blobHash(local) }
}

export async function signUp(username, password) {
  const { data, hash } = upload()
  const r = await call('/account/signup', { method: 'POST', body: { username, password, data } })
  begin(r, { sentHash: data ? hash : null })
  return r
}

export async function logIn(username, password) {
  const r = await call('/account/login', { method: 'POST', body: { username, password } })
  begin(r, { hasPassword: r.password !== false })
  return r
}

export async function recover(username, code, newPassword) {
  const r = await call('/account/recover', { method: 'POST', body: { username, code, newPassword } })
  begin(r)
  return r
}

export async function logOut({ forget = false } = {}) {
  const a = readAccount()
  if (!a) return
  if (!forget) await push({ force: true }).catch(() => {})
  call('/account/logout', { method: 'POST', token: a.token }).catch(() => {})
  writeAccount(null)
  setStatus('off')
  if (forget) {
    // Gemeinsamer Computer (z. B. in der Schule): Fortschritt von diesem Gerät entfernen
    try {
      localStorage.removeItem(PROGRESS_KEY)
      localStorage.removeItem(GAME_KEY)
    } catch {
      /* egal */
    }
    window.location.reload()
  }
}

const token = () => readAccount()?.token
export const changePassword = (password, newPassword) => call('/account/password', { method: 'POST', token: token(), body: { password, newPassword } }).then((r) => (patchAccount({ hasPassword: true }), r))
export const newRecoveryCode = (password) => call('/account/recovery-code', { method: 'POST', token: token(), body: { password } })
export const accountInfo = () => call('/account', { token: token() })
export async function deleteAccount(password) {
  await call('/account', { method: 'DELETE', token: token(), body: { password } })
  writeAccount(null)
  setStatus('off')
}
export const syncNow = () => pull({ force: true })

// ---------- Passkeys (Face ID, Fingerabdruck, Bildschirmsperre) ----------
const toB64 = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0))

export const passkeySupported =
  typeof window !== 'undefined' &&
  !!window.PublicKeyCredential &&
  !!navigator.credentials &&
  typeof window.AuthenticatorAttestationResponse?.prototype?.getPublicKey === 'function'

async function createPasskey(o) {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: fromB64(o.challenge),
      rp: o.rp,
      user: { ...o.user, id: fromB64(o.user.id) },
      pubKeyCredParams: o.pubKeyCredParams,
      excludeCredentials: (o.excludeCredentials || []).map((c) => ({ ...c, id: fromB64(c.id) })),
      authenticatorSelection: o.authenticatorSelection,
      attestation: o.attestation,
      timeout: o.timeout,
    },
  })
  const r = cred.response
  return {
    challengeId: o.challengeId,
    id: cred.id,
    clientDataJSON: toB64(r.clientDataJSON),
    authenticatorData: toB64(r.getAuthenticatorData()),
    publicKey: toB64(r.getPublicKey()),
    alg: r.getPublicKeyAlgorithm(),
    transports: r.getTransports?.() || [],
  }
}
async function getPasskey(o) {
  const cred = await navigator.credentials.get({
    publicKey: { challenge: fromB64(o.challenge), rpId: o.rpId, allowCredentials: [], userVerification: o.userVerification, timeout: o.timeout },
  })
  const r = cred.response
  return {
    challengeId: o.challengeId,
    id: cred.id,
    clientDataJSON: toB64(r.clientDataJSON),
    authenticatorData: toB64(r.authenticatorData),
    signature: toB64(r.signature),
    userHandle: r.userHandle ? toB64(r.userHandle) : null,
  }
}

// Wirft NotAllowedError, wenn abgebrochen wird (dafür gibt's keine Meldung)
export async function passkeySignUp(username) {
  const o = await call('/account/passkey/register/options', { method: 'POST', body: { username } })
  const cred = await createPasskey(o)
  const { data, hash } = upload()
  const r = await call('/account/passkey/register/verify', { method: 'POST', body: { ...cred, data } })
  begin(r, { sentHash: data ? hash : null, hasPassword: false })
  return r
}
export async function passkeyLogIn() {
  const o = await call('/account/passkey/login/options', { method: 'POST' })
  const cred = await getPasskey(o)
  const r = await call('/account/passkey/login/verify', { method: 'POST', body: cred })
  if (r.username === readAccount()?.username) {
    patchAccount({ token: r.token })
    return r
  }
  begin(r, { hasPassword: r.password !== false })
  return r
}
export async function addPasskey() {
  const o = await call('/account/passkey/register/options', { method: 'POST', token: token(), body: {} })
  return call('/account/passkey/register/verify', { method: 'POST', token: token(), body: await createPasskey(o) })
}
