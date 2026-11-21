# Deutsch Lock-In

A study app for the German Schularbeit, live at **gretagrosz.com/deutsch/**.
It runs 100 % in the browser: no backend and no paid AI. Progress is stored in `localStorage` (key `deutsch-lockin.v1`), with a JSON export/import under **Ich → ⚙️ Einstellungen**.

## Run it

From the repo root (one `node_modules` for all apps):

```bash
npm install
npx vite deutsch-app          # dev server → http://localhost:5173
npm run build:deutsch         # build → deploy/site/deutsch/
npm run test:deutsch          # generator + checker unit tests
node deutsch-app/scripts/check-content.mjs          # validate all hand-written items
node deutsch-app/scripts/check-content.mjs --dump   # print every item (for proofreading)
node deutsch-app/scripts/spot.mjs adjEnding 1 20    # print 20 generated items of one generator
```

To go live: `npm run deploy` (syncs `website/` and runs `wrangler deploy`; `deploy/site/deutsch/` is kept).

## Where things are

| Path | What |
|---|---|
| `data/units/u01.json … u40.json` | The 40 grammar units (A2 → C1): Tipps page + lessons + hand-written items. Units 1–25 follow the Schularbeit phases, 26–40 are the C1-Pfad (`"phase": 4`). Every unit has a CEFR `level`. |
| `data/my-errors.json` | The 38 mistakes from the last Schularbeit ("Meine Fehler" seed deck) |
| `data/textsorten.json`, `data/redemittel.json` | Bauplan, typical mistakes and Redemittel per text type |
| `data/angaben.json` | Practice Angaben for "Angabe lesen" and the simulation |
| `data/korrektur.json` | Correct paragraphs with marked error spots for Korrekturlesen |
| `data/vorgaben.json` | "Sätze bauen mit Vorgaben" tasks and their rule checks |
| `data/placement.json` | The placement test |
| `src/generators/` | Word tables (`lexicon.js`), declension tables (`grammar.js`), clause building blocks (`clauses.js`), all generators (`index.js`), C1 generators (`c1.js`: Futur II, subjektive Modalverben, Partizipialattribute, Passiversatz, als ob, C1-Präpositionen und -Konnektoren), proofreading generator |
| `src/lib/` | Strict checking + diff, store, spaced repetition (Leitner), phases/pacing, Endkontrolle checks |
| `src/screens/`, `src/components/` | The UI |

## Lock-In session

`#/lockin` (the big button on Heute) runs the day in one go: the next lesson (or a Wiederholung in the exam phase), then Üben, then a 60-second sprint aimed at the weakest skill.

## Add exercises

Add an object to a lesson's `items` array in `data/units/uNN.json`. Item types:

| `t` | Fields | Example |
|---|---|---|
| `mc` | `q` (use `___` for a gap), `o` options, `a` answer | `{ "t": "mc", "q": "___ Meinung nach …", "o": ["Meiner", "Meine"], "a": "Meiner" }` |
| `gap` | `q` with one or more `___`, `a` (string or array), optional `h` hint, `o` options (tap mode in level 1), `acc` | `{ "t": "gap", "q": "Mit ___ Menschen …", "h": "(viele)", "a": "vielen" }` |
| `fix` | `w` wrong sentence, `a` correct sentence (same number of words → tap-and-fix, otherwise typed) | `{ "t": "fix", "w": "Ich denke, dass es ist schwer.", "a": "Ich denke, dass es schwer ist." }` |
| `order` | `a` sentence (word bank built from it, commas are tiles) or `chunks` in the right order, optional `extra` distractors | `{ "t": "order", "a": "Ich finde, dass es schwer ist." }` |
| `match` | `pairs` | `{ "t": "match", "q": "…", "pairs": [["mit", "Dativ"], ["für", "Akkusativ"], ["wegen", "Genitiv"]] }` |
| `tf` | `q` instruction + sentence, `a`, `acc` | transform a sentence |
| `tr` | `en` English sentence, `a`, `acc` | translate |
| `listen` | `a` (read aloud with de-AT/de-DE voice) | dictation |
| `komma` | `a` sentence with its commas (shown without them) | `{ "t": "komma", "a": "Ich glaube, dass …" }` |

Optional on every item: `r` rule (German), `re` English explanation, `y` "Warum?" reasons (**first one is the correct reason**), `s` micro-skill (e.g. `komma.inf`), `c` category (G/R/A/B/S, otherwise derived from the skill), `acc` other accepted answers.
Lessons can mix in generated items with `"gen": { "adjEnding": 2, "pluralCase": 1 }` (names in `src/generators/index.js`).

After editing, run `node deutsch-app/scripts/check-content.mjs`. Checking is strict on purpose: only whitespace and quote styles are normalised, and the final full stop is optional. List every other correct wording in `acc`.

## Add your own mistakes

In the app: **Ich → 📕 Meine Fehler → + Neu** (wrong / right / category / note), or **Import**: paste lines in the form `falsch | richtig | Kategorie`. That's the format the "Feedback holen" prompt asks Claude to use. To change the seed deck for everyone, edit `data/my-errors.json`.
