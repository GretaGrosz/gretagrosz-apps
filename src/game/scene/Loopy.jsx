import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Blob, INK, SPHERE, flat, toon, turnTo } from './toon.jsx'

// Loopy, der Axolotl, in 3D: großer runder Kopf, glänzende Augen, Kiemenäste mit Kugeln. Ruhige Bewegungen.
// Blickt in +z, Ursprung an den Füßen.
// mood: 'idle' | 'think' | 'happy' | 'sad'   spot: [x, y, z] Ziel   face: Blickrichtung (Winkel um y)

const SKIN = '#A5D5FF'
const SKIN_DEEP = '#72B8FA'
const STALK = '#2F7FD6'
const EYE = '#1D2B45'
const BLUSH = '#FF8FA3'

// Kiemenäste je Seite: [x, y] am Kopf, Winkel von der Senkrechten, Länge
const GILLS = [
  { at: [0.26, 0.35], angle: 0.32, len: 0.5 },
  { at: [0.4, 0.28], angle: 0.85, len: 0.56 },
  { at: [0.52, 0.16], angle: 1.38, len: 0.46 },
]

function stalkGeometry(len) {
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.09, len * 0.55, 0), new THREE.Vector3(0, len, 0))
  return new THREE.TubeGeometry(curve, 10, 0.03, 8)
}

const MOUTH = new THREE.TorusGeometry(0.075, 0.017, 8, 18, Math.PI)

