import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Kugel from './Kugel.jsx'
import { Blob, CONE, CYL, INK, RBox, SPHERE, flat, toon, turnTo } from './toon.jsx'

// Kundschaft vom Land und aus dem Meer: Katze, Hase, Frosch, Pinguin, Ente, Hamster, Otter (+ Kugelfisch = Kugel).
// Ursprung an den Füßen, Blick in +z. Köpfe bleiben unter y ≈ 1.6 (Sprechblase der Szene bei 1.95).
// ent: { x, z, yaw, mood: 'ok' | 'talk' | 'happy' | 'angry' | 'sit', present, moving }
// tint 0–3: Farbvariante · vip: Sonnenbrille + Goldfunkeln · santa: Weihnachtsmütze · inspector: Brille, Krawatte, Koffer

const EYE = '#1D2B45'
const BLUSH = '#FF9FB5'
const PINK = '#FF9FB5'
const SMILE = new THREE.TorusGeometry(0.045, 0.012, 6, 14, Math.PI)
const RING = new THREE.TorusGeometry(1, 0.13, 6, 22)
const BRIM = new THREE.TorusGeometry(1, 0.35, 8, 22)
const SPARK = new THREE.OctahedronGeometry(1, 0)
const GLOW = new THREE.MeshBasicMaterial({ color: '#FFE9A0', transparent: true, opacity: 0.35, depthWrite: false })

function tailCurve(points, r) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 12, r, 7)
}
const CAT_TAIL = tailCurve(
  [
    [0, 0, 0],
    [0, 0.04, -0.14],
    [0, 0.2, -0.24],
    [0.04, 0.38, -0.2],
    [0.09, 0.46, -0.1],
  ],
  0.04,
)

// ---------- Farben je Art und Variante ----------
const PAL = {
  cat: [
    { fur: '#FFE2B8', deep: '#F2C38A', belly: '#FFF7EA' },
    { fur: '#C9CFDB', deep: '#A4ACBE', belly: '#F4F6FA' },
    { fur: '#FFB46E', deep: '#F09049', belly: '#FFF2DF' },
    { fur: '#666C80', deep: '#4D5265', belly: '#FFFFFF' },
  ],
  bunny: [
    { fur: '#FFFFFF', deep: '#ECE6F2', belly: '#FFF5F8' },
    { fur: '#DDB592', deep: '#C49572', belly: '#FFF1E3' },
    { fur: '#C9C6D3', deep: '#AAA6B8', belly: '#F5F4FA' },
    { fur: '#FFD9CF', deep: '#F5B9AA', belly: '#FFF6F2' },
  ],
  frog: [
    { fur: '#8EDB7A', deep: '#6CC65C', belly: '#F2FBD9' },
    { fur: '#5CD6B0', deep: '#3FBF98', belly: '#E3FAF1' },
    { fur: '#CBE56B', deep: '#ADCC4A', belly: '#FBFDE3' },
    { fur: '#C9B0F5', deep: '#A98BF0', belly: '#F6F0FF' },
  ],
  penguin: [
    { fur: '#3D4A6B', deep: '#2E3956', belly: '#FFFFFF', beak: '#FFB13D' },
    { fur: '#4F7BC4', deep: '#3D64A8', belly: '#FFFFFF', beak: '#FFB13D' },
    { fur: '#AEB8C9', deep: '#929DB2', belly: '#F4F6FA', beak: '#FF9F6B' },
    { fur: '#7C6BB8', deep: '#64559E', belly: '#FFFFFF', beak: '#FFC85E' },
  ],
  duck: [
    { fur: '#FFE27A', deep: '#F5C94A', belly: '#FFF3BF', beak: '#FF9F45' },
    { fur: '#FFFFFF', deep: '#E6E9F0', belly: '#FFFFFF', beak: '#FFB13D' },
    { fur: '#E3C29A', deep: '#C9A273', belly: '#F7E8D2', beak: '#FF9F45' },
    { fur: '#EADFCB', deep: '#CDBFA6', belly: '#F7F1E6', beak: '#FFB13D', head: '#5CC28E' },
  ],
  hamster: [
    { fur: '#F7BE74', deep: '#E9A251', belly: '#FFF4E2' },
    { fur: '#CCC5C0', deep: '#ADA49D', belly: '#FAF7F4' },
    { fur: '#FFF6EC', deep: '#F2C08A', belly: '#FFFFFF' },
    { fur: '#E3A07A', deep: '#C9825B', belly: '#FFEFE4' },
  ],
  otter: [
    { fur: '#A87B5D', deep: '#8A6146', belly: '#F2DCC2' },
    { fur: '#C79E7C', deep: '#AA805E', belly: '#F8E9D6' },
    { fur: '#7E5C48', deep: '#654634', belly: '#E8D2BC' },
    { fur: '#9D8A80', deep: '#7F6D64', belly: '#EEE4DC' },
  ],
}
const PUFFER = [
  { color: '#FFD45E', dark: '#E8B63A', hat: '#B39CFF' },
  { color: '#8EE3C4', dark: '#3FBF98', hat: '#4DA3FF' },
  { color: '#D9C8FF', dark: '#A98BF0', hat: '#FF84A6' },
  { color: '#FFB3C7', dark: '#FF84A6', hat: '#5CD6B0' },
]

