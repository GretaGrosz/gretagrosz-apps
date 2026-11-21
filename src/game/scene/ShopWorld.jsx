import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Loopy from './Loopy.jsx'
import Kugel from './Kugel.jsx'
import Krabbe from './Krabbe.jsx'
import { Board, Cloud, Flower, Tree } from './World.jsx'
import { Blob, CYL, INK, RBox, SPHERE, Slab, flat, toon, useTextTexture } from './toon.jsx'
import { CANDY, PLACES, step } from '../sim.js'

// Die spielbare Insel von Loopy & Co.: Theke vorne in der Mitte, Lagerhütte hinten links, Steg mit
// Lieferluftschiff hinten rechts, Briefkasten vorne links. Alles Lebendige (Gläser, Kisten, Kundschaft,
// Boot, Kai) liest jedes Bild den Zustand aus `simRef` – React zeichnet nur neu, wenn Kundschaft kommt oder geht.

const PLOT = '#E4EEFC'
const PLOT_DEEP = '#C3D4F0'
const PAVING = '#F7F9FD'
const GRASS = '#8EE3C4'
const WOOD = '#F2C99A'
const WOOD_DEEP = '#E0AE78'
const BLUE = '#339AFF'
const BLUE_DEEP = '#007AFF'
const PINK = '#FF84A6'
const SIZE = 12

const DIR = new THREE.Vector3(1, 0.9, 1).normalize()
const CENTER = new THREE.Vector3(0, 0, -0.4)
const up = new THREE.Vector3()
const want = new THREE.Vector3()

function Rig({ simRef, follow }) {
  const { camera, size } = useThree()
  const at = useRef(CENTER.clone())
  const ready = useRef(false)
  useFrame((_, dt) => {
    const k = ready.current ? 1 - Math.exp(-Math.min(dt, 0.05) * 3.2) : 1
    ready.current = true
    const portrait = size.height > size.width
    const L = simRef.current?.loopy
    if (follow && L) want.set(L.x * 0.7, 0.5, L.z * 0.7 - 0.2)
    else want.copy(CENTER)
    at.current.lerp(want, k)
    const zoom = follow
      ? portrait
        ? Math.min(size.width / 8.6, size.height / 13)
        : Math.min(size.width / 14, size.height / 9.5)
      : portrait
        ? Math.min(size.width / 15.5, size.height / 21)
        : Math.min(size.width / 19, size.height / 14)
    camera.zoom += (zoom - camera.zoom) * k
    camera.position.copy(at.current).addScaledVector(DIR, 40)
    camera.lookAt(at.current)
    const lift = follow ? 0.03 : portrait ? 0.1 : 0.02
    up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    camera.position.addScaledVector(up, (-lift * size.height) / camera.zoom)
    camera.updateProjectionMatrix()
  })
  return null
}

function Driver({ simRef, inputRef, running }) {
  useFrame((_, dt) => {
    const s = simRef.current
    const i = inputRef.current
    // Tastatur (kx, ky) und Joystick (jx, jy) zusammen
    if (s && running) step(s, dt, { x: Math.max(-1, Math.min(1, i.kx + i.jx)), y: Math.max(-1, Math.min(1, i.ky + i.jy)) })
  })
  return null
}

// ---------- Insel ----------
function Island() {
  return (
    <group>
      <Slab w={SIZE} d={SIZE} h={0.5} r={0.9} color={PLOT} />
      <Slab w={SIZE} d={SIZE} h={0.9} r={0.9} color={PLOT_DEEP} position={[0, -0.5, 0]} />
      {/* Platz vor der Theke und Weg für die Kundschaft */}
      <Slab w={3.6} d={2.2} r={0.6} h={0.04} color={PAVING} position={[0.2, 0.04, 1.9]} />
      <Slab w={4.4} d={1.3} r={0.5} h={0.04} color={PAVING} position={[3.9, 0.04, 1.2]} />
      {/* Wege hinter der Theke: zum Lager und zum Steg */}
      <Slab w={7.6} d={1.1} r={0.5} h={0.04} color={PAVING} position={[0.1, 0.04, -1.9]} />
      <Slab w={1.4} d={2.4} r={0.5} h={0.04} color={PAVING} position={[3.75, 0.04, -3.4]} />
      {/* Wiesen */}
      <Slab w={2.4} d={2.2} r={0.6} h={0.05} color={GRASS} position={[-4.4, 0.05, 4.4]} />
      <Slab w={2.2} d={2.0} r={0.5} h={0.05} color={GRASS} position={[4.4, 0.05, 4.2]} />
      <Slab w={1.6} d={2.4} r={0.5} h={0.05} color={GRASS} position={[-5.0, 0.05, -0.2]} />
      <Slab w={2.2} d={1.4} r={0.5} h={0.05} color={GRASS} position={[0.6, 0.05, -4.9]} />
    </group>
  )
}

