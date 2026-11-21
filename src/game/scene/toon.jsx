import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// Gemeinsamer Look der Spielwelt: klare, ruhige Formen in den Farben von BW Buddy, weiches Licht von
// oben links (Oberseiten am hellsten), keine Konturen. Materialien und Geometrien werden geteilt.

export const INK = '#1D2B45'

const cache = new Map()
export function toon(color) {
  if (!cache.has(color)) cache.set(color, new THREE.MeshLambertMaterial({ color }))
  return cache.get(color)
}

const basicCache = new Map()
export function flat(color) {
  if (!basicCache.has(color)) basicCache.set(color, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }))
  return basicCache.get(color)
}

export const SPHERE = new THREE.SphereGeometry(1, 32, 24)
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 24)
export const CONE = new THREE.ConeGeometry(1, 1, 12)

/** Runde Form. `s` = Halbachsen [x, y, z] (bei Kugeln) bzw. Skalierung der Geometrie. */
export function Blob({ geo = SPHERE, color, s = [1, 1, 1], shadow = true, outline, children, ...props }) {
  return (
    <group {...props}>
      <mesh geometry={geo} material={toon(color)} scale={s} castShadow={shadow} receiveShadow />
      {children}
    </group>
  )
}

/** Flache Platte mit runden Ecken (Insel, Pflaster, Wiese). Oberseite liegt auf y = 0 der Gruppe. */
export function Slab({ w, d, h = 0.05, r = 0.3, color, shadow = false, ...props }) {
  const geo = useMemo(() => {
    const x = w / 2
    const z = d / 2
    const c = Math.min(r, x, z)
    const sh = new THREE.Shape()
    sh.moveTo(-x + c, -z)
    sh.lineTo(x - c, -z)
    sh.quadraticCurveTo(x, -z, x, -z + c)
    sh.lineTo(x, z - c)
    sh.quadraticCurveTo(x, z, x - c, z)
    sh.lineTo(-x + c, z)
    sh.quadraticCurveTo(-x, z, -x, z - c)
    sh.lineTo(-x, -z + c)
    sh.quadraticCurveTo(-x, -z, -x + c, -z)
    const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 8 })
    g.rotateX(-Math.PI / 2)
    g.translate(0, -h, 0)
    return g
  }, [w, d, h, r])
  return <mesh geometry={geo} material={toon(color)} castShadow={shadow} receiveShadow {...props} />
}

/** Quader mit runden Kanten. */
export function RBox({ size, r = 0.08, color, shadow = true, ...props }) {
  const geo = useMemo(() => new RoundedBoxGeometry(size[0], size[1], size[2], 4, Math.min(r, Math.min(...size) / 2 - 0.001)), [size[0], size[1], size[2], r])
  return <mesh geometry={geo} material={toon(color)} castShadow={shadow} receiveShadow {...props} />
}

/** Text auf einer Fläche (Schilder). */
export function useTextTexture(text, { w = 512, h = 128, bg = null, fg = INK, size = 60 } = {}) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')
    if (bg) {
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)
    }
    g.fillStyle = fg
    g.font = `800 ${size}px ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", system-ui, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, w / 2, h / 2 + size * 0.04, w * 0.94)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [text, w, h, bg, fg, size])
}

// Winkel auf kürzestem Weg annähern
export function turnTo(current, want, k) {
  let d = (want - current) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return current + d * k
}