// Bewegung je Art: hop = Hüpfhöhe beim Gehen, waddle = Watscheln (Seitenkippen), walk = Schrittfrequenz
const MOVE = {
  cat: { hop: 0.07, waddle: 0.05, walk: 12, ear: 0.1, tailF: 1.8, tailA: 0.45 },
  bunny: { hop: 0.13, waddle: 0.02, walk: 10, ear: 0.32, tailF: 3, tailA: 0.1 },
  frog: { hop: 0.14, waddle: 0, walk: 9, ear: 0, tailF: 0, tailA: 0 },
  penguin: { hop: 0.02, waddle: 0.2, walk: 13, ear: 0, tailF: 3, tailA: 0.15 },
  duck: { hop: 0.03, waddle: 0.17, walk: 13, ear: 0, tailF: 2.4, tailA: 0.2, tailWalk: 18 },
  hamster: { hop: 0.06, waddle: 0.07, walk: 16, ear: 0.08, tailF: 0, tailA: 0 },
  otter: { hop: 0.05, waddle: 0.08, walk: 11, ear: 0.05, tailF: 1.2, tailA: 0.3 },
}

// Kopfmaße für Zubehör: y Kopfmitte, top Hutsitz über der Mitte, Augen, r Kopfbreite, chest [y, z] für die Krawatte,
// sh Schulter [x, y, z] (für den Koffer)
const HEAD = {
  cat: { y: 0.93, top: 0.3, ex: 0.15, ey: 0.02, ez: 0.3, eyaw: 0.38, r: 0.38, chest: [0.6, 0.2], sh: [0.24, 0.56, 0.03] },
  bunny: { y: 0.93, top: 0.28, ex: 0.14, ey: 0.02, ez: 0.29, eyaw: 0.38, r: 0.36, chest: [0.6, 0.2], sh: [0.24, 0.56, 0.03] },
  frog: { y: 0.84, top: 0.3, ex: 0.19, ey: 0.25, ez: 0.17, eyaw: 0.25, r: 0.44, chest: [0.53, 0.21], sh: [0.26, 0.5, 0.03] },
  penguin: { y: 0.84, top: 0.2, ex: 0.11, ey: 0.0, ez: 0.27, eyaw: 0.32, r: 0.34, chest: [0.62, 0.3], sh: [0.33, 0.62, 0.0] },
  duck: { y: 0.92, top: 0.26, ex: 0.13, ey: 0.05, ez: 0.24, eyaw: 0.4, r: 0.3, chest: [0.6, 0.22], sh: [0.27, 0.55, 0.0] },
  hamster: { y: 0.84, top: 0.3, ex: 0.16, ey: 0.05, ez: 0.29, eyaw: 0.38, r: 0.4, chest: [0.53, 0.22], sh: [0.26, 0.48, 0.05] },
  otter: { y: 0.98, top: 0.25, ex: 0.14, ey: 0.05, ez: 0.265, eyaw: 0.4, r: 0.33, chest: [0.62, 0.19], sh: [0.23, 0.6, 0.03] },
}

// ---------- gemeinsame Teile ----------
function Eyes({ r, x, y, z, s = 1, yaw = 0.35 }) {
  return [-1, 1].map((side, i) => (
    <group key={side} position={[side * x, y, z]} rotation={[0, side * yaw, 0]}>
      <group ref={(el) => (r.eyes[i] = el)}>
        <mesh geometry={SPHERE} material={flat(EYE)} scale={[0.072 * s, 0.088 * s, 0.04 * s]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.027 * s, 0.03 * s, 0.015 * s]} position={[0.02 * s, 0.035 * s, 0.032 * s]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.013 * s, 0.014 * s, 0.008 * s]} position={[-0.024 * s, -0.03 * s, 0.035 * s]} />
      </group>
    </group>
  ))
}

function Brows({ r, x, y, z, yaw = 0.35, s = 1 }) {
  return [-1, 1].map((side, i) => (
    <group key={side} position={[side * x, y, z]} rotation={[0, side * yaw, 0]}>
      <mesh ref={(el) => (r.brows[i] = el)} geometry={CYL} material={flat(INK)} scale={[0.065 * s, 0.018, 0.018]} visible={false} />
    </group>
  ))
}

function Cheeks({ r, x, y, z, yaw = 0.8, s = 1 }) {
  return [-1, 1].map((side, i) => (
    <mesh key={side} ref={(el) => (r.cheeks[i] = el)} geometry={SPHERE} material={flat(BLUSH)} scale={[0.06 * s, 0.035 * s, 0.02]} position={[side * x, y, z]} rotation={[0, side * yaw, 0]} />
  ))
}

function Mouth({ r, y, z, w = 1, rx = 0 }) {
  return (
    <group position={[0, y, z]} rotation={[rx, 0, 0]}>
      <mesh ref={(el) => (r.mouth = el)} geometry={SMILE} material={flat(INK)} scale={[w, -1, 1]} position={[0, 0.018, 0]} />
      <group ref={(el) => (r.open = el)} scale={[1, 0.001, 1]} visible={false}>
        <mesh geometry={SPHERE} material={flat('#7A2E3F')} scale={[0.048 * w, 0.05, 0.018]} />
        <mesh geometry={SPHERE} material={flat('#FF8FA3')} scale={[0.03 * w, 0.02, 0.011]} position={[0, -0.024, 0.011]} />
      </group>
    </group>
  )
}

// Arm: Gruppe an der Schulter, das Kind hängt nach unten
function Arms({ r, x, y, z, color, s = [0.07, 0.12, 0.07], tilt = 0.15 }) {
  return [1, -1].map((side, i) => (
    <group key={side} ref={(el) => (r.arms[i] = el)} position={[side * x, y, z]}>
      <Blob color={color} s={s} position={[side * 0.03, -s[1] * 0.8, 0.02]} rotation={[0, 0, side * tilt]} />
    </group>
  ))
}

