import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Blob, CONE, CYL, INK, RBox, SPHERE, Slab, flat, toon, useTextTexture } from './toon.jsx'
import { Flower, Tree } from './World.jsx'
import { Halo, useGlow } from './Atmos.jsx'
import { AQUARIUM, AREA_GEO, BEACH, CAFE } from '../sim.js'

// Zusatz-Inseln (Café, Aquarium, Strand) mit Brücken, Deko-Modelle zum Aufstellen, Laternen und Haiberts Insel.

const PLOT = '#E4EEFC'
const PLOT_DEEP = '#C3D4F0'
const WOOD = '#F2C99A'
const WOOD_DEEP = '#E0AE78'
const PINK = '#FF84A6'
const BLUE = '#339AFF'
const SAND = '#FFE2A6'

function Platform({ rect, top = PLOT, snow }) {
  const [x1, z1, x2, z2] = rect
  const w = x2 - x1
  const d = z2 - z1
  return (
    <group position={[(x1 + x2) / 2, 0, (z1 + z2) / 2]}>
      <Slab w={w} d={d} h={0.5} r={0.7} color={snow ? '#F4F8FE' : top} />
      <Slab w={w} d={d} h={0.8} r={0.7} color={PLOT_DEEP} position={[0, -0.5, 0]} />
      <Blob color={PLOT_DEEP} s={[w * 0.32, 0.9, d * 0.32]} position={[0, -1.3, 0]} shadow={false} />
    </group>
  )
}

function Bridge({ rect }) {
  const [x1, z1, x2, z2] = rect
  const alongX = x2 - x1 > z2 - z1
  const len = alongX ? x2 - x1 : z2 - z1
  const width = alongX ? z2 - z1 : x2 - x1
  const n = Math.round(len / 0.36)
  const cx = (x1 + x2) / 2
  const cz = (z1 + z2) / 2
  return (
    <group position={[cx, 0, cz]} rotation={[0, alongX ? Math.PI / 2 : 0, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <RBox key={i} size={[width + 0.1, 0.07, 0.3]} r={0.02} color={i % 2 ? WOOD : '#F6D3A8'} position={[0, 0.0, -len / 2 + 0.18 + i * (len / n)]} />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          {[-len / 2 + 0.15, len / 2 - 0.15].map((z) => (
            <RBox key={z} size={[0.09, 0.5, 0.09]} r={0.02} color={WOOD_DEEP} position={[side * (width / 2 + 0.02), 0.25, z]} />
          ))}
          <mesh geometry={CYL} material={toon('#E9D2B0')} scale={[0.02, len - 0.3, 0.02]} rotation={[Math.PI / 2, 0, 0]} position={[side * (width / 2 + 0.02), 0.44, 0]} />
        </group>
      ))}
    </group>
  )
}

