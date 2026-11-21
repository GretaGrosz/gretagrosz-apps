// Accounts: log in with a username and password and your projects follow you to any device (worker/blank-account.js).
// Blank keeps working the same without one: the data still lives on the device first (store.jsx), and the account
// keeps a copy on the server in step with it. Photos go up to the account too, and a device that's missing one
// fetches it (so a photo from your phone shows up on your laptop).
//
// Syncing: every change is sent a moment later with the revision this device last saw. If another device saved in
// between, the server says so and both versions are merged (nothing you made on either device is dropped).
// The newest copy is fetched when Blank opens and whenever you come back to it.
//
// Several accounts: every account you log into on this device stays saved (blank-accounts), like Instagram, and
// switching swaps the projects on this device for that account's copy (after sending up the one you're leaving).
//
// Passkeys: an account can also be made and opened with Face ID, a fingerprint or the phone's screen lock (WebAuthn,
// checked by the Worker), no password. The phone keeps the private key; the server only gets the public one.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { emptyData, useStore } from './store'
import { call, ApiError } from './buddy'
import { getPhotoBlob, hasPhoto, savePhotoAs } from './media'

const KEY = 'blank-account'
const SAVED = 'blank-accounts' // [{ username, token }] every account logged in on this device
const PUSH_DELAY = 1500
const API = '/blank/api'

