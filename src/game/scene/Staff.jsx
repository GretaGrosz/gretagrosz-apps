import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Blob, CYL, INK, SPHERE, flat, toon, turnTo, useTextTexture } from './toon.jsx'

// Das Personal aus dem Meer: Otto (Oktopus, füllt Gläser nach), Momo (Robbe, Café) und Luma (Qualle, beruhigt).
// ent() liefert { x, z, yaw, moving, carry, asleep, sleepy, happyT } oder null – wie bei Krabbe Kai.
// sleepy: müde (langsamer, schwere Lider, gähnt)   asleep: schläft (Augen zu, „Z“)   happyT: Sekunden seit Streicheln/Snack

const EYE = '#1D2B45'
const BLUSH = '#FF9FB5'
const SMILE = new THREE.TorusGeometry(0.05, 0.013, 6, 14, Math.PI)
const PLANE = new THREE.PlaneGeometry(1, 1)
const HEART = (() => {
  const s = new THREE.Shape()
  s.moveTo(0, -0.42)
  s.bezierCurveTo(-0.12, -0.3, -0.5, -0.08, -0.5, 0.16)
  s.bezierCurveTo(-0.5, 0.42, -0.16, 0.52, 0, 0.26)
  s.bezierCurveTo(0.16, 0.52, 0.5, 0.42, 0.5, 0.16)
  s.bezierCurveTo(0.5, -0.08, 0.12, -0.3, 0, -0.42)
  return new THREE.ShapeGeometry(s, 10)
})()

const qa = new THREE.Quaternion()
// Gruppe so drehen, dass sie zur Kamera schaut – auch wenn die Eltern gedreht/skaliert sind
function billboard(obj, camera) {
  if (!obj.parent) return
  obj.parent.getWorldQuaternion(qa).invert()
  obj.quaternion.copy(qa).multiply(camera.quaternion)
}
const read = (v) => (typeof v === 'function' ? v() : v)

/** Schlaf-„Z“s, die über dem Kopf aufsteigen. on: boolean oder Funktion → boolean (jedes Bild gelesen). */
export function Zzz({ on, y = 1.2, x = 0.15, scale = 1 }) {
  const ref = useRef()
  const zs = useRef([])
  const tex = useTextTexture('Z', { w: 128, h: 128, size: 112, fg: '#6F86C9' })
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), [tex])
  useFrame(({ clock, camera }) => {
    const g = ref.current
    const v = Boolean(read(on))
    g.visible = v
    if (!v) return
    billboard(g, camera)
    const t = clock.elapsedTime
    zs.current.forEach((z, i) => {
      if (!z) return
      const k = (t * 0.45 + i / 3) % 1
      z.position.set(x + k * 0.28 + Math.sin(k * 6 + i) * 0.04, y + k * 0.62, 0)
      z.rotation.z = Math.sin(k * 5 + i) * 0.25
      z.scale.setScalar(Math.max(0.001, (0.16 + k * 0.16) * Math.sin(Math.min(1, k * 1.15) * Math.PI) * scale))
    })
  })
  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (zs.current[i] = el)} geometry={PLANE} material={mat} />
      ))}
    </group>
  )
}

/** 2–3 rosa Herzen, die aufsteigen, solange t < 1.5. t: Zahl oder Funktion → Sekunden seit dem Streicheln. */
export function Hearts({ t: tv, y = 1.2, scale = 1 }) {
  const ref = useRef()
  const hs = useRef([])
  useFrame(({ camera }) => {
    const g = ref.current
    const t = read(tv)
    const on = typeof t === 'number' && t >= 0 && t < 1.5
    g.visible = on
    if (!on) return
    billboard(g, camera)
    hs.current.forEach((h, i) => {
      if (!h) return
      const k = (t - i * 0.25) / 1.1
      if (k <= 0 || k >= 1) {
        h.scale.setScalar(0.001)
        return
      }
      h.position.set((i - 1) * 0.2 + Math.sin(k * 7 + i * 2) * 0.05, y + k * 0.55 + (i === 1 ? 0.08 : 0), 0)
      h.scale.setScalar(Math.max(0.001, (i === 1 ? 0.24 : 0.18) * Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5) * (k > 0.75 ? (1 - k) / 0.25 : 1) * scale))
    })
  })
  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (hs.current[i] = el)} geometry={HEART} material={flat(i === 1 ? '#FF6F96' : '#FF9FB5')} />
      ))}
    </group>
  )
}