// ---------- Café ----------
function Cafe({ simRef, label, snow }) {
  const g = AREA_GEO.cafe
  const tex = useTextTexture(label, { w: 384, h: 128, size: 66, fg: '#FFFFFF' })
  const cups = useRef([])
  const steam = useRef()
  useFrame(({ clock }) => {
    const s = simRef.current
    CAFE.tables.forEach((_, i) => {
      const m = cups.current[i]
      if (m) m.visible = Boolean(s?.customers.some((c) => c.table === i && c.state === 'sit' && c.served))
    })
    if (steam.current) {
      const busy = s?.customers.some((c) => c.state === 'sit' && !c.served)
      steam.current.visible = Boolean(busy)
      steam.current.children.forEach((b, i) => {
        const a = (clock.elapsedTime * 0.8 + i / 3) % 1
        b.position.y = 1.15 + a * 0.6
        b.scale.setScalar(0.05 + a * 0.08)
      })
    }
  })
  const [mx, mz] = CAFE.machine
  return (
    <group>
      <Platform rect={g.platform} snow={snow} />
      <Bridge rect={g.bridge} />
      {/* Holzboden */}
      <Slab w={3.6} d={3.2} r={0.4} h={0.05} color={WOOD} position={[g.center[0] - 0.05, 0.05, g.center[1] + 0.3]} />
      {/* Theke mit Kakaomaschine */}
      <group position={[mx, 0, mz]}>
        <RBox size={[1.1, 0.8, 0.6]} r={0.06} color="#FFFFFF" position={[0, 0.4, 0]} />
        <RBox size={[1.16, 0.08, 0.66]} r={0.03} color={WOOD_DEEP} position={[0, 0.82, 0]} />
        <RBox size={[0.42, 0.5, 0.36]} r={0.08} color="#A86B45" position={[-0.18, 1.1, -0.05]} />
        <mesh geometry={SPHERE} material={toon('#E8E8EE')} scale={[0.12, 0.08, 0.12]} position={[-0.18, 1.38, -0.05]} />
        <RBox size={[0.08, 0.12, 0.08]} r={0.02} color={INK} position={[-0.18, 0.95, 0.15]} shadow={false} />
        {[0.25, 0.42].map((x) => (
          <group key={x} position={[x, 0.86, 0.05]}>
            <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.06, 0.1, 0.06]} position={[0, 0.05, 0]} />
            <mesh geometry={CYL} material={toon('#7E4C2E')} scale={[0.05, 0.01, 0.05]} position={[0, 0.1, 0]} />
          </group>
        ))}
        <group ref={steam} position={[-0.18, 0, 0.12]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} geometry={SPHERE} material={flat('#FFFFFF')} position={[Math.sin(i) * 0.05, 1.2, 0]} />
          ))}
        </group>
        {/* Markise */}
        {[-0.55, 0.55].map((x) => (
          <RBox key={x} size={[0.07, 1.9, 0.07]} r={0.02} color={WOOD_DEEP} position={[x, 0.95, -0.25]} />
        ))}
        <group position={[0, 1.95, 0.05]} rotation={[0.35, 0, 0]}>
          {Array.from({ length: 5 }, (_, i) => (
            <RBox key={i} size={[0.26, 0.06, 0.75]} r={0.02} color={i % 2 ? '#FFFFFF' : '#A86B45'} position={[-0.52 + i * 0.26, 0, 0]} />
          ))}
        </group>
        <RBox size={[1.0, 0.3, 0.05]} r={0.03} color={PINK} position={[0, 2.25, -0.25]} shadow={false} />
        <mesh position={[0, 2.25, -0.22]}>
          <planeGeometry args={[0.95, 0.28]} />
          <meshBasicMaterial map={tex} transparent />
        </mesh>
      </group>
      {/* Tische mit Hockern */}
      {CAFE.tables.map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh geometry={CYL} material={toon(WOOD_DEEP)} scale={[0.05, 0.55, 0.05]} position={[0, 0.28, 0]} castShadow />
          <Blob geo={CYL} color="#FFFFFF" s={[0.36, 0.05, 0.36]} position={[0, 0.57, 0]} />
          <Blob geo={CYL} color={i % 2 ? PINK : '#8EE3C4'} s={[0.37, 0.015, 0.37]} position={[0, 0.6, 0]} shadow={false} />
          <group ref={(el) => (cups.current[i] = el)} position={[0.12, 0.62, 0.05]}>
            <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.07, 0.11, 0.07]} position={[0, 0.055, 0]} />
            <mesh geometry={CYL} material={toon('#7E4C2E')} scale={[0.06, 0.01, 0.06]} position={[0, 0.11, 0]} />
            <mesh geometry={SPHERE} material={toon('#FFFFFF')} scale={[0.04, 0.025, 0.04]} position={[0, 0.125, 0]} />
          </group>
          <group position={[CAFE.seat[0], 0, CAFE.seat[1]]}>
            <mesh geometry={CYL} material={toon(WOOD_DEEP)} scale={[0.04, 0.3, 0.04]} position={[0, 0.15, 0]} />
            <Blob geo={CYL} color={PINK} s={[0.2, 0.05, 0.2]} position={[0, 0.3, 0]} />
          </group>
        </group>
      ))}
      <Flower position={[-10.7, 0, 2.7]} color="#FF84A6" />
      <Flower position={[-7.3, 0, 2.8]} color="#FFD45E" />
      <Flower position={[-10.8, 0, -0.6]} color="#5CD6B0" />
    </group>
  )
}

