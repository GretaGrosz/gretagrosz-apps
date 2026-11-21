// English / German for every page. Pages are written in English; in German each text node whose
// (whitespace-collapsed) text is a key in the dictionary is swapped for its German value.
// Switching language is instant (no reload): the original English of every node is remembered.
//
//   I18N.add({ 'English text': 'Deutscher Text', ... })  every page/scene registers its own strings
//   I18N.t('English text')                              the string in the current language
//   I18N.apply(root?)                                    translate root (default: document.body)
//   I18N.set('de' | 'en')                                switch, remember on this device, fire 'langchange'
//   I18N.lang                                            'en' or 'de'
//   I18N.num(n, opts?)                                   number in the current locale
//
// Load order on a page: i18n.js, then any js/i18n/<page>.js dictionaries, then site.js (it applies).
// Scenes that build DOM later call I18N.apply(theirRoot) after building, and use I18N.t() for text they
// rewrite every frame. Everything listens for document 'langchange' if it needs to rebuild.
;(function () {
  const DE = {}
  const ORIG_TEXT = new WeakMap()   // text node -> original English
  const ORIG_ATTR = new WeakMap()   // element -> { attr: original English }
  const ATTRS = ['aria-label', 'alt', 'title', 'placeholder', 'data-tip']

  let lang
  try { lang = localStorage.getItem('lang') } catch (e) {}
  if (lang !== 'de' && lang !== 'en') {
    lang = (navigator.languages || [navigator.language]).some((l) => /^de\b/i.test(l)) ? 'de' : 'en'
  }

  const key = (s) => s.replace(/\s+/g, ' ').trim()
  const t = (s) => (lang === 'de' && DE[key(s)] != null ? DE[key(s)] : s)

  function apply(root) {
    root = root || document.body
    if (!root) return
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && n.parentElement.closest('script, style, [data-no-i18n]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    })
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const n of nodes) {
      let en = ORIG_TEXT.get(n)
      if (en == null) {
        if (!key(n.nodeValue)) continue
        en = n.nodeValue
        ORIG_TEXT.set(n, en)
      }
      const k = key(en)
      const out = lang === 'de' && DE[k] != null ? en.replace(/\S[\s\S]*\S|\S/, DE[k]) : en
      if (n.nodeValue !== out) n.nodeValue = out
    }
    const els = root.querySelectorAll ? root.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')) : []
    for (const el of [root, ...els]) {
      if (!el.getAttribute) continue
      let orig = ORIG_ATTR.get(el)
      for (const a of ATTRS) {
        if (!el.hasAttribute(a)) continue
        if (!orig) { orig = {}; ORIG_ATTR.set(el, orig) }
        if (orig[a] == null) orig[a] = el.getAttribute(a)
        const v = t(orig[a])
        if (el.getAttribute(a) !== v) el.setAttribute(a, v)
      }
    }
  }

  function applyDocument() {
    document.documentElement.lang = lang
    const title = document.querySelector('title')
    if (title) {
      if (title.dataset.en == null) title.dataset.en = title.textContent
      document.title = t(title.dataset.en)
    }
    const desc = document.querySelector('meta[name="description"]')
    if (desc) {
      if (desc.dataset.en == null) desc.dataset.en = desc.content
      desc.content = t(desc.dataset.en)
    }
    apply(document.body)
    document.querySelectorAll('.lang button[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)))
    document.documentElement.classList.remove('i18n-wait')
  }

  function set(next) {
    if (next !== 'de' && next !== 'en') return
    try { localStorage.setItem('lang', next) } catch (e) {}
    if (next === lang) return
    lang = next
    applyDocument()
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }))
  }

  const num = (n, opts) => new Intl.NumberFormat(lang === 'de' ? 'de-AT' : 'en-GB', opts).format(n)

  window.I18N = {
    add: (dict) => { for (const k in dict) DE[key(k)] = dict[k] },
    t, apply, set, num, applyDocument,
    get lang() { return lang },
  }
  window.t = t
})()

// Shared strings: navigation, footer, contact, things on more than one page.
I18N.add({
  'Home': 'Start',
  'Finance': 'Finanzen',
  'Apps': 'Apps',
  'Language': 'Sprache',
  'Main': 'Hauptmenü',
  'Greta Grosz, home': 'Greta Grosz, Startseite',
  'Connect on LinkedIn': 'Auf LinkedIn vernetzen',


  'Market research (PDF)': 'Marktanalyse (PDF)',
  'Get in touch': 'Kontakt aufnehmen',
  '· Made by Greta in Austria': '· Von Greta in Österreich gemacht',
})

// Navigation, contact buttons and the "Write to me" sheet (site.js)
I18N.add({
  'CV': 'CV',
  'Contact': 'Kontakt',
  'Write to me': 'Schreib mir',
  'My CV': 'Mein Lebenslauf',
  'Close': 'Schließen',
  'About': 'Worum geht’s?',
  'Internship': 'Praktikum',
  'Clothing': 'Kleidung',
  'Something else': 'Etwas anderes',
  'Name': 'Name',
  'Email': 'E-Mail',
  'Message': 'Nachricht',
  'Send': 'Senden',
  'Or message me on LinkedIn': 'Oder schreib mir auf LinkedIn',
  'Sent.': 'Gesendet.',
  'Done': 'Fertig',
  'Write another': 'Noch eine schreiben',
  'Thanks, {name}. I’ll reply to {email}.': 'Danke, {name}. Ich antworte an {email}.',
  'Add your name.': 'Bitte deinen Namen angeben.',
  'Check your email address.': 'Bitte die E-Mail-Adresse prüfen.',
  'Write a little more, at least a sentence.': 'Schreib bitte etwas mehr, mindestens einen Satz.',
  'Pick a date that is still to come.': 'Bitte ein Datum in der Zukunft wählen.',
  'Check the number of people.': 'Bitte die Personenzahl prüfen.',
  'That image could not be attached. Try a PNG or JPG.': 'Das Bild ließ sich nicht anhängen. Probier ein PNG oder JPG.',
  'Too many messages from this connection. Try again in a few minutes.': 'Zu viele Nachrichten von dieser Verbindung. Versuch es in ein paar Minuten noch einmal.',
  'No connection. Your message is still here, send it again when you are online.': 'Keine Verbindung. Deine Nachricht ist noch da, schick sie noch einmal, sobald du online bist.',
  'That did not go through. Try again, or message me on LinkedIn.': 'Das hat nicht geklappt. Versuch es noch einmal oder schreib mir auf LinkedIn.',
  'Website': 'Website',
})