// ent (optional): Objekt aus der Spielwelt { x, z, yaw, moving, mood } – dann steuert das Spiel Loopy direkt.
export default function Loopy({ mood: moodProp = 'idle', spot = [0, 0, 0], face = 0, onClick, ent }) {
  const root = useRef()
  const body = useRef()
  const head = useRef()
  const gills = useRef([])
  const eyes = useRef([])
  const mouth = useRef()
  const tail = useRef()
  const arms = useRef([])
  const s = useRef({ walk: 0, hop: 0, vy: 0, moodWas: ent ? ent.mood : moodProp, moodAt: 0, blinkAt: 2, blinkNext: 2, yaw: face, placed: false })
  const stalks = useMemo(() => GILLS.map((g) => stalkGeometry(g.len)), [])

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(Math.max(dtRaw, 1 / 240), 0.05)
    const t = clock.elapsedTime
    const st = s.current
    const g = root.current
    const mood = ent ? ent.mood : moodProp
    if (!st.placed) {
      if (ent) g.position.set(ent.x, 0, ent.z)
      else g.position.set(spot[0], spot[1], spot[2])
      st.placed = true
    }
    if (st.moodWas !== mood) {
      st.moodWas = mood
      st.moodAt = t
    }
    const since = t - st.moodAt

    // Gehen: hüpfend zum Ziel (oder dorthin, wo das Spiel Loopy hinstellt)
    let moving
    let wantYaw = face
    if (ent) {
      g.position.x = ent.x
      g.position.z = ent.z
      moving = ent.moving
      wantYaw = ent.yaw
      if (moving) st.walk += dt * 13
    } else {
      const dx = spot[0] - g.position.x
      const dz = spot[2] - g.position.z
      const dist = Math.hypot(dx, dz)
      moving = dist > 0.03
      if (moving) {
        const step = Math.min(dist, 3.4 * dt)
        g.position.x += (dx / dist) * step
        g.position.z += (dz / dist) * step
        st.walk += dt * 12
        wantYaw = Math.atan2(dx, dz)
      }
    }
    g.position.y += ((ent ? 0 : spot[1]) - g.position.y) * (1 - Math.exp(-dt * 8))
    st.yaw = turnTo(st.yaw, wantYaw, 1 - Math.exp(-dt * 10))
    g.rotation.y = st.yaw

    let hop = moving ? Math.abs(Math.sin(st.walk)) * 0.09 : 0
    if (mood === 'happy' && since < 1.7) hop += Math.abs(Math.sin(since * 8)) * 0.16 * (1 - since / 1.7)
    st.vy += ((hop - st.hop) / dt - st.vy) * 0.3
    st.hop = hop

    // Körper: atmen, beim Hüpfen strecken, traurig etwas zusammensinken
    const breathe = Math.sin(t * 2.4) * 0.022
    const slump = mood === 'sad' ? -0.06 : 0
    const stretch = 1 + breathe + hop * 0.12 + slump
    body.current.position.y = hop
    body.current.scale.set(1 - hop * 0.06 - slump * 0.5, stretch, 1 - hop * 0.06 - slump * 0.5)

    // Kopf
    const k = 1 - Math.exp(-dt * 7)
    const hx = mood === 'sad' ? 0.3 : mood === 'think' ? -0.1 : mood === 'happy' ? -0.12 : 0
    const hz = mood === 'think' ? 0.2 : Math.sin(t * 1.3) * 0.03
    head.current.rotation.x += (hx - head.current.rotation.x) * k
    head.current.rotation.z += (hz - head.current.rotation.z) * k

    // Kiemen: wippen nach, wackeln vor Freude, hängen bei Kummer
    const happy = mood === 'happy' && since < 2.2
    const freq = happy ? 9 : moving ? 8 : 1.8
    const amp = happy ? 0.1 : moving ? 0.06 : 0.04
    const droop = mood === 'sad' ? 0.62 : happy ? -0.14 : 0
    const lag = THREE.MathUtils.clamp(-st.vy * 0.07, -0.35, 0.35)
    gills.current.forEach((gill, i) => {
      if (!gill) return
      const side = i < 3 ? 1 : -1
      const base = GILLS[i % 3].angle
      const want = base + droop + lag + Math.sin(t * freq + i * 1.3) * amp
      gill.rotation.z += (-side * want - gill.rotation.z) * (1 - Math.exp(-dt * 14))
    })

    // Blinzeln
    if (t > st.blinkNext) {
      st.blinkAt = t
      st.blinkNext = t + 2.2 + Math.random() * 3
    }
    const blink = t - st.blinkAt < 0.12 ? 0.1 : mood === 'happy' ? 0.82 : mood === 'sad' ? 0.9 : 1
    eyes.current.forEach((e) => e && (e.scale.y += (blink - e.scale.y) * 0.5))

    // Mund: Lächeln (−1) ↔ traurig (+1), dazwischen ein Strich
    const smile = mood === 'sad' ? 0.9 : mood === 'happy' ? -1.5 : mood === 'think' ? -0.45 : -1
    mouth.current.scale.y += (smile - mouth.current.scale.y) * k
    mouth.current.scale.x += ((mood === 'happy' ? 1.35 : mood === 'think' ? 0.7 : 1) - mouth.current.scale.x) * k

    tail.current.rotation.y = Math.sin(t * (happy ? 8 : 2.4)) * (happy ? 0.4 : 0.2)
    const wave = happy ? Math.sin(t * 9) * 0.4 - 1.6 : mood === 'think' ? -1.2 : 0
    arms.current.forEach((a, i) => a && (a.rotation.z += ((i ? -1 : 1) * (i && mood === 'think' ? 0 : wave) - a.rotation.z) * k))
  })

  return (
    <group
      ref={root}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <group ref={body}>
        {/* Schwanz */}
        <group ref={tail} position={[0, 0.3, -0.22]}>
          <Blob color={SKIN_DEEP} s={[0.09, 0.2, 0.3]} position={[0, 0.02, -0.26]} />
        </group>
        {/* Rumpf, Bauch, Füße, Arme */}
        <Blob color={SKIN} s={[0.33, 0.35, 0.3]} position={[0, 0.37, 0]} />
        <Blob color="#D6ECFF" s={[0.22, 0.24, 0.12]} position={[0, 0.34, 0.2]} outline={0} shadow={false} />
        {[-1, 1].map((side) => (
          <Blob key={side} color={SKIN_DEEP} s={[0.11, 0.07, 0.15]} position={[side * 0.17, 0.07, 0.08]} />
        ))}
        {[1, -1].map((side, i) => (
          <group key={side} ref={(el) => (arms.current[i] = el)} position={[side * 0.27, 0.5, 0.08]}>
            <Blob color={SKIN} s={[0.08, 0.13, 0.08]} position={[side * 0.05, -0.09, 0.04]} />
          </group>
        ))}

        {/* Kopf */}
        <group ref={head} position={[0, 0.96, 0.02]}>
          <Blob color={SKIN} s={[0.61, 0.43, 0.475]} />
          {/* Kiemen */}
          {[1, -1].map((side, sIdx) =>
            GILLS.map((gill, i) => (
              <group
                key={`${side}-${i}`}
                ref={(el) => (gills.current[sIdx * 3 + i] = el)}
                position={[side * gill.at[0] * 0.9, gill.at[1] * 0.9, -0.03 - i * 0.03]}
                rotation={[-0.12, 0, -side * gill.angle]}
              >
                <mesh geometry={stalks[i]} material={toon(STALK)} scale={[side, 1, 1]} castShadow />
                <Blob color={SKIN_DEEP} s={[0.085, 0.085, 0.085]} position={[0, gill.len, 0]} outline={0.028} />
              </group>
            )),
          )}
          {/* Augen mit Glanzpunkt */}
          {[-1, 1].map((side, i) => (
            <group key={side} ref={(el) => (eyes.current[i] = el)} position={[side * 0.3, 0.03, 0.385]} rotation={[0, side * 0.42, 0]}>
              <mesh geometry={SPHERE} material={flat(EYE)} scale={[0.15, 0.175, 0.075]} />
              <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.055, 0.06, 0.03]} position={[0.04, 0.065, 0.06]} />
              <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.025, 0.027, 0.015]} position={[-0.05, -0.06, 0.065]} />
            </group>
          ))}
          {/* Wangen */}
          {[-1, 1].map((side) => (
            <mesh key={side} geometry={SPHERE} material={flat(BLUSH)} scale={[0.085, 0.05, 0.03]} position={[side * 0.43, -0.12, 0.31]} rotation={[0, side * 0.75, 0]} />
          ))}
          {/* Mund */}
          <mesh ref={mouth} geometry={MOUTH} material={flat(INK)} position={[0, -0.13, 0.462]} scale={[1, -1, 1]} />
        </group>
      </group>
    </group>
  )
}