// ---------- Aquarium ----------
const FISH = [
  ['#FF9F4A', 0.0, 0.5],
  ['#FFD45E', 1.7, 0.7],
  ['#FF84A6', 3.1, 0.45],
  ['#4DA3FF', 4.4, 0.6],
  ['#B39CFF', 2.3, 0.8],
]

function Aquarium({ simRef, label, snow }) {
  const g = AREA_GEO.aquarium
  const tex = useTextTexture(label, { w: 512, h: 128, size: 66, fg: '#FFFFFF' })
  const fish = useRef([])
  const glass = useMemo(() => new THREE.MeshLambertMaterial({ color: '#9AD3FF', transparent: true, opacity: 0.5 }), [])
  const [x1, z1, x2, z2] = AQUARIUM.tank
  const cx = (x1 + x2) / 2
  const cz = (z1 + z2) / 2
  const w = x2 - x1
  const d = z2 - z1
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    fish.current.forEach((f, i) => {
      if (!f) return
      const [, ph, y] = FISH[i]
      const sp = 0.35 + i * 0.05
      const a = t * sp + ph
      f.position.set(Math.sin(a) * (w / 2 - 0.4), 0.5 + y + Math.sin(t * 1.3 + i) * 0.08, Math.cos(a * 1.3) * (d / 2 - 0.25))
      f.rotation.y = Math.atan2(Math.cos(a) * (w / 2 - 0.4), -Math.sin(a * 1.3) * 1.3 * (d / 2 - 0.25)) + Math.PI / 2
    })
  })
  return (
    <group>
      <Platform rect={g.platform} snow={snow} />
      <Bridge rect={g.bridge} />
      <group position={[cx, 0, cz]}>
        {/* Sockel und Glasbecken */}
        <RBox size={[w + 0.2, 0.45, d + 0.2]} r={0.08} color="#FFFFFF" position={[0, 0.22, 0]} />
        <mesh geometry={useMemo(() => new THREE.BoxGeometry(w, 1.5, d), [w, d])} material={glass} position={[0, 1.2, 0]} />
        <RBox size={[w + 0.24, 0.12, d + 0.24]} r={0.04} color={BLUE} position={[0, 1.98, 0]} />
        <Slab w={w - 0.1} d={d - 0.1} r={0.1} h={0.06} color={SAND} position={[0, 0.5, 0]} />
        {/* Korallen und Steine */}
        {[[-1.4, 0.2, '#FF84A6'], [-0.6, -0.3, '#FFB13D'], [0.9, 0.25, '#B39CFF'], [1.6, -0.2, '#5CD6B0']].map(([x, z, c], i) => (
          <group key={i} position={[x, 0.52, z]}>
            <Blob geo={CONE} color={c} s={[0.12, 0.45, 0.12]} position={[0, 0.22, 0]} />
            <Blob geo={CONE} color={c} s={[0.08, 0.3, 0.08]} position={[0.12, 0.15, 0.05]} rotation={[0, 0, -0.4]} />
          </group>
        ))}
        <Blob color="#C8CFDA" s={[0.3, 0.16, 0.22]} position={[0.2, 0.58, -0.25]} />
        {FISH.map(([c], i) => (
          <group key={i} ref={(el) => (fish.current[i] = el)}>
            <mesh geometry={SPHERE} material={toon(c)} scale={[0.16, 0.11, 0.07]} />
            <mesh geometry={CONE} material={toon(c)} scale={[0.09, 0.12, 0.04]} position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
            <mesh geometry={SPHERE} material={flat(INK)} scale={0.022} position={[0.1, 0.03, 0.055]} />
          </group>
        ))}
        {/* Schild */}
        <RBox size={[1.7, 0.36, 0.06]} r={0.04} color={BLUE} position={[0, 2.35, 0]} shadow={false} />
        <mesh position={[0, 2.35, 0.035]}>
          <planeGeometry args={[1.6, 0.32]} />
          <meshBasicMaterial map={tex} transparent />
        </mesh>
      </group>
      <Tree position={[g.platform[0] + 0.6, 0, g.platform[3] - 0.7]} scale={0.8} />
      <Flower position={[0.8, 0, -7.4]} color="#FFD45E" />
      <Flower position={[-3.9, 0, -7.5]} color="#FF84A6" />
    </group>
  )
}