function Decor() {
  return (
    <group>
      <Tree position={[-4.7, 0, 4.6]} scale={1.15} />
      <Tree position={[4.5, 0, 4.1]} />
      <Tree position={[-5.0, 0, -0.2]} scale={0.9} />
      <Blob color="#5CD6B0" s={[0.32, 0.28, 0.32]} position={[0.2, 0.24, -5.0]} />
      <Blob color="#7DDDB5" s={[0.24, 0.22, 0.24]} position={[0.8, 0.2, -4.7]} />
      {[[-3.9, 4.0, 0], [-4.2, 5.0, 1], [-3.6, 4.7, 4], [3.8, 3.6, 2], [5.0, 4.6, 5], [-5.3, 0.6, 1], [1.1, -5.2, 3], [-0.1, -4.6, 0]].map(([x, z, c], i) => (
        <Flower key={i} position={[x, 0, z]} color={CANDY[c % 4].color} />
      ))}
      <Board position={[-1.9, 0, 1.6]} />
      <Cloud position={[-9, -2.2, 4]} scale={1.3} speed={0.13} />
      <Cloud position={[8.5, -3, -2]} scale={1.6} speed={0.09} />
      <Cloud position={[-3, 2.5, -11]} scale={1.3} speed={0.11} />
    </group>
  )
}

// ---------- Theke mit Gläsern ----------
const JAR_X = [-0.85, -0.29, 0.27, 0.83]
const CANDY_AT = Array.from({ length: 6 }, (_, i) => [Math.cos(i * 2.4) * 0.07, 0.065 + i * 0.045, Math.sin(i * 2.4) * 0.07])

function LiveJar({ simRef, type, x }) {
  const group = useRef()
  const balls = useRef([])
  const glass = useMemo(() => new THREE.MeshLambertMaterial({ color: '#CFE3FF', transparent: true, opacity: 0.42 }), [])
  useFrame(() => {
    const s = simRef.current
    if (!s) return
    group.current.visible = type < s.types
    const n = s.jars[type] ?? 0
    const scale = 4 / s.cap // große Gläser: kleinere Kugeln, gleiche Höhe
    balls.current.forEach((b, i) => {
      if (!b) return
      b.visible = i < n
      b.position.y = 0.065 + i * 0.045 * Math.min(1, scale * 1.2)
    })
  })
  const c = CANDY[type]
  return (
    <group ref={group} position={[x, 0.81, 0.36]}>
      <mesh geometry={CYL} material={glass} scale={[0.16, 0.32, 0.16]} position={[0, 0.16, 0]} />
      {CANDY_AT.map((p, i) => (
        <mesh key={i} ref={(el) => (balls.current[i] = el)} geometry={SPHERE} material={toon(c.color)} scale={0.055} position={p} />
      ))}
      <Blob geo={CYL} color={c.dark} s={[0.17, 0.05, 0.17]} position={[0, 0.34, 0]} />
    </group>
  )
}

