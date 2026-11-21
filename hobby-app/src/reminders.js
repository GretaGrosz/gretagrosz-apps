// The axolotl's reminders: "when will you do the next step?" → a notification at that time (worker/blank-reminders.js).
// Uses the same push subscription as the buddy (buddy.js) and the app's random device id (assistant/api.js).
import { call, pushSubscription } from './buddy'
import { deviceId } from './assistant/api'

export { whenOptions } from './when'

export async function setReminder({ project, step, when, lang }) {
  const sub = await pushSubscription()
  await call('/reminders', { method: 'POST', body: { device: deviceId(), project, at: when, step: step.slice(0, 120), lang, sub } })
}

export const cancelReminder = (project) => call('/reminders/cancel', { method: 'POST', body: { device: deviceId(), project } }).catch(() => {})
