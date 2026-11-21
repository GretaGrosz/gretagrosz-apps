// A stand-in for Workers AI, for local development only (wrangler dev has no Workers AI).
// stance-ai.js aiFor() hands it out only when STANCE_FAKE_AI=1 AND the request is for localhost, so it can
// never answer on gretagrosz.com. The x-fake-ai request header picks a failure to rehearse: 'fail' (every call
// throws), 'silent' (Whisper hears nothing), 'llm-fail' (transcripts work, the language model fails).

const wait = ms => new Promise(r => setTimeout(r, ms))

const TRANSCRIPT = {
  en: 'So I think the main point here is that um the question is really about who decides. First, if we look at young people, they basically use these tools every day, and you know, banning them does not teach anything. Second, schools could use the time to show how it works instead. For example in my class we compared two news sources and found that one left out half the story. So in the end I would say teaching beats banning.',
  de: 'Also ich glaube der wichtigste Punkt ist äh wer eigentlich entscheidet. Erstens nutzen Jugendliche diese Apps halt jeden Tag, und ein Verbot bringt ihnen sozusagen gar nichts bei. Zweitens könnte die Schule die Zeit nutzen, um zu zeigen, wie das funktioniert. Zum Beispiel haben wir in meiner Klasse zwei Nachrichtenquellen verglichen und gesehen, dass eine die Hälfte weglässt. Deshalb würde ich sagen, Bildung ist besser als ein Verbot.',
}

export function fakeAI(mode) {
  return {
    async run(model, input) {
      await wait(500)
      if (mode === 'fail') throw new Error('fake AI: failure requested')
      if (model.includes('whisper')) {
        if (mode === 'silent') return { text: '' }
        return { text: TRANSCRIPT[input.language === 'de' ? 'de' : 'en'] }
      }
      if (mode === 'llm-fail') throw new Error('fake AI: language model failure requested')
      const system = input.messages?.[0]?.content || ''
      const de = /German/.test(system.match(/Write (every text field )?in ([^.,]*)/)?.[2] || '')
      const props = input.response_format?.json_schema?.properties || {}
      if (props.structure) {
        return { response: de
          ? { summary: 'Du hast argumentiert, dass Bildung besser wirkt als ein Verbot.', strength: 'Dein Beispiel mit den zwei Nachrichtenquellen macht den Punkt greifbar.', improve: 'Kündige am Anfang an, wie viele Punkte du bringst, und lass „halt“ weg.', followed: 'Ja, diesmal hast du mit einem klaren Beispiel geschlossen.', structure: 7, clarity: 6, depth: 6 }
          : { summary: 'You argued that teaching people beats banning the tools.', strength: 'The example of comparing two news sources makes your point concrete.', improve: 'Say up front how many points you will make, and drop "basically".', followed: 'Yes, this time you ended on a clear example.', structure: 7, clarity: 6, depth: 6 } }
      }
      if (props.winner) {
        return { response: de
          ? { winner: 'tie', reason: 'Ihr habt beide Gründe genannt. Du hast aber den Einwand zur Kontinuität nicht beantwortet.', strongest: input.messages[1].content.split('\n\n')[0].replace(/^STUDENT: /, '').split(/\s+/).slice(0, 14).join(' '), unanswered: 'Wo genau die Grenze liegt, ab der etwas nicht mehr dasselbe ist.', tip: 'Nimm den stärksten Einwand der Gegenseite und antworte zuerst darauf.' }
          : { winner: 'tie', reason: 'You both gave reasons. You never dealt with the continuity objection, though.', strongest: input.messages[1].content.split('\n\n')[0].replace(/^STUDENT: /, '').split(/\s+/).slice(0, 14).join(' '), unanswered: 'Where exactly the line is after which something stops being the same.', tip: 'Take the other side\'s strongest objection and answer it first.' } }
      }
      const last = input.messages.filter(m => m.role === 'user').pop()?.content || ''
      const quote = last.split(/\s+/).slice(0, 6).join(' ')
      return { response: de
        ? `Du sagst „${quote}“, aber genau da hakt es. Wenn alles nach und nach ersetzt wird, bleibt von dem, was du meinst, am Ende nichts Greifbares übrig. Kontinuität ist eine Geschichte, die wir uns erzählen, damit Verträge und Freundschaften funktionieren. Stell dir vor, jemand baut aus den alten Planken ein zweites Schiff: Welches ist dann das echte? Deine Antwort darauf entscheidet alles.`
        : `You say "${quote}", but that is exactly where it breaks. If every part is swapped out bit by bit, nothing you can point to is left of the original. Continuity is a story we tell so contracts and friendships keep working. Picture someone rebuilding a second ship from the old planks: which one is the real one? Your answer to that decides the whole question.` }
    },
  }
}