function Counter({ simRef, sign }) {
  const tex = useTextTexture(sign, { w: 640, h: 128, size: 58, fg: '#FFFFFF' })
  const stripes = 8
  return (
    <group position={[PLACES.stall[0], 0, PLACES.stall[1]]}>
      <RBox size={[2.3, 0.72, 0.72]} r={0.04} color={WOOD_DEEP} position={[0, 0.36, 0.3]} />
      <RBox size={[2.5, 0.1, 0.92]} r={0.03} color={WOOD} position={[0, 0.76, 0.3]} />
      {[[-1.15, -0.92], [1.15, -0.92]].map(([x, z], i) => (
        <RBox key={i} size={[0.1, 2.9, 0.1]} r={0.02} color={WOOD_DEEP} position={[x, 1.45, z]} />
      ))}
      <group position={[0, 2.76, -0.38]} rotation={[0.2, 0, 0]}>
        {Array.from({ length: stripes }, (_, i) => {
          const x = (i - (stripes - 1) / 2) * 0.32
          const c = i % 2 ? '#FFFFFF' : BLUE
          return (
            <group key={i} position={[x, 0, 0]}>
              <RBox size={[0.32, 0.08, 1.3]} r={0.02} color={c} />
              <Blob geo={CYL} color={c} s={[0.16, 0.08, 0.16]} position={[0, 0, 0.65]} />
            </group>
          )
        })}
      </group>
      <RBox size={[2.12, 0.42, 0.05]} r={0.02} color={BLUE_DEEP} position={[0, 0.39, 0.665]} shadow={false} />
      <mesh position={[0, 0.39, 0.693]}>
        <planeGeometry args={[2.0, 0.4]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
      {JAR_X.map((x, t) => (
        <LiveJar key={t} simRef={simRef} type={t} x={x} />
      ))}
      {/* Kiste mit Bonbons neben dem Stand */}
      <group position={[1.75, 0, 0.45]} rotation={[0, -0.3, 0]}>
        <RBox size={[0.62, 0.36, 0.5]} r={0.03} color={WOOD_DEEP} position={[0, 0.18, 0]} />
        {[[-0.16, 0.08], [0.02, -0.08], [0.17, 0.1], [0.0, 0.1], [-0.16, -0.1], [0.18, -0.1]].map(([x, z], i) => (
          <mesh key={i} geometry={SPHERE} material={toon(CANDY[i % 3].color)} scale={0.1} position={[x, 0.4, z]} castShadow />
        ))}
      </group>
    </group>
  )
}

// ---------- Kisten ----------
export function Crate({ type, ...props }) {
  const c = CANDY[type] ?? CANDY[0]
  return (
    <group {...props}>
      <RBox size={[0.4, 0.34, 0.36]} r={0.03} color={WOOD} position={[0, 0.17, 0]} />
      <RBox size={[0.41, 0.08, 0.37]} r={0.02} color={c.color} position={[0, 0.2, 0]} shadow={false} />
      <mesh geometry={SPHERE} material={toon(c.color)} scale={0.07} position={[0.06, 0.36, 0.04]} />
      <mesh geometry={SPHERE} material={toon(c.dark)} scale={0.06} position={[-0.08, 0.35, -0.05]} />
    </group>
  )
}

// ---------- Lagerhütte ----------
const STORE_X = [-4.4, -3.85, -3.3, -2.75]

function Storeroom({ simRef, label }) {
  const tex = useTextTexture(label, { w: 384, h: 128, size: 64, fg: '#FFFFFF' })
  const stacks = useRef([])
  useFrame(() => {
    const s = simRef.current
    if (!s) return
    stacks.current.forEach((row, t) =>
      row.forEach((b, k) => {
        if (b) b.visible = t < s.types && k < (s.store[t] ?? 0)
      }),
    )
  })
  const [cx, cz] = PLACES.store
  return (
    <group position={[cx, 0, cz]}>
      <Slab w={2.7} d={2.1} r={0.15} h={0.06} color={WOOD} position={[0, 0.06, 0]} />
      {/* Rückwand und Seiten */}
      <RBox size={[2.7, 1.7, 0.14]} r={0.04} color="#FFFFFF" position={[0, 0.85, -0.98]} />
      <RBox size={[0.14, 1.1, 2.0]} r={0.04} color="#FFFFFF" position={[-1.28, 0.55, 0]} />
      <RBox size={[0.14, 0.6, 2.0]} r={0.04} color="#FFFFFF" position={[1.28, 0.3, 0]} />
      {/* Pfosten vorne und Dach */}
      {[-1.28, 1.28].map((x) => (
        <RBox key={x} size={[0.12, 1.1, 0.12]} r={0.02} color={WOOD_DEEP} position={[x, 0.55, 0.98]} />
      ))}
      {/* kleines Vordach über dem Regal (kein ganzes Dach, damit man die Kisten sieht) */}
      <group position={[0, 1.78, -0.62]} rotation={[0.32, 0, 0]}>
        <RBox size={[2.9, 0.1, 0.95]} r={0.04} color={PINK} />
      </group>
      {/* Schild */}
      <RBox size={[1.2, 0.34, 0.05]} r={0.03} color={BLUE_DEEP} position={[0, 2.12, -0.9]} shadow={false} />
      <mesh position={[0, 2.12, -0.87]}>
        <planeGeometry args={[1.12, 0.3]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
      {/* Regale mit Kisten je Sorte */}
      <RBox size={[2.4, 0.06, 0.5]} r={0.02} color={WOOD_DEEP} position={[0, 0.09, -0.6]} shadow={false} />
      {STORE_X.map((x, t) => (
        <group key={t} position={[x - cx, 0.12, -0.6]}>
          {[0, 1, 2, 3].map((k) => (
            <group
              key={k}
              ref={(el) => {
                stacks.current[t] = stacks.current[t] || []
                stacks.current[t][k] = el
              }}
              position={[0, k * 0.35, 0]}
              rotation={[0, k % 2 ? 0.08 : -0.06, 0]}
            >
              <Crate type={t} />
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

// ---------- Steg, Bestelltafel, Luftschiff ----------
function Dock({ simRef, label }) {
  const tex = useTextTexture(label, { w: 384, h: 128, size: 56 })
  const pile = useRef([])
  const boxTypes = useRef([])
  useFrame(() => {
    const s = simRef.current
    if (!s) return
    pile.current.forEach((b, i) => {
      if (!b) return
      const t = s.dockBoxes[i]
      b.visible = t !== undefined
      if (t !== undefined && boxTypes.current[i] !== t) {
        boxTypes.current[i] = t
        // Farbe der Kiste wechseln: Kinder 1–3 tragen die Sortenfarbe
        const c = CANDY[t]
        b.children[1].material = toon(c.color)
        b.children[2].material = toon(c.color)
        b.children[3].material = toon(c.dark)
      }
    })
  })
  const [px, pz] = PLACES.dockPile
  return (
    <group>
      {/* Planken über den Inselrand hinaus */}
      <group position={[3.85, 0, -5.8]}>
        {Array.from({ length: 7 }, (_, i) => (
          <RBox key={i} size={[1.5, 0.08, 0.34]} r={0.02} color={i % 2 ? WOOD : '#F6D3A8'} position={[0, 0.04, 0.95 - i * 0.38]} />
        ))}
        {[[-0.7, -1.4], [0.7, -1.4]].map(([x, z], i) => (
          <RBox key={i} size={[0.12, 1.4, 0.12]} r={0.02} color={WOOD_DEEP} position={[x, -0.45, z]} />
        ))}
        {[[-0.7, -1.4], [0.7, -1.4]].map(([x, z], i) => (
          <Blob key={`p${i}`} geo={CYL} color={WOOD_DEEP} s={[0.08, 0.5, 0.08]} position={[x, 0.3, z]} />
        ))}
      </group>
      {/* Stapel gelieferter Kisten */}
      <group position={[px, 0.04, pz]}>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} ref={(el) => (pile.current[i] = el)} position={[(i % 2) * 0.44 - 0.22, Math.floor(i / 2) * 0.35, (i % 2) * 0.05]}>
            <RBox size={[0.4, 0.34, 0.36]} r={0.03} color={WOOD} position={[0, 0.17, 0]} />
            <RBox size={[0.41, 0.08, 0.37]} r={0.02} color={CANDY[0].color} position={[0, 0.2, 0]} shadow={false} />
            <mesh geometry={SPHERE} material={toon(CANDY[0].color)} scale={0.07} position={[0.06, 0.36, 0.04]} />
            <mesh geometry={SPHERE} material={toon(CANDY[0].dark)} scale={0.06} position={[-0.08, 0.35, -0.05]} />
          </group>
        ))}
      </group>
      {/* Bestelltafel */}
      <group position={[PLACES.board[0], 0, PLACES.board[1]]} rotation={[0, 0.78, 0]}>
        {[-0.42, 0.42].map((x) => (
          <RBox key={x} size={[0.08, 1.3, 0.08]} r={0.02} color={WOOD_DEEP} position={[x, 0.65, 0]} />
        ))}
        <RBox size={[1.1, 0.62, 0.07]} r={0.03} color="#FFFFFF" position={[0, 1.05, 0.02]} />
        <mesh position={[0, 1.13, 0.06]}>
          <planeGeometry args={[1.0, 0.33]} />
          <meshBasicMaterial map={tex} transparent />
        </mesh>
        {[0, 1, 2].map((i) => (
          <RBox key={i} size={[0.22, 0.035, 0.01]} r={0.004} color={CANDY[i].color} position={[-0.3 + i * 0.3, 0.9, 0.06]} shadow={false} />
        ))}
      </group>
      <Airship simRef={simRef} />
    </group>
  )
}

const SHIP_AT = new THREE.Vector3(5.35, 0.15, -6.6)
const SHIP_FROM = new THREE.Vector3(11, 3.5, -13)

function Airship({ simRef }) {
  const ref = useRef()
  const prop = useRef()
  useFrame(({ clock }, dt) => {
    const s = simRef.current
    const p = s ? s.boat.p : 0
    const e = 1 - Math.pow(1 - p, 3)
    ref.current.visible = p > 0.001
    ref.current.position.lerpVectors(SHIP_FROM, SHIP_AT, e)
    ref.current.position.y += Math.sin(clock.elapsedTime * 1.8) * 0.06
    prop.current.rotation.z += dt * 18
  })
  return (
    <group ref={ref} rotation={[0, -0.6, 0]}>
      {/* Ballon */}
      <Blob color={PINK} s={[0.55, 0.5, 1.15]} position={[0, 1.55, 0]} />
      <Blob color="#FFFFFF" s={[0.56, 0.12, 1.0]} position={[0, 1.55, 0]} shadow={false} />
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} geometry={CYL} material={toon(WOOD_DEEP)} scale={[0.02, 0.75, 0.02]} position={[x, 0.85, 0]} />
      ))}
      {/* Gondel */}
      <RBox size={[0.7, 0.38, 1.25]} r={0.1} color={BLUE} position={[0, 0.35, 0]} />
      <RBox size={[0.72, 0.08, 1.27]} r={0.03} color="#FFFFFF" position={[0, 0.5, 0]} shadow={false} />
      <Crate type={0} position={[0, 0.54, 0.3]} scale={0.8} />
      <Crate type={1} position={[0, 0.54, -0.15]} scale={0.8} />
      <group ref={prop} position={[0, 0.4, -0.68]}>
        <RBox size={[0.06, 0.42, 0.03]} r={0.01} color={INK} />
      </group>
    </group>
  )
}

// ---------- Briefkasten ----------
function Mailbox({ simRef }) {
  const flag = useRef()
  useFrame((_, dt) => {
    const s = simRef.current
    const upFlag = s?.letter ? -Math.PI / 2 : 0
    flag.current.rotation.z += (upFlag - flag.current.rotation.z) * (1 - Math.exp(-dt * 8))
  })
  return (
    <group position={[PLACES.mail[0], 0, PLACES.mail[1]]} rotation={[0, Math.PI / 2, 0]}>
      <RBox size={[0.1, 0.9, 0.1]} r={0.02} color={WOOD_DEEP} position={[0, 0.45, 0]} />
      <RBox size={[0.4, 0.34, 0.6]} r={0.12} color={BLUE} position={[0, 1.0, 0.02]} />
      <RBox size={[0.3, 0.05, 0.02]} r={0.01} color={INK} position={[0, 1.04, 0.33]} shadow={false} />
      <group ref={flag} position={[0.22, 0.95, -0.12]}>
        <RBox size={[0.03, 0.34, 0.03]} r={0.01} color={INK} position={[0, 0.17, 0]} />
        <RBox size={[0.03, 0.12, 0.18]} r={0.01} color="#FF5E8A" position={[0, 0.3, 0.09]} />
      </group>
    </group>
  )
}

// ---------- Hinweise über Stationen ----------
function LiveMarker({ simRef, position, when, color = '#FFD45E' }) {
  const ref = useRef()
  useFrame(({ clock, camera }) => {
    const s = simRef.current
    const on = Boolean(s && when(s))
    ref.current.visible = on
    if (!on) return
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 3) * 0.1
    ref.current.quaternion.copy(camera.quaternion)
  })
  return (
    <group ref={ref} position={position}>
      <mesh geometry={SPHERE} material={flat(color)} scale={[0.3, 0.3, 0.04]} />
      <mesh geometry={SPHERE} material={flat(INK)} scale={[0.045, 0.12, 0.02]} position={[0, 0.05, 0.04]} />
      <mesh geometry={SPHERE} material={flat(INK)} scale={[0.042, 0.042, 0.02]} position={[0, -0.15, 0.04]} />
    </group>
  )
}

const RING = new THREE.RingGeometry(0.72, 0.86, 40)
RING.rotateX(-Math.PI / 2)

function StationRings({ simRef }) {
  const rings = useRef({})
  const spots = { counter: PLACES.serve, store: PLACES.storeDoor, dock: PLACES.dock, mail: PLACES.mailFront }
  const mats = useMemo(() => ({ on: new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.85 }) }), [])
  useFrame(({ clock }) => {
    const s = simRef.current
    Object.entries(rings.current).forEach(([k, m]) => {
      if (!m) return
      const on = s?.near === k
      m.visible = on
      if (on) m.scale.setScalar(1 + Math.sin(clock.elapsedTime * 5) * 0.04)
    })
  })
  return Object.entries(spots).map(([k, [x, z]]) => (
    <mesh key={k} ref={(el) => (rings.current[k] = el)} geometry={RING} material={mats.on} position={[x, 0.07, z]} />
  ))
}

