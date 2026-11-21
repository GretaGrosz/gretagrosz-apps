// "I changed my mind" as an image: drawn on a canvas from the real app icon, shared through the share sheet
// (Instagram story, WhatsApp, AirDrop …) where the browser can share files, downloaded where it can't.
import { appLink } from './api.js'
import { t } from './i18n.js'

const W = 1080, H = 1350
const SERIF = 'ui-serif, "New York", Georgia, serif'
const SANS = '-apple-system, "SF Pro Text", system-ui, sans-serif'

function wrap(g, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const next = line ? line + ' ' + w : w
    if (g.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = w
      if (lines.length === maxLines) break
    } else line = next
  }
  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    let last = lines[maxLines - 1]
    while (g.measureText(last + '…').width > maxWidth && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '))
    lines[maxLines - 1] = last.replace(/[,.;:]$/, '') + '…'
  }
  return lines
}

async function render({ question, side, by, me }) {
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  const css = getComputedStyle(document.documentElement)
  const accent = `rgb(${css.getPropertyValue('--accent').trim().split(/\s+/).join(',')})`
  g.fillStyle = '#F2F2F7'
  g.fillRect(0, 0, W, H)

  const icon = new Image()
  icon.src = '/stance/icon-192.png'
  await icon.decode().catch(() => {})
  if (icon.naturalWidth) g.drawImage(icon, 80, 80, 96, 96)
  g.fillStyle = '#000'
  g.font = `700 44px ${SANS}`
  g.fillText('Agora', 196, 144)

  // The card
  const x = 64, y = 210, w = W - 128, h = 1040
  g.fillStyle = '#fff'
  g.beginPath(); g.roundRect(x, y, w, h, 48); g.fill()

  let cy = y + 96
  g.fillStyle = accent
  g.font = `600 32px ${SANS}`
  g.fillText((question?.title || '').toUpperCase(), x + 64, cy)
  cy += 30
  g.fillStyle = '#000'
  g.font = `500 52px ${SERIF}`
  for (const l of wrap(g, question?.question || '', w - 128, 3)) { cy += 66; g.fillText(l, x + 64, cy) }

  cy += 124
  g.font = `700 76px ${SANS}`
  g.fillText(t('share.changed'), x + 64, cy)
  cy += 70
  g.fillStyle = accent
  g.font = `600 40px ${SANS}`
  g.fillText(t('share.now', { side: question?.sides?.[side] || '' }), x + 64, cy)

  if (by?.text) {
    cy += 56
    g.fillStyle = '#F2F2F7'
    const qh = 300
    g.beginPath(); g.roundRect(x + 48, cy, w - 96, qh, 32); g.fill()
    g.fillStyle = '#1C1C1E'
    g.font = `italic 400 38px ${SERIF}`
    let qy = cy + 24
    for (const l of wrap(g, `“${by.text}”`, w - 176, 4)) { qy += 52; g.fillText(l, x + 88, qy) }
    g.fillStyle = '#6C6C70'
    g.font = `600 30px ${SANS}`
    g.fillText(t('share.argumentBy', { handle: by.handle }), x + 88, cy + qh - 36)
  }

  g.fillStyle = '#6C6C70'
  g.font = `500 34px ${SANS}`
  g.fillText(me ? `@${me.handle}` : '', x + 64, y + h - 56)
  g.textAlign = 'right'
  g.fillText('gretagrosz.com/stance', x + w - 64, y + h - 56)
  g.textAlign = 'left'

  return new Promise((resolve, reject) => c.toBlob(b => (b ? resolve(b) : reject(new Error(t('err.generic')))), 'image/png'))
}

export async function shareSwitch(opts) {
  const blob = await render(opts)
  const file = new File([blob], 'agora-changed-my-mind.png', { type: 'image/png' })
  const url = opts.question ? appLink(`q/${opts.question.id}`) : appLink('today')
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: t('share.changed'), text: url })
    return
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
