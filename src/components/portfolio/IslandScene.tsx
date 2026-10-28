import { useMemo, useRef, useState } from "react"
import type { RefObject } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"

// A low-poly floating island in the spirit of TinyWorld's Greenhaven,
// rendered with the same tech as the real game (Three.js / WebGL). It lives
// in the hero as a live demo of the project rather than decoration: drag to
// spin it, release and it coasts, then eases back home; a boat circles the
// island; a slow day/night cycle drives the light; and the whole palette
// glides between the IT and ESPORTS identities.

type Identity = "IT" | "ESPORTS"

const CYCLE = 48 // seconds for one full day/night loop

// Two albedo palettes: TinyWorld's teal-and-green for IT, a golden-hour
// variant that harmonizes with the site's warm ESPORTS accent.
const PALETTES: Record<Identity, Record<string, string>> = {
  IT: {
    water: "#7fd0c5", ring: "#a9e2d8", grass: "#b2e39c",
    rock: "#8a7663", rockTip: "#79675a", trunk: "#7c5a3a",
    leafA: "#5fae66", leafATop: "#6cbd73", leafB: "#6fbf72", leafBTop: "#7ecb80",
    wall: "#f5f1e8", roof: "#d95d51", door: "#6b4a35",
    stone: "#9aa3a8", stone2: "#a8b0b4",
    cloud: "#ffffff", cloud2: "#f4fbfb",
    hull: "#8b5e3c", mast: "#a06a42", sail: "#f7f4ec", flag: "#d95d51",
  },
  ESPORTS: {
    water: "#74b0c6", ring: "#9fd4c6", grass: "#d4c37e",
    rock: "#8a6f58", rockTip: "#77624e", trunk: "#7a4f33",
    leafA: "#d08a3e", leafATop: "#e09a4a", leafB: "#c67f38", leafBTop: "#d68f45",
    wall: "#f7f0e2", roof: "#c94f46", door: "#5f4030",
    stone: "#a89a88", stone2: "#b5a895",
    cloud: "#ffffff", cloud2: "#f6efe2",
    hull: "#7a4f33", mast: "#8f5c3a", sail: "#f7f0e2", flag: "#c94f46",
  },
}

const DAY_SUN = new THREE.Color("#fff1dc")
const NIGHT_SUN = new THREE.Color("#93a7d6")

// Deterministic tree layout so the island doesn't reshuffle between renders.
const TREES: { x: number; z: number; s: number; v: 0 | 1 }[] = [
  { x: 0.72, z: 0.35, s: 1.0, v: 0 },
  { x: -0.62, z: 0.48, s: 0.85, v: 1 },
  { x: -0.18, z: -0.82, s: 1.1, v: 0 },
  { x: 0.88, z: -0.38, s: 0.8, v: 1 },
  { x: -0.98, z: -0.18, s: 0.9, v: 0 },
  { x: 0.16, z: 0.92, s: 0.95, v: 1 },
]

type Mats = Record<string, THREE.Material>

function makeMaterials(identity: Identity): Mats {
  const p = PALETTES[identity]
  const std = (color: string, flat = true) =>
    new THREE.MeshStandardMaterial({ color: new THREE.Color(color), flatShading: flat })
  return {
    water: std(p.water, false),
    ring: std(p.ring, false),
    grass: std(p.grass),
    rock: std(p.rock),
    rockTip: std(p.rockTip),
    trunk: std(p.trunk),
    leafA: std(p.leafA),
    leafATop: std(p.leafATop),
    leafB: std(p.leafB),
    leafBTop: std(p.leafBTop),
    wall: std(p.wall),
    roof: std(p.roof),
    door: std(p.door),
    stone: std(p.stone),
    stone2: std(p.stone2),
    cloud: std(p.cloud),
    cloud2: std(p.cloud2),
    hull: std(p.hull),
    mast: std(p.mast),
    sail: std(p.sail),
    flag: std(p.flag),
    sunBall: new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffd98a"), transparent: true,
    }),
    moonBall: new THREE.MeshBasicMaterial({
      color: new THREE.Color("#e6eeff"), transparent: true,
    }),
  }
}

function paletteColors(identity: Identity): Record<string, THREE.Color> {
  const out: Record<string, THREE.Color> = {}
  for (const [key, hex] of Object.entries(PALETTES[identity])) {
    out[key] = new THREE.Color(hex)
  }
  return out
}

type SpinState = {
  yaw: number
  vel: number
  dragging: boolean
  lastX: number
  mode: "coast" | "return" | "idle"
  home: number
}

function Tree({
  x, z, s, v, mats,
}: { x: number; z: number; s: number; v: 0 | 1; mats: Mats }) {
  const leaf = v === 0 ? mats.leafA : mats.leafB
  const leafTop = v === 0 ? mats.leafATop : mats.leafBTop
  return (
    <group position={[x, 0.3, z]} scale={s}>
      <mesh position={[0, 0.12, 0]} material={mats.trunk}>
        <cylinderGeometry args={[0.05, 0.07, 0.24, 6]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} material={leaf}>
        <coneGeometry args={[0.26, 0.5, 7]} />
      </mesh>
      <mesh position={[0, 0.68, 0]} material={leafTop}>
        <coneGeometry args={[0.18, 0.36, 7]} />
      </mesh>
    </group>
  )
}

