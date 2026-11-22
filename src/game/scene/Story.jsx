import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Blob, CONE, CYL, INK, SPHERE, flat, toon } from './toon.jsx'

// Figuren der Geschichte: Oma Schildi (weise Meeresschildkröte, Mentorin) und Haibert (frecher Hai, Konkurrent).
// Ursprung an den Füßen, Blick in +z, etwa so groß wie die Kundschaft (Kopf bis y ≈ 1.25).
// wave: winkt mit einem Arm.

const EYE = '#1D2B45'
const BLUSH = '#FF9FB5'
const SMILE = new THREE.TorusGeometry(0.05, 0.013, 6, 14, Math.PI)
const RING = new THREE.TorusGeometry(1, 0.12, 6, 22)
const HANDLE = new THREE.TorusGeometry(0.06, 0.022, 6, 14, Math.PI)
const GRIN = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
const Z = new THREE.Vector3(0, 0, 1)

function Eyes({ eyes, x, y, z, s = 1, yaw = 0.38 }) {
  return [-1, 1].map((side, i) => (
    <group key={side} position={[side * x, y, z]} rotation={[0, side * yaw, 0]}>
      <group ref={(el) => (eyes.current[i] = el)}>
        <mesh geometry={SPHERE} material={flat(EYE)} scale={[0.07 * s, 0.085 * s, 0.04 * s]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.026 * s, 0.028 * s, 0.015 * s]} position={[0.02 * s, 0.034 * s, 0.032 * s]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.012 * s, 0.013 * s, 0.008 * s]} position={[-0.024 * s, -0.03 * s, 0.035 * s]} />
      </group>
    </group>
  ))
}

function Cheeks({ x, y, z, yaw = 0.8 }) {
  return [-1, 1].map((side) => (
    <mesh key={side} geometry={SPHERE} material={flat(BLUSH)} scale={[0.06, 0.035, 0.02]} position={[side * x, y, z]} rotation={[0, side * yaw, 0]} />
  ))
}

// gemeinsames Leben: atmen, blinzeln, Arm winken
function useLife({ body, eyes, waveArm, wave, bounce = 0.02, side = 1 }) {
  const st = useRef({ blinkAt: 0, blinkNext: 2, w: 0 })
  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const t = clock.elapsedTime
    const s = st.current
    const b = Math.sin(t * 2.2)
    body.current.position.y = Math.abs(b) * bounce
    body.current.scale.set(1 - b * 0.01, 1 + b * 0.015, 1 - b * 0.01)
    if (t > s.blinkNext) {
      s.blinkAt = t
      s.blinkNext = t + 2.2 + Math.random() * 3
    }
    const blink = t - s.blinkAt < 0.12 ? 0.1 : 1
    eyes.current.forEach((e) => e && (e.scale.y += (blink - e.scale.y) * 0.5))
    s.w += ((wave ? 1 : 0) - s.w) * (1 - Math.exp(-dt * 6))
    if (waveArm.current) {
      waveArm.current.rotation.z = side * (0.1 + s.w * (2.5 + Math.sin(t * 9) * 0.35))
      waveArm.current.rotation.x = -s.w * 0.2
    }
  })
}

// ---------- Oma Schildi ----------
const SKIN = '#A8DDA6'
const SKIN_DEEP = '#86C98A'
const SHELL = '#5DB37F'
const SHELL_DEEP = '#3F9666'
const PLASTRON = '#F6E7B8'
const SHAWL = '#C6A8F2'
const SHAWL_DEEP = '#A889E3'

const SHELL_C = [0, 0.52, -0.13]
const SHELL_S = [0.37, 0.42, 0.27]