function Feet({ r, x, y = 0.16, color, s = [0.09, 0.06, 0.12] }) {
  return [1, -1].map((side, i) => (
    <group key={side} ref={(el) => (r.feet[i] = el)} position={[side * x, y, 0.02]}>
      <Blob color={color} s={s} position={[0, -y + s[1], 0.05]} />
    </group>
  ))
}

function Whiskers({ x, y, z, color = '#8A8F9E', len = 0.13 }) {
  return [1, -1].flatMap((side) =>
    [-0.14, 0.14].map((a) => (
      <mesh key={`${side}${a}`} geometry={CYL} material={flat(color)} scale={[0.005, len, 0.005]} position={[side * x, y + a * 0.12, z]} rotation={[0, side * -0.35, Math.PI / 2 + side * a]} />
    )),
  )
}

// ---------- Arten ----------
function Biped({ r, p, h, torso = [0.28, 0.3, 0.25], ty = 0.4, footColor, armColor, children }) {
  return (
    <>
      <Blob color={p.fur} s={torso} position={[0, ty, 0]} />
      <Blob color={p.belly} s={[torso[0] * 0.68, torso[1] * 0.7, torso[2] * 0.55]} position={[0, ty - 0.03, torso[2] * 0.5]} shadow={false} />
      <Feet r={r} x={0.13} color={footColor ?? p.deep} />
      <Arms r={r} x={h.sh[0]} y={h.sh[1]} z={h.sh[2]} color={armColor ?? p.fur} />
      {children}
    </>
  )
}

function Cat({ r, p, h }) {
  return (
    <>
      <Biped r={r} p={p} h={h} />
      <group ref={(el) => (r.tail = el)} position={[0, 0.22, -0.2]}>
        <mesh geometry={CAT_TAIL} material={toon(p.fur)} castShadow />
        <Blob color={p.deep} s={[0.05, 0.05, 0.05]} position={[0.09, 0.46, -0.1]} />
      </group>
      <group ref={(el) => (r.head = el)} position={[0, h.y, 0]}>
        <Blob color={p.fur} s={[0.38, 0.32, 0.34]} />
        {[1, -1].map((side, i) => (
          <group key={side} ref={(el) => (r.ears[i] = el)} position={[side * 0.2, 0.2, -0.02]}>
            <group rotation={[0, 0, -side * 0.35]}>
              <mesh geometry={CONE} material={toon(p.fur)} scale={[0.12, 0.22, 0.08]} position={[0, 0.09, 0]} castShadow />
              <mesh geometry={CONE} material={flat('#FFB8C8')} scale={[0.07, 0.15, 0.03]} position={[0, 0.07, 0.05]} />
            </group>
          </group>
        ))}
        {p.fur === '#666C80' && <Blob color="#FFFFFF" s={[0.17, 0.12, 0.1]} position={[0, -0.09, 0.25]} shadow={false} />}
        {[1, -1].map((side) => (
          <Blob key={side} color={p.belly} s={[0.06, 0.045, 0.04]} position={[side * 0.045, -0.09, 0.305]} shadow={false} />
        ))}
        <mesh geometry={SPHERE} material={flat('#FF7F9E')} scale={[0.03, 0.02, 0.02]} position={[0, -0.05, 0.335]} />
        <Whiskers x={0.21} y={-0.08} z={0.27} color={p.fur === '#666C80' ? '#E6E8EE' : '#9A8F86'} />
        <Eyes r={r} x={h.ex} y={h.ey} z={h.ez} yaw={h.eyaw} />
        <Brows r={r} x={h.ex} y={0.13} z={0.29} yaw={h.eyaw} />
        <Cheeks r={r} x={0.24} y={-0.07} z={0.235} />
        <Mouth r={r} y={-0.135} z={0.31} w={0.8} />
      </group>
    </>
  )
}

function Bunny({ r, p, h }) {
  return (
    <>
      <Biped r={r} p={p} h={h} />
      <group ref={(el) => (r.tail = el)} position={[0, 0.28, -0.24]}>
        <Blob color="#FFFFFF" s={[0.09, 0.09, 0.08]} />
      </group>
      <group ref={(el) => (r.head = el)} position={[0, h.y, 0]}>
        <Blob color={p.fur} s={[0.36, 0.31, 0.33]} />
        {[1, -1].map((side, i) => (
          <group key={side} ref={(el) => (r.ears[i] = el)} position={[side * 0.11, 0.24, -0.03]}>
            <group rotation={[-0.1, 0, -side * 0.14]}>
              <Blob color={p.fur} s={[0.075, 0.2, 0.045]} position={[0, 0.17, 0]} />
              <Blob color="#FFB8C8" s={[0.045, 0.15, 0.02]} position={[0, 0.17, 0.03]} shadow={false} />
            </group>
          </group>
        ))}
        {[1, -1].map((side) => (
          <Blob key={side} color={p.belly} s={[0.055, 0.045, 0.04]} position={[side * 0.042, -0.09, 0.295]} shadow={false} />
        ))}
        <mesh geometry={SPHERE} material={flat('#FF7F9E')} scale={[0.032, 0.022, 0.02]} position={[0, -0.05, 0.325]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.028, 0.03, 0.012]} position={[0, -0.155, 0.3]} />
        <Eyes r={r} x={h.ex} y={h.ey} z={h.ez} yaw={h.eyaw} />
        <Brows r={r} x={h.ex} y={0.13} z={0.28} yaw={h.eyaw} />
        <Cheeks r={r} x={0.23} y={-0.07} z={0.225} />
        <Mouth r={r} y={-0.13} z={0.3} w={0.7} />
      </group>
    </>
  )
}

