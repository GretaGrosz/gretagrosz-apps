import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Blob, CYL, INK, RBox, SPHERE, Slab, flat, toon, useTextTexture } from './toon.jsx'

// Die schwebende, quadratische Insel mit Loopys Marktstand – derselbe klare Stil und dieselben Farben
// wie der Laden auf der Startseite (src/components/shop/palette.js).

const PLOT = '#E4EEFC'
const PLOT_DEEP = '#C3D4F0'
const PAVING = '#F7F9FD'
const GRASS = '#8EE3C4'
const LEAF = '#5CD6B0'
const WOOD = '#F2C99A'
const WOOD_DEEP = '#E0AE78'
const BLUE = '#339AFF'
const BLUE_DEEP = '#007AFF'
const PINK = '#FF84A6'
const CANDY = ['#FF5E8A', '#FFD45E', '#5CD6B0', '#007AFF', '#B39CFF', '#FF9F6B']

export const SIZE = 9 // Kantenlänge der Insel

export function Island() {
  return (
    <group>
      <Slab w={SIZE} d={SIZE} h={0.5} r={0.7} color={PLOT} />
      <Slab w={SIZE} d={SIZE} h={0.8} r={0.7} color={PLOT_DEEP} position={[0, -0.5, 0]} />
      {/* Platz vor dem Stand, Weg zum Rand */}
      <Slab w={4.5} d={3.5} r={0.5} h={0.04} color={PAVING} position={[0.5, 0.04, 0.9]} />
      <Slab w={2.0} d={0.9} r={0.3} h={0.04} color={PAVING} position={[3.45, 0.04, 0.4]} />
      {/* Wiesenstücke */}
      <Slab w={1.9} d={1.9} r={0.5} h={0.05} color={GRASS} position={[-3.3, 0.05, -3.3]} />
      <Slab w={1.6} d={1.6} r={0.5} h={0.05} color={GRASS} position={[-3.45, 0.05, 3.45]} />
      <Slab w={1.6} d={1.6} r={0.5} h={0.05} color={GRASS} position={[3.45, 0.05, -3.9]} />
      <Slab w={2.2} d={1.2} r={0.45} h={0.05} color={GRASS} position={[3.1, 0.05, 3.55]} />
    </group>
  )
}

export function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <Blob geo={CYL} color={WOOD_DEEP} s={[0.07, 0.9, 0.07]} position={[0, 0.45, 0]} />
      <Blob color={LEAF} s={[0.58, 0.58, 0.58]} position={[0, 1.25, 0]} />
    </group>
  )
}

export function Flower({ position, color }) {
  return (
    <group position={position}>
      <mesh geometry={CYL} material={toon('#3FBF98')} scale={[0.014, 0.14, 0.014]} position={[0, 0.07, 0]} />
      <mesh geometry={SPHERE} material={toon(color)} scale={0.06} position={[0, 0.16, 0]} castShadow />
    </group>
  )
}

export function Jar({ position, colors }) {
  const glass = useMemo(() => new THREE.MeshLambertMaterial({ color: '#CFE3FF', transparent: true, opacity: 0.45 }), [])
  return (
    <group position={position}>
      <mesh geometry={CYL} material={glass} scale={[0.15, 0.3, 0.15]} position={[0, 0.15, 0]} />
      {colors.map((c, i) => (
        <mesh key={i} geometry={SPHERE} material={toon(c)} scale={0.055} position={[Math.cos(i * 2.4) * 0.06, 0.06 + i * 0.045, Math.sin(i * 2.4) * 0.06]} />
      ))}
      <Blob geo={CYL} color={PINK} s={[0.16, 0.05, 0.16]} position={[0, 0.32, 0]} />
    </group>
  )
}

export function Lolly({ position, color, tilt = 0 }) {
  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.014, 0.3, 0.014]} position={[0, 0.15, 0]} />
      <Blob geo={CYL} color={color} s={[0.09, 0.04, 0.09]} position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

