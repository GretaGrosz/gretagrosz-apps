import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Blob, CYL, SPHERE, flat, toon, turnTo } from './toon.jsx'
import { Hearts, Zzz } from './Staff.jsx'

// Krabbe Kai, der Lagerhelfer: rundlicher Panzer, Stielaugen, zwei Scheren, sechs Beinchen.
// Läuft seitwärts-flink, trägt Kisten auf dem Rücken. ent() liefert { x, z, yaw, moving, carry, sleepy, asleep, happyT }.

const SHELL = '#FF7A59'
const SHELL_DEEP = '#E85A3C'
const BELLY = '#FFD2C2'
const EYE = '#1D2B45'

export default function Krabbe({ ent }) {
  const root = useRef()
  const body = useRef()
  const legs = useRef([])
  const claws = useRef([])
  const eyes = useRef([])
  const stalks = useRef([])
  const mouth = useRef()
  const st = useRef({ walk: 0, yaw: 0, placed: false, sl: 0, zz: 0, eye: 1, blinkAt: 0, blinkNext: 2, yawnAt: -9, yawnNext: 4 })

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const e = ent()
    if (!e) return
    const g = root.current
    const s = st.current
    g.position.x = e.x
    g.position.z = e.z
    if (!s.placed) {
      s.yaw = e.yaw
      s.placed = true
    }
    s.yaw = turnTo(s.yaw, e.yaw, 1 - Math.exp(-dt * 10))
    g.rotation.y = s.yaw
    const t = clock.elapsedTime
    // müde / schläft / freut sich
    s.sl += ((e.sleepy && !e.asleep ? 1 : 0) - s.sl) * (1 - Math.exp(-dt * 5))
    s.zz += ((e.asleep ? 1 : 0) - s.zz) * (1 - Math.exp(-dt * 3))
    const hT = typeof e.happyT === 'number' ? e.happyT : 99
    const hp = hT < 1.5 ? 1 - hT / 1.5 : 0
    if (e.sleepy && !e.asleep && t > s.yawnNext) {
      s.yawnAt = t
      s.yawnNext = t + 5 + Math.random() * 4
    }
    const ya = t - s.yawnAt
    const yawn = e.sleepy && !e.asleep && ya < 1.5 ? Math.sin((ya / 1.5) * Math.PI) : 0
    if (e.moving) s.walk += dt * 16 * (1 - s.sl * 0.45)
    const breathe = Math.sin(t * 1.2) * 0.012 * s.zz
    const hop = hp > 0 ? Math.abs(Math.sin(hT * 10)) * 0.14 * hp : 0
    body.current.position.y = 0.3 + hop - s.zz * 0.08 + breathe + (e.moving ? Math.abs(Math.sin(s.walk)) * 0.04 : Math.sin(t * 2.2 * (1 - s.sl * 0.5)) * 0.012 * (1 - s.zz))
    body.current.rotation.z = hp > 0 ? Math.sin(hT * 14) * 0.15 * hp : 0
    body.current.scale.y = 1 + breathe * 3
    legs.current.forEach((l, i) => l && (l.rotation.x = e.moving ? Math.sin(s.walk + i * 1.7) * 0.5 : 0))
    const lift = e.carry ? -1.2 : hp > 0 ? -1.4 + Math.sin(t * 16 + 0) * 0.3 : 0
    claws.current.forEach((c, i) => c && (c.rotation.x += (lift + Math.sin(t * 3 * (1 - s.zz) + i) * 0.12 * (1 - s.zz) + s.zz * 0.25 - c.rotation.x) * 0.2))
    // Stielaugen sinken beim Schlafen, Lider zu
    stalks.current.forEach((k, i) => k && (k.rotation.z = (i ? -1 : 1) * (s.zz * 0.6 + s.sl * 0.2)))
    if (t > s.blinkNext) {
      s.blinkAt = t
      s.blinkNext = t + 2 + Math.random() * 3
    }
    const want = e.asleep ? 0.08 : Math.min(t - s.blinkAt < 0.12 ? 0.1 : 1, 1 - s.sl * 0.55, 1 - yawn * 0.85)
    s.eye += (want - s.eye) * 0.45
    eyes.current.forEach((ey) => ey && (ey.scale.y = s.eye))
    mouth.current.scale.y = 0.015 + yawn * 0.05 + (hp > 0 ? 0.025 : 0)
  })

  return (
    <group ref={root} scale={0.85}>
      <group ref={body}>
        <Blob color={SHELL} s={[0.38, 0.22, 0.3]} />
        <Blob color={BELLY} s={[0.3, 0.12, 0.22]} position={[0, -0.08, 0.08]} shadow={false} />
        {/* Stielaugen */}
        {[-1, 1].map((side, i) => (
          <group key={side} ref={(el) => (stalks.current[i] = el)} position={[side * 0.12, 0.17, 0.18]}>
            <mesh geometry={CYL} material={toon(SHELL_DEEP)} scale={[0.025, 0.16, 0.025]} position={[0, 0.08, 0]} />
            <group ref={(el) => (eyes.current[i] = el)} position={[0, 0.19, 0]}>
              <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={0.075} />
              <mesh geometry={SPHERE} material={flat(EYE)} scale={0.042} position={[0, 0.01, 0.05]} />
            </group>
          </group>
        ))}
        {/* Mund */}
        <mesh ref={mouth} geometry={SPHERE} material={flat(EYE)} scale={[0.05, 0.015, 0.02]} position={[0, 0.02, 0.3]} />
        {/* Scheren */}
        {[-1, 1].map((side, i) => (
          <group key={side} ref={(el) => (claws.current[i] = el)} position={[side * 0.34, 0.02, 0.14]}>
            <Blob color={SHELL} s={[0.05, 0.05, 0.14]} position={[side * 0.04, 0, 0.1]} />
            <Blob color={SHELL_DEEP} s={[0.1, 0.08, 0.11]} position={[side * 0.08, 0.02, 0.24]} />
            <Blob color={SHELL_DEEP} s={[0.04, 0.05, 0.07]} position={[side * 0.02, 0.06, 0.32]} />
          </group>
        ))}
        {/* Beine */}
        {[-1, 1].flatMap((side) =>
          [-0.12, 0, 0.12].map((z, k) => (
            <group key={`${side}${k}`} ref={(el) => (legs.current[(side > 0 ? 3 : 0) + k] = el)} position={[side * 0.32, -0.06, z - 0.03]}>
              <mesh geometry={CYL} material={toon(SHELL_DEEP)} scale={[0.025, 0.24, 0.025]} position={[side * 0.06, -0.08, 0]} rotation={[0, 0, side * 0.7]} />
            </group>
          )),
        )}
      </group>
      <Zzz on={() => ent()?.asleep} y={0.75} scale={1.1} />
      <Hearts t={() => ent()?.happyT} y={0.85} scale={1.1} />
    </group>
  )
}