function Frog({ r, p, h }) {
  return (
    <>
      <Blob color={p.fur} s={[0.3, 0.27, 0.26]} position={[0, 0.36, 0]} />
      <Blob color={p.belly} s={[0.21, 0.2, 0.15]} position={[0, 0.33, 0.12]} shadow={false} />
      <Feet r={r} x={0.15} y={0.14} color={p.deep} s={[0.13, 0.045, 0.15]} />
      <Arms r={r} x={h.sh[0]} y={h.sh[1]} z={h.sh[2]} color={p.fur} s={[0.065, 0.11, 0.065]} />
      <group ref={(el) => (r.head = el)} position={[0, h.y, 0]}>
        <Blob color={p.fur} s={[0.44, 0.26, 0.36]} />
        <Blob color={p.belly} s={[0.36, 0.12, 0.28]} position={[0, -0.12, 0.07]} shadow={false} />
        {[1, -1].map((side) => (
          <Blob key={side} color={p.fur} s={[0.15, 0.14, 0.13]} position={[side * 0.19, 0.22, 0.05]} />
        ))}
        <Eyes r={r} x={h.ex} y={h.ey} z={h.ez} yaw={h.eyaw} s={1.15} />
        <Brows r={r} x={h.ex} y={0.38} z={0.12} yaw={h.eyaw} />
        <Cheeks r={r} x={0.31} y={-0.03} z={0.24} yaw={0.9} />
        {[1, -1].map((side) => (
          <mesh key={side} geometry={SPHERE} material={flat(p.deep)} scale={[0.012, 0.01, 0.01]} position={[side * 0.05, 0.03, 0.355]} />
        ))}
        <Mouth r={r} y={-0.05} z={0.348} w={2.4} rx={-0.15} />
      </group>
    </>
  )
}

function Penguin({ r, p, h }) {
  return (
    <>
      <Blob color={p.fur} s={[0.36, 0.5, 0.33]} position={[0, 0.56, 0]} />
      <Blob color={p.belly} s={[0.27, 0.36, 0.22]} position={[0, 0.46, 0.13]} shadow={false} />
      <Feet r={r} x={0.12} y={0.12} color={p.beak} s={[0.09, 0.04, 0.12]} />
      {[1, -1].map((side, i) => (
        <group key={side} ref={(el) => (r.arms[i] = el)} position={[side * 0.31, 0.66, 0]}>
          <Blob color={p.deep} s={[0.05, 0.19, 0.11]} position={[side * 0.04, -0.15, 0]} rotation={[0, 0, side * 0.28]} />
        </group>
      ))}
      <group ref={(el) => (r.tail = el)} position={[0, 0.12, -0.28]}>
        <Blob color={p.deep} s={[0.1, 0.04, 0.1]} position={[0, 0, -0.04]} rotation={[0.5, 0, 0]} />
      </group>
      <group ref={(el) => (r.head = el)} position={[0, h.y, 0]}>
        <Blob color={p.fur} s={[0.05, 0.07, 0.05]} position={[0.02, 0.22, -0.02]} rotation={[0, 0, -0.4]} />
        {[1, -1].map((side) => (
          <Blob key={side} color={p.belly} s={[0.14, 0.15, 0.12]} position={[side * 0.1, 0.0, 0.17]} shadow={false} />
        ))}
        <Blob color={p.belly} s={[0.2, 0.1, 0.12]} position={[0, -0.1, 0.17]} shadow={false} />
        <Eyes r={r} x={h.ex} y={h.ey} z={h.ez} yaw={h.eyaw} />
        <Brows r={r} x={h.ex} y={0.1} z={0.27} yaw={h.eyaw} />
        <Cheeks r={r} x={0.2} y={-0.07} z={0.25} yaw={0.7} />
        <group ref={(el) => (r.jaw = el)} position={[0, -0.07, 0.29]}>
          <mesh geometry={CONE} material={toon(p.beak)} scale={[0.05, 0.1, 0.035]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]} />
        </group>
      </group>
    </>
  )
}

function Duck({ r, p, h }) {
  return (
    <>
      <Blob color={p.fur} s={[0.31, 0.3, 0.31]} position={[0, 0.4, 0]} />
      <Blob color={p.belly} s={[0.22, 0.2, 0.18]} position={[0, 0.35, 0.14]} shadow={false} />
      <Feet r={r} x={0.12} y={0.12} color={p.beak} s={[0.1, 0.04, 0.12]} />
      {[1, -1].map((side, i) => (
        <group key={side} ref={(el) => (r.arms[i] = el)} position={[side * 0.27, 0.5, -0.02]}>
          <Blob color={p.deep} s={[0.06, 0.15, 0.13]} position={[side * 0.04, -0.09, 0]} rotation={[0.2, 0, side * 0.3]} />
        </group>
      ))}
      <group ref={(el) => (r.tail = el)} position={[0, 0.48, -0.26]}>
        <Blob color={p.deep} s={[0.1, 0.07, 0.12]} position={[0, 0.04, -0.06]} rotation={[-0.7, 0, 0]} />
      </group>
      <group ref={(el) => (r.head = el)} position={[0, h.y, 0.02]}>
        <Blob color={p.head ?? p.fur} s={[0.3, 0.28, 0.28]} />
        <Blob color={p.head ?? p.fur} s={[0.05, 0.08, 0.05]} position={[0.02, 0.29, 0]} rotation={[0, 0, -0.4]} />
        <Blob color={p.head ?? p.fur} s={[0.04, 0.06, 0.04]} position={[-0.04, 0.27, 0.02]} rotation={[0, 0, 0.5]} />
        {p.head && <mesh geometry={CYL} material={toon('#FFFFFF')} scale={[0.2, 0.025, 0.2]} position={[0, -0.24, 0]} />}
        <Blob color={p.beak} s={[0.13, 0.045, 0.11]} position={[0, -0.05, 0.27]} />
        <group ref={(el) => (r.jaw = el)} position={[0, -0.08, 0.2]}>
          <Blob color={p.beak} s={[0.11, 0.032, 0.09]} position={[0, -0.01, 0.06]} shadow={false} />
        </group>
        <Eyes r={r} x={h.ex} y={h.ey} z={h.ez} yaw={h.eyaw} />
        <Brows r={r} x={h.ex} y={0.15} z={0.23} yaw={h.eyaw} />
        <Cheeks r={r} x={0.2} y={-0.05} z={0.2} yaw={0.8} />
      </group>
    </>
  )
}