// Loopys Marktstand. Front zeigt nach +z. Hinter der Theke steht eine Kiste, auf der Loopy steht.
export function Stall({ position, sign = 'Loopys Bonbonstand', onClick }) {
  const tex = useTextTexture(sign, { w: 640, h: 128, size: 62, fg: '#FFFFFF' })
  const stripes = 8
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {/* Theke */}
      <RBox size={[2.3, 0.72, 0.72]} r={0.04} color={WOOD_DEEP} position={[0, 0.36, 0.3]} />
      <RBox size={[2.5, 0.1, 0.92]} r={0.03} color={WOOD} position={[0, 0.76, 0.3]} />
      {/* Trittkiste für Loopy */}
      <RBox size={[0.9, 0.34, 0.7]} r={0.03} color={WOOD_DEEP} position={[0, 0.17, -0.5]} />
      {/* Pfosten */}
      {[[-1.15, -0.92], [1.15, -0.92]].map(([x, z], i) => (
        <RBox key={i} size={[0.1, 2.9, 0.1]} r={0.02} color={WOOD_DEEP} position={[x, 1.45, z]} />
      ))}
      {/* Markise: kurz und hoch, damit man Loopy von schräg oben sieht */}
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
      {/* Schild vorne an der Theke */}
      <RBox size={[2.12, 0.42, 0.05]} r={0.02} color={BLUE_DEEP} position={[0, 0.39, 0.665]} shadow={false} />
      <mesh position={[0, 0.39, 0.693]}>
        <planeGeometry args={[2.0, 0.4]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
      {/* Ware */}
      <Jar position={[-0.92, 0.81, 0.34]} colors={['#FF5E8A', '#FFD45E', '#FF5E8A', '#FF9F6B', '#FFD45E']} />
      <Jar position={[-0.55, 0.81, 0.46]} colors={['#5CD6B0', '#007AFF', '#B39CFF', '#5CD6B0', '#007AFF']} />
      <Lolly position={[0.72, 0.81, 0.4]} color="#FF5E8A" tilt={-0.18} />
      <Lolly position={[0.9, 0.81, 0.36]} color="#5CD6B0" tilt={0.05} />
      <Lolly position={[1.05, 0.81, 0.44]} color="#FFD45E" tilt={0.25} />
      {/* Kiste mit Bonbons neben dem Stand */}
      <group position={[1.75, 0, 0.5]} rotation={[0, -0.3, 0]}>
        <RBox size={[0.62, 0.36, 0.5]} r={0.03} color={WOOD_DEEP} position={[0, 0.18, 0]} />
        {[[-0.16, 0.08], [0.02, -0.08], [0.17, 0.1], [0.0, 0.1], [-0.16, -0.1], [0.18, -0.1]].map(([x, z], i) => (
          <mesh key={i} geometry={SPHERE} material={toon(CANDY[i])} scale={0.1} position={[x, 0.4, z]} castShadow />
        ))}
      </group>
    </group>
  )
}

// Aufsteller mit Tafel, wie vor dem Laden auf der Startseite
export function Board({ position }) {
  return (
    <group position={position} rotation={[0, 0.7, 0]}>
      <group rotation={[-0.2, 0, 0]}>
        <RBox size={[0.62, 0.86, 0.06]} r={0.02} color={WOOD_DEEP} position={[0, 0.43, 0]} />
        <RBox size={[0.5, 0.66, 0.02]} r={0.01} color={INK} position={[0, 0.47, 0.035]} shadow={false} />
        {[[0.6, '#FFD45E', 0.3], [0.5, '#FFFFFF', 0.36], [0.4, '#FF84A6', 0.22]].map(([y, c, w], i) => (
          <RBox key={i} size={[w, 0.035, 0.01]} r={0.004} color={c} position={[-0.06 + i * 0.03, y, 0.05]} shadow={false} />
        ))}
      </group>
    </group>
  )
}