function Cloud({ position, s, mats }: { position: [number, number, number]; s: number; mats: Mats }) {
  return (
    <group position={position} scale={s}>
      <mesh material={mats.cloud}>
        <icosahedronGeometry args={[0.22, 0]} />
      </mesh>
      <mesh position={[0.22, -0.03, 0.04]} scale={[1, 0.75, 1]} material={mats.cloud2}>
        <icosahedronGeometry args={[0.16, 0]} />
      </mesh>
      <mesh position={[-0.2, -0.04, -0.03]} scale={[1, 0.7, 1]} material={mats.cloud2}>
        <icosahedronGeometry args={[0.14, 0]} />
      </mesh>
    </group>
  )
}

function Boat({ mats }: { mats: Mats }) {
  const boat = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!boat.current) return
    const t = state.clock.elapsedTime
    const a = t * 0.22 + 2.2
    const r = 1.58
    boat.current.position.x = Math.cos(a) * r
    boat.current.position.z = Math.sin(a) * r
    boat.current.position.y = -0.9 + Math.sin(t * 1.6) * 0.025
    boat.current.rotation.y = -a
    boat.current.rotation.z = Math.sin(t * 1.7) * 0.06
  })
  return (
    <group ref={boat} scale={0.9}>
      <mesh material={mats.hull}>
        <boxGeometry args={[0.2, 0.09, 0.42]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={mats.mast}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 5]} />
      </mesh>
      <mesh position={[0, 0.24, 0]} material={mats.sail}>
        <coneGeometry args={[0.09, 0.2, 4]} />
      </mesh>
      <mesh position={[0.035, 0.36, 0]} material={mats.flag}>
        <boxGeometry args={[0.06, 0.025, 0.015]} />
      </mesh>
    </group>
  )
}

