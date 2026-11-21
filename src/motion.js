// Eine Feder für alle Bewegungen der App (wie in der ganzen App-Familie)
export const SPRING = { type: 'spring', stiffness: 380, damping: 34 }
export const QUICK = { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }

// Seiten ohne Tab-Leiste: Lernen, Üben, Karteikarten, Fehlerheft, Wiederholen, das Spiel und ein laufender Probetest
export function isFocusRoute(pathname) {
  return /^\/(lernen|ueben|ueben-mix|karten|fehler|wiederholen|spiel)(\/|$)/.test(pathname) || /^\/tests\/(lauf|probe)$/.test(pathname)
}
