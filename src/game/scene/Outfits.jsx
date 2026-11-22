import * as THREE from 'three'
import { Blob, CONE, CYL, SPHERE, flat, toon } from './toon.jsx'

// Outfits für Loopy. Werden in Loopys Kopfgruppe gezeichnet: Ursprung = Kopfmitte, Kopf-Halbachsen
// [0.61, 0.43, 0.475], Blick in +z. Die Kiemen stehen oben seitlich ab (ab x ≈ ±0.23) – Hüte bleiben schmal
// und sitzen oben dazwischen; die Augen liegen bei y ≈ 0.03, z ≈ 0.385.

const TORUS = new THREE.TorusGeometry(1, 0.3, 8, 24)
const BAND = new THREE.TorusGeometry(1, 0.06, 8, 32, Math.PI)
const RIM = new THREE.TorusGeometry(1, 0.12, 6, 24)
const BAND_RING = new THREE.CylinderGeometry(1, 0.9, 1, 20, 1, true)
// Band der Augenklappe: vom oberen Rand der Klappe schräg unter die Hutkrempe
const STRAP = (() => {
  const a = new THREE.Vector3(0.27, 0.19, 0.44)
  const b = new THREE.Vector3(-0.08, 0.37, 0.33)
  const d = b.clone().sub(a)
  return { pos: a.clone().add(b).multiplyScalar(0.5).toArray(), len: d.length(), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()) }
})()

function Bow() {
  return (
    <group position={[0.16, 0.42, 0.1]} rotation={[0.25, 0, -0.35]}>
      {[1, -1].map((side) => (
        <Blob key={side} color="#FF6F96" s={[0.13, 0.085, 0.06]} position={[side * 0.11, 0, 0]} rotation={[0, 0, side * 0.35]} />
      ))}
      {[1, -1].map((side) => (
        <Blob key={`t${side}`} color="#FF84A6" s={[0.04, 0.09, 0.03]} position={[side * 0.05, -0.08, 0.01]} rotation={[0, 0, side * 0.5]} />
      ))}
      <Blob color="#FF4F80" s={[0.055, 0.055, 0.06]} />
      <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.03, 0.02, 0.01]} position={[0.13, 0.04, 0.055]} />
    </group>
  )
}

function Straw() {
  return (
    <group position={[0, 0.4, 0.02]} rotation={[0.12, 0, 0.06]}>
      <mesh geometry={CYL} material={toon('#F6D58E')} scale={[0.33, 0.025, 0.3]} castShadow />
      <Blob color="#F6D58E" s={[0.2, 0.15, 0.19]} position={[0, 0.04, 0]} />
      <mesh geometry={CYL} material={toon('#FF84A6')} scale={[0.205, 0.05, 0.195]} position={[0, 0.06, 0]} />
      <Blob color="#FFFFFF" s={[0.045, 0.045, 0.03]} position={[0.12, 0.07, 0.15]} />
      <Blob color="#FFD45E" s={[0.02, 0.02, 0.02]} position={[0.12, 0.07, 0.175]} />
    </group>
  )
}

function Beanie() {
  return (
    <group position={[0, 0.36, 0.02]} rotation={[0.08, 0, -0.08]}>
      <Blob color="#5CA8FF" s={[0.27, 0.22, 0.27]} position={[0, 0.05, 0]} />
      <mesh geometry={TORUS} material={toon('#339AFF')} scale={[0.25, 0.25, 0.22]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} />
      {[-0.1, 0, 0.1].map((x) => (
        <mesh key={x} geometry={CYL} material={toon('#8CC4FF')} scale={[0.015, 0.16, 0.015]} position={[x, 0.15, 0.22 - Math.abs(x) * 0.25]} rotation={[-0.45, 0, x * 1.2]} />
      ))}
      <Blob color="#FFFFFF" s={[0.08, 0.08, 0.08]} position={[0, 0.28, 0]} />
    </group>
  )
}