// ---------- gemeinsamer Zustand fürs Personal ----------
function freshState() {
  return { placed: false, yaw: 0, walk: 0, mv: 0, sl: 0, zz: 0, carry: 0, blinkAt: 0, blinkNext: 1.5, yawnAt: -9, yawnNext: 4, eye: 1, yawn: 0, hp: 0, hpT: 99 }
}

// liest ent, setzt Position/Drehung der Wurzel und rechnet die gemeinsamen Werte (müde, Schlaf, Freude, Gähnen, Blinzeln)
function staffStep(st, e, g, yawG, t, dt, walkRate) {
  g.position.x = e.x
  g.position.z = e.z
  if (!st.placed) {
    st.yaw = e.yaw ?? 0
    st.placed = true
  }
  st.yaw = turnTo(st.yaw, e.yaw ?? st.yaw, 1 - Math.exp(-dt * 9))
  yawG.rotation.y = st.yaw
  const k = 1 - Math.exp(-dt * 5)
  st.sl += ((e.sleepy && !e.asleep ? 1 : 0) - st.sl) * k
  st.zz += ((e.asleep ? 1 : 0) - st.zz) * (1 - Math.exp(-dt * 3))
  st.mv += ((e.moving ? 1 : 0) - st.mv) * (1 - Math.exp(-dt * 10))
  st.carry += ((e.carry ? 1 : 0) - st.carry) * (1 - Math.exp(-dt * 10))
  if (e.moving) st.walk += dt * walkRate * (1 - st.sl * 0.45)
  const h = e.happyT
  st.hpT = typeof h === 'number' ? h : 99
  st.hp = st.hpT < 1.5 ? 1 - st.hpT / 1.5 : 0
  // Gähnen ab und zu, wenn müde
  if (e.sleepy && !e.asleep && t > st.yawnNext) {
    st.yawnAt = t
    st.yawnNext = t + 5 + Math.random() * 4
  }
  const ya = t - st.yawnAt
  st.yawn = e.sleepy && !e.asleep && ya < 1.5 ? Math.sin((ya / 1.5) * Math.PI) : 0
  if (t > st.blinkNext) {
    st.blinkAt = t
    st.blinkNext = t + 2 + Math.random() * 3
  }
  const blink = t - st.blinkAt < 0.12 ? 0.1 : 1
  const want = e.asleep ? 0.07 : Math.min(blink, 1 - st.sl * 0.55, 1 - st.yawn * 0.85, st.hp > 0.1 ? 0.75 : 1)
  st.eye += (want - st.eye) * 0.45
}

function Eyes({ refs, x, y, z, s = 1, yaw = 0.35 }) {
  return [-1, 1].map((side, i) => (
    <group key={side} position={[side * x, y, z]} rotation={[0, side * yaw, 0]}>
      <group ref={(el) => (refs.current[i] = el)}>
        <mesh geometry={SPHERE} material={flat(EYE)} scale={[0.08 * s, 0.095 * s, 0.04 * s]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.03 * s, 0.032 * s, 0.015 * s]} position={[0.022 * s, 0.038 * s, 0.032 * s]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.014 * s, 0.015 * s, 0.008 * s]} position={[-0.026 * s, -0.032 * s, 0.035 * s]} />
      </group>
    </group>
  ))
}

function Cheeks({ x, y, z, yaw = 0.8, s = 1 }) {
  return [-1, 1].map((side) => (
    <mesh key={side} geometry={SPHERE} material={flat(BLUSH)} scale={[0.06 * s, 0.035 * s, 0.02]} position={[side * x, y, z]} rotation={[0, side * yaw, 0]} />
  ))
}

// Mund: Lächeln + offener Mund (Gähnen / Freude)
function Mouth({ smile, open, y, z, w = 1 }) {
  return (
    <group position={[0, y, z]}>
      <mesh ref={smile} geometry={SMILE} material={flat(INK)} scale={[w, -1, 1]} position={[0, 0.02, 0]} />
      <group ref={open} scale={[1, 0.001, 1]}>
        <mesh geometry={SPHERE} material={flat('#7A2E3F')} scale={[0.05 * w, 0.055, 0.02]} />
        <mesh geometry={SPHERE} material={flat('#FF8FA3')} scale={[0.032 * w, 0.022, 0.012]} position={[0, -0.025, 0.012]} />
      </group>
    </group>
  )
}