function Hamster({ r, p, h }) {
  return (
    <>
      <Blob color={p.fur} s={[0.32, 0.29, 0.3]} position={[0, 0.34, 0]} />
      <Blob color={p.belly} s={[0.23, 0.21, 0.18]} position={[0, 0.32, 0.14]} shadow={false} />
      <Feet r={r} x={0.12} y={0.12} color="#FFB8C2" s={[0.07, 0.045, 0.09]} />
      {[1, -1].map((side, i) => (
        <group key={side} ref={(el) => (r.arms[i] = el)} position={[side * h.sh[0], h.sh[1], h.sh[2]]}>
          <Blob color="#FFC4CC" s={[0.05, 0.06, 0.05]} position={[-side * 0.04, -0.06, 0.12]} />
        </group>
      ))}
      <group ref={(el) => (r.head = el)} position={[0, h.y, 0]}>
        <Blob color={p.fur} s={[0.4, 0.33, 0.35]} />
        {p.fur === '#FFF6EC' && <Blob color={p.deep} s={[0.2, 0.18, 0.2]} position={[0.2, 0.16, -0.04]} shadow={false} />}
        {[1, -1].map((side, i) => (
          <group key={side} ref={(el) => (r.ears[i] = el)} position={[side * 0.24, 0.22, -0.04]}>
            <Blob color={p.deep} s={[0.085, 0.08, 0.04]} />
            <Blob color="#FFB8C8" s={[0.05, 0.05, 0.02]} position={[0, 0, 0.025]} shadow={false} />
          </group>
        ))}
        {[1, -1].map((side, i) => (
          <group key={side} ref={(el) => (r.pouches[i] = el)} position={[side * 0.25, -0.09, 0.16]}>
            <Blob color={p.belly} s={[0.13, 0.11, 0.12]} />
            <mesh geometry={SPHERE} material={flat(BLUSH)} scale={[0.06, 0.035, 0.02]} position={[side * 0.02, 0.0, 0.11]} rotation={[0, side * 0.5, 0]} />
          </group>
        ))}
        <Blob color={p.belly} s={[0.11, 0.08, 0.06]} position={[0, -0.1, 0.29]} shadow={false} />
        <mesh geometry={SPHERE} material={flat('#FF7F9E')} scale={[0.028, 0.02, 0.02]} position={[0, -0.05, 0.345]} />
        <mesh geometry={SPHERE} material={flat('#FFFFFF')} scale={[0.024, 0.024, 0.01]} position={[0, -0.16, 0.315]} />
        <Eyes r={r} x={h.ex} y={h.ey} z={h.ez} yaw={h.eyaw} s={0.95} />
        <Brows r={r} x={h.ex} y={0.15} z={0.28} yaw={h.eyaw} />
        <Mouth r={r} y={-0.125} z={0.33} w={0.6} />
      </group>
    </>
  )
}

function Otter({ r, p, h }) {
  return (
    <>
      <Biped r={r} p={p} h={h} torso={[0.25, 0.36, 0.23]} ty={0.45} />
      <group ref={(el) => (r.tail = el)} position={[0, 0.2, -0.16]}>
        <group rotation={[0, -0.75, 0]}>
          <Blob color={p.deep} s={[0.11, 0.08, 0.18]} position={[0, -0.06, -0.12]} rotation={[-0.3, 0, 0]} />
          <Blob color={p.deep} s={[0.085, 0.06, 0.17]} position={[0, -0.12, -0.38]} rotation={[-0.1, 0, 0]} />
          <Blob color={p.deep} s={[0.06, 0.045, 0.1]} position={[0, -0.13, -0.56]} />
        </group>
      </group>
      <group ref={(el) => (r.head = el)} position={[0, h.y, 0]}>
        <Blob color={p.fur} s={[0.35, 0.27, 0.3]} />
        <Blob color={p.belly} s={[0.28, 0.17, 0.22]} position={[0, -0.08, 0.1]} shadow={false} />
        <Blob color={p.belly} s={[0.13, 0.08, 0.08]} position={[0, -0.07, 0.25]} shadow={false} />
        {[1, -1].map((side, i) => (
          <group key={side} ref={(el) => (r.ears[i] = el)} position={[side * 0.25, 0.15, -0.05]}>
            <Blob color={p.deep} s={[0.07, 0.06, 0.04]} />
          </group>
        ))}
        <mesh geometry={SPHERE} material={flat('#4A3328')} scale={[0.055, 0.038, 0.03]} position={[0, -0.03, 0.325]} />
        <Whiskers x={0.15} y={-0.07} z={0.29} color="#6B5446" len={0.14} />
        <Eyes r={r} x={h.ex} y={h.ey} z={h.ez} yaw={h.eyaw} s={0.95} />
        <Brows r={r} x={h.ex} y={0.14} z={0.26} yaw={h.eyaw} />
        <Cheeks r={r} x={0.2} y={-0.07} z={0.23} />
        <Mouth r={r} y={-0.135} z={0.32} w={0.7} />
      </group>
    </>
  )
}