// ---------- Was Loopy trägt ----------
function Carry({ ent, y = 1.5 }) {
  const ref = useRef()
  const crates = useRef([])
  useFrame(() => {
    const e = ent()
    const t = e?.carry?.type
    ref.current.visible = t !== undefined && t !== null
    if (!ref.current.visible) return
    ref.current.position.set(e.x, y + (e.moving ? Math.abs(Math.sin(performance.now() / 80)) * 0.04 : 0), e.z)
    ref.current.rotation.y = e.yaw
    crates.current.forEach((c, i) => c && (c.visible = i === t))
  })
  return (
    <group ref={ref}>
      {CANDY.map((_, t) => (
        <group key={t} ref={(el) => (crates.current[t] = el)}>
          <Crate type={t} />
        </group>
      ))}
    </group>
  )
}

// ---------- Sprechblase über der Kundschaft ----------
function CustomerTag({ c }) {
  const ref = useRef()
  const bar = useRef()
  const barMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#5CD6B0' }), [])
  const qTex = useTextTexture('?', { w: 128, h: 128, size: 104, fg: BLUE_DEEP })
  const ask = c.kind === 'ask' || c.kind === 'regular'
  useFrame(({ camera }) => {
    const on = c.state !== 'leave' && c.present
    ref.current.visible = on
    if (!on) return
    ref.current.position.set(c.x, 1.95, c.z)
    ref.current.quaternion.copy(camera.quaternion)
    const k = Math.max(0, c.patience / c.max)
    bar.current.scale.x = Math.max(0.001, k)
    bar.current.position.x = -0.32 * (1 - k)
    barMat.color.set(k > 0.5 ? '#5CD6B0' : k > 0.25 ? '#FFB13D' : '#FF5E5E')
  })
  const candy = CANDY[c.want]
  return (
    <group ref={ref}>
      <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.42, 0.3, 0.02]} />
      <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.09, 0.09, 0.02]} position={[-0.12, -0.3, 0]} />
      {c.kind === 'regular' && <mesh geometry={SPHERE} material={flat('#FFD45E')} scale={[0.1, 0.1, 0.02]} position={[0.36, 0.22, 0.02]} />}
      {ask ? (
        <mesh position={[0, 0.01, 0.03]}>
          <planeGeometry args={[0.42, 0.42]} />
          <meshBasicMaterial map={qTex} transparent />
        </mesh>
      ) : (
        Array.from({ length: c.qty }, (_, i) => (
          <mesh key={i} geometry={SPHERE} material={flat(candy.color)} scale={[0.11, 0.11, 0.03]} position={[(i - (c.qty - 1) / 2) * 0.24, 0.02, 0.03]} />
        ))
      )}
      {c.kind === 'gold' && <mesh geometry={SPHERE} material={flat('#FFD45E')} scale={[0.07, 0.07, 0.02]} position={[0.3, 0.18, 0.03]} />}
      {/* Geduld */}
      <mesh position={[0, -0.42, 0.01]} material={flat('#E5E5EA')} scale={[0.64, 0.07, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={bar} position={[0, -0.42, 0.02]} material={barMat} scale={[1, 0.07, 1]}>
        <planeGeometry args={[0.64, 1]} />
      </mesh>
    </group>
  )
}

