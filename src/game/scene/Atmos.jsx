import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CYL, SPHERE, flat, toon, useTextTexture } from './toon.jsx'
import { DAY_LEN } from '../sim.js'

// Stimmung der Insel: Tageslicht (Morgen → Mittag → Sonnenuntergang → Dämmerung), Jahreszeit (Schnee, Blätter,
// Blüten), Wetter (Regen, Regenbogen) und kleine Effekte (Herzen, Sterne, Konfetti …).
// `atmos.night` (0–1) lesen Laternen und Lichterketten, damit sie in der Dämmerung leuchten.

export const atmos = { night: 0, rain: 0 }

const KEYS = [
  // p, Hintergrund, Himmel, Boden, Stärke, Sonne, Sonnenstärke
  [0.0, '#EAF2FE', '#FFFFFF', '#DCE7FA', 2.58, '#FFFFFF', 0.74],
  [0.55, '#E6F3FF', '#FFFFFF', '#DCE7FA', 2.62, '#FFFFFF', 0.78],
  [0.78, '#FFEBD9', '#FFF3E6', '#F0DCCB', 2.45, '#FFD9B0', 0.8],
  [0.9, '#FFC7B5', '#FFDCCB', '#E7C0C8', 2.15, '#FF9F80', 0.62],
  [1.0, '#7F8FC4', '#B6C4F0', '#7A86B3', 1.8, '#A0B2F0', 0.38],
]
const cols = KEYS.map((k) => k.map((v) => (typeof v === 'string' ? new THREE.Color(v) : v)))
const RAIN_BG = new THREE.Color('#B9C3D3')
const WINTER_TINT = new THREE.Color('#E4EEFA')
const tmp = { bg: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color(), sun: new THREE.Color() }

function sample(p) {
  let i = 0
  while (i < cols.length - 2 && p > cols[i + 1][0]) i++
  const a = cols[i]
  const b = cols[i + 1]
  const k = THREE.MathUtils.clamp((p - a[0]) / (b[0] - a[0]), 0, 1)
  tmp.bg.copy(a[1]).lerp(b[1], k)
  tmp.sky.copy(a[2]).lerp(b[2], k)
  tmp.ground.copy(a[3]).lerp(b[3], k)
  tmp.sun.copy(a[5]).lerp(b[5], k)
  return { hemi: a[4] + (b[4] - a[4]) * k, sunI: a[6] + (b[6] - a[6]) * k }
}

/** Licht und Himmelsfarbe nach Tageszeit. timeOf(): Sekunden seit Ladenöffnung (oder null = Morgen). */
export function DayLight({ simRef, season }) {
  const hemi = useRef()
  const sun = useRef()
  const { scene } = useThree()
  const bg = useMemo(() => new THREE.Color('#EAF2FE'), [])
  const shown = useRef(0)
  useFrame((_, dt) => {
    const s = simRef.current
    const want = s ? Math.min(1.05, s.t / DAY_LEN) : 0
    // sanft nachziehen (beim Tageswechsel kein harter Sprung)
    shown.current += (want - shown.current) * (1 - Math.exp(-Math.min(dt, 0.05) * (Math.abs(want - shown.current) > 0.3 ? 1.5 : 6)))
    const p = shown.current
    const { hemi: hi, sunI } = sample(Math.min(1, p))
    const rainWant = s?.weather?.kind === 'rain' ? 1 : 0
    atmos.rain += (rainWant - atmos.rain) * (1 - Math.exp(-dt * 1.2))
    atmos.night = THREE.MathUtils.smoothstep(p, 0.84, 1.0)
    bg.copy(tmp.bg)
    if (season === 'winter') bg.lerp(WINTER_TINT, 0.35 * (1 - atmos.night))
    bg.lerp(RAIN_BG, atmos.rain * 0.7 * (1 - atmos.night * 0.5))
    scene.background = bg
    hemi.current.color.copy(tmp.sky)
    hemi.current.groundColor.copy(tmp.ground)
    hemi.current.intensity = hi * (1 - atmos.rain * 0.18)
    sun.current.color.copy(tmp.sun)
    sun.current.intensity = sunI * (1 - atmos.rain * 0.55)
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#FFFFFF', '#DCE7FA', 2.58]} />
      <directionalLight
        ref={sun}
        position={[-5, 12, 9]}
        intensity={0.74}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
    </>
  )
}

// ---------- Leuchtendes (Laternen, Lichterketten) ----------
const glowCache = new Map()
/** Material, das in der Dämmerung von `off` zu `on` wechselt. */
export function useGlow(on = '#FFD27A', off = '#F4EBDD') {
  const key = on + off
  if (!glowCache.has(key)) glowCache.set(key, { mat: new THREE.MeshBasicMaterial({ color: off }), on: new THREE.Color(on), off: new THREE.Color(off) })
  return glowCache.get(key)
}
let glowFrame = -1
export function GlowDriver() {
  useFrame(({ clock }) => {
    const f = Math.floor(clock.elapsedTime * 60)
    if (f === glowFrame) return
    glowFrame = f
    for (const g of glowCache.values()) g.mat.color.copy(g.off).lerp(g.on, atmos.night)
  })
  return null
}

/** Weicher Lichthof (Billboard), sichtbar bei Nacht. */
const HALO_TEX = (() => {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,214,130,0.9)')
  grd.addColorStop(0.4, 'rgba(255,200,110,0.35)')
  grd.addColorStop(1, 'rgba(255,190,100,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
})()
export function Halo({ size = 1.2, ...props }) {
  const ref = useRef()
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: HALO_TEX, transparent: true, depthWrite: false, opacity: 0 }), [])
  useFrame(({ clock }) => {
    mat.opacity = atmos.night * (0.85 + Math.sin(clock.elapsedTime * 3 + (props.position?.[0] ?? 0)) * 0.08)
    ref.current.visible = atmos.night > 0.02
  })
  return <sprite ref={ref} material={mat} scale={[size, size, 1]} {...props} />
}

