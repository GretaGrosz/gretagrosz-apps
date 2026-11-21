// Talking to Blank's social API (worker/blank-social.js) with your account's token (account.jsx).
import { useEffect, useState } from 'react'
import { call } from './buddy'
import { deviceId } from './sparks'
import { blobToDataUrl, getPhotoBlob } from './media'

export const api = (token) => ({
  me: () => call('/social/me', { key: token }),
  saveMe: (body) => call('/social/me', { method: 'PATCH', key: token, body }),
  acceptRules: () => call('/social/me/rules', { method: 'POST', key: token }),
  suggestions: (cats) => call(`/social/suggestions?cats=${cats.join(',')}`, { key: token }),
  search: (q) => call(`/social/search?q=${encodeURIComponent(q)}`, { key: token }),
  known: () => call('/social/known', { key: token }),
  samePlans: (guides, titles) => call(`/social/sameplans?guides=${guides.map(encodeURIComponent).join(',')}&titles=${titles.map(encodeURIComponent).join('|')}`, { key: token }),
  pushOn: (body) => call('/social/push', { method: 'POST', key: token, body }),
  pushOff: (endpoint) => call('/social/push', { method: 'DELETE', key: token, body: { endpoint } }),
  user: (username) => call(`/social/users/${encodeURIComponent(username)}`, { key: token }),
  friends: () => call('/social/friends', { key: token }),
  addFriend: (username, invite) => call(`/social/friends/${encodeURIComponent(username)}`, { method: 'POST', key: token, body: invite ? { invite } : undefined }),
  invite: () => call('/social/invite', { key: token }),
  removeFriend: (username) => call(`/social/friends/${encodeURIComponent(username)}`, { method: 'DELETE', key: token }),
  block: (username) => call(`/social/blocks/${encodeURIComponent(username)}`, { method: 'POST', key: token }),
  unblock: (username) => call(`/social/blocks/${encodeURIComponent(username)}`, { method: 'DELETE', key: token }),
  // Someone started a project from a post (counts for its author, "started because of you")
  startFromPost: (id) => call(`/social/posts/${id}/start`, { method: 'POST', key: token, body: { device: deviceId() } }),
  feed: (scope, before) => call(`/social/feed?scope=${scope}${before ? `&before=${before}` : ''}`, { key: token }),
  post: (body) => call('/social/posts', { method: 'POST', key: token, body }),
  publish: (id) => call(`/social/posts/${id}/publish`, { method: 'POST', key: token }),
  deletePost: (id) => call(`/social/posts/${id}`, { method: 'DELETE', key: token }),
  like: (id, on) => call(`/social/posts/${id}/like`, { method: on ? 'POST' : 'DELETE', key: token }),
  report: (id, reason) => call(`/social/posts/${id}/report`, { method: 'POST', key: token, body: { reason } }),
  reportUser: (username, reason) => call(`/social/users/${encodeURIComponent(username)}/report`, { method: 'POST', key: token, body: { reason } }),
  chats: () => call('/social/chats', { key: token }),
  unreadChats: () => call('/social/chats/unread', { key: token }),
  startChat: (body) => call('/social/chats', { method: 'POST', key: token, body }),
  chat: (id, { after, before } = {}) => call(`/social/chats/${id}${after ? `?after=${after}` : before ? `?before=${before}` : ''}`, { key: token }),
  renameChat: (id, body) => call(`/social/chats/${id}`, { method: 'PATCH', key: token, body }),
  send: (id, body) => call(`/social/chats/${id}/messages`, { method: 'POST', key: token, body }),
  typing: (id) => call(`/social/chats/${id}/typing`, { method: 'POST', key: token }),
  // Message requests (people who aren't your friends)
  sendRequest: (username, text) => call(`/social/requests/${encodeURIComponent(username)}`, { method: 'POST', key: token, body: { text } }),
  acceptRequest: (id) => call(`/social/chats/${id}/accept`, { method: 'POST', key: token, body: {} }),
  declineRequest: (id) => call(`/social/chats/${id}/decline`, { method: 'POST', key: token, body: {} }),
  // Doing a plan together (project chats)
  createProject: (body) => call('/social/projects', { method: 'POST', key: token, body }),
  join: (id) => call(`/social/chats/${id}/join`, { method: 'POST', key: token, body: {} }),
  progress: (id, body) => call(`/social/chats/${id}/progress`, { method: 'POST', key: token, body }),
  poke: (id) => call(`/social/chats/${id}/poke`, { method: 'POST', key: token, body: {} }),
  addItem: (id, text) => call(`/social/chats/${id}/items`, { method: 'POST', key: token, body: { text } }),
  item: (id, item, body) => call(`/social/chats/${id}/items/${item}`, { method: 'PATCH', key: token, body }),
  addSession: (id, body) => call(`/social/chats/${id}/sessions`, { method: 'POST', key: token, body }),
  deleteSession: (id, session) => call(`/social/chats/${id}/sessions/${session}`, { method: 'DELETE', key: token }),
  // One post by id (a post shared into a chat). Not called post(): that name is creating one, above
  getPost: (id) => call(`/social/posts/${id}`, { key: token }),
  addToChat: (id, add) => call(`/social/chats/${id}/members`, { method: 'POST', key: token, body: { add } }),
  leaveChat: (id) => call(`/social/chats/${id}/leave`, { method: 'POST', key: token }),
  react: (id, emoji) => call(`/social/messages/${id}/react`, { method: 'POST', key: token, body: { emoji } }),
  unsend: (id) => call(`/social/messages/${id}`, { method: 'DELETE', key: token }),
  reportMessage: (id, reason) => call(`/social/messages/${id}/report`, { method: 'POST', key: token, body: { reason } }),
  adminQueue: () => call('/social/admin', { key: token }),
  madeFrom: (id) => call(`/social/posts/${id}/made`, { key: token }),
  comments: (id) => call(`/social/posts/${id}/comments`, { key: token }),
  comment: (id, text) => call(`/social/posts/${id}/comments`, { method: 'POST', key: token, body: { text } }),
  deleteComment: (id) => call(`/social/comments/${id}`, { method: 'DELETE', key: token }),
  reportComment: (id, reason) => call(`/social/comments/${id}/report`, { method: 'POST', key: token, body: { reason } }),
  setCommentsOff: (id, commentsOff) => call(`/social/posts/${id}`, { method: 'PATCH', key: token, body: { commentsOff } }),
  adminCommentAction: (id, action) => call(`/social/admin/comments/${id}`, { method: 'POST', key: token, body: { action } }),
  adminMessageAction: (id, action) => call(`/social/admin/messages/${id}`, { method: 'POST', key: token, body: { action } }),
  adminAction: (id, action) => call(`/social/admin/posts/${id}`, { method: 'POST', key: token, body: { action } }),
  adminUserAction: (username, action) => call(`/social/admin/users/${encodeURIComponent(username)}`, { method: 'POST', key: token, body: { action } }),
})

