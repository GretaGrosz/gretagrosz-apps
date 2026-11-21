import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Blob, CYL, SPHERE, flat, toon, turnTo } from './toon.jsx'

// Krabbe Kai, der Lagerhelfer: rundlicher Panzer, Stielaugen, zwei Scheren, sechs Beinchen.
// Läuft seitwärts-flink, trägt Kisten auf dem Rücken. ent() liefert { x, z, yaw, moving, carry }.

const SHELL = '#FF7A59'
const SHELL_DEEP = '#E85A3C'
const BELLY = '#FFD2C2'
const EYE = '#1D2B45'

export default function Krabbe({ ent }) {
  const root = useRef()
  const body = useRef()
  const legs = useRef([])
  const claws = useRef([])
  const st = useRef({ walk: 0, yaw: 0, placed: false })

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
    if (e.moving) s.walk += dt * 16
    const t = clock.elapsedTime
    body.current.position.y = 0.3 + (e.moving ? Math.abs(Math.sin(s.walk)) * 0.04 : Math.sin(t * 2.2) * 0.012)
    legs.current.forEach((l, i) => l && (l.rotation.x = e.moving ? Math.sin(s.walk + i * 1.7) * 0.5 : 0))
    const lift = e.carry ? -1.2 : 0
    claws.current.forEach((c, i) => c && (c.rotation.x += (lift + Math.sin(t * 3 + i) * 0.12 - c.rotation.x) * 0.2))
  })

  return (
    <group ref={root} scale={0.85}>
      <group ref={body}>
        <Blob color={SHELL} s={[0.38, 0.22, 0.3]} />
        <Blob color={BELLY} s={[0.3, 0.12, 0.22]} position={[0, -0.08, 0.08]} shadow={false} />
        {/* Stielaugen */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.12, 0.17, 0.18]}>
            <mesh geometry={CYL} material={toon(SHELL_DEEP)} scale={[0.025, 0.16, 0.025]} position={[0, 0.08, 0]} />
            <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={0.075} position={[0, 0.19, 0]} />
            <mesh geometry={SPHERE} material={flat(EYE)} scale={0.042} position={[0, 0.2, 0.05]} />
          </group>
        ))}
        {/* Mund */}
        <mesh geometry={SPHERE} material={flat(EYE)} scale={[0.05, 0.015, 0.02]} position={[0, 0.02, 0.3]} />
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
    </group>
  )
}