function applyFace(st, eyes, smile, open, t) {
  eyes.current.forEach((e) => e && (e.scale.y = st.eye))
  const o = Math.max(st.yawn * 1.1, st.hp > 0 ? 0.55 + Math.abs(Math.sin(t * 8)) * 0.2 : 0)
  if (open.current) {
    open.current.scale.y += (Math.max(0.001, o) - open.current.scale.y) * 0.35
    open.current.visible = open.current.scale.y > 0.06
  }
  if (smile.current) smile.current.visible = !(open.current && open.current.scale.y > 0.3)
}

// ---------- Otto, der Oktopus ----------
const OTTO = '#F2A0CF'
const OTTO_DEEP = '#D27CC0'
const OTTO_SPOT = '#C56BB6'
const OTTO_BELLY = '#FFD6EA'
const ARMS = 8

export function Octopus({ ent }) {
  const root = useRef()
  const yawG = useRef()
  const body = useRef()
  const mantle = useRef()
  const arms = useRef([])
  const eyes = useRef([])
  const smile = useRef()
  const open = useRef()
  const st = useRef(freshState())
  const armDefs = useMemo(
    () =>
      Array.from({ length: ARMS }, (_, i) => {
        const a = (i / ARMS) * Math.PI * 2 + Math.PI / ARMS
        return { a, front: Math.cos(a) > 0.2 && Math.cos(a) < 0.6 }
      }),
    [],
  )

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(Math.max(dtRaw, 1 / 240), 0.05)
    const e = ent()
    if (!e) return
    const t = clock.elapsedTime
    const s = st.current
    staffStep(s, e, root.current, yawG.current, t, dt, 9)
    const slow = 1 - s.sl * 0.5 - s.zz * 0.7
    const hop = s.hp > 0 ? Math.abs(Math.sin(s.hpT * 9)) * 0.16 * s.hp : 0
    const bob = Math.sin(t * 2.2 * slow) * 0.035 + s.mv * Math.abs(Math.sin(s.walk)) * 0.06
    body.current.position.y = hop + bob - s.zz * 0.12 - s.sl * 0.04
    body.current.rotation.z = s.hp > 0 ? Math.sin(s.hpT * 14) * 0.15 * s.hp : 0
    const breathe = Math.sin(t * (s.zz > 0.5 ? 1.2 : 2.4)) * (0.02 + s.zz * 0.03)
    mantle.current.scale.set(1 - breathe * 0.5, 1 + breathe - s.zz * 0.06, 1 - breathe * 0.5)
    mantle.current.rotation.x = -s.zz * 0.25 + s.sl * 0.1
    const spd = (s.mv > 0.5 ? 7 : 2.6) * slow
    arms.current.forEach((segs, i) => {
      if (!segs) return
      const def = armDefs[i]
      const lift = def.front ? s.carry : 0
      const flat = s.zz
      for (let j = 0; j < segs.length; j++) {
        const sg = segs[j]
        if (!sg) continue
        const base = j === 0 ? 0.75 - flat * 0.35 : j === 1 ? -0.35 + flat * 0.2 : -0.7 + flat * 0.5
        const wig = Math.sin(t * spd + i * 0.9 + j * 1.1 + (s.mv > 0.5 ? s.walk : 0)) * (0.22 + s.hp * 0.3) * (1 - flat * 0.7)
        const up = j === 0 ? -0.1 : j === 1 ? -1.25 : -0.55
        sg.rotation.x = base * (1 - lift) + up * lift + wig * (1 - lift * 0.7)
      }
    })
    applyFace(s, eyes, smile, open, t)
  })

  return (
    <group ref={root}>
      <group ref={yawG}>
        <group ref={body}>
          {/* Kopf/Mantel */}
          <group ref={mantle} position={[0, 0.72, 0]}>
            <Blob color={OTTO} s={[0.4, 0.42, 0.37]} position={[0, 0.06, -0.02]} />
            <Blob color={OTTO} s={[0.36, 0.2, 0.34]} position={[0, -0.18, 0]} />
            {[
              [0.18, 0.32, -0.15, 0.06],
              [-0.2, 0.26, -0.2, 0.05],
              [0.02, 0.44, -0.1, 0.045],
              [-0.3, 0.08, -0.18, 0.04],
              [0.31, 0.12, -0.14, 0.04],
            ].map(([x, y, z, r], i) => (
              <Blob key={i} color={OTTO_SPOT} s={[r, r, r * 0.5]} position={[x, y, z]} rotation={[0, Math.atan2(x, z), 0]} shadow={false} />
            ))}
            <Eyes refs={eyes} x={0.15} y={-0.04} z={0.31} s={1.15} yaw={0.4} />
            <Cheeks x={0.26} y={-0.15} z={0.25} />
            <Mouth smile={smile} open={open} y={-0.19} z={0.33} />
          </group>
          {/* Arme */}
          {armDefs.map((def, i) => (
            <group key={i} position={[Math.sin(def.a) * 0.22, 0.42, Math.cos(def.a) * 0.22]} rotation={[0, def.a, 0]}>
              <ArmChain refs={(j, el) => ((arms.current[i] = arms.current[i] || [])[j] = el)} />
            </group>
          ))}
        </group>
        <Zzz on={() => ent()?.asleep} y={1.15} />
        <Hearts t={() => ent()?.happyT} y={1.3} />
      </group>
    </group>
  )
}

