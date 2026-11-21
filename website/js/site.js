// Shared behaviour for every page. Loaded last (after i18n.js and the page dictionaries).
//   SITE.sheet(dialog)   open/close a <dialog class="gsheet"> with the shared motion, backdrop tap and focus return
//   SITE.send(payload)   POST a message to /api/site/messages; resolves { id } or rejects with { code, field }
//   SITE.contact(topic)  open the "Write to me" sheet
;(function () {
  const LINKEDIN = 'https://www.linkedin.com/in/greta-grosz'
  const html = document.documentElement
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const t = (s) => I18N.t(s)
  html.classList.add('js')

  /* ---------- Sheets ---------- */
  function sheet(dialog) {
    let closing = 0
    let returnTo = null
    function open(from) {
      if (dialog.open) return
      clearTimeout(closing)
      returnTo = from || document.activeElement
      html.classList.add('sheet-open')
      dialog.showModal()
      // Start on the sheet itself, not with a focus ring on its close button (Tab still reaches everything)
      dialog.tabIndex = -1
      dialog.focus({ preventScroll: true })
      requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('on')))
    }
    function close() {
      if (!dialog.open) return
      dialog.classList.remove('on')
      html.classList.remove('sheet-open')
      clearTimeout(closing)
      closing = setTimeout(() => dialog.close(), reduced.matches ? 0 : 240)
    }
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close() })
    dialog.addEventListener('close', () => {
      dialog.classList.remove('on')
      html.classList.remove('sheet-open')
      // Safari does not focus a tapped button, so hand focus back explicitly
      if (returnTo && returnTo.isConnected && returnTo.focus) returnTo.focus({ preventScroll: true })
    })
    // A tap on the backdrop lands on the <dialog> itself, outside its box
    dialog.addEventListener('click', (e) => {
      if (e.target !== dialog) return
      const r = dialog.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close()
    })
    dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close))
    return { open, close }
  }

  /* ---------- Sending a message ---------- */
  const ERRORS = {
    name: 'Add your name.',
    email: 'Check your email address.',
    message: 'Write a little more, at least a sentence.',
    date: 'Pick a date that is still to come.',
    people: 'Check the number of people.',
    logo: 'That image could not be attached. Try a PNG or JPG.',
    rate: 'Too many messages from this connection. Try again in a few minutes.',
    offline: 'No connection. Your message is still here, send it again when you are online.',
    other: 'That did not go through. Try again, or message me on LinkedIn.',
  }
  const errorText = (code) => t(ERRORS[code] || ERRORS.other)
  const EMAIL = /^[^\s@<>()",;:\\]+@[^\s@<>()",;:\\]+\.[^\s@<>()",;:\\]{2,}$/

  async function send(payload) {
    if (!navigator.onLine) throw { code: 'offline' }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20000)
    let res
    try {
      res = await fetch('/api/site/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, lang: I18N.lang, page: location.pathname }),
        signal: ctrl.signal,
      })
    } catch (e) {
      throw { code: navigator.onLine ? 'other' : 'offline' }
    } finally { clearTimeout(timer) }
    let data = {}
    try { data = await res.json() } catch (e) {}
    if (res.ok && data.ok) return data
    if (res.status === 429) throw { code: 'rate' }
    if (res.status === 400 && data.field) throw { code: data.field, field: data.field }
    throw { code: 'other' }
  }

  // Name and email are remembered on this device once a message has gone out, so the next form is filled in
  const ME_KEY = 'gg-me'
  const me = () => { try { return JSON.parse(localStorage.getItem(ME_KEY)) || {} } catch (e) { return {} } }
  const rememberMe = (name, email) => { try { localStorage.setItem(ME_KEY, JSON.stringify({ name, email })) } catch (e) {} }

  /* ---------- "Write to me" ---------- */
  const TOPICS = [['internship', 'Internship'], ['apps', 'Apps'], ['weekendink', 'Weekend Ink'], ['clothing', 'Clothing'], ['other', 'Something else']]
  const DRAFT_KEY = 'gg-contact-draft'
  const xIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  const okIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'

  function contactMarkup(inline) {
    return `
      ${inline ? '' : `<div class="gs-top"><h2 id="cs-h">Write to me</h2><button type="button" class="gs-x" data-close aria-label="Close">${xIcon}</button></div>`}
      <form class="gs-form cs-form" novalidate>
        <fieldset><legend>About</legend><div class="gchips">${TOPICS.map(([v, l], i) => `<label><input type="radio" name="topic" value="${v}"${i ? '' : ' checked'} /><span>${l}</span></label>`).join('')}</div></fieldset>
        <div class="gpair stack">
          <label class="gfield" data-f="name"><span>Name</span><input name="name" autocomplete="name" maxlength="80" required /></label>
          <label class="gfield" data-f="email"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="200" required /></label>
        </div>
        <label class="gfield" data-f="message"><span>Message</span><textarea name="message" rows="5" maxlength="4000" required></textarea></label>
        <label class="g-hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label>
        <p class="g-err" role="alert" data-no-i18n></p>
        <div class="gs-acts"><button type="submit" class="btn send"><span class="l">Send</span><span class="spin" aria-hidden="true"></span></button></div>
        <div class="gs-alt"><a class="link" href="${LINKEDIN}" target="_blank" rel="noopener">Or message me on LinkedIn</a></div>
      </form>
      <div class="gs-done" hidden>
        <span class="ok">${okIcon}</span>
        <h3>Sent.</h3>
        <p data-no-i18n></p>
        <button type="button" class="btn soft" ${inline ? 'data-again' : 'data-close'}>${inline ? 'Write another' : 'Done'}</button>
      </div>`
  }

  function wireContact(root, onSent) {
    const form = root.querySelector('.cs-form')
    const done = root.querySelector('.gs-done')
    const err = form.querySelector('.g-err')
    const btn = form.querySelector('.send')
    const f = form.elements
    let started = 0

    const draft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {} } catch (e) { return {} } }
    function fill() {
      const d = draft(), m = me()
      f.name.value = d.name || m.name || ''
      f.email.value = d.email || m.email || ''
      f.message.value = d.message || ''
      if (d.topic && f.topic) [...f.topic].forEach((r) => (r.checked = r.value === d.topic))
    }
    function save() {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ topic: f.topic.value, name: f.name.value, email: f.email.value, message: f.message.value })) } catch (e) {}
    }
    function mark(field) {
      form.querySelectorAll('.gfield.bad').forEach((x) => x.classList.remove('bad'))
      if (!field) return
      const box = form.querySelector(`[data-f="${field}"]`)
      if (!box) return
      void box.offsetWidth
      box.classList.add('bad')
      box.querySelector('input, textarea').focus()
    }
    function showError(code) {
      err.dataset.code = code
      err.textContent = errorText(code)
      err.classList.add('on')
    }
    function reset(topic) {
      fill()
      if (topic) [...f.topic].forEach((r) => (r.checked = r.value === topic))
      err.classList.remove('on')
      mark(null)
      form.hidden = false
      done.hidden = true
      started = Date.now()
    }

    form.addEventListener('input', (e) => {
      save()
      const box = e.target.closest('.gfield')
      if (box) box.classList.remove('bad')
      if (err.classList.contains('on')) err.classList.remove('on')
    })
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (btn.classList.contains('busy')) return
      const name = f.name.value.trim(), email = f.email.value.trim(), message = f.message.value.trim()
      const bad = !name ? 'name' : !EMAIL.test(email) ? 'email' : message.length < 10 ? 'message' : null
      if (bad) { mark(bad); showError(bad); return }
      btn.classList.add('busy')
      btn.disabled = true
      try {
        await send({ kind: 'contact', topic: f.topic.value, name, email, message, website: f.website.value, typingMs: Date.now() - started })
        rememberMe(name, email)
        try { localStorage.removeItem(DRAFT_KEY) } catch (e) {}
        done.querySelector('p').textContent = t('Thanks, {name}. I’ll reply to {email}.').replace('{name}', name.split(/\s+/)[0]).replace('{email}', email)
        form.hidden = true
        done.hidden = false
        f.message.value = ''
        done.querySelector('.btn').focus({ preventScroll: true })
        if (onSent) onSent()
      } catch (x) {
        if (x.field) mark(x.field)
        showError(x.code)
      } finally {
        btn.classList.remove('busy')
        btn.disabled = false
      }
    })
    const again = root.querySelector('[data-again]')
    if (again) again.addEventListener('click', () => { reset(); f.message.focus() })
    document.addEventListener('langchange', () => { if (err.classList.contains('on') && err.dataset.code) showError(err.dataset.code) })
    return { reset }
  }

  let contactSheet = null
  function contact(topic, from) {
    if (!contactSheet) {
      const dialog = document.createElement('dialog')
      dialog.className = 'gsheet cs-sheet'
      dialog.setAttribute('aria-labelledby', 'cs-h')
      dialog.innerHTML = `<div class="gs-body">${contactMarkup(false)}</div>`
      document.body.appendChild(dialog)
      I18N.apply(dialog)
      const s = sheet(dialog)
      contactSheet = { ...s, ...wireContact(dialog), dialog }
    }
    contactSheet.reset(topic)
    contactSheet.open(from)
  }

  // A page can hold the form inline (/contact/): <div data-contact-form data-topic="…"></div>
  document.querySelectorAll('[data-contact-form]').forEach((el) => {
    el.innerHTML = contactMarkup(true)
    I18N.apply(el)
    const topic = new URLSearchParams(location.search).get('topic')
    wireContact(el).reset(TOPICS.some(([v]) => v === topic) ? topic : el.dataset.topic)
  })

  /* ---------- Contact buttons: any element with [data-contact] gets them ---------- */
  const inIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-4.95c0-1.18-.02-2.7-1.65-2.7-1.65 0-1.9 1.29-1.9 2.62V21h-4V9.75Z"/></svg>'
  document.querySelectorAll('[data-contact]').forEach((el) => {
    const topic = el.dataset.contact || 'internship'
    el.innerHTML = [
      `<button type="button" class="btn" data-contact-open="${topic}">Write to me</button>`,
      `<a class="btn soft" href="${LINKEDIN}" target="_blank" rel="noopener">${inIcon}LinkedIn</a>`,
    ].join('')
  })
  const canSheet = typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-contact-open]')
    if (!b) return
    e.preventDefault()
    if (canSheet) contact(b.dataset.contactOpen, b)
    else location.href = `/contact/?topic=${encodeURIComponent(b.dataset.contactOpen || '')}`
  })
  if (location.hash === '#write' && canSheet) requestAnimationFrame(() => contact())

  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()))

  window.SITE = { sheet, send, contact, errorText, rememberMe, me, LINKEDIN, EMAIL }

  /* ---------- Language switch: the text you were reading stays where it was ---------- */
  function switchLang(next) {
    let anchor = null, top = 0
    const nav = 80
    for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main li, main dt')) {
      const r = el.getBoundingClientRect()
      if (r.height && r.top >= nav && r.top < innerHeight) { anchor = el; top = r.top; break }
    }
    I18N.set(next)
    if (!anchor) return
    const d = anchor.getBoundingClientRect().top - top
    if (Math.abs(d) > 1) scrollTo({ top: scrollY + d, behavior: 'instant' })
  }
  document.querySelectorAll('.lang button[data-lang]').forEach((b) => b.addEventListener('click', () => switchLang(b.dataset.lang)))
  I18N.applyDocument()

  /* ---------- Reveal on scroll ---------- */
  const rv = document.querySelectorAll('.rv')
  if (reduced.matches || !('IntersectionObserver' in window)) rv.forEach((el) => el.classList.add('in'))
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    rv.forEach((el) => io.observe(el))
  }

  /* ---------- Scenes: <div class="scene" data-scene="deca"></div> loads /scenes/deca.js (+ .css) shortly before
     it scrolls into view and calls its mount(el). Nothing is downloaded for scenes you never reach. ---------- */
  const scenes = document.querySelectorAll('[data-scene]')
  if (scenes.length) {
    const v = document.querySelector('meta[name="build"]')?.content || ''
    const q = v ? `?v=${v}` : ''
    const load = (el) => {
      if (el.dataset.mounted) return
      el.dataset.mounted = '1'
      const name = el.dataset.scene
      if (!document.querySelector(`link[data-scene-css="${name}"]`)) {
        const l = document.createElement('link')
        l.rel = 'stylesheet'; l.href = `/scenes/${name}.css${q}`; l.dataset.sceneCss = name
        document.head.appendChild(l)
      }
      import(`/scenes/${name}.js${q}`)
        .then((m) => m.mount(el))
        .catch((err) => { el.classList.add('scene-failed'); setTimeout(() => { throw err }) })
    }
    if (!('IntersectionObserver' in window)) scenes.forEach(load)
    else {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { load(e.target); io.unobserve(e.target) }
      }), { rootMargin: '600px 0px' })
      scenes.forEach((el) => io.observe(el))
    }
  }
})()