function IslandWorld({
  identity, spin, reduced,
}: {
  identity: Identity
  spin: RefObject<SpinState>
  reduced: boolean
}) {
  const mats = useMemo(() => makeMaterials(identity), []) // eslint-disable-line react-hooks/exhaustive-deps
  const targets = useMemo(() => paletteColors(identity), [identity])

  const island = useRef<THREE.Group>(null)
  const clouds = useRef<THREE.Group>(null)
  const sun = useRef<THREE.Mesh>(null)
  const moon = useRef<THREE.Mesh>(null)
  const dirLight = useRef<THREE.DirectionalLight>(null)
  const ambLight = useRef<THREE.AmbientLight>(null)

  useFrame((state, dt) => {
    // Glide materials toward the active identity's palette.
    const k = 1 - Math.exp(-3.5 * dt)
    for (const [key, color] of Object.entries(targets)) {
      const mat = mats[key] as THREE.MeshStandardMaterial | undefined
      if (mat) mat.color.lerp(color, k)
    }

    // Day/night cycle: noon at t=0, midnight half a cycle later.
    const t = reduced ? 0 : state.clock.elapsedTime
    const phase = (t / CYCLE) % 1
    const elev = Math.cos(phase * Math.PI * 2) // 1 noon … -1 midnight
    const day = THREE.MathUtils.clamp(elev, 0, 1)
    if (dirLight.current) {
      dirLight.current.color.lerpColors(NIGHT_SUN, DAY_SUN, day)
      dirLight.current.intensity = 0.45 + 0.7 * day
    }
    if (ambLight.current) ambLight.current.intensity = 0.4 + 0.35 * day
    const sunAngle = phase * Math.PI * 2
    if (sun.current) {
      sun.current.position.set(Math.sin(sunAngle) * 2.4, elev * 1.8 + 0.1, -2.3)
      ;(sun.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(
        (elev + 0.15) * 4, 0, 1
      )
    }
    if (moon.current) {
      moon.current.position.set(-Math.sin(sunAngle) * 2.4, -elev * 1.8 + 0.1, -2.3)
      ;(moon.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(
        (-elev + 0.15) * 4, 0, 1
      )
    }

    // Spin: drag → coast with inertia → ease back home → gentle idle drift.
    const s = spin.current
    if (!s.dragging) {
      if (s.mode === "coast") {
        s.yaw += s.vel * dt
        s.vel *= Math.max(0, 1 - 2.6 * dt)
        if (Math.abs(s.vel) < 0.08) s.mode = "return"
      } else if (s.mode === "return") {
        const target = s.home + Math.round((s.yaw - s.home) / (Math.PI * 2)) * Math.PI * 2
        s.yaw = THREE.MathUtils.damp(s.yaw, target, 4, dt)
        if (Math.abs(s.yaw - target) < 0.005) {
          s.yaw = target
          s.mode = "idle"
        }
      } else if (!reduced) {
        s.yaw += dt * 0.12
      }
    }
    if (island.current) {
      island.current.rotation.y = s.yaw
      island.current.position.y = reduced ? 0 : Math.sin(t * 1.1) * 0.07
    }
    if (clouds.current) {
      clouds.current.rotation.y = reduced ? 0.4 : 0.4 + t * 0.03
    }
  })

  return (
    <>
      <ambientLight ref={ambLight} intensity={0.75} />
      <directionalLight ref={dirLight} position={[4, 6, 3]} intensity={1.15} color="#fff1dc" />

      {/* Sea + shore rings — sized so the whole diorama stays inside frame */}
      <mesh position={[0, -1.0, 0]} rotation-x={-Math.PI / 2} material={mats.water}>
        <circleGeometry args={[1.98, 40]} />
      </mesh>
      <mesh position={[0, -0.995, 0]} rotation-x={-Math.PI / 2} material={mats.ring}>
        <ringGeometry args={[1.28, 1.35, 48]} />
      </mesh>
      <mesh position={[0, -0.99, 0]} rotation-x={-Math.PI / 2} material={mats.ring}>
        <ringGeometry args={[1.78, 1.84, 48]} />
      </mesh>

      {/* Sun and moon cross the sky behind the island */}
      <mesh ref={sun} material={mats.sunBall}>
        <icosahedronGeometry args={[0.13, 1]} />
      </mesh>
      <mesh ref={moon} material={mats.moonBall}>
        <icosahedronGeometry args={[0.11, 1]} />
      </mesh>

      {/* Clouds orbit independently of the drag spin */}
      <group ref={clouds}>
        <Cloud position={[1.55, 0.95, -0.5]} s={1.0} mats={mats} />
        <Cloud position={[-1.6, 1.25, 0.35]} s={0.8} mats={mats} />
        <Cloud position={[-0.9, 1.5, -1.2]} s={0.65} mats={mats} />
      </group>

      {/* The little ferry — circles the island on the water */}
      <Boat mats={mats} />

      {/* The island — this group carries the drag/idle rotation */}
      <group ref={island} scale={0.85}>
        <mesh position={[0, 0.15, 0]} material={mats.grass}>
          <cylinderGeometry args={[1.35, 1.45, 0.3, 10]} />
        </mesh>
        <mesh position={[0, -0.425, 0]} material={mats.rock}>
          <cylinderGeometry args={[1.42, 0.5, 0.85, 10]} />
        </mesh>
        <mesh position={[0, -1.1, 0]} material={mats.rockTip}>
          <cylinderGeometry args={[0.5, 0.12, 0.5, 10]} />
        </mesh>

        {TREES.map((tr, i) => (
          <Tree key={i} x={tr.x} z={tr.z} s={tr.s} v={tr.v} mats={mats} />
        ))}

        {/* Little house with the red roof */}
        <group position={[-0.3, 0.3, 0.12]} rotation-y={0.5}>
          <mesh position={[0, 0.14, 0]} material={mats.wall}>
            <boxGeometry args={[0.44, 0.28, 0.36]} />
          </mesh>
          <mesh position={[0, 0.36, 0]} rotation-y={Math.PI / 4} material={mats.roof}>
            <coneGeometry args={[0.35, 0.26, 4]} />
          </mesh>
          <mesh position={[0, 0.07, 0.19]} material={mats.door}>
            <boxGeometry args={[0.09, 0.14, 0.02]} />
          </mesh>
        </group>

        {/* Scattered rocks */}
        <mesh position={[0.55, 0.36, -0.5]} rotation-y={0.7} material={mats.stone}>
          <icosahedronGeometry args={[0.09, 0]} />
        </mesh>
        <mesh position={[-0.85, 0.35, 0.55]} rotation-y={1.4} material={mats.stone2}>
          <icosahedronGeometry args={[0.07, 0]} />
        </mesh>
      </group>
    </>
  )
}

export default function IslandScene({ identity }: { identity: Identity }) {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const spin = useRef<SpinState>({
    yaw: 0.6, vel: 0, dragging: false, lastX: 0, mode: "idle", home: 0.6,
  })

  return (
    <div
      className="relative aspect-[5/4] w-full touch-none select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        const s = spin.current
        s.dragging = true
        s.lastX = e.clientX
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
        const s = spin.current
        s.dragging = false
        s.mode = Math.abs(s.vel) > 0.08 ? "coast" : "return"
      }}
      onPointerLeave={() => {
        const s = spin.current
        s.dragging = false
        if (s.mode !== "return") s.mode = Math.abs(s.vel) > 0.08 ? "coast" : "return"
      }}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.7, 4.6], fov: 40 }}
        onCreated={({ camera }) => camera.lookAt(0, -0.2, 0)}
        gl={{ antialias: true }}
      >
        <IslandWorld identity={identity} spin={spin} reduced={reduced} />
      </Canvas>
    </div>
  )
}