export function Turtle({ position = [0, 0, 0], rotation = [0, 0, 0], wave = false }) {
  const body = useRef()
  const head = useRef()
  const eyes = useRef([])
  const waveArm = useRef()
  useLife({ body, eyes, waveArm, wave, bounce: 0.012, side: -1 })
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    head.current.rotation.x = Math.sin(t * 0.9) * 0.05 - 0.04
    head.current.rotation.z = Math.sin(t * 0.6) * 0.06 + (wave ? 0.1 : 0)
  })
  // Muster auf dem Panzer: flache Platten auf der Rückseite der Panzerkugel
  const plates = useMemo(() => {
    const list = []
    const dirs = [
      [0, 0.35],
      [0.55, 0.3],
      [-0.55, 0.3],
      [0, -0.15],
      [0.6, -0.2],
      [-0.6, -0.2],
      [0, 0.75],
      [0.3, -0.55],
      [-0.3, -0.55],
    ]
    for (const [a, e] of dirs) {
      const d = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e))
      const pos = new THREE.Vector3(d.x * SHELL_S[0], d.y * SHELL_S[1], d.z * SHELL_S[2]).multiplyScalar(0.985)
      const n = new THREE.Vector3(d.x / SHELL_S[0], d.y / SHELL_S[1], d.z / SHELL_S[2]).normalize()
      list.push({ pos: [pos.x + SHELL_C[0], pos.y + SHELL_C[1], pos.z + SHELL_C[2]], quat: new THREE.Quaternion().setFromUnitVectors(Z, n) })
    }
    return list
  }, [])
  return (
    <group position={position} rotation={rotation}>
      <group ref={body}>
        {/* Füße */}
        {[1, -1].map((side) => (
          <Blob key={side} color={SKIN_DEEP} s={[0.1, 0.07, 0.13]} position={[side * 0.14, 0.07, 0.06]} />
        ))}
        {/* Panzer mit Muster und Rand */}
        <Blob color={SHELL} s={SHELL_S} position={SHELL_C} />
        <Blob color="#8FCF8C" s={[0.39, 0.44, 0.2]} position={[0, 0.52, -0.07]} shadow={false} />
        {plates.map((p, i) => (
          <mesh key={i} geometry={SPHERE} material={toon(SHELL_DEEP)} position={p.pos} quaternion={p.quat} scale={[0.1, 0.09, 0.025]} />
        ))}
        {/* Bauch */}
        <Blob color={SKIN} s={[0.28, 0.33, 0.22]} position={[0, 0.46, 0.04]} />
        <Blob color={PLASTRON} s={[0.22, 0.28, 0.12]} position={[0, 0.44, 0.15]} shadow={false} />
        {/* Stola */}
        <mesh geometry={RING} material={toon(SHAWL)} scale={[0.27, 0.27, 0.26]} position={[0, 0.74, 0.0]} rotation={[Math.PI / 2 + 0.15, 0, 0]} />
        <Blob color={SHAWL} s={[0.3, 0.1, 0.24]} position={[0, 0.73, -0.02]} />
        <Blob color={SHAWL_DEEP} s={[0.05, 0.045, 0.04]} position={[0.06, 0.68, 0.25]} />
        {[0, 1].map((i) => (
          <Blob key={i} color={SHAWL_DEEP} s={[0.035, 0.09, 0.025]} position={[0.06 + i * 0.05, 0.6, 0.26 - i * 0.01]} rotation={[0.2, 0, 0.15 - i * 0.25]} />
        ))}
        {/* Arm mit Stock (rechts im Bild) */}
        <group position={[0.27, 0.62, 0.06]} rotation={[-0.5, 0, 0.2]}>
          <Blob color={SKIN} s={[0.07, 0.15, 0.07]} position={[0.02, -0.12, 0]} />
        </group>
        <group position={[0.36, 0, 0.24]}>
          <mesh geometry={CYL} material={toon('#B07A4F')} scale={[0.022, 0.6, 0.022]} position={[0, 0.3, 0]} castShadow />
          <mesh geometry={HANDLE} material={toon('#B07A4F')} position={[-0.06, 0.6, 0]} />
          <Blob color="#5E3B26" s={[0.03, 0.02, 0.03]} position={[0, 0.01, 0]} />
        </group>
        {/* Winkarm */}
        <group ref={waveArm} position={[-0.27, 0.62, 0.04]}>
          <Blob color={SKIN} s={[0.07, 0.15, 0.07]} position={[-0.02, -0.12, 0.02]} />
        </group>
        {/* Kopf */}
        <group ref={head} position={[0, 0.98, 0.06]}>
          <Blob color={SKIN} s={[0.29, 0.26, 0.26]} />
          {/* weiße Augenbrauen */}
          {[1, -1].map((side) => (
            <Blob key={side} color="#FFFFFF" s={[0.06, 0.025, 0.025]} position={[side * 0.12, 0.13, 0.21]} rotation={[0, side * 0.4, side * -0.25]} shadow={false} />
          ))}
          <Eyes eyes={eyes} x={0.12} y={0.03} z={0.22} s={0.95} />
          {[1, -1].map((side) => (
            <mesh key={side} geometry={RING} material={toon('#C9A15A')} scale={0.085} position={[side * 0.12, 0.03, 0.265]} rotation={[0, side * 0.38, 0]} />
          ))}
          <mesh geometry={CYL} material={toon('#C9A15A')} scale={[0.009, 0.05, 0.009]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.05, 0.28]} />
          <Cheeks x={0.19} y={-0.07} z={0.19} />
          <mesh geometry={SMILE} material={flat(INK)} scale={[0.9, -1, 1]} position={[0, -0.07, 0.255]} />
          {/* kleines Blümchen */}
          <group position={[-0.14, 0.2, 0.08]} rotation={[0.3, 0, 0.4]}>
            {[0, 1, 2, 3, 4].map((j) => (
              <mesh key={j} geometry={SPHERE} material={toon('#FF9FB5')} scale={[0.035, 0.035, 0.018]} position={[Math.cos(j * 1.256) * 0.035, Math.sin(j * 1.256) * 0.035, 0]} />
            ))}
            <mesh geometry={SPHERE} material={toon('#FFD45E')} scale={0.022} position={[0, 0, 0.01]} />
          </group>
        </group>
      </group>
    </group>
  )
}