// ---------- Strand ----------
function Beach({ snow }) {
  const g = AREA_GEO.beach
  const [x1, z1, x2, z2] = g.platform
  return (
    <group>
      <Platform rect={g.platform} top={SAND} snow={snow} />
      <Bridge rect={g.bridge} />
      {/* Wasserrand vorne */}
      <Slab w={x2 - x1 - 0.6} d={1.0} r={0.4} h={0.05} color="#9AD3FF" position={[(x1 + x2) / 2, 0.05, z2 - 0.75]} />
      <Slab w={x2 - x1 - 1.2} d={0.25} r={0.12} h={0.06} color="#FFFFFF" position={[(x1 + x2) / 2, 0.06, z2 - 1.22]} />
      {BEACH.beds.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <RBox size={[0.55, 0.1, 1.0]} r={0.04} color="#FFFFFF" position={[0, 0.22, 0]} />
          <RBox size={[0.5, 0.05, 0.85]} r={0.03} color={['#FF84A6', '#5CD6B0', '#FFD45E'][i]} position={[0, 0.29, 0.05]} shadow={false} />
          <group position={[0, 0.3, -0.42]} rotation={[-0.6, 0, 0]}>
            <RBox size={[0.55, 0.08, 0.4]} r={0.03} color="#FFFFFF" position={[0, 0, 0.18]} />
          </group>
          {[[-0.22, -0.4], [0.22, -0.4], [-0.22, 0.4], [0.22, 0.4]].map(([lx, lz], k) => (
            <mesh key={k} geometry={CYL} material={toon(WOOD_DEEP)} scale={[0.025, 0.2, 0.025]} position={[lx, 0.1, lz]} />
          ))}
        </group>
      ))}
      {/* Sonnenschirm */}
      <group position={[BEACH.umbrella[0], 0, BEACH.umbrella[1]]}>
        <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.04, 1.6, 0.04]} position={[0, 0.8, 0]} />
        <Blob geo={CONE} color="#FF84A6" s={[0.85, 0.35, 0.85]} position={[0, 1.7, 0]} />
        <Blob geo={CONE} color="#FFFFFF" s={[0.5, 0.22, 0.5]} position={[0, 1.79, 0]} shadow={false} />
      </group>
      {/* Palme */}
      <group position={[x1 + 0.5, 0, z1 + 0.6]}>
        {Array.from({ length: 6 }, (_, i) => (
          <Blob key={i} geo={CYL} color={i % 2 ? WOOD_DEEP : WOOD} s={[0.09 - i * 0.006, 0.28, 0.09 - i * 0.006]} position={[i * 0.04, 0.14 + i * 0.27, 0]} />
        ))}
        {[0, 1.2, 2.4, 3.6, 4.8].map((a) => (
          <group key={a} position={[0.24, 1.72, 0]} rotation={[0, a, 0]}>
            <Blob color="#5CD6B0" s={[0.12, 0.04, 0.55]} position={[0, -0.08, 0.42]} rotation={[0.35, 0, 0]} />
          </group>
        ))}
        <mesh geometry={SPHERE} material={toon('#8A5A3C')} scale={0.08} position={[0.3, 1.6, 0.08]} />
      </group>
      {/* Muscheln und Seestern */}
      {[[-1.0, 9.9, '#FFB8CE'], [-3.6, 10.1, '#FFFFFF'], [0.0, 7.4, '#FFD45E']].map(([x, z, c], i) => (
        <mesh key={i} geometry={SPHERE} material={toon(c)} scale={[0.12, 0.05, 0.1]} position={[x, 0.08, z]} />
      ))}
      <group position={[-4.6, 0.07, 7.4]}>
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} geometry={SPHERE} material={toon('#FF9F4A')} scale={[0.05, 0.03, 0.15]} rotation={[0, (k * Math.PI * 2) / 5, 0]} position={[Math.sin((k * Math.PI * 2) / 5) * 0.1, 0, Math.cos((k * Math.PI * 2) / 5) * 0.1]} />
        ))}
      </group>
    </group>
  )
}

