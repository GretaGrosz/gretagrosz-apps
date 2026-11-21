// Apps page: after the shelf pops in, each icon hops once in turn while the mascot leans toward it (then the
// shelf stays still; hovering an icon makes it hop again), and a dock jumps between the app cards once the
// shelf has scrolled away: along the bottom on phones, as a rail on the right on wide screens.
;(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const stage = document.querySelector('.shelf-stage')
  const peek = document.querySelector('.peek')
  const icons = [...document.querySelectorAll('.shelf a')]
  const cards = [...document.querySelectorAll('.app[data-app]')]
  const dock = document.querySelector('.dock')
  const dockLinks = dock ? [...dock.querySelectorAll('a')] : []
  const end = document.querySelector('.apps-end')

  /* ---------- Hero shelf ---------- */
  function lean(a) {
    if (!peek) return
    let deg = 0
    if (a) {
      const p = peek.getBoundingClientRect()
      const r = a.getBoundingClientRect()
      deg = Math.max(-7, Math.min(7, (r.left + r.width / 2 - (p.left + p.width / 2)) / 28))
    }
    peek.style.setProperty('--tilt', deg.toFixed(1) + 'deg')
  }
  function hop(a) {
    if (reduced.matches) return
    const icon = a.querySelector('.app-icon')
    icon.classList.remove('hop')
    void icon.offsetWidth // restart the animation if it is still running
    icon.classList.add('hop')
  }

  icons.forEach((a) => {
    const icon = a.querySelector('.app-icon')
    icon.addEventListener('animationend', () => icon.classList.remove('hop'))
    a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hop(a); lean(a) } })
    a.addEventListener('pointerleave', () => lean(null))
    a.addEventListener('focus', () => lean(a))
    a.addEventListener('blur', () => lean(null))
  })

  // One pass along the shelf once it has popped in, then stillness
  if (!reduced.matches) {
    icons.forEach((a, i) => setTimeout(() => { hop(a); lean(a) }, 1500 + i * 260))
    setTimeout(() => lean(null), 1500 + icons.length * 260 + 500)
  }

  /* ---------- Dock ---------- */
  let shelfVisible = true
  let endVisible = false
  let dockOn = false
  function setDock(on) {
    if (!dock || on === dockOn) return
    dockOn = on
    dock.classList.toggle('on', on)
    dock.inert = !on
  }
  if (dock) { dock.hidden = false; dock.inert = true }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === stage) shelfVisible = e.isIntersecting
        else if (e.target === end) endVisible = e.isIntersecting
      }
      setDock(!shelfVisible && !endVisible)
    }, { rootMargin: '0px 0px -12% 0px' })
    if (stage) io.observe(stage)
    if (end) io.observe(end)
  }

  let ticking = false
  let lastActive = -1
  function frame() {
    ticking = false
    const mid = innerHeight * 0.5
    let active = 0
    cards.forEach((c, i) => { if (c.getBoundingClientRect().top <= mid) active = i })
    if (active === lastActive) return
    lastActive = active
    dockLinks.forEach((a, i) => {
      if (i === active) a.setAttribute('aria-current', 'true')
      else a.removeAttribute('aria-current')
    })
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame) } }, { passive: true })
  frame()
})()
