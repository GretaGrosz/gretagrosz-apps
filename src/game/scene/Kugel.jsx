import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Blob, CONE, CYL, INK, SPHERE, flat, toon, turnTo } from './toon.jsx'

// Kugelfisch-Kundschaft (Frau Kugel und Verwandte). Schwebt, redet, bläst sich auf, wenn sie sich ärgert.
// mood: 'talk' | 'happy' | 'angry' | 'ok'   present: false → schrumpft und verschwindet

const UP = new THREE.Vector3(0, 1, 0)

function spikes() {
  const list = []
  const n = 46
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const a = i * 2.39996
    const v = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
    if (v.z > 0.45 && v.y > -0.5) continue // Gesicht frei lassen
    if (v.y < -0.75) continue
    list.push({ pos: v.clone().multiplyScalar(0.45), quat: new THREE.Quaternion().setFromUnitVectors(UP, v) })
  }
  return list
}

const LIPS = new THREE.TorusGeometry(0.06, 0.028, 10, 20)

// ent (optional): Kundschaft aus der Spielwelt { x, z, yaw, mood, present } – dann bewegt das Spiel sie direkt.
export default function Kugel({ color = '#FFD45E', dark = '#E8B63A', hat = '#B39CFF', mood: moodProp = 'talk', present: presentProp = true, spot = [0, 0, 0], from = [4, 0, -3], face = 0, ent }) {
  const root = useRef()
  const body = useRef()
  const lips = useRef()
  const brows = useRef([])
  const fins = useRef([])
  const eyes = useRef([])
  const s = useRef({ size: 0, puff: 1, placed: false, blinkAt: 0, blinkNext: 1.5, yaw: face, spin: 0, moodWas: ent ? ent.mood : moodProp, moodAt: 0 })
  const spikeList = useMemo(spikes, [])

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(Math.max(dtRaw, 1 / 240), 0.05)
    const t = clock.elapsedTime
    const st = s.current
    const g = root.current
    const mood = ent ? ent.mood : moodProp
    const present = ent ? ent.present : presentProp
    if (!st.placed) {
      if (ent) g.position.set(ent.x, 0, ent.z)
      else g.position.set(from[0], 0, from[2])
      st.placed = true
    }
    if (st.moodWas !== mood) {
      st.moodWas = mood
      st.moodAt = t
    }
    const since = t - st.moodAt
    let wantYaw = face
    if (ent) {
      g.position.x = ent.x
      g.position.z = ent.z
      wantYaw = ent.yaw
    } else {
      const goal = present ? spot : from
      const dx = goal[0] - g.position.x
      const dz = goal[2] - g.position.z
      const dist = Math.hypot(dx, dz)
      if (dist > 0.03) {
        const step = Math.min(dist, 3.6 * dt)
        g.position.x += (dx / dist) * step
        g.position.z += (dz / dist) * step
        if (dist > 0.4) wantYaw = Math.atan2(dx, dz)
      }
    }
    st.yaw = turnTo(st.yaw, wantYaw, 1 - Math.exp(-dt * 8))

    // Freudendrehung
    const spin = mood === 'happy' && since < 0.9 ? Math.sin((since / 0.9) * Math.PI * 0.5) * Math.PI * 2 : 0
    g.rotation.y = st.yaw + spin

    st.size += ((present ? 1 : 0) - st.size) * (1 - Math.exp(-dt * (present ? 7 : 9)))
    st.puff += ((mood === 'angry' ? 1.25 : 1) - st.puff) * (1 - Math.exp(-dt * 9))
    const wobble = mood === 'angry' ? Math.sin(t * 30) * 0.012 : 0
    const bob = Math.sin(t * 2.1) * 0.06 + (mood === 'happy' ? Math.abs(Math.sin(t * 6)) * 0.07 : 0)
    body.current.position.set(wobble, 0.86 + bob, 0)
    const breathe = 1 + Math.sin(t * 2.6) * 0.02
    body.current.scale.setScalar(Math.max(0.001, st.size * st.puff * breathe))

    const talk = mood === 'talk' ? 0.75 + Math.abs(Math.sin(t * 9)) * 0.7 : mood === 'happy' ? 1.25 : 0.8
    lips.current.scale.y += (talk - lips.current.scale.y) * 0.4
    const brow = mood === 'angry' ? 0.5 : mood === 'talk' ? 0.22 : -0.1
    brows.current.forEach((b, i) => b && (b.rotation.z += ((i ? 1 : -1) * brow - b.rotation.z) * 0.2))
    brows.current.forEach((b) => b && (b.position.y += ((mood === 'angry' ? 0.24 : 0.3) - b.position.y) * 0.2))
    fins.current.forEach((f, i) => f && (f.rotation.y = (i ? -1 : 1) * (0.5 + Math.sin(t * (mood === 'angry' ? 22 : 7)) * 0.4)))

    if (t > st.blinkNext) {
      st.blinkAt = t
      st.blinkNext = t + 2 + Math.random() * 3
    }
    const blink = t - st.blinkAt < 0.12 ? 0.1 : 1
    eyes.current.forEach((e) => e && (e.scale.y += (blink - e.scale.y) * 0.5))
  })

  return (
    <group ref={root}>
      <group ref={body}>
        <Blob color={color} s={[0.45, 0.45, 0.45]} outline={0.03} />
        <Blob color="#FFF6DD" s={[0.36, 0.3, 0.3]} position={[0, -0.12, 0.14]} outline={0} shadow={false} />
        {spikeList.map((sp, i) => (
          <mesh key={i} geometry={CONE} material={toon(dark)} position={sp.pos} quaternion={sp.quat} scale={[0.045, 0.13, 0.045]} />
        ))}
        {/* Flossen */}
        {[1, -1].map((side, i) => (
          <group key={side} ref={(el) => (fins.current[i] = el)} position={[side * 0.42, -0.05, 0.05]}>
            <Blob color={dark} s={[0.14, 0.11, 0.03]} position={[side * 0.1, 0, 0]} outline={0.025} />
          </group>
        ))}
        <Blob color={dark} s={[0.04, 0.16, 0.14]} position={[0, 0.02, -0.52]} outline={0.025} />
        {/* Augen */}
        {[-1, 1].map((side, i) => (
          <group key={side} position={[side * 0.19, 0.12, 0.37]} rotation={[0, side * 0.35, 0]}>
            <group ref={(el) => (eyes.current[i] = el)}>
              <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.12, 0.13, 0.07]} />
              <mesh geometry={SPHERE} material={flat('#3B1D17')} scale={[0.06, 0.07, 0.04]} position={[-side * 0.02, -0.01, 0.045]} />
              <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.02, 0.022, 0.015]} position={[-side * 0.02 + 0.02, 0.025, 0.08]} />
            </group>
          </group>
        ))}
        {[-1, 1].map((side, i) => (
          <mesh key={side} ref={(el) => (brows.current[i] = el)} geometry={CYL} material={flat(INK)} position={[side * 0.19, 0.3, 0.4]} scale={[0.09, 0.022, 0.022]} rotation={[0, 0, 0]}>
          </mesh>
        ))}
        {/* Lippen */}
        <mesh ref={lips} geometry={LIPS} material={toon('#FF7FA3')} position={[0, -0.09, 0.44]} />
        {/* Wangen */}
        {[-1, 1].map((side) => (
          <mesh key={side} geometry={SPHERE} material={flat('#FF9FB5')} scale={[0.06, 0.04, 0.02]} position={[side * 0.3, -0.04, 0.33]} rotation={[0, side * 0.7, 0]} />
        ))}
        {/* Hütchen */}
        <group position={[0.1, 0.44, 0.05]} rotation={[0.1, 0, -0.25]}>
          <Blob geo={CYL} color={hat} s={[0.17, 0.035, 0.17]} outline={0.02} />
          <Blob geo={CYL} color={hat} s={[0.1, 0.11, 0.1]} position={[0, 0.07, 0]} outline={0.02} />
          <Blob color="#FF7FA3" s={[0.045, 0.045, 0.045]} position={[0.09, 0.07, 0.06]} outline={0.015} />
        </group>
      </group>
    </group>
  )
}