export function AreasLayer({ simRef, areas, labels, snow }) {
  return (
    <>
      {areas.cafe && <Cafe simRef={simRef} label={labels.cafe} snow={snow} />}
      {areas.aquarium && <Aquarium simRef={simRef} label={labels.aquarium} snow={snow} />}
      {areas.beach && <Beach snow={snow} />}
    </>
  )
}

// ---------- Laternen am Inselrand ----------
export function Lantern({ position, scale = 1 }) {
  const glow = useGlow('#FFD27A', '#FFF6E5')
  return (
    <group position={position} scale={scale}>
      <mesh geometry={CYL} material={toon(INK)} scale={[0.035, 1.3, 0.035]} position={[0, 0.65, 0]} castShadow />
      <RBox size={[0.24, 0.3, 0.24]} r={0.05} color={INK} position={[0, 1.42, 0]} />
      <mesh geometry={SPHERE} material={glow.mat} scale={[0.1, 0.13, 0.1]} position={[0, 1.42, 0]} />
      <Blob geo={CONE} color={INK} s={[0.18, 0.12, 0.18]} position={[0, 1.63, 0]} />
      <Halo position={[0, 1.42, 0]} size={1.4} />
    </group>
  )
}

// ---------- Deko-Modelle ----------
function Balloons() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.4) * 0.06
  })
  return (
    <group ref={ref}>
      <RBox size={[0.18, 0.1, 0.18]} r={0.03} color={WOOD_DEEP} position={[0, 0.05, 0]} />
      {[['#FF5E8A', -0.18, 1.35], ['#FFD45E', 0.16, 1.5], ['#4DA3FF', 0.02, 1.7]].map(([c, x, y], i) => (
        <group key={i}>
          <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.008, y, 0.008]} position={[x / 2, y / 2, 0]} rotation={[0, 0, -x * 0.25]} />
          <Blob color={c} s={[0.17, 0.2, 0.17]} position={[x, y, 0]} />
        </group>
      ))}
    </group>
  )
}

function Fountain() {
  const spray = useRef([])
  useFrame(({ clock }) => {
    spray.current.forEach((b, i) => {
      if (!b) return
      const a = (clock.elapsedTime * 0.9 + i / 6) % 1
      const ang = (i / 6) * Math.PI * 2
      b.position.set(Math.cos(ang) * a * 0.42, 0.95 + a * 0.35 - a * a * 0.75, Math.sin(ang) * a * 0.42)
      b.scale.setScalar(0.06 * (1 - a * 0.5))
    })
  })
  return (
    <group>
      <Blob geo={CYL} color="#FFFFFF" s={[0.62, 0.28, 0.62]} position={[0, 0.14, 0]} />
      <Blob geo={CYL} color="#9AD3FF" s={[0.54, 0.03, 0.54]} position={[0, 0.27, 0]} shadow={false} />
      <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.08, 0.6, 0.08]} position={[0, 0.55, 0]} />
      <Blob geo={CYL} color="#FFFFFF" s={[0.28, 0.06, 0.28]} position={[0, 0.85, 0]} />
      <Blob color="#9AD3FF" s={[0.1, 0.12, 0.1]} position={[0, 0.98, 0]} />
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} ref={(el) => (spray.current[i] = el)} geometry={SPHERE} material={flat('#BFE3FF')} />
      ))}
    </group>
  )
}

function XmasTree() {
  const bulbs = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ a: i * 2.1, y: 0.45 + (i % 5) * 0.22, r: 0.42 - (i % 5) * 0.07, c: ['#FF5E8A', '#FFD45E', '#4DA3FF', '#5CD6B0'][i % 4] })), [])
  return (
    <group>
      <mesh geometry={CYL} material={toon(WOOD_DEEP)} scale={[0.08, 0.3, 0.08]} position={[0, 0.15, 0]} />
      {[[0.55, 0.6, 0.55], [0.43, 0.5, 0.95], [0.3, 0.42, 1.3]].map(([r, h, y], i) => (
        <Blob key={i} geo={CONE} color={i % 2 ? '#3FBF98' : '#2FA57F'} s={[r, h, r]} position={[0, y, 0]} />
      ))}
      {bulbs.map((b, i) => (
        <mesh key={i} geometry={SPHERE} material={useGlow(b.c, b.c).mat} scale={0.05} position={[Math.cos(b.a) * b.r, b.y, Math.sin(b.a) * b.r]} />
      ))}
      <mesh geometry={SPHERE} material={useGlow('#FFE27A', '#FFD45E').mat} scale={[0.12, 0.12, 0.05]} position={[0, 1.62, 0]} />
      <Halo position={[0, 1.62, 0]} size={0.9} />
    </group>
  )
}