function Shades() {
  return (
    <group position={[0, 0.05, 0]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.3, 0, 0.455]} rotation={[Math.PI / 2, side * 0.42, 0]}>
          <mesh geometry={CYL} material={toon('#262B40')} scale={[0.19, 0.025, 0.16]} />
          <mesh geometry={RIM} material={toon('#FF84A6')} scale={[0.19, 0.16, 0.16]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={SPHERE} material={flat('#7C86A6')} scale={[0.05, 0.012, 0.03]} position={[0.06, 0.016, -0.06]} />
        </group>
      ))}
      <mesh geometry={CYL} material={toon('#FF84A6')} scale={[0.018, 0.08, 0.018]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.04, 0.49]} />
    </group>
  )
}

const FLOWER_AT = [-0.27, -0.135, 0, 0.135, 0.27]
const PETAL_COLORS = ['#FF84A6', '#FFD45E', '#B39CFF', '#FFFFFF', '#FF9F6B']
function Flowers() {
  return (
    <group position={[0, 0.33, 0.04]} rotation={[0.12, 0, 0]} scale={1.35}>
      {FLOWER_AT.map((x, i) => (
        <group key={i} position={[x, 0.06 - Math.abs(x) * 0.35, 0.2 - Math.abs(x) * 0.5]} rotation={[-0.75, x * 1.5, 0]}>
          {[0, 1, 2, 3, 4].map((j) => (
            <mesh key={j} geometry={SPHERE} material={toon(PETAL_COLORS[i])} scale={[0.05, 0.05, 0.022]} position={[Math.cos((j / 5) * Math.PI * 2) * 0.05, Math.sin((j / 5) * Math.PI * 2) * 0.05, 0]} />
          ))}
          <mesh geometry={SPHERE} material={toon(i === 1 ? '#FF84A6' : '#FFD45E')} scale={[0.03, 0.03, 0.02]} position={[0, 0, 0.014]} />
        </group>
      ))}
      {[-0.18, 0.06, 0.2].map((x, i) => (
        <Blob key={`l${i}`} color="#5CD6B0" s={[0.04, 0.018, 0.022]} position={[x, 0.03 - Math.abs(x) * 0.3, 0.2 - Math.abs(x) * 0.5]} rotation={[-0.6, 0, 0.6]} shadow={false} />
      ))}
    </group>
  )
}

function Headphones() {
  return (
    <group position={[0, -0.02, 0.06]} rotation={[0.35, 0, 0]}>
      <mesh geometry={BAND} material={toon('#B39CFF')} scale={[0.63, 0.56, 0.6]} />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.62, 0, 0]}>
          <mesh geometry={CYL} material={toon('#9A80F5')} scale={[0.13, 0.08, 0.13]} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={CYL} material={toon('#FF84A6')} scale={[0.09, 0.03, 0.09]} position={[side * 0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
        </group>
      ))}
    </group>
  )
}

function Chef() {
  return (
    <group position={[0, 0.37, 0.0]} rotation={[0.05, 0, 0.05]} scale={1.25}>
      <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.2, 0.14, 0.19]} position={[0, 0.06, 0]} castShadow />
      {[
        [0, 0.2, 0, 0.17],
        [0.12, 0.18, 0.05, 0.11],
        [-0.12, 0.18, 0.04, 0.11],
        [0.02, 0.19, -0.11, 0.11],
        [0.03, 0.2, 0.11, 0.11],
      ].map(([x, y, z, r], i) => (
        <Blob key={i} color="#FFFFFF" s={[r, r * 0.85, r]} position={[x, y, z]} />
      ))}
      <mesh geometry={CYL} material={toon('#E5EAF3')} scale={[0.205, 0.03, 0.195]} position={[0, 0.0, 0]} />
    </group>
  )
}

