// Blank's own logic (hobby-app/src): streaks, progress, challenges
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAY, bestWeeklyStreak, daysThisWeek, goalFor, progressOf, sessionMinutes, weekOf, weeklyStreak } from '../src/data.js'
import { monthKey, wonThisMonth } from '../src/challenges.js'

// Noon on the Monday of the week `ago` weeks back, plus `day` days
const monday = (() => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
})()
const at = (ago, day) => monday - ago * 7 * DAY + day * DAY

test('a week counts with 3 different days; the same day twice is one day', () => {
  const twoDays = [at(1, 0), at(1, 0) + 1000, at(1, 1)]
  assert.equal(weeklyStreak(twoDays), 0)
  assert.equal(weeklyStreak([...twoDays, at(1, 2)]), 1)
})

test('this week not being done yet does not break the streak', () => {
  const lastTwoWeeks = [0, 1, 2].flatMap((d) => [at(1, d), at(2, d)])
  assert.equal(weeklyStreak(lastTwoWeeks), 2)
  assert.equal(weeklyStreak([...lastTwoWeeks, at(0, 0), at(0, 1), at(0, 2)]), 3)
})

test('a missed week ends the streak, unless a freeze saved it', () => {
  const times = [0, 1, 2].flatMap((d) => [at(1, d), at(3, d)])
  assert.equal(weeklyStreak(times), 1)
  assert.equal(weeklyStreak(times, {}, [weekOf(at(2, 0))]), 3)
  assert.equal(bestWeeklyStreak(times), 1)
})

test('raising the goal only counts from that week on', () => {
  const week = weekOf(at(0, 0))
  assert.equal(goalFor({}, week), 3)
  assert.equal(goalFor({ [week]: 5 }, week - 1), 3)
  assert.equal(goalFor({ [week]: 5 }, week), 5)
})

test('days this week, progress and session length', () => {
  assert.equal(daysThisWeek([at(0, 0), at(0, 0) + 60_000, at(1, 3)], at(0, 0)), 1)
  assert.equal(progressOf({ milestones: [{ done: true }, { done: false }, { done: false }] }), 33)
  assert.equal(progressOf({ milestones: [], status: 'done' }), 100)
  assert.equal(sessionMinutes({ time: 'lots' }), 45)
  assert.equal(sessionMinutes(null), 15)
})

test('a challenge win belongs to its month', () => {
  const t = new Date(2026, 10, 15).getTime()
  assert.equal(monthKey(t), monthKey(new Date(2026, 10, 1).getTime()))
  assert.notEqual(monthKey(t), monthKey(new Date(2026, 9, 31).getTime()))
  assert.ok(wonThisMonth([`knit:${monthKey(t)}`], 'knit', t))
  assert.ok(!wonThisMonth([`knit:${monthKey(t)}`], 'draw', t))
})

test('the one-tap reminder times make sense at any time of day', async () => {
  const { whenOptions } = await import('../src/when.js')
  const at = (y, m, d, h, min = 0) => new Date(y, m - 1, d, h, min)
  // Monday 9:00: today at 17, tomorrow at 17, Saturday 10:00
  let o = whenOptions(at(2026, 11, 2, 9), 17)
  assert.deepEqual(o.map((x) => x.key), ['today', 'tomorrow', 'weekend'])
  assert.equal(new Date(o[0].at).getHours(), 17)
  assert.equal(new Date(o[2].at).getDay(), 6)
  // Monday 19:10, after the usual hour: today in about an hour
  o = whenOptions(at(2026, 11, 2, 19, 10), 17)
  assert.equal(new Date(o[0].at).getHours(), 20)
  // Monday 22:00: no "today" any more
  o = whenOptions(at(2026, 11, 2, 22), 17)
  assert.deepEqual(o.map((x) => x.key), ['tomorrow', 'weekend'])
  // Friday: tomorrow is Saturday, so the weekend option is Sunday
  o = whenOptions(at(2026, 11, 6, 9), 17)
  assert.equal(new Date(o[1].at).getDay(), 6)
  assert.equal(new Date(o[2].at).getDay(), 0)
  // Every option is in the future
  for (const h of [0, 7, 12, 16, 17, 18, 20, 23]) for (const x of whenOptions(at(2026, 11, 4, h, 45), 17)) assert.ok(x.at > at(2026, 11, 4, h, 45).getTime())
})