export function DecorModel({ id }) {
  const glow = useGlow('#FFE2A0', '#FFF0F4')
  switch (id) {
    case 'flowerpot':
      return (
        <group>
          <Blob geo={CYL} color="#E58B5A" s={[0.2, 0.26, 0.2]} position={[0, 0.13, 0]} />
          <Blob geo={CYL} color="#D27245" s={[0.22, 0.05, 0.22]} position={[0, 0.27, 0]} />
          <Blob color="#5CD6B0" s={[0.24, 0.2, 0.24]} position={[0, 0.42, 0]} />
          {[['#FF84A6', 0.1, 0.08], ['#FFD45E', -0.1, 0.05], ['#B39CFF', 0.0, -0.12]].map(([c, x, z], i) => (
            <mesh key={i} geometry={SPHERE} material={toon(c)} scale={0.07} position={[x, 0.58, z]} />
          ))}
        </group>
      )
    case 'lantern':
      return <Lantern position={[0, 0, 0]} scale={0.75} />
    case 'shellLamp':
      return (
        <group>
          <Blob color="#FFB8CE" s={[0.32, 0.3, 0.12]} position={[0, 0.3, -0.05]} rotation={[-0.3, 0, 0]} />
          {[-0.2, -0.1, 0, 0.1, 0.2].map((x) => (
            <mesh key={x} geometry={CYL} material={toon('#FF9FBF')} scale={[0.012, 0.5, 0.012]} position={[x * 0.9, 0.3, 0.06]} rotation={[0.2, 0, -x * 1.6]} />
          ))}
          <Blob color="#FFFFFF" s={[0.3, 0.06, 0.22]} position={[0, 0.06, 0.1]} />
          <mesh geometry={SPHERE} material={glow.mat} scale={0.08} position={[0, 0.17, 0.14]} />
          <Halo position={[0, 0.2, 0.14]} size={0.9} />
        </group>
      )
    case 'parasol':
      return (
        <group>
          <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.035, 1.5, 0.035]} position={[0, 0.75, 0]} />
          <Blob geo={CONE} color={BLUE} s={[0.7, 0.3, 0.7]} position={[0, 1.55, 0]} />
          <Blob geo={CONE} color="#FFFFFF" s={[0.4, 0.2, 0.4]} position={[0, 1.63, 0]} shadow={false} />
        </group>
      )
    case 'benchDeco':
      return (
        <group>
          <RBox size={[0.9, 0.08, 0.34]} r={0.03} color={WOOD} position={[0, 0.38, 0]} />
          <RBox size={[0.9, 0.3, 0.06]} r={0.03} color={WOOD} position={[0, 0.6, -0.15]} />
          {[-0.36, 0.36].map((x) => (
            <RBox key={x} size={[0.06, 0.36, 0.3]} r={0.02} color={WOOD_DEEP} position={[x, 0.18, 0]} />
          ))}
        </group>
      )
    case 'balloons':
      return <Balloons />
    case 'flamingo':
      return (
        <group>
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} geometry={CYL} material={toon('#FF9FB5')} scale={[0.015, 0.5, 0.015]} position={[x, 0.25, 0]} />
          ))}
          <Blob color="#FF84A6" s={[0.2, 0.15, 0.28]} position={[0, 0.62, 0]} />
          <mesh geometry={CYL} material={toon('#FF84A6')} scale={[0.04, 0.4, 0.04]} position={[0, 0.88, 0.18]} rotation={[0.35, 0, 0]} />
          <Blob color="#FF84A6" s={[0.09, 0.09, 0.1]} position={[0, 1.08, 0.26]} />
          <Blob geo={CONE} color={INK} s={[0.03, 0.1, 0.03]} position={[0, 1.04, 0.37]} rotation={[1.9, 0, 0]} />
          <mesh geometry={SPHERE} material={flat(INK)} scale={0.018} position={[0.07, 1.11, 0.3]} />
        </group>
      )
    case 'fountain':
      return <Fountain />
    case 'xmasTree':
      return <XmasTree />
    case 'snowman':
      return (
        <group>
          <Blob color="#FFFFFF" s={[0.3, 0.28, 0.3]} position={[0, 0.27, 0]} />
          <Blob color="#FFFFFF" s={[0.22, 0.2, 0.22]} position={[0, 0.68, 0]} />
          <Blob color="#FFFFFF" s={[0.16, 0.15, 0.16]} position={[0, 0.98, 0]} />
          <Blob geo={CONE} color="#FF9F4A" s={[0.03, 0.14, 0.03]} position={[0, 0.98, 0.2]} rotation={[Math.PI / 2, 0, 0]} />
          {[-0.06, 0.06].map((x) => (
            <mesh key={x} geometry={SPHERE} material={flat(INK)} scale={0.02} position={[x, 1.03, 0.14]} />
          ))}
          <Blob geo={CYL} color="#FF5E8A" s={[0.18, 0.05, 0.18]} position={[0, 0.84, 0]} />
          <Blob geo={CYL} color={INK} s={[0.14, 0.03, 0.14]} position={[0, 1.11, 0]} />
          <Blob geo={CYL} color={INK} s={[0.1, 0.14, 0.1]} position={[0, 1.18, 0]} />
        </group>
      )
    case 'pumpkin':
      return (
        <group>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <Blob key={k} color="#FF9F4A" s={[0.16, 0.22, 0.26]} position={[Math.cos(k) * 0.08, 0.2, Math.sin(k) * 0.08]} rotation={[0, k * 0.52, 0]} />
          ))}
          <mesh geometry={CYL} material={toon('#3FBF98')} scale={[0.03, 0.12, 0.03]} position={[0, 0.44, 0]} />
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} geometry={CONE} material={useGlow('#FFE27A', INK).mat} scale={[0.04, 0.05, 0.02]} position={[x, 0.26, 0.3]} />
          ))}
        </group>
      )
    case 'eggs':
      return (
        <group>
          <Blob color="#8EE3C4" s={[0.32, 0.06, 0.32]} position={[0, 0.04, 0]} />
          {[['#FFB8CE', -0.12, 0.02], ['#A5D5FF', 0.12, -0.05], ['#FFE27A', 0.0, 0.13]].map(([c, x, z], i) => (
            <Blob key={i} color={c} s={[0.09, 0.12, 0.09]} position={[x, 0.15, z]} rotation={[0.2, 0, i * 0.3]} />
          ))}
        </group>
      )
    default:
      return <mesh geometry={SPHERE} material={toon('#FFD45E')} scale={0.2} position={[0, 0.2, 0]} />
  }
}

