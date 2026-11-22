import { useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Critter from './Critter.jsx'
import Loopy from './Loopy.jsx'
import Krabbe from './Krabbe.jsx'
import { Jelly, Octopus, Seal } from './Staff.jsx'
import { Shark, Turtle } from './Story.jsx'
import { Slab } from './toon.jsx'
import { OUTFITS, SPECIES_IDS } from '../data.js'

// Entwickler-Vorschau aller Figuren (nur für Screenshots). URL-Parameter:
//   focus = all | critters | extras | staff | loopy | story | <Art-ID> | <Art-ID>,<Art-ID>,…   zoom = Zahl   mood = ok|talk|happy|angry|sit (fest)
//   moving = 1|0 (fest)   staff = normal|sleepy|asleep|happy|carry (fest)   at = x,z (Blickpunkt)

const MOODS = ['ok', 'talk', 'happy', 'angry', 'sit']
const STAFF_STATES = ['normal', 'sleepy', 'asleep', 'happy', 'carry']
const FACE = Math.PI / 4
const R = new THREE.Vector3(Math.SQRT1_2, 0, -Math.SQRT1_2)
const D = new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2)
const DIR = new THREE.Vector3(1, 0.9, 1).normalize()

// Rasterplatz (Spalte, Zeile) → Weltkoordinate, so dass Spalten auf dem Bildschirm waagerecht liegen
function at(col, row, sp = 1.7) {
  return [(R.x * col + D.x * row) * sp, 0, (R.z * col + D.z * row) * sp]
}

function params() {
  const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
  return {
    focus: q.get('focus') || 'all',
    zoom: Number(q.get('zoom')) || 0,
    mood: q.get('mood'),
    moving: q.get('moving'),
    staff: q.get('staff'),
    at: q.get('at')?.split(',').map(Number),
  }
}

function Rig({ center, zoom }) {
  const { camera, size } = useThree()
  useFrame(() => {
    const c = new THREE.Vector3(center[0], center[1], center[2])
    camera.position.copy(c).addScaledVector(DIR, 40)
    camera.lookAt(c)
    camera.zoom = zoom || Math.min(size.width / 16, size.height / 11)
    camera.updateProjectionMatrix()
  })
  return null
}

// Kundschaft: mood alle 2 s weiter, moving wechselt
function useCritterEnts(list, p) {
  const ents = useMemo(() => list.map((c, i) => ({ ...c, x: c.pos[0], z: c.pos[2], yaw: FACE, mood: 'ok', present: true, moving: false, i })), [list])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ents.forEach((e) => {
      const k = Math.floor(t / 2 + e.i * 0.37)
      e.mood = p.mood || MOODS[k % MOODS.length]
      if (p.mood === 'happy' && t % 2.5 < 0.1) e.mood = 'ok' // Freudentanz wiederholen
      e.moving = p.moving != null ? p.moving === '1' : e.mood === 'ok' && Math.floor(t / 4 + e.i) % 2 === 0
    })
  })
  return ents
}

function Critters({ list, p }) {
  const ents = useCritterEnts(list, p)
  return ents.map((e, i) => <Critter key={i} ent={e} species={e.species} tint={e.tint} vip={e.vip} santa={e.santa} inspector={e.inspector} />)
}

function StaffRow({ list, p }) {
  const ents = useMemo(
    () =>
      list.map((s, i) => {
        const e = { x: s.pos[0], z: s.pos[2], yaw: FACE, moving: false, carry: null, asleep: false, sleepy: false, happyT: 99, i, start: 0 }
        return { ...s, e, fn: () => e }
      }),
    [list],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ents.forEach(({ e }) => {
      const phase = t / 3 + e.i * 0.6
      const k = Math.floor(phase)
      const state = p.staff || STAFF_STATES[k % STAFF_STATES.length]
      e.sleepy = state === 'sleepy'
      e.asleep = state === 'asleep'
      e.carry = state === 'carry' ? { type: 0 } : null
      e.moving = p.moving != null ? p.moving === '1' : state === 'normal' || state === 'carry'
      e.happyT = state === 'happy' ? ((phase - k) * 3) % 2 : 99
    })
  })
  return ents.map(({ C, fn }, i) => <C key={i} ent={fn} />)
}