const MODELS = { cat: Cat, bunny: Bunny, frog: Frog, penguin: Penguin, duck: Duck, hamster: Hamster, otter: Otter }

// ---------- Zubehör ----------
function Sunglasses({ h }) {
  return (
    <group position={[0, h.ey + 0.01, 0]} scale={h.gs ?? 1}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * h.ex, 0, h.ez + 0.05]} rotation={[Math.PI / 2, side * h.eyaw, 0]}>
          <mesh geometry={CYL} material={toon('#262B40')} scale={[0.1, 0.02, 0.085]} />
          <mesh geometry={SPHERE} material={flat('#6E7896')} scale={[0.03, 0.012, 0.018]} position={[0.03, 0.012, -0.035]} />
        </group>
      ))}
      <mesh geometry={CYL} material={toon('#F0B429')} scale={[0.012, h.ex * 0.9, 0.012]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.02, h.ez + 0.06]} />
    </group>
  )
}

function RoundGlasses({ h }) {
  return (
    <group position={[0, h.ey, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} geometry={RING} material={toon('#4A4F66')} scale={[0.1, 0.1, 0.1]} position={[side * h.ex, 0, h.ez + 0.05]} rotation={[0, side * h.eyaw, 0]} />
      ))}
      <mesh geometry={CYL} material={toon('#4A4F66')} scale={[0.01, h.ex * 0.5, 0.01]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.03, h.ez + 0.07]} />
    </group>
  )
}

function SantaHat({ h }) {
  const k = h.r / 0.38
  return (
    <group position={[0, h.top - 0.03, -0.04]} rotation={[-0.2, 0, -0.18]} scale={k * 0.85}>
      <mesh geometry={BRIM} material={toon('#FFFFFF')} scale={[0.22, 0.22, 0.2]} rotation={[Math.PI / 2, 0, 0]} />
      <group position={[0, 0.03, 0]}>
        <mesh geometry={CONE} material={toon('#E8414B')} scale={[0.2, 0.34, 0.2]} position={[0, 0.17, 0]} castShadow />
        <group position={[0, 0.3, 0]} rotation={[0, 0, -0.9]}>
          <mesh geometry={CONE} material={toon('#E8414B')} scale={[0.08, 0.16, 0.08]} position={[0, 0.06, 0]} />
          <Blob color="#FFFFFF" s={[0.06, 0.06, 0.06]} position={[0, 0.15, 0]} />
        </group>
      </group>
    </group>
  )
}

function Sparkles({ h, sp }) {
  return (
    <group ref={sp} position={[0, h.top * 0.6, 0]}>
      {[0, 1].map((i) => (
        <group key={i} position={[Math.sin(i * Math.PI) * (h.r + 0.14), i * 0.12, Math.cos(i * Math.PI) * (h.r + 0.14)]}>
          <mesh geometry={SPARK} material={flat('#FFD45E')} scale={[0.035, 0.08, 0.035]} />
          <mesh geometry={SPARK} material={flat('#FFD45E')} scale={[0.08, 0.035, 0.035]} />
          <mesh geometry={SPHERE} material={GLOW} scale={0.08} />
        </group>
      ))}
    </group>
  )
}

function Tie({ h }) {
  return (
    <group position={[0, h.chest[0], h.chest[1]]} rotation={[-0.25, 0, 0]}>
      <Blob color="#4A6FD6" s={[0.035, 0.03, 0.025]} />
      <mesh geometry={CONE} material={toon('#4A6FD6')} scale={[0.045, 0.16, 0.02]} position={[0, -0.1, 0]} rotation={[0, 0, Math.PI]} />
      {[1, -1].map((side) => (
        <mesh key={side} geometry={CONE} material={flat('#FFFFFF')} scale={[0.04, 0.06, 0.012]} position={[side * 0.04, 0.025, -0.005]} rotation={[0, 0, Math.PI + side * 0.9]} />
      ))}
    </group>
  )
}

function Briefcase({ bag, h }) {
  return (
    <group ref={bag} position={[-h.sh[0], h.sh[1], h.sh[2]]}>
      <group position={[-0.1, -0.34, 0.08]} rotation={[0, 0.5, 0]}>
        <RBox size={[0.24, 0.18, 0.07]} r={0.025} color="#8A5A3C" />
        <mesh geometry={RING} material={toon('#5E3B26')} scale={[0.05, 0.04, 0.05]} position={[0, 0.1, 0]} />
        <mesh geometry={CYL} material={toon('#F0B429')} scale={[0.025, 0.012, 0.02]} position={[0, 0.04, 0.04]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={CYL} material={toon('#6E4730')} scale={[0.003, 0.24, 0.003]} position={[0, -0.01, 0.036]} rotation={[0, 0, Math.PI / 2]} />
      </group>
    </group>
  )
}

// ---------- Kugelfisch: die bestehende Kugel + VIP-Zubehör, das ihrer Bewegung folgt ----------
function PufferExtras({ ent }) {
  const root = useRef()
  const body = useRef()
  const sp = useRef()
  const s = useRef({ size: 0, yaw: ent.yaw ?? 0, moodWas: ent.mood, moodAt: 0 })
  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(Math.max(dtRaw, 1 / 240), 0.05)
    const t = clock.elapsedTime
    const st = s.current
    const g = root.current
    if (st.moodWas !== ent.mood) {
      st.moodWas = ent.mood
      st.moodAt = t
    }
    const since = t - st.moodAt
    g.position.set(ent.x, 0, ent.z)
    st.yaw = turnTo(st.yaw, ent.yaw, 1 - Math.exp(-dt * 8))
    const spin = ent.mood === 'happy' && since < 0.9 ? Math.sin((since / 0.9) * Math.PI * 0.5) * Math.PI * 2 : 0
    g.rotation.y = st.yaw + spin
    st.size += ((ent.present ? 1 : 0) - st.size) * (1 - Math.exp(-dt * (ent.present ? 7 : 9)))
    const bob = Math.sin(t * 2.1) * 0.06 + (ent.mood === 'happy' ? Math.abs(Math.sin(t * 6)) * 0.07 : 0)
    body.current.position.y = 0.86 + bob
    body.current.scale.setScalar(Math.max(0.001, st.size * (ent.mood === 'angry' ? 1.2 : 1)))
    sp.current.rotation.y = t * 2.2
  })
  const h = { ey: 0.15, ex: 0.155, ez: 0.36, eyaw: 0.35, top: 0.5, r: 0.45, gs: 1.25 }
  return (
    <group ref={root}>
      <group ref={body}>
        <Sunglasses h={h} />
        <Sparkles h={h} sp={sp} />
      </group>
    </group>
  )
}