function Pirate() {
  return (
    <group>
      <group position={[0, 0.38, 0.02]} rotation={[0.12, 0, 0]} scale={1.2}>
        <Blob color="#2E3346" s={[0.22, 0.13, 0.2]} position={[0, 0.06, 0]} />
        <Blob color="#2E3346" s={[0.3, 0.06, 0.12]} position={[0, 0.03, 0.06]} rotation={[0.3, 0, 0]} />
        {[1, -1].map((side) => (
          <Blob key={side} color="#2E3346" s={[0.08, 0.08, 0.04]} position={[side * 0.27, 0.07, 0.07]} rotation={[0, side * -0.5, side * -0.3]} />
        ))}
        <mesh geometry={CYL} material={toon('#F0B429')} scale={[0.225, 0.02, 0.205]} position={[0, 0.0, 0]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.045, 0.04, 0.012]} position={[0, 0.09, 0.19]} rotation={[-0.2, 0, 0]} />
        {[1, -1].map((side) => (
          <mesh key={`e${side}`} geometry={SPHERE} material={flat('#2E3346')} scale={[0.01, 0.01, 0.006]} position={[side * 0.016, 0.095, 0.2]} />
        ))}
      </group>
      {/* Augenklappe über dem rechten Auge (Loopys Sicht: links im Bild) */}
      <group position={[0.3, 0.04, 0.43]} rotation={[0, 0.42, 0]}>
        <mesh geometry={SPHERE} material={toon('#2E3346')} scale={[0.17, 0.19, 0.06]} />
      </group>
      <mesh geometry={CYL} material={toon('#2E3346')} scale={[0.014, STRAP.len, 0.014]} position={STRAP.pos} quaternion={STRAP.quat} />
    </group>
  )
}

function Party() {
  return (
    <group position={[0.08, 0.38, 0.03]} rotation={[0.1, 0, -0.22]} scale={1.45}>
      <mesh geometry={CONE} material={toon('#B39CFF')} scale={[0.15, 0.36, 0.15]} position={[0, 0.18, 0]} castShadow />
      {[0.08, 0.2].map((y, i) => (
        <mesh key={y} geometry={CYL} material={toon(i ? '#FFD45E' : '#FF84A6')} scale={[0.15 * (1 - y / 0.36) + 0.006, 0.03, 0.15 * (1 - y / 0.36) + 0.006]} position={[0, y, 0]} />
      ))}
      <Blob color="#FFD45E" s={[0.055, 0.055, 0.055]} position={[0, 0.37, 0]} />
      <mesh geometry={RIM} material={toon('#5CD6B0')} scale={[0.15, 0.15, 0.15]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

function Crown() {
  return (
    <group position={[0, 0.38, 0.03]} rotation={[0.1, 0, -0.06]} scale={1.25}>
      <mesh geometry={BAND_RING} material={toon('#FFD45E')} scale={[0.2, 0.1, 0.19]} position={[0, 0.03, 0]} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <group key={i} position={[Math.sin(a) * 0.19, 0.12, Math.cos(a) * 0.18]}>
            <mesh geometry={CONE} material={toon('#FFD45E')} scale={[0.045, 0.1, 0.03]} />
            <mesh geometry={SPHERE} material={toon('#FFE9A0')} scale={0.022} position={[0, 0.06, 0]} />
          </group>
        )
      })}
      <mesh geometry={SPHERE} material={toon('#FF5E8A')} scale={[0.03, 0.03, 0.015]} position={[0, 0.03, 0.19]} />
      {[1, -1].map((side) => (
        <mesh key={side} geometry={SPHERE} material={toon('#5CA8FF')} scale={[0.022, 0.022, 0.012]} position={[Math.sin(side * 0.9) * 0.2, 0.03, Math.cos(side * 0.9) * 0.18]} rotation={[0, side * 0.9, 0]} />
      ))}
    </group>
  )
}

function Santa() {
  return (
    <group position={[0, 0.39, 0.02]} rotation={[0.08, 0, -0.12]}>
      <mesh geometry={TORUS} material={toon('#FFFFFF')} scale={[0.23, 0.23, 0.21]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={CONE} material={toon('#E8414B')} scale={[0.22, 0.34, 0.2]} position={[0, 0.18, 0]} castShadow />
      <group position={[0, 0.32, 0]} rotation={[0, 0, -1.0]}>
        <mesh geometry={CONE} material={toon('#E8414B')} scale={[0.08, 0.17, 0.08]} position={[0, 0.07, 0]} />
        <Blob color="#FFFFFF" s={[0.065, 0.065, 0.065]} position={[0, 0.17, 0]} />
      </group>
    </group>
  )
}

const OUTFIT_PARTS = { bow: Bow, straw: Straw, beanie: Beanie, shades: Shades, flowers: Flowers, headphones: Headphones, chef: Chef, pirate: Pirate, party: Party, crown: Crown, santa: Santa }

export default function Outfit({ id }) {
  const Part = OUTFIT_PARTS[id]
  return Part ? <Part /> : null
}