export default function Gallery() {
  const p = useMemo(params, [])
  const { critters, staff, loopies, story, center } = useMemo(() => {
    const f = p.focus
    const critters = []
    const staff = []
    const loopies = []
    const story = []
    let row = 0
    let center = [0, 0.7, 0]
    const showAll = f === 'all'
    const pick = f.split(',').filter((x) => SPECIES_IDS.includes(x))
    if (pick.length > 1) {
      pick.forEach((sp, si) => {
        for (let tint = 0; tint < 4; tint++) critters.push({ species: sp, tint, pos: at(tint - 1.5, si * 1.1 - (pick.length - 1) * 0.55) })
      })
    }
    if (showAll || f === 'critters' || SPECIES_IDS.includes(f)) {
      const species = SPECIES_IDS.includes(f) ? [f] : SPECIES_IDS
      species.forEach((sp, si) => {
        for (let tint = 0; tint < 4; tint++) critters.push({ species: sp, tint, pos: at(tint - 1.5, row + si * 1.1) })
      })
      row += species.length * 1.1 + 0.4
    }
    if (showAll || f === 'extras' || SPECIES_IDS.includes(f)) {
      const base = SPECIES_IDS.includes(f) ? [f] : SPECIES_IDS
      const r0 = SPECIES_IDS.includes(f) ? 1.1 : row
      base.forEach((sp, i) => {
        const c = base.length > 1 ? i : 0
        const off = base.length > 1 ? -3.5 : -1
        critters.push({ species: sp, tint: i % 4, vip: true, pos: at(c + off, r0) })
        critters.push({ species: sp, tint: (i + 1) % 4, santa: true, pos: at(c + off, r0 + 1.1) })
        if (base.length === 1 || sp === 'otter') critters.push({ species: sp, tint: 0, inspector: true, pos: at(base.length > 1 ? 0 : c + off + 2, base.length > 1 ? r0 + 2.2 : r0) })
      })
      if (base.length > 1) row += 3.4
    }
    if (showAll || f === 'staff') {
      ;[Octopus, Seal, Jelly, Krabbe].forEach((C, i) => staff.push({ C, pos: at(i - 1.5, f === 'staff' ? 0 : row) }))
      row += 1.3
    }
    if (showAll || f === 'loopy') {
      OUTFITS.forEach((o, i) => loopies.push({ id: o.id, pos: at((i % 6) - 2.5, (f === 'loopy' ? -0.6 : row + 0.3) + Math.floor(i / 6) * 1.3) }))
      row += 3.1
    }
    if (showAll || f === 'story') {
      story.push({ C: Turtle, pos: at(-0.6, f === 'story' ? 0 : row), wave: true })
      story.push({ C: Shark, pos: at(0.6, f === 'story' ? 0 : row), wave: true })
      row += 1.3
    }
    if (showAll || f === 'critters') center = [...at(0, row / 2 - 0.6)]
    if (p.at) center = [p.at[0], 0.7, p.at[1]]
    else center[1] = 0.7
    return { critters, staff, loopies, story, center }
  }, [p])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#EAF2FD' }}>
      <Canvas orthographic flat shadows="soft" dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [40, 36, 40], zoom: 30, near: 0.1, far: 200 }}>
        <Rig center={center} zoom={p.zoom} />
        <hemisphereLight args={['#FFFFFF', '#DCE7FA', 2.58]} />
        <directionalLight
          position={[-5, 12, 9]}
          intensity={0.74}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0006}
          shadow-normalBias={0.03}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-camera-near={1}
          shadow-camera-far={60}
        />
        <Slab w={40} d={40} h={0.2} r={1} color="#E4EEFC" />
        <Critters list={critters} p={p} />
        <StaffRow list={staff} p={p} />
        {loopies.map((l) => (
          <Loopy key={l.id} spot={l.pos} face={FACE} outfit={l.id} mood="idle" />
        ))}
        {story.map(({ C, pos, wave }, i) => (
          <C key={i} position={pos} rotation={[0, FACE, 0]} wave={wave} />
        ))}
      </Canvas>
    </div>
  )
}