/** Aufgestellte Deko. onPick(index): beim Dekorieren antippen = wieder einsammeln. */
export function DecorLayer({ decor, onPick }) {
  return decor.map((d, i) => (
    <group
      key={`${d.id}-${i}-${d.x}-${d.z}`}
      position={[d.x, 0.03, d.z]}
      rotation={[0, d.rot ?? 0, 0]}
      onPointerDown={
        onPick
          ? (e) => {
              e.stopPropagation()
              onPick(i)
            }
          : undefined
      }
    >
      <DecorModel id={d.id} />
    </group>
  ))
}

// ---------- Haiberts Insel (Konkurrenz) ----------
export function RivalIsle({ label, children }) {
  const tex = useTextTexture(label, { w: 512, h: 128, size: 60, fg: '#FFFFFF' })
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = -1.2 + Math.sin(clock.elapsedTime * 0.5) * 0.15
  })
  return (
    <group ref={ref} position={[15, -1.2, -10]}>
      <Slab w={4.4} d={4} h={0.45} r={0.8} color={PLOT} />
      <Slab w={4.4} d={4} h={0.7} r={0.8} color={PLOT_DEEP} position={[0, -0.45, 0]} />
      <Blob color={PLOT_DEEP} s={[1.4, 0.8, 1.3]} position={[0, -1.2, 0]} shadow={false} />
      <group position={[0, 0, -0.4]}>
        <RBox size={[2.0, 0.7, 0.6]} r={0.05} color="#B8C7DD" position={[0, 0.35, 0]} />
        {[-0.95, 0.95].map((x) => (
          <RBox key={x} size={[0.08, 2.1, 0.08]} r={0.02} color="#8EA0BC" position={[x, 1.05, -0.3]} />
        ))}
        <group position={[0, 2.05, 0.0]} rotation={[0.25, 0, 0]}>
          {Array.from({ length: 7 }, (_, i) => (
            <RBox key={i} size={[0.3, 0.07, 1.0]} r={0.02} color={i % 2 ? '#FFFFFF' : '#FF5E5E'} position={[-0.9 + i * 0.3, 0, 0]} />
          ))}
        </group>
        <RBox size={[1.9, 0.36, 0.05]} r={0.03} color="#2E5C9A" position={[0, 0.4, 0.31]} shadow={false} />
        <mesh position={[0, 0.4, 0.34]}>
          <planeGeometry args={[1.8, 0.33]} />
          <meshBasicMaterial map={tex} transparent />
        </mesh>
      </group>
      <group position={[0.9, 0, 0.9]}>{children}</group>
      <Tree position={[-1.5, 0, 1.2]} scale={0.7} />
    </group>
  )
}