// drei Glieder, jedes am Ende des vorigen; Unterseite heller
function ArmChain({ refs }) {
  const seg = (j, children) => (
    <group ref={(el) => refs(j, el)} position={[0, 0, j === 0 ? 0 : 0.15]}>
      <Blob color={OTTO_DEEP} s={[0.075 - j * 0.017, 0.07 - j * 0.015, 0.1]} position={[0, 0, 0.08]} />
      <Blob color={OTTO_BELLY} s={[0.05 - j * 0.012, 0.03, 0.08]} position={[0, -0.045 + j * 0.01, 0.08]} shadow={false} />
      {children}
    </group>
  )
  return seg(0, seg(1, seg(2, <Blob color={OTTO_DEEP} s={[0.035, 0.035, 0.035]} position={[0, 0, 0.18]} />)))
}

// ---------- Momo, die Robbe (Barista) ----------
const SEAL = '#B9C4D2'
const SEAL_DEEP = '#9AA7B8'
const SEAL_BELLY = '#EEF2F7'
const APRON = '#7FD1B9'
const APRON_DEEP = '#5CB89C'

export function Seal({ ent }) {
  const root = useRef()
  const yawG = useRef()
  const lift = useRef()
  const head = useRef()
  const flips = useRef([])
  const eyes = useRef([])
  const smile = useRef()
  const open = useRef()
  const tail = useRef()
  const st = useRef(freshState())

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(Math.max(dtRaw, 1 / 240), 0.05)
    const e = ent()
    if (!e) return
    const t = clock.elapsedTime
    const s = st.current
    staffStep(s, e, root.current, yawG.current, t, dt, 13)
    const ws = Math.sin(s.walk)
    const hop = (s.hp > 0 ? Math.abs(Math.sin(s.hpT * 9)) * 0.15 * s.hp : 0) + s.mv * Math.abs(ws) * 0.035
    const breathe = Math.sin(t * (s.zz > 0.5 ? 1.2 : 2.4)) * (0.02 + s.zz * 0.025)
    const L = lift.current
    L.position.y = hop - s.zz * 0.1
    L.rotation.z = s.mv * ws * 0.17 + (s.hp > 0 ? Math.sin(s.hpT * 12) * 0.12 * s.hp : 0)
    L.rotation.x = s.mv * 0.06 + s.zz * 0.12
    L.scale.set(1 - breathe * 0.5, 1 + breathe, 1 - breathe * 0.5)
    const k = 1 - Math.exp(-dt * 8)
    head.current.rotation.x += (s.zz * 0.45 + s.sl * 0.15 - s.yawn * 0.25 - s.hp * 0.15 - head.current.rotation.x) * k
    head.current.rotation.z += (Math.sin(t * 1.3) * 0.04 + s.zz * 0.2 - head.current.rotation.z) * k
    flips.current.forEach((f, i) => {
      if (!f) return
      const side = i ? -1 : 1
      const flap = s.hp > 0 ? 1.6 + Math.sin(t * 16 + i * Math.PI) * 0.5 : s.mv * Math.sin(s.walk + i * Math.PI) * 0.35
      const raise = s.carry * 2.5 + (s.hp > 0 ? flap * s.hp : flap) - s.zz * 0.2 + s.yawn * 0.6
      f.rotation.z = side * raise
      f.rotation.x = -s.carry * 0.4
    })
    tail.current.rotation.y = Math.sin(t * (s.mv > 0.5 ? 12 : 2)) * (s.mv > 0.5 ? 0.3 : 0.1)
    applyFace(s, eyes, smile, open, t)
  })

  return (
    <group ref={root}>
      <group ref={yawG}>
        <group ref={lift}>
          <Blob color={SEAL} s={[0.33, 0.42, 0.3]} position={[0, 0.44, 0]} />
          <Blob color={SEAL_BELLY} s={[0.25, 0.33, 0.2]} position={[0, 0.4, 0.12]} shadow={false} />
          {/* Schürze */}
          <Blob color={APRON} s={[0.258, 0.27, 0.206]} position={[0, 0.34, 0.122]} shadow={false} />
          {[1, -1].map((side) => (
            <mesh key={side} geometry={CYL} material={toon(APRON_DEEP)} scale={[0.014, 0.2, 0.014]} position={[side * 0.1, 0.68, 0.25]} rotation={[-0.45, 0, side * 0.35]} />
          ))}
          <Blob color="#FFF3E0" s={[0.09, 0.055, 0.03]} position={[0, 0.3, 0.315]} shadow={false} />
          <HeartBadge position={[0, 0.31, 0.346]} />
          {/* Flossen */}
          {[1, -1].map((side, i) => (
            <group key={side} ref={(el) => (flips.current[i] = el)} position={[side * 0.3, 0.58, 0.04]}>
              <Blob color={SEAL_DEEP} s={[0.06, 0.16, 0.1]} position={[side * 0.05, -0.13, 0.02]} rotation={[0, 0, side * 0.35]} />
            </group>
          ))}
          <group ref={tail} position={[0, 0.06, -0.2]}>
            {[1, -1].map((side) => (
              <Blob key={side} color={SEAL_DEEP} s={[0.12, 0.04, 0.14]} position={[side * 0.09, 0, -0.06]} rotation={[0, side * 0.5, 0]} />
            ))}
          </group>
          {/* Kopf */}
          <group ref={head} position={[0, 0.96, 0.02]}>
            <Blob color={SEAL} s={[0.31, 0.27, 0.28]} />
            {[1, -1].map((side) => (
              <Blob key={side} color="#FFFFFF" s={[0.075, 0.06, 0.06]} position={[side * 0.06, -0.08, 0.235]} shadow={false} />
            ))}
            <mesh geometry={SPHERE} material={flat(INK)} scale={[0.045, 0.03, 0.03]} position={[0, -0.04, 0.29]} />
            {[1, -1].flatMap((side) =>
              [-0.12, 0.12].map((a) => (
                <mesh key={`${side}${a}`} geometry={CYL} material={flat('#7B8597')} scale={[0.005, 0.12, 0.005]} position={[side * 0.17, -0.08 + a * 0.15, 0.22]} rotation={[0, 0, Math.PI / 2 + side * a]} />
              )),
            )}
            <Eyes refs={eyes} x={0.13} y={0.05} z={0.22} s={1} yaw={0.4} />
            <Cheeks x={0.21} y={-0.06} z={0.18} />
            <Mouth smile={smile} open={open} y={-0.14} z={0.235} w={0.8} />
          </group>
        </group>
        <Zzz on={() => ent()?.asleep} y={1.2} />
        <Hearts t={() => ent()?.happyT} y={1.35} />
      </group>
    </group>
  )
}

