// Der laufende Probetest liegt im Speicher (übersteht Neuladen, Zurück und das Schließen von Safari);
// die Zeit läuft nach der Uhr (Ende = Startzeit + Limit), nicht nach Ticks.
const RUN_KEY = 'bw-buddy-exam-run'

export function readRun() {
  try {
    const run = JSON.parse(localStorage.getItem(RUN_KEY) || 'null')
    return run && run.v === 1 && Array.isArray(run.items) ? run : null
  } catch {
    return null
  }
}

export function writeRun(run) {
  try {
    if (run) localStorage.setItem(RUN_KEY, JSON.stringify(run))
    else localStorage.removeItem(RUN_KEY)
  } catch {
    /* Speicher voll – der Test läuft trotzdem weiter, nur ohne Sicherung */
  }
}

export const runSecondsLeft = (run, now = Date.now()) => (run.endsAt ? Math.max(0, Math.round((run.endsAt - now) / 1000)) : null)
