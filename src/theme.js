// Klassen für Akzent-Text und -Flächen in Lernseiten und Diagrammen (eine Akzentfarbe für die ganze App).
// Wichtig: Klassennamen als volle Strings, damit Tailwind sie beim Build erkennt.
const ACCENT = {
  gradient: 'from-accent to-accent',
  text: 'text-accent-text',
  soft: 'bg-accent/10',
}

export function theme() {
  return ACCENT
}