function HeartBadge(props) {
  return <mesh geometry={HEART} material={flat('#FF84A6')} scale={0.06} {...props} />
}

// ---------- Luma, die Qualle ----------
const BELL = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.56)
const RIBBONS = [
  { a: 0.5, c: '#FFB3D9' },
  { a: 2.1, c: '#C9B6FF' },
  { a: 3.6, c: '#9FE6D2' },
  { a: 5.0, c: '#FFD3A8' },
  { a: 1.3, c: '#E3C2FF', short: true },
  { a: 4.3, c: '#FFC2DC', short: true },
]
const FRILLS = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2)

export function Jelly({ ent }) {
  const root = useRef()
  const yawG = useRef()
  const float = useRef()
  const bell = useRef()
  const ribbons = useRef([])
  const eyes = useRef([])
  const smile = useRef()
  const open = useRef()
  const glow = useRef()
  const st = useRef(freshState())
  const mats = useMemo(
    () => ({
      bell: new THREE.MeshLambertMaterial({ color: '#D9C2FF', transparent: true, opacity: 0.78, emissive: '#B998FF', emissiveIntensity: 0.25, depthWrite: false }),
      inner: new THREE.MeshLambertMaterial({ color: '#FFC4E1', transparent: true, opacity: 0.85, emissive: '#FF9CCB', emissiveIntensity: 0.25 }),
      glow: new THREE.MeshBasicMaterial({ color: '#E8D9FF', transparent: true, opacity: 0.4, depthWrite: false }),
    }),
    [],
  )

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(Math.max(dtRaw, 1 / 240), 0.05)
    const e = ent()
    if (!e) return
    const t = clock.elapsedTime
    const s = st.current
    staffStep(s, e, root.current, yawG.current, t, dt, 7)
    const slow = 1 - s.sl * 0.45 - s.zz * 0.6
    const hop = s.hp > 0 ? Math.abs(Math.sin(s.hpT * 8)) * 0.16 * s.hp : 0
    const F = float.current
    F.position.y = Math.sin(t * 1.6 * slow) * 0.06 + hop - s.sl * 0.1 - s.zz * 0.25
    F.rotation.x = s.mv * 0.15
    F.rotation.z = s.hp > 0 ? Math.sin(s.hpT * 12) * 0.14 * s.hp : 0
    // Schwimmen: Schirm zieht sich rhythmisch zusammen
    const pulse = Math.sin(t * (s.mv > 0.5 ? 6 : 2.2) * slow)
    bell.current.scale.set(1 + pulse * 0.05, 1 - pulse * 0.06, 1 + pulse * 0.05)
    const g = 0.5 + Math.sin(t * 2) * 0.5
    const dim = 1 - s.zz * 0.6
    mats.bell.emissiveIntensity = (0.15 + g * 0.3) * dim
    mats.inner.emissiveIntensity = (0.15 + g * 0.35) * dim
    mats.glow.opacity = (0.22 + g * 0.22) * dim
    glow.current.scale.x = glow.current.scale.z = 0.5 + g * 0.1
    ribbons.current.forEach((segs, i) => {
      if (!segs) return
      const front = i === 0 || i === 4
      for (let j = 0; j < segs.length; j++) {
        const sg = segs[j]
        if (!sg) continue
        const wave = Math.sin(t * 2.6 * slow - j * 0.9 + i * 1.7) * (0.25 + s.mv * 0.2 + s.hp * 0.3)
        const trail = s.mv * (j === 0 ? -0.5 : -0.15)
        const lift = front ? s.carry * (j === 0 ? -2.4 : 0.35) : 0
        sg.rotation.x = wave * (1 - s.carry * (front ? 0.8 : 0)) + trail + lift
      }
    })
    applyFace(s, eyes, smile, open, t)
  })

  return (
    <group ref={root}>
      <mesh ref={glow} geometry={SPHERE} material={mats.glow} scale={[0.55, 0.01, 0.55]} position={[0, 0.02, 0]} />
      <group ref={yawG}>
        <group ref={float}>
          <group ref={bell} position={[0, 0.86, 0]}>
            <mesh geometry={BELL} material={mats.bell} scale={[0.42, 0.44, 0.42]} castShadow />
            <mesh geometry={BELL} material={mats.inner} scale={[0.26, 0.3, 0.26]} position={[0, 0.02, -0.04]} />
            {FRILLS.map((a, i) => (
              <mesh key={i} geometry={SPHERE} material={mats.bell} scale={[0.07, 0.045, 0.07]} position={[Math.sin(a) * 0.38, 0.0 + Math.sin(i * 2.3) * 0.004 - 0.07, Math.cos(a) * 0.38]} />
            ))}
            <Eyes refs={eyes} x={0.14} y={0.15} z={0.34} s={1} yaw={0.38} />
            <Cheeks x={0.25} y={0.06} z={0.31} />
            <Mouth smile={smile} open={open} y={0.04} z={0.4} w={0.8} />
          </group>
          {RIBBONS.map((r, i) => (
            <group key={i} position={[Math.sin(r.a) * (r.short ? 0.12 : 0.24), 0.82, Math.cos(r.a) * (r.short ? 0.12 : 0.24)]} rotation={[0, r.a, 0]}>
              <RibbonChain color={r.c} n={r.short ? 3 : 5} refs={(j, el) => ((ribbons.current[i] = ribbons.current[i] || [])[j] = el)} />
            </group>
          ))}
        </group>
        <Zzz on={() => ent()?.asleep} y={1.25} />
        <Hearts t={() => ent()?.happyT} y={1.45} />
      </group>
    </group>
  )
}

function RibbonChain({ color, n, refs }) {
  const build = (j) => {
    if (j >= n) return null
    return (
      <group ref={(el) => refs(j, el)} position={[0, j === 0 ? 0 : -0.13, 0]}>
        <Blob color={color} s={[0.065 - j * 0.01, 0.085, 0.02]} position={[0, -0.065, 0]} shadow={false} />
        {build(j + 1)}
      </group>
    )
  }
  return build(0)
}
