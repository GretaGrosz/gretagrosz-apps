// Greta's inbox (/inbox/): every message from the contact sheet, every Weekend Ink request and every CV download.
// Reads /api/site/inbox with the inbox key (the INBOX_TOKEN secret), kept on this device only.
// Reply opens her mail app; Done files a message away; notifications arrive through /inbox/sw.js.
;(function () {
  I18N.add({
    'Inbox · Greta Grosz': 'Posteingang · Greta Grosz',
    'Inbox': 'Posteingang',
    'Inbox key': 'Schlüssel',
    'Open': 'Öffnen',
    'Refresh': 'Aktualisieren',
    'Notifications': 'Mitteilungen',
    'Lock': 'Sperren',
    'Show': 'Anzeigen',
    'Done': 'Erledigt',
    'Show older': 'Ältere anzeigen',
    'Reply': 'Antworten',
    'Mark done': 'Erledigt',
    'Reopen': 'Wieder öffnen',
    'Delete': 'Löschen',
    'Delete this message?': 'Diese Nachricht löschen?',
    'That key is not right.': 'Dieser Schlüssel stimmt nicht.',
    'The inbox key is not set on the server yet.': 'Der Schlüssel ist auf dem Server noch nicht gesetzt.',
    'No connection.': 'Keine Verbindung.',
    'Something went wrong. Try again.': 'Etwas ist schiefgelaufen. Versuch es noch einmal.',
    'No open messages.': 'Keine offenen Nachrichten.',
    'Nothing done yet.': 'Noch nichts erledigt.',
    'Sent very fast, maybe a bot': 'Sehr schnell gesendet, vielleicht ein Bot',
    'Notifications are on.': 'Mitteilungen sind an.',
    'Notifications are off.': 'Mitteilungen sind aus.',
    'Add this page to your Home Screen first (Share, then Add to Home Screen), then open it from there.':
      'Füge diese Seite zuerst zum Home-Bildschirm hinzu (Teilen, dann Zum Home-Bildschirm), und öffne sie von dort.',
    'Notifications are blocked for this site in the browser settings.': 'Mitteilungen sind für diese Seite in den Browser-Einstellungen blockiert.',
    'Logo': 'Logo',
    'Internship': 'Praktikum', 'Apps': 'Apps', 'Weekend Ink': 'Weekend Ink', 'Clothing': 'Kleidung', 'Something else': 'Etwas anderes',
    'Festival': 'Festival', 'Event': 'Event', 'Team': 'Team',
    'Their logo': 'Ihr Logo', 'A name': 'Ein Name', 'Their own idea': 'Eigene Idee', 'A QR code': 'Ein QR-Code',
    'On the arm': 'Auf dem Arm', 'Lettering': 'Schriftzug', 'QR code opens': 'QR-Code öffnet',
    '{n} people': '{n} Personen', '1 person': '1 Person',
    'Your message to Greta Grosz': 'Deine Nachricht an Greta Grosz',
    'Your Weekend Ink request': 'Deine Weekend-Ink-Anfrage',
    'CV download': 'Lebenslauf', 'My CV': 'Mein Lebenslauf', 'Blank feedback': 'Blank-Feedback', 'Your Blank feedback': 'Dein Feedback zu Blank',
  })
  I18N.applyDocument()
  document.documentElement.classList.add('js')

  const t = I18N.t
  const $ = (s, el = document) => el.querySelector(s)
  const KEY = 'gg-inbox-key'
  const lock = $('.ib-lock'), app = $('.ib-app'), list = $('.ib-list'), empty = $('.ib-empty'), more = $('.ib-more'), note = $('.ib-note')
  const keyForm = $('.ib-key'), keyErr = $('.ib-key .g-err'), keyBtn = $('.ib-key .send')
  const pushBtn = $('[data-act=push]')
  const TOPIC = { internship: 'Internship', apps: 'Apps', weekendink: 'Weekend Ink', clothing: 'Clothing', other: 'Something else', cv: 'CV download', blank: 'Blank feedback' }
  const OCC = { festival: 'Festival', event: 'Event', team: 'Team' }
  const DESIGN = { logo: 'Their logo', name: 'A name', qr: 'A QR code', idea: 'Their own idea' }

  let key = ''
  try { key = localStorage.getItem(KEY) || '' } catch (e) {}
  let status = 'open'
  let messages = []
  let more_ = false
  const logoUrls = new Map()

  class ApiError extends Error { constructor(code, status) { super(code); this.code = code; this.status = status } }
  async function api(path, opts = {}) {
    let res
    try {
      res = await fetch('/api/site' + path, { ...opts, headers: { authorization: `Bearer ${key}`, ...(opts.body ? { 'content-type': 'application/json' } : {}), ...(opts.headers || {}) } })
    } catch (e) { throw new ApiError('offline', 0) }
    if (!res.ok) {
      let data = {}
      try { data = await res.json() } catch (e) {}
      throw new ApiError(data.error || 'server', res.status)
    }
    return res
  }
  const errorText = (e) => t(e.code === 'unauthorized' ? 'That key is not right.' : e.code === 'inbox_not_set_up' ? 'The inbox key is not set on the server yet.' : e.code === 'offline' ? 'No connection.' : 'Something went wrong. Try again.')

  function showLock(msg) {
    app.hidden = true
    lock.hidden = false
    keyErr.textContent = msg || ''
    keyErr.classList.toggle('on', !!msg)
    keyForm.elements.key.focus()
  }

  keyForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const v = keyForm.elements.key.value.trim()
    if (!v) return
    key = v
    keyBtn.classList.add('busy'); keyBtn.disabled = true
    try {
      await load(true)
      try { localStorage.setItem(KEY, key) } catch (x) {}
      keyForm.reset()
    } catch (x) {
      key = ''
      showLock(errorText(x))
    } finally { keyBtn.classList.remove('busy'); keyBtn.disabled = false }
  })

  const fmtDate = (ms) => {
    const d = new Date(ms), now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    const loc = I18N.lang === 'de' ? 'de-AT' : 'en-GB'
    return sameDay ? d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' }) + ' · ' + d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  function detailsLine(d) {
    if (!d) return ''
    if (d.company) return esc(d.company)
    const parts = [t(OCC[d.occasion] || d.occasion), t(DESIGN[d.design] || d.design)]
    if (d.date) parts.push(new Date(d.date + 'T12:00:00').toLocaleDateString(I18N.lang === 'de' ? 'de-AT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    if (d.people) parts.push(d.people === 1 ? t('1 person') : t('{n} people').replace('{n}', I18N.num(d.people)))
    if (d.size) parts.push(`${I18N.num(d.size, { maximumFractionDigits: 1 })} cm`)
    return parts.map(esc).join(' · ')
  }

  function card(m) {
    const subject = m.kind === 'weekendink' ? t('Your Weekend Ink request') : m.kind === 'cv' ? t('My CV') : m.kind === 'blank' ? t('Your Blank feedback') : t('Your message to Greta Grosz')
    const quote = m.body ? m.body.split('\n').map((l) => '> ' + l).join('\n') : ''
    const mailto = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent((m.kind === 'cv' ? '' : 'Re: ') + subject)}&body=${encodeURIComponent('\n\n' + quote)}`
    const li = document.createElement('li')
    li.className = 'ib-msg' + (m.done ? ' done' : '')
    li.id = m.id
    li.innerHTML = `
      <div class="ib-meta"><span class="ib-topic t-${esc(m.topic)}" data-no-i18n>${esc(t(TOPIC[m.topic] || m.topic))}</span>${m.suspect ? `<span class="ib-sus" data-no-i18n>${esc(t('Sent very fast, maybe a bot'))}</span>` : ''}<time data-no-i18n datetime="${new Date(m.created).toISOString()}">${esc(fmtDate(m.created))}</time></div>
      <h2 data-no-i18n>${esc(m.name)}</h2>
      ${m.email ? `<a class="ib-mail" data-no-i18n href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}
      ${m.details ? `<p class="ib-det" data-no-i18n>${detailsLine(m.details)}</p>` : ''}
      ${m.details && m.details.text ? `<p class="ib-det" data-no-i18n>${esc(t('Lettering'))}: „${esc(m.details.text)}“</p>` : ''}
      ${m.details && m.details.qr ? `<p class="ib-det" data-no-i18n>${esc(t('QR code opens'))}: ${/^https?:\/\//i.test(m.details.qr) ? `<a href="${esc(m.details.qr)}" target="_blank" rel="noopener noreferrer">${esc(m.details.qr)}</a>` : esc(m.details.qr)}</p>` : ''}
      ${m.body ? `<p class="ib-body" data-no-i18n>${esc(m.body)}</p>` : ''}
      ${m.has_preview ? `<figure class="ib-preview"><img alt="${esc(t('On the arm'))}" /></figure>` : ''}
      ${m.has_logo ? `<figure class="ib-logo"><img alt="${esc(t('Logo'))}" /></figure>` : ''}
      <div class="ib-acts">
        ${m.email ? `<a class="btn small" href="${mailto}">Reply</a>` : ''}
        <button type="button" class="btn small soft" data-done>${m.done ? 'Reopen' : 'Mark done'}</button>
        <button type="button" class="btn small soft ib-del" data-del>Delete</button>
      </div>`
    I18N.apply(li)
    if (m.has_preview) loadLogo(m.id, li.querySelector('.ib-preview img'), 'preview')
    if (m.has_logo) loadLogo(m.id, li.querySelector('.ib-logo img'))
    li.querySelector('[data-done]').addEventListener('click', () => setDone(m, li))
    li.querySelector('[data-del]').addEventListener('click', () => remove(m, li))
    return li
  }

  async function loadLogo(id, img, what = 'logo') {
    const k = `${id}/${what}`
    try {
      if (!logoUrls.has(k)) logoUrls.set(k, URL.createObjectURL(await (await api(`/inbox/${id}/${what}`)).blob()))
      img.src = logoUrls.get(k)
    } catch (e) { img.closest('figure').remove() }
  }

  function render() {
    list.replaceChildren(...messages.map(card))
    empty.hidden = messages.length > 0
    empty.textContent = t(status === 'open' ? 'No open messages.' : 'Nothing done yet.')
    more.hidden = !more_
    const target = location.hash.slice(1)
    if (target && document.getElementById(target)) {
      const el = document.getElementById(target)
      el.classList.add('hit')
      el.scrollIntoView({ block: 'center' })
    }
  }

  async function load(reset) {
    const before = reset || !messages.length ? '' : `&before=${messages[messages.length - 1].created}`
    const data = await (await api(`/inbox?status=${status}${before}`)).json()
    messages = reset ? data.messages : messages.concat(data.messages)
    more_ = data.more
    $('.n-open').textContent = data.counts.open || ''
    $('.n-done').textContent = data.counts.done || ''
    document.title = (data.counts.open ? `(${data.counts.open}) ` : '') + t('Inbox · Greta Grosz')
    lock.hidden = true
    app.hidden = false
    note.textContent = ''
    render()
  }
  async function reload() {
    try { await load(true) } catch (e) {
      if (e.status === 401) { try { localStorage.removeItem(KEY) } catch (x) {} key = ''; showLock(errorText(e)) }
      else note.textContent = errorText(e)
    }
  }

  async function setDone(m, li) {
    const next = !m.done
    li.classList.add('leaving')
    try {
      await api(`/inbox/${m.id}`, { method: 'PATCH', body: JSON.stringify({ done: next }) })
      await reload()
    } catch (e) { li.classList.remove('leaving'); note.textContent = errorText(e) }
  }
  async function remove(m, li) {
    if (!confirm(t('Delete this message?'))) return
    li.classList.add('leaving')
    try {
      await api(`/inbox/${m.id}`, { method: 'DELETE' })
      await reload()
    } catch (e) { li.classList.remove('leaving'); note.textContent = errorText(e) }
  }

  document.querySelectorAll('input[name=status]').forEach((r) => r.addEventListener('change', () => { status = r.value; reload() }))
  $('[data-act=refresh]').addEventListener('click', reload)
  $('[data-act=lock]').addEventListener('click', () => {
    try { localStorage.removeItem(KEY) } catch (e) {}
    key = ''; messages = []; list.replaceChildren(); showLock()
  })
  more.addEventListener('click', async () => { try { await load(false) } catch (e) { note.textContent = errorText(e) } })
  document.addEventListener('visibilitychange', () => { if (!document.hidden && key) reload() })
  addEventListener('hashchange', render)

  /* ---------- Notifications ---------- */
  const canPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  let reg = null
  const b64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0))

  async function pushState() {
    const sub = reg && (await reg.pushManager.getSubscription())
    pushBtn.setAttribute('aria-pressed', String(!!sub))
    return sub
  }
  if (canPush || isIOS) {
    fetch('/api/site/push/key').then((r) => r.json()).then(async ({ key: vapid }) => {
      if (!vapid) return
      pushBtn.hidden = false
      if (canPush) {
        reg = await navigator.serviceWorker.register('/inbox/sw.js', { scope: '/inbox/' })
        await pushState()
      }
      pushBtn.addEventListener('click', async () => {
        if (isIOS && !standalone) { note.textContent = t('Add this page to your Home Screen first (Share, then Add to Home Screen), then open it from there.'); return }
        if (!reg) return
        try {
          const sub = await pushState()
          if (sub) {
            await api('/push', { method: 'DELETE', body: JSON.stringify({ endpoint: sub.endpoint }) })
            await sub.unsubscribe()
            note.textContent = t('Notifications are off.')
          } else {
            if ((await Notification.requestPermission()) !== 'granted') { note.textContent = t('Notifications are blocked for this site in the browser settings.'); return }
            const s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(vapid) })
            await api('/push', { method: 'POST', body: JSON.stringify(s.toJSON()) })
            note.textContent = t('Notifications are on.')
          }
          await pushState()
        } catch (e) { note.textContent = e instanceof ApiError ? errorText(e) : t('Something went wrong. Try again.') }
      })
    }).catch(() => {})
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.open) { location.hash = new URL(e.data.open).hash; reload() }
  })

  if (key) reload()
  else showLock()
})()