// ---------- Haibert ----------
const SHARK = '#6FA4E6'
const SHARK_DEEP = '#4F86CF'
const SHARK_BELLY = '#F2F6FC'
const CAP = '#FF5E5E'

export function Shark({ position = [0, 0, 0], rotation = [0, 0, 0], wave = false }) {
  const body = useRef()
  const eyes = useRef([])
  const waveArm = useRef()
  const tail = useRef()
  useLife({ body, eyes, waveArm, wave, bounce: 0.05, side: 1 })
  useFrame(({ clock }) => {
    tail.current.rotation.y = Math.sin(clock.elapsedTime * 3) * 0.3
  })
  return (
    <group position={position} rotation={rotation}>
      <group ref={body}>
        {/* Füße */}
        {[1, -1].map((side) => (
          <Blob key={side} color={SHARK_DEEP} s={[0.09, 0.06, 0.12]} position={[side * 0.13, 0.06, 0.06]} />
        ))}
        <Blob color={SHARK} s={[0.34, 0.52, 0.3]} position={[0, 0.58, 0]} />
        <Blob color={SHARK_BELLY} s={[0.25, 0.4, 0.2]} position={[0, 0.5, 0.12]} shadow={false} />
        {/* Rückenflosse */}
        <mesh geometry={CONE} material={toon(SHARK_DEEP)} scale={[0.05, 0.3, 0.18]} position={[0, 0.86, -0.3]} rotation={[-0.85, 0, 0]} castShadow />
        {/* Schwanzflosse */}
        <group ref={tail} position={[0, 0.22, -0.26]}>
          <Blob color={SHARK_DEEP} s={[0.04, 0.16, 0.08]} position={[0, 0.09, -0.12]} rotation={[0.7, 0, 0]} />
          <Blob color={SHARK_DEEP} s={[0.04, 0.1, 0.06]} position={[0, -0.06, -0.1]} rotation={[-0.8, 0, 0]} />
        </group>
        {/* Seitenflossen */}
        <group position={[-0.31, 0.58, 0.02]} rotation={[0, 0, -0.35]}>
          <Blob color={SHARK_DEEP} s={[0.05, 0.15, 0.1]} position={[-0.02, -0.11, 0]} />
        </group>
        <group ref={waveArm} position={[0.31, 0.58, 0.02]}>
          <Blob color={SHARK_DEEP} s={[0.05, 0.15, 0.1]} position={[0.03, -0.11, 0.01]} rotation={[0, 0, 0.2]} />
        </group>
        {/* Kiemen */}
        {[1, -1].flatMap((side) =>
          [0, 1, 2].map((i) => (
            <mesh key={`${side}${i}`} geometry={CYL} material={flat(SHARK_DEEP)} scale={[0.008, 0.08, 0.008]} position={[side * (0.31 - i * 0.005), 0.78, 0.1 - i * 0.055]} rotation={[0, 0, side * 0.1]} />
          )),
        )}
        {/* Gesicht */}
        <Eyes eyes={eyes} x={0.14} y={0.9} z={0.235} s={1} />
        <Blob color={INK} s={[0.06, 0.016, 0.016]} position={[-0.15, 1.0, 0.22]} rotation={[0, -0.4, 0.3]} shadow={false} />
        <Blob color={INK} s={[0.06, 0.016, 0.016]} position={[0.15, 1.01, 0.22]} rotation={[0, 0.4, 0.05]} shadow={false} />
        <Cheeks x={0.24} y={0.8} z={0.2} />
        <group position={[0, 0.75, 0.262]} rotation={[-0.15, 0, 0]}>
          <mesh geometry={GRIN} material={flat('#7A2E3F')} scale={[0.18, 0.11, 0.04]} />
          <mesh geometry={SPHERE} material={flat('#FF8FA3')} scale={[0.09, 0.035, 0.02]} position={[0, -0.07, 0.022]} />
          {[-0.13, -0.078, -0.026, 0.026, 0.078, 0.13].map((x) => (
            <mesh key={x} geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.022, 0.026, 0.012]} position={[x, -0.012 + Math.abs(x) * 0.08, 0.035]} />
          ))}
        </group>
        {/* Schirmmütze */}
        <group position={[0, 1.04, 0.0]} rotation={[-0.12, 0, 0.12]}>
          <Blob color={CAP} s={[0.24, 0.13, 0.23]} />
          <Blob color={CAP} s={[0.17, 0.022, 0.13]} position={[0, -0.04, 0.24]} rotation={[0.15, 0, 0]} />
          <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.245, 0.03, 0.235]} position={[0, -0.03, 0]} />
          <Blob color="#FFD45E" s={[0.035, 0.035, 0.035]} position={[0, 0.13, 0]} />
          <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.05, 0.04, 0.012]} position={[0, 0.03, 0.225]} rotation={[-0.4, 0, 0]} />
        </group>
      </group>
    </group>
  )
}
