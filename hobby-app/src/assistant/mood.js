// How the axolotl feels, from the real state of your streak and the time of day
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { dayOf } from '../data'

// Days since you last did anything for a hobby (null: never)
const daysIdle = (activity) => (activity.length ? dayOf(Date.now()) - dayOf(Math.max(...activity.map((a) => a.at))) : null)

// Streak milestones, in weeks
export const MILESTONES = [2, 4, 8, 12, 16, 26, 39, 52, 78, 104, 156, 208]

// Days left in this week, today included (Monday 7 … Sunday 1)
export const daysLeftThisWeek = (t = new Date()) => 7 - ((t.getDay() + 6) % 7)

// needsToday: the week can only still count if you do something today
export function streakMood({ streak, doneToday, weekDone, needsToday, hour, idle }) {
  if (hour < 6) return 'sleepy'
  if (idle != null && idle >= 3) return 'worried' // misses you: nothing for your hobbies in days
  if (doneToday && weekDone && MILESTONES.includes(streak)) return 'proud'
  if (hour >= 22) return doneToday || !needsToday || streak === 0 ? 'sleepy' : 'worried'
  if (doneToday) return 'happy'
  if (streak > 0 && needsToday && hour >= 18) return 'worried'
  return 'idle'
}

// Whether this week's goal still needs today (store.jsx: thisWeek, weekGoal, weekDone)
export const needsTodayOf = ({ thisWeek, weekGoal, weekDone, doneToday }) => !weekDone && !doneToday && weekGoal - thisWeek >= daysLeftThisWeek()

// The local hour, kept current (a tab left open overnight changes mood on its own)
export function useHour() {
  const [hour, setHour] = useState(() => new Date().getHours())
  useEffect(() => {
    const tick = () => setHour(new Date().getHours())
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return hour
}

// The streak axolotl's mood, plus a counter that goes up each time the streak grows (for the cheer)
export function useStreakAxo() {
  const store = useStore()
  const { streak, doneToday, weekDone, data } = store
  const needsToday = needsTodayOf(store)
  const idle = daysIdle(data.activity)
  const hour = useHour()
  const prev = useRef(streak)
  const born = useRef(Date.now()) // the saved copy loading in a moment after start is not a new day
  const [bump, setBump] = useState(0)
  const change = useRef({ from: streak, to: streak })
  const [cheering, setCheering] = useState(false)
  useEffect(() => {
    if (streak > prev.current && Date.now() - born.current > 1500) {
      change.current = { from: prev.current, to: streak }
      setBump((n) => n + 1)
    }
    prev.current = streak
  }, [streak])
  useEffect(() => {
    if (!bump) return
    setCheering(true)
    const id = setTimeout(() => setCheering(false), 2400)
    return () => clearTimeout(id)
  }, [bump])
  return { streak, doneToday, weekDone, mood: cheering ? 'cheer' : streakMood({ streak, doneToday, weekDone, needsToday, hour, idle }), bump, change: change.current }
}
