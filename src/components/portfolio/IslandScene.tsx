import { useRef, useState } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"

// A low-poly floating island in the spirit of TinyWorld's Greenhaven,
// rendered with the same tech as the real game (Three.js / WebGL). It lives
// in the hero as a live demo of the project rather than decoration: drag to
// orbit, release to coast, idle drift when untouched.

// Deterministic tree layout so the island doesn't reshuffle between renders.
const TREES: { x: number; z: number; s: number; v: 0 | 1 }[] = [
  { x: 0.72, z: 0.35, s: 1.0, v: 0 },
  { x: -0.62, z: 0.48, s: 0.85, v: 1 },
  { x: -0.18, z: -0.82, s: 1.1, v: 0 },
  { x: 0.88, z: -0.38, s: 0.8, v: 1 },
  { x: -0.98, z: -0.18, s: 0.9, v: 0 },
  { x: 0.16, z: 0.92, s: 0.95, v: 1 },
]

type SpinState = {
  yaw: number
  vel: number
  dragging: boolean
  lastX: number
}

function Tree({ x, z, s, v }: { x: number; z: number; s: number; v: 0 | 1 }) {
  const leaf = v === 0 ? "#5fae66" : "#6fbf72"
  const leafTop = v === 0 ? "#6cbd73" : "#7ecb80"
  return (
    <group position={[x, 0.3, z]} scale={s}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.24, 6]} />
        <meshStandardMaterial color="#7c5a3a" flatShading />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.26, 0.5, 7]} />
        <meshStandardMaterial color={leaf} flatShading />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <coneGeometry args={[0.18, 0.36, 7]} />
        <meshStandardMaterial color={leafTop} flatShading />
      </mesh>
    </group>
  )
}

function Cloud({ position, s }: { position: [number, number, number]; s: number }) {
  return (
    <group position={position} scale={s}>
      <mesh>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
      <mesh position={[0.22, -0.03, 0.04]} scale={[1, 0.75, 1]}>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color="#f4fbfb" flatShading />
      </mesh>
      <mesh position={[-0.2, -0.04, -0.03]} scale={[1, 0.7, 1]}>
        <icosahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color="#f4fbfb" flatShading />
      </mesh>
    </group>
  )
}

function IslandWorld({ spin, reduced }: { spin: React.RefObject<SpinState>; reduced: boolean }) {
  const island = useRef<THREE.Group>(null)
  const clouds = useRef<THREE.Group>(null)

  useFrame((state, dt) => {
    const s = spin.current
    if (!s.dragging) {
      s.vel *= Math.max(0, 1 - 2.2 * dt)
      s.yaw += s.vel * dt
      if (!reduced) s.yaw += dt * 0.12
    }
    if (island.current) {
      island.current.rotation.y = s.yaw
      island.current.position.y = reduced ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.07
    }
    if (clouds.current) {
      clouds.current.rotation.y = reduced ? 0.4 : 0.4 + state.clock.elapsedTime * 0.03
    }
  })

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} color="#fff3e0" />

      {/* Sea + shore rings — sized so the whole diorama stays inside frame */}
      <mesh position={[0, -1.0, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.98, 40]} />
        <meshStandardMaterial color="#7fd0c5" />
      </mesh>
      <mesh position={[0, -0.995, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.28, 1.35, 48]} />
        <meshStandardMaterial color="#a9e2d8" />
      </mesh>
      <mesh position={[0, -0.99, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.78, 1.84, 48]} />
        <meshStandardMaterial color="#a9e2d8" />
      </mesh>

      {/* Clouds orbit independently of the drag spin */}
      <group ref={clouds}>
        <Cloud position={[1.55, 0.95, -0.5]} s={1.0} />
        <Cloud position={[-1.6, 1.25, 0.35]} s={0.8} />
        <Cloud position={[-0.9, 1.5, -1.2]} s={0.65} />
      </group>

      {/* The island — this group carries the drag/idle rotation */}
      <group ref={island} scale={0.85}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[1.35, 1.45, 0.3, 10]} />
          <meshStandardMaterial color="#b2e39c" flatShading />
        </mesh>
        <mesh position={[0, -0.425, 0]}>
          <cylinderGeometry args={[1.42, 0.5, 0.85, 10]} />
          <meshStandardMaterial color="#8a7663" flatShading />
        </mesh>
        <mesh position={[0, -1.1, 0]}>
          <cylinderGeometry args={[0.5, 0.12, 0.5, 10]} />
          <meshStandardMaterial color="#79675a" flatShading />
        </mesh>

        {TREES.map((t, i) => (
          <Tree key={i} x={t.x} z={t.z} s={t.s} v={t.v} />
        ))}

        {/* Little house with the red roof */}
        <group position={[-0.3, 0.3, 0.12]} rotation-y={0.5}>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.44, 0.28, 0.36]} />
            <meshStandardMaterial color="#f5f1e8" flatShading />
          </mesh>
          <mesh position={[0, 0.36, 0]} rotation-y={Math.PI / 4}>
            <coneGeometry args={[0.35, 0.26, 4]} />
            <meshStandardMaterial color="#d95d51" flatShading />
          </mesh>
          <mesh position={[0, 0.07, 0.19]}>
            <boxGeometry args={[0.09, 0.14, 0.02]} />
            <meshStandardMaterial color="#6b4a35" flatShading />
          </mesh>
        </group>

        {/* Scattered rocks */}
        <mesh position={[0.55, 0.36, -0.5]} rotation-y={0.7}>
          <icosahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#9aa3a8" flatShading />
        </mesh>
        <mesh position={[-0.85, 0.35, 0.55]} rotation-y={1.4}>
          <icosahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color="#a8b0b4" flatShading />
        </mesh>
      </group>
    </>
  )
}

export default function IslandScene() {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const spin = useRef<SpinState>({ yaw: 0.6, vel: 0, dragging: false, lastX: 0 })

  return (
    <div
      className="relative aspect-[5/4] w-full touch-none select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        spin.current.dragging = true
        spin.current.lastX = e.clientX
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const s = spin.current
        if (!s.dragging) return
        const dx = e.clientX - s.lastX
        s.lastX = e.clientX
        s.yaw += dx * 0.006
        s.vel = dx * 0.35
      }}
      onPointerUp={() => {
        spin.current.dragging = false
      }}
      onPointerLeave={() => {
        spin.current.dragging = false
      }}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.7, 4.6], fov: 40 }}
        onCreated={({ camera }) => camera.lookAt(0, -0.2, 0)}
        gl={{ antialias: true }}
      >
        <IslandWorld spin={spin} reduced={reduced} />
      </Canvas>
    </div>
  )
}