// ---------- Jahreszeit: Schnee, Blätter, Blüten ----------
const FALL = { winter: { n: 170, color: '#FFFFFF', speed: 0.9, size: 0.055, flat: false }, autumn: { n: 34, color: '#FFA24D', speed: 0.7, size: 0.16, flat: true }, spring: { n: 40, color: '#FFB8CE', speed: 0.55, size: 0.12, flat: true } }
const dummy = new THREE.Object3D()

export function SeasonFall({ season }) {
  const cfg = FALL[season]
  const ref = useRef()
  const parts = useMemo(() => {
    if (!cfg) return []
    return Array.from({ length: cfg.n }, () => ({ x: (Math.random() - 0.5) * 30, y: Math.random() * 12, z: (Math.random() - 0.5) * 30, ph: Math.random() * 6, sp: 0.7 + Math.random() * 0.6 }))
  }, [cfg])
  const geo = useMemo(() => (cfg?.flat ? new THREE.BoxGeometry(1, 0.25, 0.7) : SPHERE), [cfg])
  useFrame(({ clock }, dt) => {
    if (!cfg || !ref.current) return
    const t = clock.elapsedTime
    parts.forEach((p, i) => {
      p.y -= cfg.speed * p.sp * Math.min(dt, 0.05)
      if (p.y < -2) {
        p.y = 11
        p.x = (Math.random() - 0.5) * 30
        p.z = (Math.random() - 0.5) * 30
      }
      dummy.position.set(p.x + Math.sin(t * 0.8 + p.ph) * 0.4, p.y, p.z + Math.cos(t * 0.6 + p.ph) * 0.3)
      dummy.rotation.set(t * p.sp + p.ph, t * 0.7 * p.sp, 0)
      dummy.scale.setScalar(cfg.size)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  if (!cfg) return null
  return <instancedMesh ref={ref} args={[geo, flat(cfg.color), cfg.n]} frustumCulled={false} />
}

// ---------- Wetter ----------
const RAIN_N = 240
export function Weather({ simRef }) {
  const rain = useRef()
  const clouds = useRef()
  const bow = useRef()
  const drops = useMemo(() => Array.from({ length: RAIN_N }, () => ({ x: (Math.random() - 0.5) * 26, y: Math.random() * 12, z: (Math.random() - 0.5) * 26 })), [])
  const cloudMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#A3AEC4', transparent: true, opacity: 0.85 }), [])
  const rainMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#8FB4E8', transparent: true, opacity: 0.0 }), [])
  const bowMats = useMemo(() => ['#FF6B6B', '#FFB13D', '#FFE45E', '#5CD6B0', '#4DA3FF', '#B39CFF'].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })), [])
  const bowGeos = useMemo(() => bowMats.map((_, i) => new THREE.TorusGeometry(9 - i * 0.42, 0.21, 6, 48, Math.PI)), [bowMats])
  const bowK = useRef(0)
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const s = simRef.current
    const r = atmos.rain
    rainMat.opacity = r * 0.75
    rain.current.visible = r > 0.02
    clouds.current.visible = r > 0.02
    clouds.current.scale.setScalar(Math.max(0.001, r))
    if (r > 0.02) {
      drops.forEach((d, i) => {
        d.y -= 16 * dt
        if (d.y < -1) {
          d.y = 11
          d.x = (Math.random() - 0.5) * 26
          d.z = (Math.random() - 0.5) * 26
        }
        dummy.position.set(d.x, d.y, d.z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(0.022, 0.42, 0.022)
        dummy.updateMatrix()
        rain.current.setMatrixAt(i, dummy.matrix)
      })
      rain.current.instanceMatrix.needsUpdate = true
    }
    const wantBow = s?.weather?.kind === 'rainbow' ? 1 : 0
    bowK.current += (wantBow - bowK.current) * (1 - Math.exp(-dt * 1.5))
    bow.current.visible = bowK.current > 0.01
    bowMats.forEach((m) => (m.opacity = bowK.current * 0.75))
  })
  return (
    <>
      <instancedMesh ref={rain} args={[CYL, rainMat, RAIN_N]} frustumCulled={false} />
      <group ref={clouds} position={[-7, 3.5, -7]}>
        {[[-4, 0, 3, 2.2], [-1, 0.5, 0, 2.6], [3, -0.2, -3, 2], [6, 0.3, -6, 2.3], [-6, 0.2, 6, 1.8]].map(([x, y, z, r], i) => (
          <mesh key={i} geometry={SPHERE} material={cloudMat} position={[x, y, z]} scale={[r, r * 0.5, r * 0.8]} />
        ))}
      </group>
      <group ref={bow} position={[-2, -2.5, -12]} rotation={[0, Math.PI / 4, 0]}>
        {bowGeos.map((g, i) => (
          <mesh key={i} geometry={g} material={bowMats[i]} />
        ))}
      </group>
    </>
  )
}