// ---------- Kundschaft ----------
export default function Critter({ ent, species = 'cat', tint = 0, vip = false, santa = false, inspector = false }) {
  if (species === 'puffer' || !MODELS[species]) {
    const c = PUFFER[((tint % 4) + 4) % 4]
    return (
      <>
        <Kugel ent={ent} color={c.color} dark={c.dark} hat={santa ? '#E8414B' : vip ? '#FFD45E' : c.hat} />
        {vip && <PufferExtras ent={ent} />}
      </>
    )
  }
  return <Animal ent={ent} species={species} tint={tint} vip={vip} santa={santa} inspector={inspector} />
}

function Animal({ ent, species, tint, vip, santa, inspector }) {
  const root = useRef()
  const lift = useRef()
  const sp = useRef()
  const bag = useRef()
  const parts = useRef({ eyes: [], brows: [], cheeks: [], arms: [], feet: [], ears: [], pouches: [], head: null, mouth: null, open: null, jaw: null, tail: null })
  const s = useRef({ size: 0, placed: false, yaw: ent.yaw ?? 0, walk: 0, mv: 0, sit: 0, ang: 0, moodWas: ent.mood, moodAt: -9, blinkAt: 0, blinkNext: 1.5 })
  const p = PAL[species][((tint % 4) + 4) % 4]
  const h = HEAD[species]
  const mv = MOVE[species]
  const Model = MODELS[species]
  const R = parts.current

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(Math.max(dtRaw, 1 / 240), 0.05)
    const t = clock.elapsedTime
    const st = s.current
    const g = root.current
    const mood = ent.mood
    if (!st.placed) {
      g.position.set(ent.x, 0, ent.z)
      st.placed = true
    }
    if (st.moodWas !== mood) {
      st.moodWas = mood
      st.moodAt = t
    }
    const since = t - st.moodAt
    g.position.x = ent.x
    g.position.z = ent.z
    st.yaw = turnTo(st.yaw, ent.yaw ?? st.yaw, 1 - Math.exp(-dt * 8))
    const happy = mood === 'happy'
    const dance = happy && since < 1.2
    const dk = since / 1.2
    const spin = dance ? (dk * dk * (3 - 2 * dk)) * Math.PI * 2 : 0
    g.rotation.y = st.yaw + spin

    st.size += ((ent.present !== false ? 1 : 0) - st.size) * (1 - Math.exp(-dt * (ent.present !== false ? 7 : 9)))
    g.scale.setScalar(Math.max(0.001, st.size))

    const k = 1 - Math.exp(-dt * 10)
    const moving = Boolean(ent.moving) && mood !== 'sit'
    st.mv += ((moving ? 1 : 0) - st.mv) * k
    st.sit += ((mood === 'sit' ? 1 : 0) - st.sit) * (1 - Math.exp(-dt * 7))
    st.ang += ((mood === 'angry' ? 1 : 0) - st.ang) * k
    if (moving) st.walk += dt * mv.walk
    const ws = Math.sin(st.walk)

    // Rumpf: hüpfen, watscheln, stampfen, sitzen, atmen
    let hop = st.mv * Math.abs(ws) * mv.hop
    if (dance) hop += Math.abs(Math.sin(dk * Math.PI * 3)) * 0.2 * (1 - dk * 0.4)
    const stomp = st.ang * Math.abs(Math.sin(t * 13)) * 0.04
    const L = lift.current
    L.position.y = hop + stomp - st.sit * 0.25
    L.rotation.z = st.mv * ws * mv.waddle + st.ang * Math.sin(t * 26) * 0.05
    L.rotation.x = st.mv * 0.07
    const breathe = Math.sin(t * 2.4) * 0.02
    L.scale.set(1 - breathe * 0.4 + st.ang * 0.03, 1 + breathe, 1 - breathe * 0.4 + st.ang * 0.03)

    // Kopf
    if (R.head) {
      const hx = st.ang * 0.12 - (dance ? 0.18 : happy ? 0.08 : 0) + st.sit * 0.05
      const hz = mood === 'talk' ? Math.sin(t * 3) * 0.09 : happy && !dance ? Math.sin(t * 2) * 0.06 : Math.sin(t * 1.3) * 0.03
      R.head.rotation.x += (hx - R.head.rotation.x) * k
      R.head.rotation.z += (hz - R.head.rotation.z) * k
      R.head.rotation.y = st.ang * Math.sin(t * 18) * 0.08
    }

    // Arme: Freudentanz hoch, beim Reden gestikulieren, wütend Fäuste schütteln, sitzend nach vorn auf den Tisch
    R.arms.forEach((a, i) => {
      if (!a) return
      const side = i ? -1 : 1
      let raise = 0.08
      if (dance) raise = 2.5 + Math.sin(t * 14 + i * Math.PI) * 0.35
      else if (happy) raise = 0.45 + Math.sin(t * 5 + i) * 0.15
      else if (mood === 'talk') raise = i === 0 ? 0.5 + Math.sin(t * 6) * 0.35 : 0.15
      else if (mood === 'angry') raise = 0.55 + Math.sin(t * 30 + i * Math.PI) * 0.18
      a.rotation.z += (side * raise - a.rotation.z) * k
      const fwd = st.mv * Math.sin(st.walk + i * Math.PI) * 0.5 - st.sit * 1.0 - st.ang * 0.4
      a.rotation.x += (fwd - a.rotation.x) * k
    })
    if (bag.current && R.arms[1]) bag.current.rotation.copy(R.arms[1].rotation)

    // Beine: laufen, sitzen (nach vorn gestreckt), wütend trampeln
    R.feet.forEach((f, i) => {
      if (!f) return
      f.rotation.x = st.mv * Math.sin(st.walk + i * Math.PI) * 0.6 - st.sit * 1.35 - st.ang * Math.max(0, Math.sin(t * 13 + i * Math.PI)) * 0.5
    })

    // Ohren: wippen beim Gehen, stellen sich vor Freude auf, legen sich an vor Ärger
    R.ears.forEach((e, i) => {
      if (!e) return
      const side = i ? -1 : 1
      const flop = st.mv * Math.sin(st.walk * 2 + i) * mv.ear + Math.sin(t * 1.7 + i * 2) * mv.ear * 0.25
      const perk = dance ? Math.sin(t * 16 + i) * 0.25 : 0
      e.rotation.x = flop - st.ang * 0.5 + perk + st.sit * 0.1
      e.rotation.z = -side * (st.ang * 0.45 - (dance ? 0.15 : 0)) + (species === 'bunny' && i === 1 ? 0.25 * (1 - st.ang) : 0)
    })

    // Schwanz
    if (R.tail) {
      const wig = mv.tailWalk && st.mv > 0.3 ? Math.sin(t * mv.tailWalk) * 0.5 : 0
      const fast = dance || st.ang > 0.5 ? 3 : 1
      R.tail.rotation.y = Math.sin(t * mv.tailF * fast) * mv.tailA + wig
      if (species === 'cat') R.tail.rotation.z = Math.sin(t * 1.3) * 0.15
    }

    // Blinzeln, Wangen, Backentaschen
    if (t > st.blinkNext) {
      st.blinkAt = t
      st.blinkNext = t + 2 + Math.random() * 3
    }
    const blink = t - st.blinkAt < 0.12 ? 0.1 : dance ? 0.35 : happy ? 0.75 : st.ang > 0.5 ? 0.8 : 1
    R.eyes.forEach((e) => e && (e.scale.y += (blink - e.scale.y) * 0.5))
    R.brows.forEach((b, i) => {
      if (!b) return
      b.visible = st.ang > 0.2
      b.rotation.z = (i ? 1 : -1) * 0.45 * st.ang
    })
    const ch = 1 + st.ang * 0.55 + (happy ? 0.2 : 0)
    R.cheeks.forEach((c) => c && (c.scale.x += (0.06 * ch - c.scale.x) * k, c.scale.y += (0.035 * ch - c.scale.y) * k))
    const pouch = happy ? 1.45 : st.ang > 0.5 ? 1.3 : 1
    R.pouches.forEach((pp) => pp && pp.scale.setScalar(pp.scale.x + (pouch - pp.scale.x) * k))

    // Mund
    const open = mood === 'talk' ? 0.25 + Math.abs(Math.sin(t * 9)) * 0.85 : dance ? 1 : happy ? 0.6 : 0
    if (R.open) {
      R.open.scale.y += (Math.max(0.001, open) - R.open.scale.y) * 0.4
      R.open.visible = R.open.scale.y > 0.06
    }
    if (R.mouth) {
      R.mouth.visible = !(R.open && R.open.scale.y > 0.3)
      const want = st.ang > 0.5 ? 0.8 : -1
      R.mouth.scale.y += (want - R.mouth.scale.y) * k
      R.mouth.position.y = R.mouth.scale.y > 0 ? -0.012 : 0.018
    }
    if (R.jaw) R.jaw.rotation.x += (open * 0.45 - R.jaw.rotation.x) * 0.4

    if (sp.current) sp.current.rotation.y = t * 2.2
  })

  return (
    <group ref={root}>
      <group ref={lift}>
        <Model r={R} p={p} h={h} />
        {(vip || santa || inspector) && (
          <HeadFollower r={R} h={h}>
            {vip && <Sunglasses h={h} />}
            {vip && <Sparkles h={h} sp={sp} />}
            {inspector && !vip && <RoundGlasses h={h} />}
            {santa && <SantaHat h={h} />}
          </HeadFollower>
        )}
        {inspector && <Tie h={h} />}
        {inspector && <Briefcase bag={bag} h={h} />}
      </group>
    </group>
  )
}

// Zubehör am Kopf: folgt der Kopfdrehung (der Kopf liegt in der Art-Komponente)
function HeadFollower({ r, h, children }) {
  const ref = useRef()
  useFrame(() => {
    if (r.head && ref.current) {
      ref.current.position.copy(r.head.position)
      ref.current.rotation.copy(r.head.rotation)
    }
  })
  return (
    <group ref={ref} position={[0, h.y, 0]}>
      {children}
    </group>
  )
}

export { PAL as CRITTER_TINTS, HEAD as CRITTER_HEADS }
