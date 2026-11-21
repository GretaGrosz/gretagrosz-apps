// CV page: the print button prints the sheet; Download PDF asks for name, email and company first.
// The PDF (Greta's Lebenslauf, with phone number and date of birth) is not a public file: POST /api/site/cv
// answers a personal link to it (worker/site.js), and Greta sees each request in her inbox.
// The link is kept on this device for its 30 days, so a recruiter coming back downloads straight away.
;(function () {
  const pdf = document.querySelector('[data-cv-pdf]')
  const print = document.querySelector('[data-cv-print]')
  const peek = document.querySelector('.cv-peek')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const t = (s) => I18N.t(s)

  /* ---------- Download PDF: a short form, then the file ---------- */
  const CV_KEY = 'gg-cv'
  const CV_DAYS = 29   // one day short of the server's 30, so a kept link never turns up expired
  const saved = () => { try { const v = JSON.parse(localStorage.getItem(CV_KEY)); return v && v.url && v.exp > Date.now() ? v : null } catch (e) { return null } }
  const CV_ERRORS = {
    name: 'Please add your name.',
    email: 'Please check your email address.',
    company: 'Add your company or organisation.',
    rate: 'Too many requests from this connection. Try again in a few minutes.',
    offline: 'No connection. Try again when you are online.',
    other: 'That did not go through. Please try again, or message me on LinkedIn.',
  }
  const xIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  const okIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'

  function download(url) {
    const a = document.createElement('a')
    a.href = url
    a.download = 'Greta_Grosz_Lebenslauf.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  let gate = null
  function makeGate() {
    const dialog = document.createElement('dialog')
    dialog.className = 'gsheet cvg'
    dialog.setAttribute('aria-labelledby', 'cvg-h')
    dialog.innerHTML = `<div class="gs-body">
      <div class="gs-top"><h2 id="cvg-h">Download my CV</h2><button type="button" class="gs-x" data-close aria-label="Close">${xIcon}</button></div>
      <p class="cvg-lead">My full CV has my phone number and date of birth, so I share it with people who are hiring. Tell me who you are and the PDF downloads straight away.</p>
      <form class="gs-form cvg-form" novalidate>
        <div class="gpair stack">
          <label class="gfield" data-f="name"><span>Your name</span><input name="name" autocomplete="name" maxlength="80" required /></label>
          <label class="gfield" data-f="email"><span>Work email</span><input name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="200" required /></label>
        </div>
        <label class="gfield" data-f="company"><span>Company or organisation</span><input name="company" autocomplete="organization" maxlength="120" required /></label>
        <label class="g-hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label>
        <p class="g-err" role="alert" data-no-i18n></p>
        <div class="gs-acts"><button type="submit" class="btn send"><span class="l">Download PDF</span><span class="spin" aria-hidden="true"></span></button></div>
        <p class="cvg-fine">Only I see these details, and I use them only to get back to you.</p>
      </form>
      <div class="gs-done" hidden>
        <span class="ok">${okIcon}</span>
        <h3>Your download has started.</h3>
        <p data-no-i18n></p>
        <a class="link cvg-again" href="#">Download again</a>
        <button type="button" class="btn soft" data-close>Done</button>
      </div>
    </div>`
    document.body.appendChild(dialog)
    I18N.apply(dialog)
    const s = SITE.sheet(dialog)
    const form = dialog.querySelector('.cvg-form'), done = dialog.querySelector('.gs-done')
    const err = form.querySelector('.g-err'), btn = form.querySelector('.send'), again = dialog.querySelector('.cvg-again')
    const lead = dialog.querySelector('.cvg-lead')
    const f = form.elements
    let started = 0

    function mark(field) {
      form.querySelectorAll('.gfield.bad').forEach((x) => x.classList.remove('bad'))
      const box = field && form.querySelector(`[data-f="${field}"]`)
      if (!box) return
      void box.offsetWidth
      box.classList.add('bad')
      box.querySelector('input').focus()
    }
    function showError(code) {
      err.dataset.code = code
      err.textContent = t(CV_ERRORS[code] || CV_ERRORS.other)
      err.classList.add('on')
    }
    function showDone(name, url) {
      again.href = url
      done.querySelector('p').textContent = t('Thanks, {name}. The PDF is in German, the language I study in.').replace('{name}', name.split(/\s+/)[0])
      lead.hidden = true
      form.hidden = true
      done.hidden = false
      done.querySelector('.btn').focus({ preventScroll: true })
    }
    function reset() {
      const m = SITE.me(), kept = (() => { try { return JSON.parse(localStorage.getItem(CV_KEY)) || {} } catch (e) { return {} } })()
      f.name.value = f.name.value || m.name || ''
      f.email.value = f.email.value || m.email || ''
      f.company.value = f.company.value || kept.company || ''
      err.classList.remove('on')
      mark(null)
      lead.hidden = false
      form.hidden = false
      done.hidden = true
      started = Date.now()
    }

    form.addEventListener('input', (e) => {
      const box = e.target.closest('.gfield')
      if (box) box.classList.remove('bad')
      err.classList.remove('on')
    })
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (btn.classList.contains('busy')) return
      const name = f.name.value.trim(), email = f.email.value.trim(), company = f.company.value.trim()
      const bad = !name ? 'name' : !SITE.EMAIL.test(email) ? 'email' : company.length < 2 ? 'company' : null
      if (bad) { mark(bad); showError(bad); return }
      if (!navigator.onLine) { showError('offline'); return }
      btn.classList.add('busy')
      btn.disabled = true
      try {
        let res, data = {}
        try {
          res = await fetch('/api/site/cv', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name, email, company, website: f.website.value, typingMs: Date.now() - started, lang: I18N.lang, page: location.pathname }),
          })
          data = await res.json()
        } catch (x) { throw { code: navigator.onLine ? 'other' : 'offline' } }
        if (!res.ok || !data.url) throw { code: res.status === 429 ? 'rate' : res.status === 400 && data.field ? data.field : 'other', field: res.status === 400 ? data.field : null }
        SITE.rememberMe(name, email)
        try { localStorage.setItem(CV_KEY, JSON.stringify({ url: data.url, exp: Date.now() + CV_DAYS * 86_400_000, name, company })) } catch (x) {}
        download(data.url)
        showDone(name, data.url)
      } catch (x) {
        if (x.field) mark(x.field)
        showError(x.code)
      } finally {
        btn.classList.remove('busy')
        btn.disabled = false
      }
    })
    again.addEventListener('click', (e) => { e.preventDefault(); download(again.href) })
    document.addEventListener('langchange', () => { if (err.classList.contains('on') && err.dataset.code) showError(err.dataset.code) })
    return { ...s, reset }
  }

  function askForCv() {
    const kept = saved()
    if (kept) { download(kept.url); return }
    if (!(typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype)) { location.href = '/contact/?topic=internship'; return }
    if (!gate) gate = makeGate()
    gate.reset()
    gate.open(pdf)
  }

  function hop() {
    if (!peek || reduced.matches) return
    peek.classList.remove('hop')
    void peek.offsetWidth   // restart the animation on repeated clicks
    peek.classList.add('hop')
  }
  if (peek) peek.addEventListener('animationend', () => peek.classList.remove('hop'))

  if (pdf) pdf.addEventListener('click', () => { hop(); askForCv() })

  if (print && typeof window.print === 'function') {
    print.hidden = false
    print.addEventListener('click', () => window.print())
  }

  // Copy as text: the whole CV as plain text in the current language, for job portals that want it pasted
  const copy = document.querySelector('[data-cv-text]')
  const sheet = document.querySelector('.sheet')
  const label = () => I18N.t('Copy as text')
  function cvText() {
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')
    const out = []
    const head = sheet.querySelector('.head')
    out.push(txt(head.querySelector('h1')), txt(head.querySelector('.role')), txt(head.querySelector('.seek')), '', txt(head.querySelector('.profile')))
    for (const sec of sheet.querySelectorAll('.sec')) {
      out.push('', txt(sec.querySelector('h2')).toUpperCase())
      for (const li of sec.querySelectorAll('.rows > li')) {
        const body = li.querySelector('div')
        const parts = [...body.children].filter((c) => c.tagName !== 'UL' && !c.classList.contains('url')).map(txt).filter(Boolean)
        out.push(`${txt(li.querySelector('.when'))}: ${parts.join(' · ')}`)
        body.querySelectorAll('.sub > li').forEach((s) => out.push(`  - ${txt(s)}`))
        const url = body.querySelector('.url a')
        if (url) out.push(`  ${url.href.replace(/\/$/, '')}`)
      }
    }
    for (const block of sheet.querySelectorAll('.side .block')) {
      out.push('', txt(block.querySelector('h2')).toUpperCase())
      block.querySelectorAll('.facts > div').forEach((d) => {
        const a = d.querySelector('a')
        out.push(`${txt(d.querySelector('dt'))}: ${a ? a.href.replace(/\/$/, '') : txt(d.querySelector('dd'))}`)
      })
      block.querySelectorAll('.langs li').forEach((l) => { const v = txt(l.querySelector('.v')); out.push(v ? `${txt(l.querySelector('.l'))}: ${v}` : txt(l.querySelector('.l'))) })
      block.querySelectorAll('.list li').forEach((l) => out.push(`- ${txt(l)}`))
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
  }
  let copyTimer = 0
  if (copy && sheet) {
    copy.querySelector('.l').textContent = label()
    copy.addEventListener('click', async () => {
      const text = cvText()
      let ok = false
      try { await navigator.clipboard.writeText(text); ok = true } catch (e) {
        const ta = document.createElement('textarea')
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(ta); ta.select()
        try { ok = document.execCommand('copy') } catch (x) {}
        ta.remove()
      }
      if (!ok) return
      copy.classList.add('done')
      copy.querySelector('.l').textContent = I18N.t('Copied')
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => { copy.classList.remove('done'); copy.querySelector('.l').textContent = label() }, 2200)
    })
    window.CV_TEXT = cvText
  }

  document.addEventListener('langchange', () => { if (copy && !copy.classList.contains('done')) copy.querySelector('.l').textContent = label() })
})()