/**
 * simRef: Spielzustand (kann null sein, dann steht die Insel ruhig)
 * inputRef: { x, y } Richtung in Bildschirmkoordinaten
 * customers: Liste der Kundschaft (nur für das Neuzeichnen, Bewegung liest jedes Bild)
 */
export default function ShopWorld({ simRef, inputRef, running, follow, customers, kai, dayKey, labels }) {
  const loopyEnt = () => simRef.current?.loopy
  const kaiEnt = () => simRef.current?.kai
  return (
    <Canvas
      orthographic
      flat
      shadows="soft"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [40, 36, 40], zoom: 30, near: 0.1, far: 200 }}
      style={{ touchAction: 'none' }}
    >
      <Driver simRef={simRef} inputRef={inputRef} running={running} />
      <Rig simRef={simRef} follow={follow} />
      <hemisphereLight args={['#FFFFFF', '#DCE7FA', 2.58]} />
      <directionalLight
        position={[-5, 12, 9]}
        intensity={0.74}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
      <Island />
      <Decor />
      <Counter simRef={simRef} sign={labels.sign} />
      <Storeroom simRef={simRef} label={labels.store} />
      <Dock simRef={simRef} label={labels.dock} />
      <Mailbox simRef={simRef} />
      <StationRings simRef={simRef} />
      <LiveMarker simRef={simRef} position={[PLACES.mail[0], 1.9, PLACES.mail[1]]} when={(s) => s.letter} />
      <LiveMarker simRef={simRef} position={[PLACES.store[0], 2.75, PLACES.store[1] + 0.6]} when={(s) => s.inventur} />
      <LiveMarker simRef={simRef} position={[PLACES.dockPile[0], 1.6, PLACES.dockPile[1]]} when={(s) => s.dockBoxes.length > 0} color="#5CD6B0" />
      <Loopy key={`loopy-${dayKey}`} ent={simRef.current?.loopy ?? { x: 0, z: -1.1, yaw: 0.6, moving: false, mood: 'idle' }} />
      <Carry ent={loopyEnt} />
      {kai && (
        <>
          <Krabbe key={`kai-${dayKey}`} ent={kaiEnt} />
          <Carry ent={kaiEnt} y={0.72} />
        </>
      )}
      {customers.map((c) => (
        <group key={c.id}>
          <Kugel ent={c} color={c.color} dark={c.dark} hat={c.hat} />
          <CustomerTag c={c} />
        </group>
      ))}
    </Canvas>
  )
}