// ---------- Kleine Effekte (aus s.fx) ----------
const FX_GLYPH = { hearts: ['♥', '#FF5E8A'], stars: ['★', '#FFC93D'], sparkle: ['✦', '#FFD45E'], confetti: ['✿', '#FF84A6'], cloud: ['☁', '#8E9AAF'], steam: ['∿', '#FFFFFF'], bubbles: ['○', '#7CC4FF'] }
const CONFETTI = ['#FF5E8A', '#FFD45E', '#5CD6B0', '#4DA3FF', '#B39CFF']
const SLOTS = 14

function useGlyphMats() {
  const tex = {}
  for (const [k, [g, c]] of Object.entries(FX_GLYPH)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tex[k] = useTextTexture(g, { w: 128, h: 128, size: 110, fg: c })
  }
  return useMemo(() => Object.fromEntries(Object.entries(tex).map(([k, t]) => [k, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })])), []) // eslint-disable-line react-hooks/exhaustive-deps
}

export function Effects({ simRef }) {
  const mats = useGlyphMats()
  const slots = useRef([])
  const confetti = useRef([])
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 0.2), [])
  useFrame(({ camera }) => {
    const list = simRef.current?.fx ?? []
    for (let i = 0; i < SLOTS; i++) {
      const g = slots.current[i]
      if (!g) continue
      const f = list[list.length - 1 - i]
      const on = Boolean(f) && f.kind !== 'confetti'
      g.visible = on
      if (!on) continue
      const a = f.age
      const k = Math.min(1, a / 0.25)
      const fade = a > 1.2 ? Math.max(0, 1 - (a - 1.2) / 0.6) : 1
      g.position.set(f.x, f.y + a * (f.kind === 'cloud' ? 0.3 : 0.9), f.z)
      g.quaternion.copy(camera.quaternion)
      g.children.forEach((m, j) => {
        m.material = mats[f.kind] ?? mats.hearts
        const spread = (j - 1) * 0.32
        m.position.set(spread + Math.sin(a * 5 + j) * 0.06, j === 1 ? 0.18 : 0, 0)
        const sc = (f.kind === 'cloud' ? 0.55 : 0.34) * k * fade * (j === 1 ? 1.25 : 1)
        m.scale.set(Math.max(0.001, sc), Math.max(0.001, sc), 1)
      })
    }
    // Konfetti: nur das neueste
    const c = [...list].reverse().find((f) => f.kind === 'confetti')
    confetti.current.forEach((m, j) => {
      if (!m) return
      m.visible = Boolean(c)
      if (!c) return
      const a = c.age
      const ang = j * 0.9
      const r = 0.4 + a * 1.4
      m.position.set(c.x + Math.cos(ang) * r, c.y + a * 2.2 - a * a * 1.8, c.z + Math.sin(ang) * r)
      m.rotation.set(a * 8 + j, a * 6, j)
      const sc = Math.max(0.001, 0.09 * (1 - Math.max(0, a - 1.1) / 0.7))
      m.scale.set(sc, sc * 0.6, sc)
    })
  })
  return (
    <>
      {Array.from({ length: SLOTS }, (_, i) => (
        <group key={i} ref={(el) => (slots.current[i] = el)} visible={false}>
          {[0, 1, 2].map((j) => (
            <mesh key={j} geometry={plane} material={mats.hearts} renderOrder={5} />
          ))}
        </group>
      ))}
      {Array.from({ length: 18 }, (_, j) => (
        <mesh key={j} ref={(el) => (confetti.current[j] = el)} geometry={box} material={flat(CONFETTI[j % CONFETTI.length])} visible={false} />
      ))}
    </>
  )
}
