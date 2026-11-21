import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Loopy from './Loopy.jsx'
import Kugel from './Kugel.jsx'
import { Deko, Island, Marker, Stall } from './World.jsx'

// Die 3D-Bühne: Insel von schräg oben (isometrisch, ohne Perspektive). Auf der Karte sieht man die
// ganze Insel; bei einem Fall fährt die Kamera an Loopy und die Kundschaft heran.

const DIR = new THREE.Vector3(1, 0.9, 1).normalize()
const MAP_AT = new THREE.Vector3(0, 0.2, 0)
const TALK_AT = new THREE.Vector3(0.55, 0.75, 1.0)
const STALL = [-1.0, 0, -1.0]

// Loopys Plätze: auf der Kiste hinter der Theke bzw. vorne beim Gespräch
export const SPOTS = {
  stall: { spot: [-1.0, 0.34, -1.5], face: 0.5 },
  talk: { spot: [-0.3, 0, 1.75], face: 1.35 },
  customer: { spot: [1.45, 0, 0.3], face: 0.05, from: [4.15, 0, 0.4] },
}

const up = new THREE.Vector3()

function Rig({ close }) {
  const { camera, size } = useThree()
  const at = useRef(MAP_AT.clone())
  const ready = useRef(false)
  useFrame((_, dt) => {
    const k = ready.current ? 1 - Math.exp(-Math.min(dt, 0.05) * 3.6) : 1
    ready.current = true
    const portrait = size.height > size.width
    at.current.lerp(close ? TALK_AT : MAP_AT, k)
    const zoom = close ? Math.min(size.width / 5.2, size.height / 9) : Math.min(size.width / 13.6, size.height / (portrait ? 16 : 12.5))
    camera.zoom += (zoom - camera.zoom) * k
    camera.position.copy(at.current).addScaledVector(DIR, 40)
    camera.lookAt(at.current)
    // Motiv etwas nach oben rücken (unten liegt die Bedienung)
    const lift = close ? 0.1 : portrait ? 0.07 : 0
    up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    camera.position.addScaledVector(up, (-lift * size.height) / camera.zoom)
    camera.updateProjectionMatrix()
  })
  return null
}

export default function Scene({ phase, loopyMood, customer, onStart, onPoke }) {
  const close = phase !== 'map'
  const loopyAt = close ? SPOTS.talk : SPOTS.stall
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
      <Rig close={close} />
      <hemisphereLight args={['#FFFFFF', '#DCE7FA', 2.58]} />
      <directionalLight
        position={[-5, 12, 9]}
        intensity={0.74}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <Island />
      <Deko />
      <Stall position={STALL} onClick={phase === 'map' ? onStart : undefined} />
      {phase === 'map' && <Marker position={[STALL[0], 4.1, STALL[2]]} onClick={onStart} />}
      <Loopy mood={loopyMood} spot={loopyAt.spot} face={loopyAt.face} onClick={onPoke} />
      {customer && (
        <Kugel
          key={customer.key}
          color={customer.color}
          dark={customer.dark}
          hat={customer.hat}
          mood={customer.mood}
          present={customer.present}
          spot={SPOTS.customer.spot}
          from={SPOTS.customer.from}
          face={SPOTS.customer.face}
        />
      )}
    </Canvas>
  )
}