// ---------- photos ----------
// Which photos this device knows are in the account, per username (so a second account on the same device starts fresh)
const upKey = (u) => `blank-photos-up:${u}`
const readUp = (u) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(upKey(u)) || '[]'))
  } catch {
    return new Set()
  }
}
const writeUp = (u, set) => {
  try {
    localStorage.setItem(upKey(u), JSON.stringify([...set]))
  } catch {}
}
const clearUp = (u) => {
  try {
    localStorage.removeItem(upKey(u))
  } catch {}
}
const photoRefs = (d) => {
  const refs = new Set()
  for (const p of d.projects || []) for (const e of p.entries || []) if (e.photo?.startsWith('idb:')) refs.add(e.photo)
  return refs
}
async function photoCall(method, ref, token, blob) {
  let res
  try {
    res = await fetch(`${API}/account/photos/${encodeURIComponent(ref.slice(4))}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(blob && { 'content-type': blob.type || 'image/jpeg' }) },
      body: blob,
    })
  } catch {
    throw new ApiError('offline')
  }
  if (res.status === 401) throw new ApiError('logged_out', 401)
  return res
}

// Send up the photos the account doesn't have yet, fetch the ones this device is missing, and remove the account's
// copy of photos you deleted. Only runs right after a sync, so the data here matches the account.
async function syncPhotos(account, data) {
  const { username, token } = account
  const up = readUp(username)
  const refs = photoRefs(data)
  let changed = false
  try {
    for (const ref of refs) {
      const id = ref.slice(4)
      if (await hasPhoto(ref)) {
        if (up.has(id)) continue
        const blob = await getPhotoBlob(ref)
        if (!blob) continue
        const res = await photoCall('PUT', ref, token, blob)
        if (res.status === 429 || res.status === 503) break // daily limit, or photo storage not set up: try again later
        if (res.ok) {
          up.add(id)
          changed = true
        }
      } else {
        const res = await photoCall('GET', ref, token)
        if (!res.ok) continue // not uploaded yet by the device that took it: next time
        await savePhotoAs(ref, await res.blob())
        up.add(id)
        changed = true
      }
    }
    for (const id of up) {
      if (refs.has(`idb:${id}`)) continue
      const res = await photoCall('DELETE', `idb:${id}`, token)
      if (res.ok) {
        up.delete(id)
        changed = true
      }
    }
  } finally {
    if (changed) writeUp(username, up)
  }
}

const readAccount = () => {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || 'null')
    return a?.token && a?.username ? a : null
  } catch {
    return null
  }
}
const writeAccount = (a) => {
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a))
    else localStorage.removeItem(KEY)
  } catch {}
}

const readSaved = () => {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED) || '[]')
    return Array.isArray(list) ? list.filter((a) => a?.token && a?.username) : []
  } catch {
    return []
  }
}
const writeSaved = (list) => {
  try {
    localStorage.setItem(SAVED, JSON.stringify(list))
  } catch {}
}
const keepSaved = (a) => writeSaved([...readSaved().filter((x) => x.username !== a.username), { username: a.username, token: a.token }])
const dropSaved = (username) => writeSaved(readSaved().filter((x) => x.username !== username))

// What gets compared and sent: the data without the save time
const strip = (d) => {
  const { savedAt, ...rest } = d
  return rest
}
const fingerprint = (d) => JSON.stringify(strip(d))
const hasAnything = (d) => !!(d && (d.projects?.length || d.activity?.length || Object.keys(d.challenges || {}).length))

// ---------- merging two versions of the same data ----------
const byId = (a = [], b = [], key = (x) => x.id) => {
  const map = new Map()
  for (const x of [...a, ...b]) if (!map.has(key(x))) map.set(key(x), x)
  return [...map.values()]
}
const union = (a = [], b = []) => [...new Set([...(a || []), ...(b || [])])]

function mergeProject(p, q) {
  const steps = byId(p.milestones, q.milestones).map((m) => {
    const other = q.milestones?.find((x) => x.id === m.id)
    return other?.done && !m.done ? other : m
  })
  return {
    ...p,
    milestones: steps,
    entries: byId(p.entries, q.entries).sort((a, b) => b.at - a.at),
    sessions: byId(p.sessions, q.sessions, (s) => s.at).sort((a, b) => a.at - b.at),
    status: p.status === 'done' || q.status === 'done' ? 'done' : 'active',
    finishedAt: p.finishedAt || q.finishedAt || null,
  }
}

// `mine` is this device, `theirs` the server. Their version wins where the two disagree on a single value.
// Hobby outfits from both copies; a pick made on either phone wins over one still open
const mergePicks = (a = {}, b = {}) => Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => [k, a[k] || b[k] || null]))

export function mergeData(mine, theirs) {
  if (!theirs) return mine
  if (!hasAnything(mine)) return { ...theirs, onboarded: theirs.onboarded || mine.onboarded }
  const projects = byId(theirs.projects, mine.projects).map((p) => {
    const a = theirs.projects.find((x) => x.id === p.id)
    const b = mine.projects.find((x) => x.id === p.id)
    return a && b ? mergeProject(a, b) : p
  })
  const challenges = { ...(mine.challenges || {}) }
  for (const [id, c] of Object.entries(theirs.challenges || {})) {
    challenges[id] = challenges[id] ? { ...c, days: union(c.days, challenges[id].days).sort((x, y) => x - y) } : c
  }
  const freezes = theirs.freezes || mine.freezes
  return {
    ...mine,
    ...theirs,
    onboarded: mine.onboarded || theirs.onboarded,
    me: { ...mine.me, ...theirs.me, name: theirs.me?.name || mine.me?.name || '', weekGoals: { ...mine.me?.weekGoals, ...theirs.me?.weekGoals } },
    projects: projects.sort((a, b) => b.createdAt - a.createdAt),
    activity: byId(theirs.activity, mine.activity, (a) => `${a.projectId}|${a.at}|${a.kind}`).sort((a, b) => a.at - b.at),
    challenges,
    challengeWins: union(theirs.challengeWins, mine.challengeWins),
    unlockedNotified: theirs.unlockedNotified || mine.unlockedNotified ? union(theirs.unlockedNotified, mine.unlockedNotified) : null,
    freezes: { ...freezes, used: union(theirs.freezes?.used, mine.freezes?.used), earned: union(theirs.freezes?.earned, mine.freezes?.earned) },
    buddy: theirs.buddy || mine.buddy || null,
    picks: mergePicks(theirs.picks, mine.picks),
  }
}

// ---------- passkeys (navigator.credentials, base64url in and out) ----------
const toB64 = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0))

// The Worker reads the public key the browser hands over (getPublicKey), which every browser with passkeys has had since 2023
export const passkeySupported =
  typeof window !== 'undefined' &&
  !!window.PublicKeyCredential &&
  !!navigator.credentials &&
  typeof window.AuthenticatorAttestationResponse?.prototype?.getPublicKey === 'function'

// Makes a passkey from the server's options; returns what /account/passkey/register/verify wants
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

// ---------- the provider ----------
const Ctx = createContext(null)

export function AccountProvider({ children }) {
  const { data, actions } = useStore()
  const [account, setAccountState] = useState(readAccount)
  const [saved, setSaved] = useState(() => {
    const a = readAccount()
    if (a && !readSaved().some((x) => x.username === a.username)) keepSaved(a) // logged in before accounts were saved
    return readSaved()
  })
  const refreshSaved = useCallback(() => setSaved(readSaved()), [])
  const [status, setStatus] = useState(account ? 'syncing' : 'off') // off | syncing | synced | offline | error
  const accountRef = useRef(account)
  const dataRef = useRef(data)
  dataRef.current = data
  const lastSent = useRef(null) // fingerprint of what the server has
  const busy = useRef(false)
  const again = useRef(false) // a change came in while a sync was running: send it right after
  const timer = useRef(null)
  const pushRef = useRef(null)
  const photosBusy = useRef(false)
  // After every successful sync: photos (one run at a time, in the background)
  const photos = useCallback(() => {
    const a = accountRef.current
    if (!a || photosBusy.current) return
    if (lastSent.current == null || fingerprint(dataRef.current) !== lastSent.current) return
    photosBusy.current = true
    syncPhotos(a, dataRef.current)
      .catch((e) => {
        if (e.code === 'logged_out') loggedOutRef.current?.()
      })
      .finally(() => (photosBusy.current = false))
  }, [])
  const loggedOutRef = useRef(null)
  const done = () => {
    busy.current = false
    if (again.current) {
      again.current = false
      setTimeout(() => pushRef.current?.(), 300)
    }
  }

  const setAccount = useCallback((a) => {
    accountRef.current = a
    writeAccount(a)
    setAccountState(a)
  }, [])

  const loggedOut = useCallback(() => {
    if (accountRef.current) dropSaved(accountRef.current.username)
    refreshSaved()
    setAccount(null)
    setStatus('off')
    actions.toast({ text: 'You were logged out. Log in again to keep syncing.' })
  }, [actions, setAccount, refreshSaved])
  loggedOutRef.current = loggedOut

  // Take the server's version (merged with anything newer here) as this device's data
  const adopt = useCallback(
    (remote) => {
      const next = actions.adopt(remote)
      lastSent.current = fingerprint(next)
    },
    [actions],
  )

  // Send this device's data. On a clash, merge with the server's copy and send that.
  const push = useCallback(async () => {
    const a = accountRef.current
    if (!a) return
    if (busy.current) {
      again.current = true
      return
    }
    const fp = fingerprint(dataRef.current)
    if (fp === lastSent.current && !a.dirty) {
      setStatus('synced')
      return photos()
    }
    busy.current = true
    setStatus('syncing')
    try {
      for (let tries = 0; tries < 3; tries++) {
        const cur = accountRef.current
        try {
          const r = await call('/account/data', { method: 'PUT', key: cur.token, body: { data: strip(dataRef.current), rev: cur.rev } })
          lastSent.current = fingerprint(dataRef.current)
          setAccount({ ...accountRef.current, rev: r.rev, dirty: false })
          setStatus('synced')
          photos()
          return
        } catch (e) {
          if (e.status !== 409) throw e
          const remote = e.body
          setAccount({ ...accountRef.current, rev: remote.rev })
          const merged = remote.data ? mergeData(dataRef.current, remote.data) : dataRef.current
          dataRef.current = actions.adopt(merged)
        }
      }
      setStatus('error')
    } catch (e) {
      if (e.code === 'logged_out') return loggedOut()
      setAccount({ ...accountRef.current, dirty: true })
      setStatus(e.code === 'offline' ? 'offline' : 'error')
    } finally {
      done()
    }
  }, [actions, loggedOut, setAccount, photos])
  pushRef.current = push

  // Fetch the newest copy
  const pull = useCallback(async () => {
    const a = accountRef.current
    if (!a || busy.current) return
    busy.current = true
    setStatus('syncing')
    let needPush = false
    try {
      const r = await call('/account', { key: a.token })
      if (r.rev > a.rev && r.data) {
        const changedHere = a.dirty || (lastSent.current && fingerprint(dataRef.current) !== lastSent.current)
        if (changedHere) {
          dataRef.current = actions.adopt(mergeData(dataRef.current, r.data))
          needPush = true
        } else adopt(r.data)
        setAccount({ ...accountRef.current, rev: r.rev, username: r.username, hasPassword: r.password })
      } else {
        if (typeof r.password === 'boolean' && r.password !== accountRef.current?.hasPassword) setAccount({ ...accountRef.current, hasPassword: r.password })
        needPush = a.dirty || r.rev === 0
        if (!needPush && lastSent.current == null) lastSent.current = fingerprint(dataRef.current)
      }
      setStatus('synced')
      if (!needPush) photos()
    } catch (e) {
      if (e.code === 'logged_out') return loggedOut()
      setStatus(e.code === 'offline' ? 'offline' : 'error')
    } finally {
      if (needPush) again.current = true
      done()
    }
  }, [actions, adopt, loggedOut, push, setAccount, photos])

  // Waits for a running sync to finish, then sends anything not sent yet (before this device changes account)
  const settle = useCallback(async () => {
    clearTimeout(timer.current)
    for (let i = 0; busy.current && i < 100; i++) await new Promise((r) => setTimeout(r, 100))
    if (accountRef.current) await push().catch(() => {})
    for (let i = 0; busy.current && i < 100; i++) await new Promise((r) => setTimeout(r, 100))
  }, [push])

  // Every change goes up a moment later
  useEffect(() => {
    if (!accountRef.current) return
    if (lastSent.current != null && fingerprint(data) === lastSent.current) return
    clearTimeout(timer.current)
    timer.current = setTimeout(push, PUSH_DELAY)
    return () => clearTimeout(timer.current)
  }, [data, push])

  // Newest copy when Blank opens, when you come back to it, and when the connection comes back
  useEffect(() => {
    if (!account) return
    pull()
    const onVisible = () => document.visibilityState === 'visible' && pull()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', pull)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', pull)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.token])

  // Another tab logged in or out
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY) return
      const a = readAccount()
      accountRef.current = a
      setAccountState(a)
      if (!a) setStatus('off')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => {
    let value = null
    const start = (r) => {
      setAccount({ username: r.username, token: r.token, rev: r.rev, dirty: false, hasPassword: r.password ?? true })
      keepSaved(r)
      refreshSaved()
    }
    // Adding another account: the one you're on keeps its projects, and the new one starts from its own
    const leave = async () => {
      await settle()
      setAccount(null)
      lastSent.current = null
      dataRef.current = actions.adopt(emptyData())
    }
    // What a new account starts with: this device's data, if there's anything in it
    const upload = (local) => (hasAnything(local) || local.onboarded ? strip(local) : null)
    // After /account/signup or a passkey signup
    const signedUp = async (r, local, fresh) => {
      if (fresh) await leave()
      lastSent.current = r.rev ? fingerprint(local) : null
      start(r)
      setStatus('synced')
      return r
    }
    // After /account/login or a passkey sign-in
    const loggedIn = async (r, fresh) => {
      if (fresh) await leave()
      const local = fresh ? emptyData() : dataRef.current
      lastSent.current = null
      start(r)
      if (r.data) {
        const merged = hasAnything(local) ? mergeData(local, r.data) : r.data
        const next = actions.adopt(merged)
        if (hasAnything(local)) setAccount({ ...accountRef.current, dirty: true })
        else lastSent.current = fingerprint(next)
      } else {
        setAccount({ ...accountRef.current, dirty: true })
      }
      setStatus('synced')
      return r
    }
    value = {
      account,
      status,
      saved,
      syncNow: () => pull(),

      // Switch to another account saved on this device
      async switchTo(username) {
        const target = readSaved().find((x) => x.username === username)
        if (!target || target.username === accountRef.current?.username) return
        let r
        try {
          r = await call('/account', { key: target.token })
        } catch (e) {
          if (e.code === 'logged_out') {
            dropSaved(username)
            refreshSaved()
          }
          throw e
        }
        const wasIn = !!accountRef.current
        await settle()
        busy.current = true
        try {
          lastSent.current = null
          setAccount({ username: r.username, token: target.token, rev: r.rev, dirty: false })
          const local = dataRef.current
          if (!wasIn && hasAnything(local)) {
            // Logged out with projects kept on this device: like logging in, they go into the account
            dataRef.current = actions.adopt(r.data ? mergeData(local, r.data) : local)
            setAccount({ ...accountRef.current, dirty: true })
            again.current = true
          } else {
            dataRef.current = actions.adopt(r.data || { ...emptyData(), onboarded: true })
            lastSent.current = r.data ? fingerprint(dataRef.current) : null
          }
          setStatus('synced')
        } finally {
          done()
        }
      },

      // fresh: adding another account (nothing from the one you're on goes into it)
      async signUp(username, password, email, { fresh } = {}) {
        const local = fresh ? emptyData() : dataRef.current
        const r = await call('/account/signup', {
          method: 'POST',
          body: { username, password, email: email || null, data: upload(local) },
        })
        return signedUp(r, local, fresh)
      },

      // Logging in on a device that already has projects keeps both: they're merged into the account
      async logIn(username, password, { fresh } = {}) {
        if (fresh && readSaved().some((x) => x.username === username.toLowerCase())) return value.switchTo(username.toLowerCase())
        const r = await call('/account/login', { method: 'POST', body: { username, password } })
        return loggedIn(r, fresh)
      },

      // Passkeys: the same as signUp / logIn, with Face ID, a fingerprint or the screen lock instead of a password.
      // Throws the browser's NotAllowedError when the person cancels (nothing to show for that).
      passkeySupported,
      async passkeySignUp(username, { fresh } = {}) {
        const local = fresh ? emptyData() : dataRef.current
        const o = await call('/account/passkey/register/options', { method: 'POST', body: { username } })
        const cred = await createPasskey(o)
        const r = await call('/account/passkey/register/verify', { method: 'POST', body: { ...cred, data: upload(local) } })
        return signedUp({ ...r, password: false }, local, fresh)
      },
      async passkeyLogIn({ fresh } = {}) {
        const o = await call('/account/passkey/login/options', { method: 'POST' })
        const cred = await getPasskey(o)
        const r = await call('/account/passkey/login/verify', { method: 'POST', body: cred })
        // Already the account on this device: just keep the new session
        if (r.username === accountRef.current?.username) {
          start(r)
          return r
        }
        return loggedIn(r, fresh)
      },
      // A passkey for the account you're logged into, on this phone
      async addPasskey() {
        const key = accountRef.current.token
        const o = await call('/account/passkey/register/options', { method: 'POST', key, body: {} })
        return call('/account/passkey/register/verify', { method: 'POST', key, body: await createPasskey(o) })
      },

      // `forget`: also remove the projects and photos from this device
      async logOut(forget) {
        const a = accountRef.current
        if (a && !forget) await push().catch(() => {})
        if (a) call('/account/logout', { method: 'POST', key: a.token }).catch(() => {})
        if (a) dropSaved(a.username)
        refreshSaved()
        setAccount(null)
        lastSent.current = null
        setStatus('off')
        if (forget) {
          if (a) clearUp(a.username)
          await actions.resetAll()
        }
      },

      // Password reset by email (worker/blank-account.js): the link opens #/reset/<token>
      forgot: (login, lang) => call('/account/forgot', { method: 'POST', body: { login, lang } }),
      async resetPassword(token, password) {
        const r = await call('/account/reset', { method: 'POST', body: { token, password } })
        return value.logIn(r.username, password)
      },
      getEmail: () => call('/account', { key: accountRef.current.token }).then((r) => r.email || ''),
      setEmail: (email) => call('/account/email', { method: 'PUT', key: accountRef.current.token, body: { email } }),

      changePassword: (password, newPassword) =>
        call('/account/password', { method: 'POST', key: accountRef.current.token, body: { password, newPassword } }),

      async deleteAccount(password) {
        await call('/account', { method: 'DELETE', key: accountRef.current.token, body: { password } })
        clearUp(accountRef.current.username)
        dropSaved(accountRef.current.username)
        refreshSaved()
        setAccount(null)
        lastSent.current = null
        setStatus('off')
      },
    }
    return value
  }, [account, status, saved, pull, push, settle, actions, setAccount, refreshSaved])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAccount = () => useContext(Ctx)
export { ApiError }
