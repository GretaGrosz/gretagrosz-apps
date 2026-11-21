// Mehrere Fragendateien zusammenführen: Listen desselben Themas werden aneinandergehängt
// (Reihenfolge = Adresse "x0, x1, …", neue Dateien deshalb immer hinten anfügen).
export default function merge(...parts) {
  const out = {}
  for (const part of parts) for (const [topicId, list] of Object.entries(part)) out[topicId] = [...(out[topicId] ?? []), ...list]
  return out
}
