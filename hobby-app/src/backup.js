// Saving files out of the app: backups, reels and cards. Uses the share sheet where the device has one
// (iPhone: "Save to Files", AirDrop, Instagram…), otherwise a normal download.
import { makeBackup } from './store'

export function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

const touchDevice = () => window.matchMedia?.('(pointer: coarse)').matches

// Returns 'shared' | 'downloaded' | 'cancelled'
export async function shareOrDownload(blob, name, { title, preferShare = touchDevice() } = {}) {
  const file = new File([blob], name, { type: blob.type })
  if (preferShare && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
      // Sharing failed for another reason (permissions, size): fall back to a download
    }
  }
  download(blob, name)
  return 'downloaded'
}

export async function exportBackup(data) {
  const blob = await makeBackup(data)
  const date = new Date().toISOString().slice(0, 10)
  // A backup is a file to keep, so it's always a download (the share sheet would offer apps that can't open it)
  download(blob, `blank-backup-${date}.json`)
  return blob.size
}