/** Werbe-Luftschiff von Haibert, fliegt während seiner Aktion über die Insel. */
export function RivalBlimp({ simRef, label }) {
  const ref = useRef()
  const tex = useTextTexture(label, { w: 512, h: 128, size: 58, fg: '#FFFFFF', bg: '#FF5E5E' })
  const k = useRef(0)
  useFrame(({ clock }, dt) => {
    const s = simRef.current
    const on = s && s.t < s.rivalUntil
    k.current += ((on ? 1 : 0) - k.current) * (1 - Math.exp(-Math.min(dt, 0.05) * 1.2))
    ref.current.visible = k.current > 0.01
    const a = clock.elapsedTime * 0.25
    ref.current.position.set(Math.sin(a) * 6, 5.2 + (1 - k.current) * 8, -3 + Math.cos(a) * 3)
    ref.current.rotation.y = a + Math.PI / 2
  })
  return (
    <group ref={ref}>
      <Blob color="#6E9BD1" s={[0.7, 0.62, 1.5]} />
      <Blob color="#FFFFFF" s={[0.5, 0.3, 1.2]} position={[0, -0.25, 0]} shadow={false} />
      <Blob geo={CONE} color="#6E9BD1" s={[0.25, 0.5, 0.1]} position={[0, 0.7, -0.3]} />
      <Blob geo={CONE} color="#6E9BD1" s={[0.4, 0.4, 0.08]} position={[0, 0, -1.6]} rotation={[0, 0, 0]} />
      <group position={[0.72, -0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[2.4, 0.6]} />
          <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={[-0.72, -0.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[2.4, 0.6]} />
          <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

// ---------- Lichterkette (Weihnachten) ----------
export function StringLights({ from, to, n = 12, sag = 0.18 }) {
  const mats = ['#FF5E8A', '#FFD45E', '#4DA3FF', '#5CD6B0'].map((c) => useGlow(c, c)) // eslint-disable-line react-hooks/rules-of-hooks
  const refs = useRef([])
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (m) m.scale.setScalar(0.045 + (Math.sin(clock.elapsedTime * 4 + i * 1.3) > 0.2 ? 0.012 : 0))
    })
  })
  return Array.from({ length: n }, (_, i) => {
    const k = i / (n - 1)
    const x = from[0] + (to[0] - from[0]) * k
    const y = from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * sag
    const z = from[2] + (to[2] - from[2]) * k
    return <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={SPHERE} material={mats[i % 4].mat} position={[x, y, z]} scale={0.05} />
  })
}