// Nächster Bauplatz: zeigt, dass die Firma wachsen wird
function Plot({ position }) {
  const tex = useTextTexture('Bald: eigener Laden', { w: 512, h: 128, size: 46 })
  return (
    <group position={position}>
      <Slab w={2.3} d={1.7} r={0.35} h={0.04} color="#D6E2F6" position={[0, 0.04, 0]} />
      <group position={[0.25, 0, 0.45]} rotation={[0, 0.5, 0]}>
        <RBox size={[0.07, 0.7, 0.07]} r={0.015} color={WOOD_DEEP} position={[0, 0.35, 0]} />
        <RBox size={[1.15, 0.34, 0.06]} r={0.02} color="#FFFFFF" position={[0, 0.72, 0]} />
        <mesh position={[0, 0.72, 0.035]}>
          <planeGeometry args={[1.08, 0.27]} />
          <meshBasicMaterial map={tex} transparent />
        </mesh>
      </group>
      <RBox size={[0.4, 0.28, 0.34]} r={0.02} color={WOOD} position={[-0.5, 0.14, -0.15]} rotation={[0, 0.4, 0]} />
      <RBox size={[0.34, 0.24, 0.3]} r={0.02} color={WOOD_DEEP} position={[-0.46, 0.4, -0.13]} rotation={[0, 0.9, 0]} />
    </group>
  )
}

export function Cloud({ position, scale = 1, speed = 0.1 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * speed + position[2]) * 0.7
  })
  const white = toon('#FFFFFF')
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh geometry={SPHERE} material={white} scale={[0.9, 0.55, 0.7]} />
      <mesh geometry={SPHERE} material={white} scale={[0.65, 0.45, 0.6]} position={[0.8, -0.08, 0.1]} />
      <mesh geometry={SPHERE} material={white} scale={[0.6, 0.4, 0.55]} position={[-0.75, -0.1, 0.05]} />
    </group>
  )
}

export function Deko() {
  return (
    <group>
      <Tree position={[-3.3, 0, -3.3]} scale={1.1} />
      <Tree position={[-3.45, 0, 3.45]} />
      <Tree position={[3.45, 0, -3.9]} />
      <Blob color={LEAF} s={[0.34, 0.3, 0.34]} position={[2.6, 0.25, 3.6]} />
      <Blob color="#7DDDB5" s={[0.26, 0.24, 0.26]} position={[3.1, 0.2, 3.75]} />
      {[[3.55, 3.4, 0], [3.75, 3.75, 1], [2.25, 3.3, 4], [-3.0, 3.9, 0], [-3.9, 3.0, 1], [-2.8, -3.0, 4], [-3.8, -2.8, 5], [3.0, -3.6, 1], [3.9, -4.2, 0]].map(([x, z, c], i) => (
        <Flower key={i} position={[x, 0, z]} color={CANDY[c]} />
      ))}
      <Board position={[-2.25, 0, 0.75]} />
      <Plot position={[2.9, 0, -2.0]} />
      <Cloud position={[-7.5, -2.2, 4]} scale={1.2} speed={0.13} />
      <Cloud position={[7, -3, -3.5]} scale={1.5} speed={0.09} />
      <Cloud position={[-2, 3, -9]} scale={1.2} speed={0.11} />
    </group>
  )
}

// Das „!" über dem Stand: hier wartet ein Fall
export function Marker({ position, onClick }) {
  const ref = useRef()
  useFrame(({ clock, camera }) => {
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2.6) * 0.1
    ref.current.quaternion.copy(camera.quaternion)
  })
  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <mesh geometry={SPHERE} material={flat('#FFD45E')} scale={[0.4, 0.4, 0.05]} />
      <mesh geometry={SPHERE} material={flat(INK)} scale={[0.06, 0.16, 0.02]} position={[0, 0.07, 0.05]} />
      <mesh geometry={SPHERE} material={flat(INK)} scale={[0.055, 0.055, 0.02]} position={[0, -0.2, 0.05]} />
      {/* größere unsichtbare Tippfläche */}
      <mesh visible={false} scale={0.9}>
        <sphereGeometry args={[1, 8, 8]} />
      </mesh>
    </group>
  )
}