// A photo of yours (an "idb:" ref) as a data: URL, ready to post
export async function photoForPost(ref) {
  const blob = await getPhotoBlob(ref)
  return blob ? blobToDataUrl(blob) : null
}

// Photo n of a post. Raw bytes, one photo per request.
export async function uploadMedia(token, postId, n, blob) {
  const res = await fetch(`/blank/api/social/posts/${postId}/media/${n}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': blob.type || 'image/jpeg' },
    body: blob,
  }).catch(() => null)
  if (!res) throw Object.assign(new Error('offline'), { code: 'offline' })
  if (!res.ok && res.status !== 409) {
    const b = await res.json().catch(() => ({}))
    throw Object.assign(new Error(b.error || 'server'), { code: b.error || 'server', status: res.status })
  }
}

// Where to load item n of a post from (older posts have one photo, at the same place as item 0)
export const mediaPath = (post, n) => `/social/posts/${post.id}/media/${n}`
export const mediaOf = (post) => post.media || (post.photo ? [{ ratio: post.ratio }] : [])

// A photo in a chat (raw bytes; the caption and the message it answers go in the address) → { message }
export async function sendChatPhoto(token, chatId, blob, { text = '', reply = null, ratio = 1 } = {}) {
  const q = new URLSearchParams({ text, ratio: String(Math.round(ratio * 1000) / 1000), ...(reply && { reply }) })
  const res = await fetch(`/blank/api/social/chats/${chatId}/photo?${q}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': blob.type || 'image/jpeg' },
    body: blob,
  }).catch(() => null)
  if (!res) throw Object.assign(new Error('offline'), { code: 'offline' })
  const b = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(b.error || 'server'), { code: b.error || 'server', status: res.status })
  return b
}

export async function uploadAvatar(token, blob) {
  const res = await fetch('/blank/api/social/me/avatar', {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': blob.type || 'image/jpeg' },
    body: blob,
  }).catch(() => null)
  if (!res) throw Object.assign(new Error('offline'), { code: 'offline' })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw Object.assign(new Error(b.error || 'server'), { code: b.error || 'server' })
  }
}

// Images that need your token (post photos, profile pictures): fetched once, kept as object URLs
const cache = new Map() // path -> Promise<url|null>
export function forgetImage(path) {
  cache.delete(path)
}
export function useAuthImage(path, token) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!path) return setUrl(null)
    // Without an account only public posts' photos load, straight from their (cached) address
    if (!token) return setUrl(`/blank/api${path}`)
    let alive = true
    if (!cache.has(path)) {
      cache.set(
        path,
        fetch(`/blank/api${path}`, { headers: { authorization: `Bearer ${token}` } })
          .then((r) => (r.ok ? r.blob() : null))
          .then((b) => (b ? URL.createObjectURL(b) : null))
          .catch(() => {
            cache.delete(path)
            return null
          }),
      )
    }
    cache.get(path).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [path, token])
  return url
}

// Your invite link: your profile plus your invite code. Whoever opens it and joins (or logs in) is your friend right
// away, no request to accept (worker/blank-social.js). Without the code it's just your profile.
export const inviteLink = (username, code) => `${location.origin}${import.meta.env.BASE_URL}#/u/${username}${code ? `?i=${code}` : ''}`
export const INVITE_CODE = /^[0-9a-f]{20}$/
export const invitePreview = (username, code) => call(`/social/invite/${encodeURIComponent(username)}/${code}`)

let inviteCode = { token: null, code: null }
async function myInviteCode(token) {
  if (inviteCode.token !== token) inviteCode = { token, code: (await api(token).invite()).code }
  return inviteCode.code
}

// Share sheet where there is one, otherwise copy. Returns 'shared' | 'copied' | 'cancelled' | 'failed'
export async function shareInvite(token, username, text) {
  const code = await myInviteCode(token).catch(() => null)
  const url = inviteLink(username, code)
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title: 'Blank', text, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
