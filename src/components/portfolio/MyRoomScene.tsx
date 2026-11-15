import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type ReactNode, type RefObject,
} from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import {
  Armchair, Backpack as BackpackIcon, Bed as BedIcon, Box, ClipboardList, Clock as ClockIcon, Eye,
  Headphones, Image as ImageIcon, Lamp, Laptop as LaptopIcon, Library, Monitor as MonitorIcon, Moon, Play, Radio, Settings,
  Sprout, Sun, Sunrise, Sunset, Utensils, type LucideIcon,
} from "lucide-react"
import { roomHotspots, hotspotPoints, type RoomHotspotId } from "@/data/room"
import { bi, useLang } from "@/lib/i18n"

// "My Room.exe" — the hero diorama, rebuilt as a live 3D scene.
//
// Everything is procedural low-poly / voxel primitives plus a few tiny canvas
// textures (posters, code on the screens, carpet, blanket) — no art assets.
//
// What's new in this version
// - Time of day: Live (follows the visitor's clock) or a fixed Morning / Noon /
//   Evening / Night. Sun, sky, window, lamps, LEDs and the room's ambient light
//   all glide between presets instead of snapping.
// - HUD in the spirit of the reference render: title chip, clock + settings,
//   current task, "Press E" hint and a controls legend.
// - Pins for the main interactions (laptop, bed, food, fridge) stay labelled.
// - Voxel detail pass: blinds, skyline, code on screens, boba, ramen steam,
//   pixel carpet / blanket, posters, LED shelves, hanging plant, bean bag…
//
// Object positions are unchanged, so `data/room.ts` and `RoomPanel.tsx` keep
// working as they are.

/** Default when the visitor hasn't picked anything. Use "noon" to always start bright. */
const DEFAULT_MODE: TimeMode = "live"
const STORAGE_KEY = "room-time-mode"

type Identity = "IT" | "ESPORTS"
type TimeMode = "live" | "morning" | "noon" | "evening" | "night"
type Phase = Exclude<TimeMode, "live">

const PRESET_HOUR: Record<Phase, number> = { morning: 8, noon: 12.5, evening: 17.5, night: 21 }
const MODES: TimeMode[] = ["live", "morning", "noon", "evening", "night"]

function phaseOf(hour: number): Phase {
  const h = ((hour % 24) + 24) % 24
  if (h >= 5 && h < 10.5) return "morning"
  if (h >= 10.5 && h < 15.5) return "noon"
  if (h >= 15.5 && h < 18.5) return "evening"
  return "night"
}

const PHASE_LABEL = {
  morning: bi("Morning", "Pagi"),
  noon: bi("Day", "Siang"),
  evening: bi("Evening", "Sore"),
  night: bi("Night", "Malam"),
}
const MODE_LABEL = {
  live: bi("Live", "Live"),
  morning: bi("Morning", "Pagi"),
  noon: bi("Noon", "Siang"),
  evening: bi("Evening", "Sore"),
  night: bi("Night", "Malam"),
}
const MODE_ICON: Record<TimeMode, LucideIcon> = {
  live: Radio, morning: Sunrise, noon: Sun, evening: Sunset, night: Moon,
}
const TASK: Record<Phase, ReturnType<typeof bi>> = {
  morning: bi("Plan today's tasks", "Susun rencana hari ini"),
  noon: bi("Ship a small feature", "Rilis satu fitur kecil"),
  evening: bi("Review & merge PRs", "Review & merge PR"),
  night: bi("Debug until it passes", "Debug sampai lulus"),
}

/* ───────────────────────────── palette & materials ───────────────────────── */

interface Palette {
  floor: string
  floorEdge: string
  slab: string
  wall: string
  wallSide: string
  wood: string
  woodDark: string
  woodLight: string
  fabricBlue: string
  fabricNavy: string
  blanket: string
  metal: string
  metalDark: string
  white: string
  accent: string
  accent2: string
  plant: string
  plantDark: string
  carpet: string
  carpetEdge: string
  skin: string
  hair: string
  hoodie: string
  pants: string
  cork: string
  bean: string
  led: string
}

const PALETTES: Record<Identity, Palette> = {
  IT: {
    floor: "#c9925c",
    floorEdge: "#a2703f",
    slab: "#2a2d4d",
    wall: "#f1ecf8",
    wallSide: "#dcd5ec",
    wood: "#b27a48",
    woodDark: "#6c452b",
    woodLight: "#d3a06c",
    fabricBlue: "#5a70b0",
    fabricNavy: "#2c3359",
    blanket: "#4a5c98",
    metal: "#7a7f8e",
    metalDark: "#353a4e",
    white: "#f8f6f1",
    accent: "#ffb347",
    accent2: "#a274f5",
    plant: "#66b56f",
    plantDark: "#427e4b",
    carpet: "#33447a",
    carpetEdge: "#5870a8",
    skin: "#e7b48c",
    hair: "#2a1f2d",
    hoodie: "#e6e3f2",
    pants: "#2c3252",
    cork: "#c79a63",
    bean: "#34407a",
    led: "#a874ff",
  },
  ESPORTS: {
    floor: "#c9925c",
    floorEdge: "#a2703f",
    slab: "#33263a",
    wall: "#f8ecdd",
    wallSide: "#e6d3bb",
    wood: "#b27a48",
    woodDark: "#6b4527",
    woodLight: "#d3a06c",
    fabricBlue: "#9a6247",
    fabricNavy: "#4a2c25",
    blanket: "#a3453a",
    metal: "#7d7168",
    metalDark: "#3a302a",
    white: "#f9f4ea",
    accent: "#ff8a4c",
    accent2: "#e0553f",
    plant: "#8bb35f",
    plantDark: "#4f7a3a",
    carpet: "#7a3a2a",
    carpetEdge: "#b0553c",
    skin: "#e7b48c",
    hair: "#2a1c18",
    hoodie: "#f3e0d0",
    pants: "#3a2a2a",
    cork: "#c99a60",
    bean: "#8a3a30",
    led: "#ff8a5c",
  },
}

type Mats = Record<keyof Palette, THREE.MeshStandardMaterial>

function makeMats(identity: Identity): Mats {
  const p = PALETTES[identity]
  const out = {} as Mats
  ;(Object.keys(p) as (keyof Palette)[]).forEach((key) => {
    out[key] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(p[key]),
      roughness: 0.85,
      metalness: 0.02,
      flatShading: key === "plant" || key === "plantDark",
    })
  })
  return out
}

const BOOK_COLORS = ["#c2504a", "#3f7a8c", "#c9a24a", "#5f6fae", "#8a5fa8", "#4f8a5f"]

const ROOM_W = 6
const ROOM_D = 5
const WALL_H = 3.2
const DEG = Math.PI / 180
const SIDE_X = 2.45
const SIDE_Z = 0.55
const WHITE = new THREE.Color("#ffffff")

// Inner faces of the two walls (baseboard included). Furniture is placed flush
// against these so nothing floats off the wall or sinks into it.
const BACK_Z = -ROOM_D / 2 + 0.135 // -2.365
const LEFT_X = -ROOM_W / 2 + 0.135 // -2.865
const WALL_Z = -ROOM_D / 2 + 0.07 // -2.43, the plane things are hung on
const WALL_X = -ROOM_W / 2 + 0.07 // -2.93

/** Pin / glow anchors for objects that were re-seated; everything else keeps data/room.ts. */
const POINT_FIX: Partial<Record<RoomHotspotId, [number, number, number]>> = {
  monitor: [-0.56, 1.05, -2.2],
  shelf: [2.55, 1.0, -2.05],
  bed: [-1.975, 0.55, -1.72],
  fridge: [1.72, 0.8, -2.13],
  plant: [-2.65, 0.8, 2.05],
  posters: [-1.9, 2.05, -2.3],
  whiteboard: [-2.8, 1.95, 1.25],
  accessories: [SIDE_X, 0.8, SIDE_Z],
}
const POINTS = { ...hotspotPoints, ...POINT_FIX } as Record<RoomHotspotId, [number, number, number]>

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const clamp = THREE.MathUtils.clamp
const lerp = THREE.MathUtils.lerp
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* ───────────────────────────── rounded voxels ────────────────────────────── */

// Slightly bevelled boxes catch light on their edges, which is most of what
// separates a soft "toy" voxel look from hard CG blocks. Geometries are cached
// by size, so the room still only pays for each unique box once.
const boxCache = new Map<string, THREE.BufferGeometry>()
function boxGeo(w: number, h: number, d: number) {
  const key = `${w}|${h}|${d}`
  let g = boxCache.get(key)
  if (!g) {
    const r = Math.min(0.022, Math.min(w, h, d) * 0.32)
    g = r < 0.004 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 2, r)
    boxCache.set(key, g)
  }
  return g
}
function BoxG({ args }: { args: [number, number, number] }) {
  return <primitive object={boxGeo(args[0], args[1], args[2])} attach="geometry" dispose={null} />
}

/* ───────────────────────────── time-of-day model ─────────────────────────── */

interface RawKey {
  h: number
  day: number
  lamps: number
  sunI: number
  ambI: number
  hemiI: number
  fillI: number
  sun: string
  amb: string
  hemiSky: string
  hemiGround: string
  fill: string
  skyTop: string
  skyBottom: string
  bloom: string
}

const NIGHT: Omit<RawKey, "h"> = {
  day: 0, lamps: 1, sunI: 0.5, ambI: 0.85, hemiI: 0.6, fillI: 0.55,
  sun: "#9db4ff", amb: "#9aa4ea", hemiSky: "#7585d6", hemiGround: "#2c2440", fill: "#a98bff",
  skyTop: "#0a0e2e", skyBottom: "#2a2f6e", bloom: "#5a4fd0",
}

const RAW_KEYS: RawKey[] = [
  { h: 0, ...NIGHT },
  { h: 4.8, ...NIGHT, skyBottom: "#3a3d86", bloom: "#6a5ad8" },
  {
    h: 6.3, day: 0.4, lamps: 0.8, sunI: 1.0, ambI: 0.9, hemiI: 0.65, fillI: 0.5,
    sun: "#ff9d66", amb: "#ffd4c4", hemiSky: "#ffc7b0", hemiGround: "#6b4a3a", fill: "#c9a8ff",
    skyTop: "#6d78c9", skyBottom: "#ffb48a", bloom: "#ffa57a",
  },
  {
    h: 8.2, day: 0.9, lamps: 0.3, sunI: 1.9, ambI: 1.0, hemiI: 0.8, fillI: 0.6,
    sun: "#ffe2b0", amb: "#fff1e2", hemiSky: "#d2e6ff", hemiGround: "#7d5c40", fill: "#bcd3ff",
    skyTop: "#70b7ff", skyBottom: "#d3ebff", bloom: "#ffd9a8",
  },
  {
    h: 12.5, day: 1, lamps: 0.12, sunI: 2.5, ambI: 1.2, hemiI: 0.9, fillI: 0.65,
    sun: "#fffaf0", amb: "#f4f8ff", hemiSky: "#d8ecff", hemiGround: "#8a6a4a", fill: "#cfe0ff",
    skyTop: "#3f9cff", skyBottom: "#c4e4ff", bloom: "#9fd0ff",
  },
  {
    h: 15.5, day: 0.95, lamps: 0.2, sunI: 2.3, ambI: 1.15, hemiI: 0.85, fillI: 0.6,
    sun: "#fff0cf", amb: "#fff4e6", hemiSky: "#d8e8ff", hemiGround: "#85623f", fill: "#cfdcff",
    skyTop: "#58a7ff", skyBottom: "#d0e7ff", bloom: "#ffe2b0",
  },
  {
    h: 17.6, day: 0.6, lamps: 0.55, sunI: 2.0, ambI: 1.0, hemiI: 0.7, fillI: 0.55,
    sun: "#ffad62", amb: "#ffe0c8", hemiSky: "#ffd8b8", hemiGround: "#6b4430", fill: "#d0a8ff",
    skyTop: "#7f80da", skyBottom: "#ffa56b", bloom: "#ff9b6a",
  },
  {
    h: 18.8, day: 0.2, lamps: 0.9, sunI: 0.8, ambI: 0.85, hemiI: 0.65, fillI: 0.55,
    sun: "#ff7a5a", amb: "#d9b9ea", hemiSky: "#b894d8", hemiGround: "#3d2a40", fill: "#a98bff",
    skyTop: "#2f307c", skyBottom: "#ff7f8a", bloom: "#b06ad8",
  },
  { h: 20, ...NIGHT },
  { h: 24, ...NIGHT },
]

const KEYS = RAW_KEYS.map((k) => ({
  ...k,
  cSun: new THREE.Color(k.sun),
  cAmb: new THREE.Color(k.amb),
  cHemiSky: new THREE.Color(k.hemiSky),
  cHemiGround: new THREE.Color(k.hemiGround),
  cFill: new THREE.Color(k.fill),
  cSkyTop: new THREE.Color(k.skyTop),
  cSkyBottom: new THREE.Color(k.skyBottom),
  cBloom: new THREE.Color(k.bloom),
}))

interface Env {
  day: number
  lamps: number
  stars: number
  sunI: number
  ambI: number
  hemiI: number
  fillI: number
  sunP: number
  sunVis: number
  moonP: number
  moonVis: number
  sunColor: THREE.Color
  ambColor: THREE.Color
  hemiSky: THREE.Color
  hemiGround: THREE.Color
  fillColor: THREE.Color
  skyTop: THREE.Color
  skyBottom: THREE.Color
  lightDir: THREE.Vector3
}

const NUM_KEYS = [
  "day", "lamps", "stars", "sunI", "ambI", "hemiI", "fillI", "sunP", "sunVis", "moonP", "moonVis",
] as const
const COLOR_KEYS = [
  "sunColor", "ambColor", "hemiSky", "hemiGround", "fillColor", "skyTop", "skyBottom",
] as const

const makeEnv = (): Env => ({
  day: 0, lamps: 1, stars: 1, sunI: 0, ambI: 0, hemiI: 0, fillI: 0,
  sunP: 0, sunVis: 0, moonP: 0, moonVis: 0,
  sunColor: new THREE.Color(), ambColor: new THREE.Color(), hemiSky: new THREE.Color(),
  hemiGround: new THREE.Color(), fillColor: new THREE.Color(), skyTop: new THREE.Color(),
  skyBottom: new THREE.Color(),
  lightDir: new THREE.Vector3(0.3, 1, 0.8),
})

function segment(hour: number) {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < KEYS.length - 2 && h >= KEYS[i + 1].h) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  return { h, a, b, t: (h - a.h) / (b.h - a.h) }
}

function sampleEnv(hour: number): Env {
  const { h, a, b, t } = segment(hour)
  const e = makeEnv()
  e.day = lerp(a.day, b.day, t)
  e.lamps = lerp(a.lamps, b.lamps, t)
  e.sunI = lerp(a.sunI, b.sunI, t)
  e.ambI = lerp(a.ambI, b.ambI, t)
  e.hemiI = lerp(a.hemiI, b.hemiI, t)
  e.fillI = lerp(a.fillI, b.fillI, t)
  e.sunColor.copy(a.cSun).lerp(b.cSun, t)
  e.ambColor.copy(a.cAmb).lerp(b.cAmb, t)
  e.hemiSky.copy(a.cHemiSky).lerp(b.cHemiSky, t)
  e.hemiGround.copy(a.cHemiGround).lerp(b.cHemiGround, t)
  e.fillColor.copy(a.cFill).lerp(b.cFill, t)
  e.skyTop.copy(a.cSkyTop).lerp(b.cSkyTop, t)
  e.skyBottom.copy(a.cSkyBottom).lerp(b.cSkyBottom, t)

  // Celestial bodies: the sun is up 06:00–18:00, the moon takes the other half.
  const sunP = (h - 6) / 12
  const moonP = (((h - 18) % 24) + 24) % 24 / 12
  const sunUp = sunP >= 0 && sunP <= 1
  const moonUp = moonP >= 0 && moonP <= 1
  e.sunP = clamp01(sunP)
  e.sunVis = sunUp ? smooth(0, 0.07, sunP) * smooth(1, 0.93, sunP) : 0
  e.moonP = clamp01(moonP)
  e.moonVis = moonUp ? smooth(0, 0.07, moonP) * smooth(1, 0.93, moonP) : 0
  e.stars = clamp01(1 - e.day * 1.8)

  // Key light: stylised so the faces the camera sees stay readable all day.
  const p = sunUp ? sunP : clamp01(moonP)
  const elev = (sunUp ? 24 + Math.sin(Math.PI * p) * 46 : 36 + Math.sin(Math.PI * p) * 18) * DEG
  const c = Math.cos(elev)
  e.lightDir.set(c * lerp(-0.25, 0.85, p), Math.sin(elev), c * 0.85).normalize()
  return e
}

function bloomAt(hour: number): string {
  const { a, b, t } = segment(hour)
  return `#${new THREE.Color().copy(a.cBloom).lerp(b.cBloom, t).getHexString()}`
}

function stepEnv(cur: Env, tgt: Env, dt: number) {
  const k = 1 - Math.exp(-2.4 * dt)
  for (const key of NUM_KEYS) cur[key] += (tgt[key] - cur[key]) * k
  for (const key of COLOR_KEYS) cur[key].lerp(tgt[key], k)
  cur.lightDir.lerp(tgt.lightDir, k).normalize()
}

type EnvRef = { current: Env }
const EnvCtx = createContext<EnvRef | null>(null)
function useEnv(): EnvRef {
  const ctx = useContext(EnvCtx)
  if (!ctx) throw new Error("useEnv must be used inside <RoomWorld>")
  return ctx
}

interface ClockState {
  live: boolean
  hour: number
}
const ClockCtx = createContext<{ current: ClockState }>({ current: { live: true, hour: 12 } })

/* ───────────────────────────── canvas textures ───────────────────────────── */

function canvas2d(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")!
  ctx.imageSmoothingEnabled = false
  return { c, ctx }
}

function pixelTexture(c: HTMLCanvasElement, repeat = false) {
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestFilter
  t.generateMipmaps = false
  t.colorSpace = THREE.SRGBColorSpace
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function useTex<T extends THREE.Texture>(factory: () => T, deps: readonly unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tex = useMemo(factory, deps)
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

const hexOf = (c: THREE.Color) => `#${c.getHexString()}`
const mixHex = (a: THREE.Color, b: THREE.Color, t: number) =>
  `#${new THREE.Color().copy(a).lerp(b, t).getHexString()}`

function makeBlanketTexture(a: THREE.Color, b: THREE.Color) {
  const W = 14
  const H = 10
  const { c, ctx } = canvas2d(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const checker = (x + y) % 2 ? 0.0 : 0.45
      const t = clamp01(checker + rnd(x * 13 + y * 7.3) * 0.5)
      ctx.fillStyle = mixHex(a, b, t)
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return pixelTexture(c)
}

function makeCarpetTexture(base: THREE.Color, edge: THREE.Color) {
  const W = 28
  const H = 20
  const dark = new THREE.Color().copy(base).multiplyScalar(0.72)
  const { c, ctx } = canvas2d(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.min(x, y, W - 1 - x, H - 1 - y)
      const diamond = Math.abs(x + 0.5 - W / 2) / (W / 2) + Math.abs(y + 0.5 - H / 2) / (H / 2)
      let col: string
      if (d === 0) col = hexOf(edge)
      else if (d === 1) col = hexOf(base)
      else if (Math.abs(diamond - 0.62) < 0.07) col = mixHex(base, edge, 0.75)
      else col = mixHex(base, dark, rnd(x * 9.1 + y * 17.7))
      ctx.fillStyle = col
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return pixelTexture(c)
}

function makeCodeTexture(kind: "laptop" | "monitor") {
  const { c, ctx } = canvas2d(128, 96)
  ctx.fillStyle = kind === "laptop" ? "#0b1424" : "#0a1020"
  ctx.fillRect(0, 0, 128, 96)
  const colors = ["#6fa8ff", "#ffb86b", "#8fe3a0", "#d6a8ff", "#cfd8ea", "#ff8fa3"]
  if (kind === "laptop") {
    let y = 3
    for (let i = 0; y < 92; i++) {
      let x = 8 + Math.floor(rnd(i * 3.1) * 4) * 6
      const segs = 1 + Math.floor(rnd(i * 7.7) * 3)
      for (let s = 0; s < segs; s++) {
        const w = 8 + Math.floor(rnd(i * 5.3 + s * 2.1) * 30)
        ctx.fillStyle = colors[Math.floor(rnd(i * 2.9 + s * 8.8) * colors.length)]
        ctx.fillRect(x, y, w, 3)
        x += w + 4
      }
      ctx.fillStyle = "#3b4a6b"
      ctx.fillRect(2, y, 3, 3)
      y += 6
    }
  } else {
    ctx.fillStyle = "#1a2442"
    ctx.fillRect(0, 0, 128, 10)
    ctx.fillStyle = "#6f8dff"
    ctx.fillRect(4, 3, 20, 4)
    for (let i = 0; i < 10; i++) {
      const h = 10 + Math.floor(rnd(i * 4.4) * 46)
      ctx.fillStyle = i % 3 === 0 ? "#ffb347" : "#6f8dff"
      ctx.fillRect(8 + i * 11, 84 - h, 8, h)
    }
    ctx.strokeStyle = "#8fe3a0"
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= 10; i++) {
      const y = 40 - Math.floor(rnd(i * 6.1) * 22)
      if (i === 0) ctx.moveTo(8, y)
      else ctx.lineTo(8 + i * 11, y)
    }
    ctx.stroke()
  }
  return pixelTexture(c, true)
}

function makeDreamPoster() {
  const { c, ctx } = canvas2d(48, 68)
  ctx.fillStyle = "#161b30"
  ctx.fillRect(0, 0, 48, 68)
  const star = (x: number, y: number, s: number) => {
    ctx.fillStyle = "#f3e6b3"
    ctx.fillRect(x - s, y, s * 2 + 1, 1)
    ctx.fillRect(x, y - s, 1, s * 2 + 1)
  }
  star(38, 9, 3)
  star(8, 58, 4)
  star(40, 50, 1)
  star(10, 12, 1)
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillStyle = "#f0e8d8"
  ctx.font = "bold 11px monospace"
  ctx.fillText("DREAM", 24, 26)
  ctx.font = "bold 20px monospace"
  ctx.fillStyle = "#c9b8ff"
  ctx.fillText("BIG", 24, 42)
  return pixelTexture(c)
}

function makePlanetPoster() {
  const S = 32
  const { c, ctx } = canvas2d(S, S)
  ctx.fillStyle = "#1c2440"
  ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = "#cfd8ff"
    ctx.fillRect(Math.floor(rnd(i * 3.3) * S), Math.floor(rnd(i * 5.9) * S), 1, 1)
  }
  const cs = Math.cos(-0.4)
  const sn = Math.sin(-0.4)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x - S / 2 + 0.5
      const dy = y - S / 2 + 0.5
      const rx = dx * cs - dy * sn
      const ry = dx * sn + dy * cs
      const ring = (rx / 14) ** 2 + (ry / 4.2) ** 2
      const inRing = ring > 0.72 && ring < 1.12
      const inPlanet = dx * dx + dy * dy < 49
      if (inPlanet) {
        ctx.fillStyle = dx + dy > 3 ? "#c2551f" : (y % 5 === 0 ? "#f19a55" : "#e2823f")
        ctx.fillRect(x, y, 1, 1)
      }
      if (inRing && (!inPlanet || ry > 0)) {
        ctx.fillStyle = "#ffd08a"
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  return pixelTexture(c)
}

/** Soft white-to-black fade (bright at the top, soft at the sides) for beams and glows. */
function makeFadeTexture() {
  const W = 32
  const H = 64
  const { c, ctx } = canvas2d(W, H)
  const img = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = 1 - y / (H - 1)
      const u = Math.sin(Math.PI * (x / (W - 1))) ** 0.6
      const val = Math.round(255 * Math.pow(v, 1.3) * u)
      const i = (y * W + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  return t
}

/** Window-slat pattern for the sunlight patch on the floor. */
function makeSlatTexture() {
  const { c, ctx } = canvas2d(64, 4)
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, 64, 4)
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, 44, 4)
  for (let x = 44; x < 64; x += 4) ctx.fillRect(x, 0, 2, 4)
  const t = pixelTexture(c)
  t.colorSpace = THREE.NoColorSpace
  return t
}

/* ───────────────────────────── hot-spot wrapper ──────────────────────────── */

interface HotspotProps {
  id: RoomHotspotId
  hovered: RoomHotspotId | null
  selected: RoomHotspotId | null
  onHover: (id: RoomHotspotId | null) => void
  onSelect: (id: RoomHotspotId) => void
  children: ReactNode
  lift?: number
}

/** World-space hit box per interactive object: [cx, cy, cz, sx, sy, sz]. */
const HIT: Partial<Record<RoomHotspotId, [number, number, number, number, number, number]>> = {
  laptop: [0.2, 0.75, -1.5, 1.0, 1.5, 1.2],
  lamp: [0.95, 1.0, -1.9, 0.45, 0.7, 0.5],
  monitor: [-0.56, 1.05, -2.2, 0.85, 0.6, 0.3],
  shelf: [2.55, 1.0, -2.05, 0.85, 2.1, 0.7],
  bed: [-1.975, 0.4, -1.6, 1.85, 0.85, 1.6],
  fridge: [1.72, 0.65, -2.13, 0.6, 1.3, 0.5],
  food: [1.35, 0.35, 1.2, 1.1, 0.7, 1.8],
  plant: [-2.65, 0.55, 2.05, 0.6, 1.1, 0.6],
  backpack: [-1.0, 0.27, 0.55, 0.4, 0.55, 0.35],
  accessories: [SIDE_X, 0.6, SIDE_Z, 0.7, 1.0, 0.7],
}
const noopRaycast = () => {}

function Hotspot({
  id, hovered, selected, onHover, onSelect, children, lift = 0.05,
}: HotspotProps) {
  const group = useRef<THREE.Group>(null)
  const content = useRef<THREE.Group>(null)
  const amount = useRef(0)
  const isActive = hovered === id || selected === id
  const hit = HIT[id]
  const brain = useContext(BrainCtx)

  // Raycasting every rounded box on every pointer move is what made hover feel
  // laggy. The visuals are excluded and one invisible box per object takes the
  // pointer instead.
  useLayoutEffect(() => {
    content.current?.traverse((o) => {
      o.raycast = noopRaycast
    })
  }, [])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    amount.current = THREE.MathUtils.damp(amount.current, isActive ? 1 : 0, 9, dt)
    const a = amount.current
    const e = a * a * (3 - 2 * a)
    const t = state.clock.elapsedTime
    const s = 1 + e * 0.03
    // Scale about the object's own centre, not the world origin.
    const cx = hit ? hit[0] : 0
    const cy = hit ? hit[1] : 0
    const cz = hit ? hit[2] : 0
    g.scale.setScalar(s)
    const rise = e * lift + Math.sin(t * 2.4) * 0.006 * e
    g.position.set((1 - s) * cx, (1 - s) * cy + rise, (1 - s) * cz)
    if (brain) brain.current.lift[id] = rise
  })

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(id)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onHover(null)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
    >
      <group ref={content}>{children}</group>
      {hit && (
        <mesh position={[hit[0], hit[1], hit[2]]}>
          <boxGeometry args={[hit[3], hit[4], hit[5]]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/** One shared light that slides to whichever object is hovered or opened. */
function HoverGlow({ active }: { active: RoomHotspotId | null }) {
  const light = useRef<THREE.PointLight>(null)
  const target = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    const l = light.current
    if (!l) return
    if (active) {
      const p = POINTS[active]
      target.set(p[0], p[1] + 0.45, p[2] + 0.35)
      if (l.intensity < 0.05) l.position.copy(target)
      else l.position.lerp(target, 1 - Math.exp(-10 * dt))
    }
    l.intensity = THREE.MathUtils.damp(l.intensity, active ? 2.1 : 0, 10, dt)
  })
  return <pointLight ref={light} distance={2.4} intensity={0} color="#ffd9a0" />
}

/* ─────────────────────────────── lighting rig ────────────────────────────── */

function EnvDriver({ target }: { target: { current: Env } }) {
  const env = useEnv()
  useFrame((_, dt) => stepEnv(env.current, target.current, Math.min(dt, 0.1)))
  return null
}

function Lighting() {
  const env = useEnv()
  const amb = useRef<THREE.AmbientLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)

  useFrame(() => {
    const e = env.current
    if (amb.current) {
      amb.current.color.copy(e.ambColor)
      amb.current.intensity = e.ambI
    }
    if (sun.current) {
      sun.current.position.copy(e.lightDir).multiplyScalar(10)
      sun.current.color.copy(e.sunColor)
      sun.current.intensity = e.sunI
    }
    if (fill.current) {
      fill.current.color.copy(e.fillColor)
      fill.current.intensity = e.fillI
    }
    if (hemi.current) {
      hemi.current.color.copy(e.hemiSky)
      hemi.current.groundColor.copy(e.hemiGround)
      hemi.current.intensity = e.hemiI
    }
  })

  return (
    <>
      <ambientLight ref={amb} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight ref={fill} position={[-5, 5, 2]} />
      <hemisphereLight ref={hemi} />
    </>
  )
}

/* ─────────────────────────────── room parts ──────────────────────────────── */

const FLOOR_COLS = 10
const FLOOR_ROWS = 5

function Room({ m }: { m: Mats }) {
  const env = useEnv()
  const tiles = useRef<THREE.InstancedMesh>(null)
  const strip = useRef<THREE.MeshStandardMaterial>(null)

  useLayoutEffect(() => {
    const mesh = tiles.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const w = ROOM_W / FLOOR_COLS
    const d = ROOM_D / FLOOR_ROWS
    let n = 0
    for (let r = 0; r < FLOOR_ROWS; r++) {
      for (let c = 0; c < FLOOR_COLS; c++) {
        dummy.position.set(-ROOM_W / 2 + w * (c + 0.5), 0, -ROOM_D / 2 + d * (r + 0.5))
        dummy.scale.set(w - 0.025, 0.08, d - 0.025)
        dummy.updateMatrix()
        mesh.setMatrixAt(n, dummy.matrix)
        col.copy(m.floor.color).lerp(m.floorEdge.color, 0.35 * ((c + r) % 2) + rnd(n * 3.7) * 0.45)
        mesh.setColorAt(n, col)
        n++
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [m])

  useFrame(() => {
    if (strip.current) strip.current.emissiveIntensity = 0.5 + env.current.lamps * 1.4
  })

  return (
    <group>
      {/* Plank floor — instanced tiles with tone jitter and visible seams. */}
      <instancedMesh
        ref={tiles}
        args={[undefined, undefined, FLOOR_COLS * FLOOR_ROWS]}
        receiveShadow
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0.02} />
      </instancedMesh>

      {/* Slab + feet under the floating room */}
      <mesh position={[0, -0.22, 0]} material={m.slab}>
        <BoxG args={[ROOM_W + 0.5, 0.38, ROOM_D + 0.5]} />
      </mesh>
      <mesh position={[-2.2, -0.5, 1.6]} material={m.slab}>
        <BoxG args={[0.5, 0.24, 0.5]} />
      </mesh>
      <mesh position={[2.2, -0.5, 1.6]} material={m.slab}>
        <BoxG args={[0.5, 0.24, 0.5]} />
      </mesh>
      {/* Teal light line around the platform edge, like the reference. */}
      <mesh position={[0, -0.17, ROOM_D / 2 + 0.26]}>
        <BoxG args={[ROOM_W + 0.5, 0.025, 0.02]} />
        <meshStandardMaterial ref={strip} color="#2fe6c8" emissive="#2fe6c8" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <mesh position={[ROOM_W / 2 + 0.26, -0.17, 0]}>
        <BoxG args={[0.02, 0.025, ROOM_D + 0.5]} />
        <meshStandardMaterial color="#2fe6c8" emissive="#2fe6c8" emissiveIntensity={1} toneMapped={false} />
      </mesh>

      {/* Two walls only — the camera side stays cut away. */}
      <mesh position={[0, WALL_H / 2, -ROOM_D / 2]} material={m.wall} receiveShadow>
        <BoxG args={[ROOM_W, WALL_H, 0.14]} />
      </mesh>
      <mesh position={[-ROOM_W / 2, WALL_H / 2, 0]} material={m.wallSide} receiveShadow>
        <BoxG args={[0.14, WALL_H, ROOM_D]} />
      </mesh>
      {/* Wall tops, so the cut-away edges read as solid. */}
      <mesh position={[0, WALL_H + 0.02, -ROOM_D / 2]} material={m.wallSide}>
        <BoxG args={[ROOM_W + 0.14, 0.05, 0.18]} />
      </mesh>
      <mesh position={[-ROOM_W / 2, WALL_H + 0.02, 0]} material={m.wallSide}>
        <BoxG args={[0.18, 0.05, ROOM_D]} />
      </mesh>
      <mesh position={[0, 0.06, -ROOM_D / 2 + 0.1]} material={m.woodDark}>
        <BoxG args={[ROOM_W, 0.12, 0.06]} />
      </mesh>
      <mesh position={[-ROOM_W / 2 + 0.1, 0.06, 0]} material={m.woodDark}>
        <BoxG args={[0.06, 0.12, ROOM_D]} />
      </mesh>
    </group>
  )
}

function WallGlow({
  position, size, color, rotationY = 0, strength = 1,
}: {
  position: [number, number, number]
  size: [number, number]
  color: string
  rotationY?: number
  strength?: number
}) {
  const env = useEnv()
  const fade = useTex(() => makeFadeTexture(), [])
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (mat.current) mat.current.opacity = (0.28 + env.current.lamps * 0.4) * strength
  })
  return (
    <mesh position={position} rotation-y={rotationY}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        ref={mat}
        color={color}
        alphaMap={fade}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

function BobaCup() {
  return (
    <group position={[0.66, 0.78, 0.1]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.04, 0.16, 10]} />
        <meshStandardMaterial color="#9a6a46" roughness={0.5} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.165, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.015, 10]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.6} />
      </mesh>
      <mesh position={[0.012, 0.24, 0]} rotation-z={-0.12}>
        <BoxG args={[0.012, 0.16, 0.012]} />
        <meshStandardMaterial color="#e0555f" roughness={0.6} />
      </mesh>
      {[-0.015, 0.012, 0.0].map((x, i) => (
        <mesh key={i} position={[x, 0.02 + (i % 2) * 0.02, i * 0.012 - 0.01]}>
          <BoxG args={[0.022, 0.022, 0.022]} />
          <meshStandardMaterial color="#2a1c18" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Desk({ m }: { m: Mats }) {
  return (
    <group position={[0.2, 0, -1.95]}>
      <mesh position={[0, 0.74, 0]} material={m.wood} castShadow receiveShadow>
        <BoxG args={[2.2, 0.08, 0.8]} />
      </mesh>
      <mesh position={[-0.98, 0.37, 0]} material={m.woodDark}>
        <BoxG args={[0.1, 0.74, 0.7]} />
      </mesh>
      <mesh position={[0.98, 0.37, 0]} material={m.woodDark}>
        <BoxG args={[0.1, 0.74, 0.7]} />
      </mesh>
      <mesh position={[0.72, 0.35, 0.02]} material={m.woodLight} castShadow>
        <BoxG args={[0.42, 0.7, 0.66]} />
      </mesh>
      {[0.18, 0.5].map((y) => (
        <mesh key={y} position={[0.72, y, 0.36]} material={m.metalDark}>
          <BoxG args={[0.18, 0.03, 0.03]} />
        </mesh>
      ))}
      {/* Desk mat, turned a touch to match the laptop */}
      <mesh position={[0, 0.783, 0.05]} rotation-y={0.2} material={m.metalDark}>
        <BoxG args={[1.0, 0.008, 0.5]} />
      </mesh>
      <BobaCup />
    </group>
  )
}

function Laptop({ m }: { m: Mats }) {
  const env = useEnv()
  const code = useTex(() => makeCodeTexture("laptop"), [])
  const screenMat = useRef<THREE.MeshStandardMaterial>(null)
  const spill = useRef<THREE.PointLight>(null)
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const night = 1 - env.current.day * 0.55
    code.offset.y = (code.offset.y + dt * 0.035) % 1
    if (screenMat.current) {
      const tick = t % 3.2 < 0.14 ? 0.35 : 0
      screenMat.current.emissiveIntensity = (0.85 + Math.sin(t * 2.2) * 0.1 + tick) * (0.7 + night * 0.45)
    }
    if (spill.current) spill.current.intensity = 0.2 + night * 0.45
  })
  return (
    // Local frame: the screen faces +z (towards the person), keys at z ≈ +0.04.
    <group position={[0, 0.78, 0]}>
      <mesh position={[0, 0.02, 0]} material={m.metalDark} castShadow>
        <BoxG args={[0.62, 0.03, 0.42]} />
      </mesh>
      <mesh position={[0, 0.038, 0.04]} material={m.metal}>
        <BoxG args={[0.5, 0.008, 0.2]} />
      </mesh>
      {[0, 1, 2, 3].map((r) => (
        <mesh key={r} position={[0, 0.044, -0.04 + r * 0.045]} material={m.metalDark}>
          <BoxG args={[0.46, 0.006, 0.026]} />
        </mesh>
      ))}
      <mesh position={[0, 0.038, 0.17]} material={m.metal}>
        <BoxG args={[0.16, 0.008, 0.08]} />
      </mesh>
      {/* Lid, tilted back like a real laptop. */}
      <group position={[0, 0.035, -0.2]} rotation-x={-0.3}>
        <mesh position={[0, 0.215, 0]} material={m.metalDark} castShadow>
          <BoxG args={[0.64, 0.44, 0.022]} />
        </mesh>
        <mesh position={[0, 0.215, 0.0125]}>
          <planeGeometry args={[0.57, 0.37]} />
          <meshStandardMaterial
            ref={screenMat}
            map={code}
            emissiveMap={code}
            color="#1b2540"
            emissive="#ffffff"
            emissiveIntensity={1}
            roughness={0.35}
          />
        </mesh>
      </group>
      <pointLight ref={spill} position={[0, 0.3, 0.25]} distance={0.9} intensity={0.55} color="#6fa8ff" />
    </group>
  )
}

/* ── the person ──────────────────────────────────────────────────────────── */

const ReducedCtx = createContext(false)

const ARM1 = 0.29 // upper arm
const ARM2 = 0.27 // forearm
const LEG1 = 0.38 // thigh
const LEG2 = 0.38 // shin
const CYCLE = 13 // seconds between "looks over at you"
const HIP_STAND = 0.86 // pelvis height when standing
const FOOT_Y = 0.105 // ankle height with the sole on the floor

const _up = new THREE.Vector3(0, 1, 0)
const _dir = new THREE.Vector3()
const _perp = new THREE.Vector3()
const _mid = new THREE.Vector3()

/** Two-bone IK: the joint (elbow / knee) lands where the pole vector pushes it. */
function solveLimb(
  S: THREE.Vector3, T: THREE.Vector3, pole: THREE.Vector3,
  l1: number, l2: number, joint: THREE.Vector3, end: THREE.Vector3
) {
  _dir.subVectors(T, S)
  const dist = clamp(_dir.length(), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.002)
  _dir.normalize()
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist)
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0))
  _perp.copy(pole).addScaledVector(_dir, -pole.dot(_dir))
  if (_perp.lengthSq() < 1e-6) _perp.set(0, -1, 0)
  _perp.normalize()
  joint.copy(S).addScaledVector(_dir, a).addScaledVector(_perp, h)
  end.copy(S).addScaledVector(_dir, dist)
}

function placeLimb(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3) {
  _mid.addVectors(from, to).multiplyScalar(0.5)
  mesh.position.copy(_mid)
  _dir.subVectors(to, from).normalize()
  mesh.quaternion.setFromUnitVectors(_up, _dir)
}

function useLimb() {
  return {
    upper: useRef<THREE.Mesh>(null),
    lower: useRef<THREE.Mesh>(null),
    joint: useRef<THREE.Mesh>(null),
    end: useRef<THREE.Mesh>(null),
  }
}

const wrapAngle = (a: number) => {
  const t = (a + Math.PI) % (Math.PI * 2)
  return (t < 0 ? t + Math.PI * 2 : t) - Math.PI
}
const dampAngle = (cur: number, target: number, lambda: number, dt: number) =>
  cur + wrapAngle(target - cur) * (1 - Math.exp(-lambda * dt))
const ease = (v: number) => {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}

/* ── where things are (world space) ──────────────────────────────────────── */

const CHAIR_YAW = 0.2 // same turn as the laptop, so he faces the screen
const CHAIR_IN: readonly [number, number] = [0.315, -1.332] // tucked under the desk
const CHAIR_OUT: readonly [number, number] = [0.424, -0.793] // pulled out for getting up / sitting down
const SEAT_FWD = 0.08 // pelvis sits a little ahead of the seat centre
const FWD_X = -Math.sin(CHAIR_YAW)
const FWD_Z = -Math.cos(CHAIR_YAW)
const DESK_FRONT: readonly [number, number] = [CHAIR_OUT[0] + FWD_X * (SEAT_FWD + 0.45), CHAIR_OUT[1] + FWD_Z * (SEAT_FWD + 0.45)]

const BED_LIE = { x: -1.885, z: -1.725, y: 0.66 - HIP_STAND, yaw: -Math.PI / 2 }
const BED_SIDE: readonly [number, number] = [-1.9, -0.78]
const BEAN_SEAT: readonly [number, number] = [1.35, 1.7]
const BEAN_BACK: readonly [number, number] = [1.35, 2.3]
const FLOOR_SPOT: readonly [number, number] = [0.1, 0.35]

const seatRoot = (c: number): [number, number] => [
  lerp(CHAIR_IN[0], CHAIR_OUT[0], c) + FWD_X * SEAT_FWD,
  lerp(CHAIR_IN[1], CHAIR_OUT[1], c) + FWD_Z * SEAT_FWD,
]

const W3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const SPOTS = {
  fridgeHandle: W3(1.89, 0.72, -1.84),
  fridgeInside: W3(1.72, 0.66, -2.0),
  lampSwitch: W3(1.02, 0.98, -1.86),
  bowl: W3(1.35, 0.46, 1.14),
  bowlLeft: W3(1.18, 0.47, 1.19),
  sillR: W3(-2.74, 1.07, -0.55),
  sillL: W3(-2.74, 1.07, -0.08),
  board: W3(-2.86, 1.62, 1.25),
  plantTop: W3(-2.5, 1.08, 1.95),
  bag: W3(-1.0, 0.5, 0.55),
  book: W3(2.5, 1.2, -1.82),
  monitor: W3(-0.56, 1.05, -2.2),
}

/* ── navigation: a tiny grid A* so he walks around the furniture ─────────── */

type Box = [number, number, number, number] // x0, x1, z0, z1

const NAV_CELL = 0.1
const NAV_COLS = Math.round(ROOM_W / NAV_CELL)
const NAV_ROWS = Math.round(ROOM_D / NAV_CELL)
const NAV_X0 = -ROOM_W / 2
const NAV_Z0 = -ROOM_D / 2
const WALK_R = 0.15

const BLOCKERS: Box[] = [
  [-2.87, -1.08, -2.37, -1.08], // bed
  [-2.87, -2.36, -1.04, -0.56], // nightstand
  [-0.95, 1.3, -2.37, -1.56], // desk
  [0.12, 0.72, -1.09, -0.49], // the chair, pulled out
  [1.44, 2.0, -2.37, -1.9], // fridge
  [2.15, 2.95, -2.37, -1.74], // bookshelf
  [0.87, 1.83, 0.62, 1.28], // low table
  [0.99, 1.71, 1.34, 2.06], // bean bag
  [-2.95, -2.42, 1.72, 2.3], // big plant
  [-1.2, -0.8, 0.4, 0.7], // backpack
  [-1.02, -0.74, -1.34, -1.06], // bin
  [2.16, 2.74, 0.26, 0.84], // side table
]

const navGrid = (() => {
  const g = new Uint8Array(NAV_COLS * NAV_ROWS)
  for (let r = 0; r < NAV_ROWS; r++) {
    for (let c = 0; c < NAV_COLS; c++) {
      const x = NAV_X0 + (c + 0.5) * NAV_CELL
      const z = NAV_Z0 + (r + 0.5) * NAV_CELL
      let blocked = x < -ROOM_W / 2 + 0.2 || x > ROOM_W / 2 - 0.12 || z < -ROOM_D / 2 + 0.2 || z > ROOM_D / 2 - 0.1
      if (!blocked) {
        for (const b of BLOCKERS) {
          if (x > b[0] - WALK_R && x < b[1] + WALK_R && z > b[2] - WALK_R && z < b[3] + WALK_R) {
            blocked = true
            break
          }
        }
      }
      g[r * NAV_COLS + c] = blocked ? 1 : 0
    }
  }
  return g
})()

const cellX = (x: number) => Math.floor((x - NAV_X0) / NAV_CELL)
const cellZ = (z: number) => Math.floor((z - NAV_Z0) / NAV_CELL)
const cellFree = (c: number, r: number) =>
  c >= 0 && r >= 0 && c < NAV_COLS && r < NAV_ROWS && navGrid[r * NAV_COLS + c] === 0
const isFree = (x: number, z: number) => cellFree(cellX(x), cellZ(z))

function nearestFree(x: number, z: number): [number, number] {
  const c0 = cellX(x)
  const r0 = cellZ(z)
  if (cellFree(c0, r0)) return [c0, r0]
  let best: [number, number] = [c0, r0]
  let bestD = Infinity
  for (let rad = 1; rad < 24; rad++) {
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue
        if (!cellFree(c0 + dc, r0 + dr)) continue
        const d = dr * dr + dc * dc
        if (d < bestD) {
          bestD = d
          best = [c0 + dc, r0 + dr]
        }
      }
    }
    if (bestD < Infinity) break
  }
  return best
}

const centreOf = (c: number, r: number): [number, number] => [NAV_X0 + (c + 0.5) * NAV_CELL, NAV_Z0 + (r + 0.5) * NAV_CELL]

function lineClear(ax: number, az: number, bx: number, bz: number) {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.04))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    if (!isFree(lerp(ax, bx, t), lerp(az, bz, t))) return false
  }
  return true
}

/** Path from (sx, sz) to (gx, gz) as waypoints, ending exactly on the goal. */
function findPath(sx: number, sz: number, gx: number, gz: number): [number, number][] {
  const [sc, sr] = nearestFree(sx, sz)
  const [gc, gr] = nearestFree(gx, gz)
  const key = (c: number, r: number) => r * NAV_COLS + c
  const gScore = new Map<number, number>([[key(sc, sr), 0]])
  const came = new Map<number, number>()
  // binary min-heap on f-score, so a click never causes a hitch
  const open: [number, number, number][] = [[0, sc, sr]]
  const push = (n: [number, number, number]) => {
    open.push(n)
    let i = open.length - 1
    while (i > 0) {
      const par = (i - 1) >> 1
      if (open[par][0] <= open[i][0]) break
      ;[open[par], open[i]] = [open[i], open[par]]
      i = par
    }
  }
  const pop = () => {
    const top = open[0]
    const last = open.pop() as [number, number, number]
    if (open.length) {
      open[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < open.length && open[l][0] < open[m][0]) m = l
        if (r < open.length && open[r][0] < open[m][0]) m = r
        if (m === i) break
        ;[open[m], open[i]] = [open[i], open[m]]
        i = m
      }
    }
    return top
  }
  const closed = new Set<number>()
  const h = (c: number, r: number) => {
    const dx = Math.abs(c - gc)
    const dz = Math.abs(r - gr)
    return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz)
  }
  let found = false
  while (open.length) {
    const [, c, r] = pop()
    const k = key(c, r)
    if (closed.has(k)) continue
    closed.add(k)
    if (c === gc && r === gr) {
      found = true
      break
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dc && !dr) continue
        const nc = c + dc
        const nr = r + dr
        if (!cellFree(nc, nr)) continue
        if (dc && dr && (!cellFree(c + dc, r) || !cellFree(c, r + dr))) continue
        const nk = key(nc, nr)
        if (closed.has(nk)) continue
        const cost = (gScore.get(k) ?? 0) + (dc && dr ? Math.SQRT2 : 1)
        if (cost < (gScore.get(nk) ?? Infinity)) {
          gScore.set(nk, cost)
          came.set(nk, k)
          push([cost + h(nc, nr), nc, nr])
        }
      }
    }
  }
  const pts: [number, number][] = [[sx, sz]]
  if (found) {
    const chain: [number, number][] = []
    let k = key(gc, gr)
    while (k !== key(sc, sr)) {
      chain.push(centreOf(k % NAV_COLS, Math.floor(k / NAV_COLS)))
      const p = came.get(k)
      if (p === undefined) break
      k = p
    }
    chain.reverse()
    pts.push(...chain)
  }
  pts.push([gx, gz])
  // String-pull: keep only the corners that are actually needed.
  const out: [number, number][] = []
  let i = 0
  while (i < pts.length - 1) {
    let j = pts.length - 1
    while (j > i + 1 && !lineClear(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j--
    out.push(pts[j])
    i = j
  }
  return out
}

/* ── the brain: what he is doing, and the script to get there ────────────── */

type Mode = "stand" | "sitChair" | "sitBean" | "sitFloor" | "squat" | "lie"
type Gesture =
  | "none" | "type" | "typeMon" | "lamp" | "read" | "eat" | "fridge" | "sleep" | "look" | "think"
  | "water" | "dance" | "write" | "rummage" | "chill" | "window"
type Place = "desk" | "bed" | "bean" | "floor" | "stand"

type Step =
  | { k: "walk"; x: number; z: number; yaw?: number }
  | { k: "glide"; x: number; z: number; yaw: number; y?: number; mode?: Mode; dur: number }
  | { k: "scoot"; to: 0 | 1; dur: number }
  | { k: "mode"; mode: Mode; dur: number }
  | { k: "gest"; g: Gesture; dur: number; intr?: boolean }
  | { k: "do"; fn: (b: Brain) => void; dur?: number }

interface Brain {
  x: number
  z: number
  y: number
  yaw: number
  speed: number
  amp: number
  phase: number
  mode: Mode
  gesture: Gesture
  gt: number
  flag: boolean
  at: Place
  attach: boolean
  chair: number
  swivel: number
  lamp: number
  lampTarget: number
  fridge: number
  fridgeTarget: number
  turn: number
  script: Step[]
  si: number
  st: number
  started: boolean
  path: [number, number][]
  pi: number
  g0: { x: number; z: number; y: number; yaw: number; c: number }
  pending: RoomHotspotId | null
  cmdN: number
  label: RoomHotspotId
  lift: Partial<Record<RoomHotspotId, number>>
  head: THREE.Vector3
  tm: THREE.Matrix4
}

interface Command {
  id: RoomHotspotId | null
  n: number
}

function createBrain(): Brain {
  const [sx, sz] = seatRoot(0)
  return {
    x: sx, z: sz, y: 0, yaw: CHAIR_YAW, speed: 0, amp: 0, phase: 0,
    mode: "sitChair", gesture: "type", gt: 0, flag: false, at: "desk", attach: true,
    chair: 0, swivel: 0, lamp: 1, lampTarget: 1, fridge: 0, fridgeTarget: 0, turn: 0,
    script: [], si: 0, st: 0, started: false, path: [], pi: 0,
    g0: { x: sx, z: sz, y: 0, yaw: CHAIR_YAW, c: 0 },
    pending: null, cmdN: 0, label: "laptop", lift: {},
    head: new THREE.Vector3(), tm: new THREE.Matrix4(),
  }
}

type BrainRef = { current: Brain }
const BrainCtx = createContext<BrainRef | null>(null)
function useBrain(): BrainRef {
  const b = useContext(BrainCtx)
  if (!b) throw new Error("BrainCtx missing")
  return b
}

const placeOf = (id: RoomHotspotId): Place =>
  id === "laptop" || id === "monitor" ? "desk" : id === "bed" ? "bed" : id === "food" ? "bean" : id === "carpet" ? "floor" : "stand"

/** Getting out of whatever he is sitting / lying on, ending upright and free to walk. */
function exitSteps(at: Place): Step[] {
  switch (at) {
    case "desk":
      return [
        { k: "gest", g: "none", dur: 0.35, intr: false },
        { k: "scoot", to: 1, dur: 0.8 },
        { k: "do", fn: (b) => { b.attach = false } },
        { k: "glide", x: DESK_FRONT[0], z: DESK_FRONT[1], yaw: CHAIR_YAW, mode: "stand", dur: 0.95 },
        { k: "do", fn: (b) => { b.at = "stand" } },
      ]
    case "bed":
      return [
        { k: "gest", g: "none", dur: 0.3, intr: false },
        { k: "glide", x: BED_SIDE[0], z: BED_SIDE[1], yaw: Math.PI, y: 0, mode: "stand", dur: 1.5 },
        { k: "do", fn: (b) => { b.at = "stand" } },
      ]
    case "bean":
      return [
        { k: "gest", g: "none", dur: 0.3, intr: false },
        { k: "glide", x: BEAN_BACK[0], z: BEAN_BACK[1], yaw: Math.PI, mode: "stand", dur: 1.0 },
        { k: "do", fn: (b) => { b.at = "stand" } },
      ]
    case "floor":
      return [
        { k: "gest", g: "none", dur: 0.3, intr: false },
        { k: "mode", mode: "stand", dur: 0.9 },
        { k: "do", fn: (b) => { b.at = "stand" } },
      ]
    default:
      return []
  }
}

const hold = (g: Gesture, dur: number): Step => ({ k: "gest", g, dur })
const label = (id: RoomHotspotId): Step => ({ k: "do", fn: (b) => { b.label = id } })

function deskSteps(g: Gesture): Step[] {
  const seat = seatRoot(1)
  return [
    { k: "walk", x: DESK_FRONT[0], z: DESK_FRONT[1], yaw: CHAIR_YAW },
    { k: "glide", x: seat[0], z: seat[1], yaw: CHAIR_YAW, mode: "sitChair", dur: 0.95 },
    { k: "do", fn: (b) => { b.attach = true; b.at = "desk" } },
    { k: "scoot", to: 0, dur: 0.85 },
    hold(g, Infinity),
  ]
}

/** Go back to the desk and carry on typing once a short activity is over. */
const homeSteps = (): Step[] => [label("laptop"), ...deskSteps("type")]

/** Walk to a spot, do something there for a while, then go back to work. */
const errand = (x: number, z: number, yaw: number, g: Gesture, dur: number): Step[] => [
  { k: "walk", x, z, yaw },
  hold(g, dur),
]

function enterSteps(id: RoomHotspotId): Step[] {
  switch (id) {
    case "laptop":
      return deskSteps("type")
    case "monitor":
      return deskSteps("typeMon")
    case "bed":
      return [
        { k: "walk", x: BED_SIDE[0], z: BED_SIDE[1], yaw: Math.PI },
        { k: "glide", x: BED_LIE.x, z: BED_LIE.z, yaw: BED_LIE.yaw, y: BED_LIE.y, mode: "lie", dur: 1.6 },
        { k: "do", fn: (b) => { b.at = "bed" } },
        hold("sleep", Infinity),
      ]
    case "food":
      return [
        { k: "walk", x: BEAN_BACK[0], z: BEAN_BACK[1], yaw: Math.PI },
        { k: "glide", x: BEAN_SEAT[0], z: BEAN_SEAT[1], yaw: 0, mode: "sitBean", dur: 1.05 },
        { k: "do", fn: (b) => { b.at = "bean" } },
        hold("eat", 24),
        ...homeSteps(),
      ]
    case "carpet":
      return [
        { k: "walk", x: FLOOR_SPOT[0], z: FLOOR_SPOT[1], yaw: 0.4 },
        { k: "mode", mode: "sitFloor", dur: 0.9 },
        { k: "do", fn: (b) => { b.at = "floor" } },
        hold("chill", 18),
        ...homeSteps(),
      ]
    case "backpack":
      return [
        ...errand(-0.85, 1.0, 0.33, "none", 0),
        { k: "mode", mode: "squat", dur: 0.7 },
        hold("rummage", 6.5),
        { k: "mode", mode: "stand", dur: 0.7 },
        ...homeSteps(),
      ]
    case "lamp":
      return [...errand(1.05, -1.38, 0, "lamp", 3.2), ...homeSteps()]
    case "shelf":
      return [...errand(2.5, -1.52, 0, "read", 14), ...homeSteps()]
    case "fridge":
      return [...errand(1.82, -1.68, 0, "fridge", 8.2), ...homeSteps()]
    case "window":
      return [...errand(-2.35, -0.3, Math.PI / 2, "window", 12), ...homeSteps()]
    case "clock":
      return [...errand(1.05, -1.38, 0, "look", 7), ...homeSteps()]
    case "posters":
      return [...errand(-1.7, -0.7, 0, "think", 9), ...homeSteps()]
    case "plant":
      return [...errand(-2.15, 1.7, 2.28, "water", 9), ...homeSteps()]
    case "accessories":
      return [...errand(1.9, 0.95, -0.94, "dance", 14), ...homeSteps()]
    case "whiteboard":
      return [...errand(-2.5, 1.25, Math.PI / 2, "write", 12), ...homeSteps()]
    default:
      return []
  }
}

function planFor(b: Brain, id: RoomHotspotId) {
  const target = placeOf(id)
  let steps: Step[]
  const upright: Step[] = b.at === "stand" && b.mode !== "stand" ? [{ k: "mode", mode: "stand", dur: 0.6 }] : []
  if (b.at === "desk" && target === "desk") {
    steps = [{ k: "gest", g: id === "monitor" ? "typeMon" : "type", dur: Infinity }]
  } else if (b.at === "bed" && target === "bed") {
    steps = [{ k: "gest", g: "sleep", dur: Infinity }]
  } else {
    steps = [...upright, ...exitSteps(b.at), label(id), ...enterSteps(id)]
  }
  b.script = steps
  b.si = 0
  b.st = 0
  b.started = false
  b.label = id
}

const canCut = (s: Step | undefined) => !s || s.k === "walk" || (s.k === "gest" && s.intr !== false)

function startStep(b: Brain, s: Step) {
  b.st = 0
  switch (s.k) {
    case "walk":
      b.path = findPath(b.x, b.z, s.x, s.z)
      b.pi = 0
      b.gesture = "none"
      break
    case "glide":
      b.g0 = { x: b.x, z: b.z, y: b.y, yaw: b.yaw, c: b.chair }
      if (s.mode) b.mode = s.mode
      b.gesture = "none"
      b.speed = 0
      break
    case "scoot":
      b.g0 = { x: b.x, z: b.z, y: b.y, yaw: b.yaw, c: b.chair }
      b.gesture = "none"
      b.speed = 0
      break
    case "mode":
      b.mode = s.mode
      b.gesture = "none"
      break
    case "gest":
      b.gesture = s.g
      b.gt = 0
      b.flag = false
      break
    case "do":
      s.fn(b)
      break
  }
}

/** Returns true once the step has finished. */
function updateStep(b: Brain, s: Step, dt: number): boolean {
  switch (s.k) {
    case "walk": {
      const end = s.yaw === undefined
      let moving = false
      if (b.pi < b.path.length) {
        const [tx, tz] = b.path[b.pi]
        const dx = tx - b.x
        const dz = tz - b.z
        const dist = Math.hypot(dx, dz)
        const last = b.pi === b.path.length - 1
        // turn first, then walk: speed is scaled by how well he already faces the way he is going
        const err = Math.abs(wrapAngle(Math.atan2(-dx, -dz) - b.yaw))
        const facing = clamp01(1.35 - err / 0.9)
        // ease off for the last bit and for the sharper corners
        const want = (last ? clamp(dist * 3.2, 0.3, 1.3) : 1.3) * facing
        b.speed = THREE.MathUtils.damp(b.speed, dist < 0.02 ? 0 : want, 6, dt)
        const stepLen = b.speed * dt
        if (dist <= Math.max(stepLen, 0.025)) {
          b.x = tx
          b.z = tz
          b.pi++
        } else {
          b.x += (dx / dist) * stepLen
          b.z += (dz / dist) * stepLen
          b.yaw = dampAngle(b.yaw, Math.atan2(-dx, -dz), 11, dt)
          moving = true
        }
      }
      if (!moving && b.pi >= b.path.length) {
        b.speed = THREE.MathUtils.damp(b.speed, 0, 9, dt)
        if (!end) b.yaw = dampAngle(b.yaw, s.yaw as number, 8, dt)
        const yawOk = end || Math.abs(wrapAngle((s.yaw as number) - b.yaw)) < 0.06
        if (yawOk && b.speed < 0.05) {
          b.speed = 0
          return true
        }
      }
      return false
    }
    case "glide": {
      const e = ease(b.st / s.dur)
      b.x = lerp(b.g0.x, s.x, e)
      b.z = lerp(b.g0.z, s.z, e)
      b.y = lerp(b.g0.y, s.y ?? 0, e)
      b.yaw = b.g0.yaw + wrapAngle(s.yaw - b.g0.yaw) * e
      return b.st >= s.dur
    }
    case "scoot": {
      b.chair = lerp(b.g0.c, s.to, ease(b.st / s.dur))
      return b.st >= s.dur
    }
    case "mode":
      return b.st >= s.dur
    case "gest":
      b.gt += dt
      return b.gt >= s.dur
    case "do":
      return b.st >= (s.dur ?? 0)
  }
}

/** Small timed events that live inside a gesture (toggle the lamp, open the fridge…). */
function gestureEvents(b: Brain) {
  if (b.gesture === "lamp" && !b.flag && b.gt > 1.3) {
    b.flag = true
    b.lampTarget = b.lampTarget > 0.5 ? 0 : 1
  }
  if (b.gesture === "fridge") {
    b.fridgeTarget = b.gt >= 0.9 && b.gt < 3.5 ? 1 : 0
  } else if (b.fridgeTarget !== 0) {
    b.fridgeTarget = 0
  }
}

function tickBrain(b: Brain, frameDt: number, cmd: Command) {
  let dt = frameDt
  if (cmd.n !== b.cmdN) {
    b.cmdN = cmd.n
    if (cmd.id) b.pending = cmd.id
  }
  if (b.pending && canCut(b.script[b.si])) {
    const id = b.pending
    b.pending = null
    planFor(b, id)
  }
  for (let guard = 0; guard < 6; guard++) {
    const s = b.script[b.si]
    if (!s) break
    if (!b.started) {
      startStep(b, s)
      b.started = true
    }
    b.st += dt
    if (!updateStep(b, s, dt)) break
    b.si++
    b.started = false
    dt = 0
  }
  gestureEvents(b)
  if (b.attach) {
    const [sx, sz] = seatRoot(b.chair)
    b.x = sx
    b.z = sz
    b.y = 0
    b.yaw = CHAIR_YAW
  }
  b.lamp = THREE.MathUtils.damp(b.lamp, b.lampTarget, 7, Math.max(frameDt, 1 / 120))
  b.fridge = THREE.MathUtils.damp(b.fridge, b.fridgeTarget, 4.5, Math.max(frameDt, 1 / 120))
}

/* ── pose: where every joint wants to be ─────────────────────────────────── */

interface Pose {
  hipY: number
  hipZ: number
  lean: number
  torsoYaw: number
  headPitch: number
  headYaw: number
  lie: number
  footL: THREE.Vector3
  footR: THREE.Vector3
  handL: THREE.Vector3
  handR: THREE.Vector3
}

const makePose = (): Pose => ({
  hipY: 0.6, hipZ: 0, lean: 0.1, torsoYaw: 0, headPitch: 0.1, headYaw: 0, lie: 0,
  footL: W3(-0.12, FOOT_Y, -0.4), footR: W3(0.12, FOOT_Y, -0.4),
  handL: W3(-0.16, 0.69, -0.2), handR: W3(0.16, 0.69, -0.2),
})

function dampPose(c: Pose, t: Pose, dt: number) {
  c.hipY = THREE.MathUtils.damp(c.hipY, t.hipY, 7, dt)
  c.hipZ = THREE.MathUtils.damp(c.hipZ, t.hipZ, 7, dt)
  c.lean = THREE.MathUtils.damp(c.lean, t.lean, 8, dt)
  c.torsoYaw = THREE.MathUtils.damp(c.torsoYaw, t.torsoYaw, 8, dt)
  c.headPitch = THREE.MathUtils.damp(c.headPitch, t.headPitch, 9, dt)
  c.headYaw = THREE.MathUtils.damp(c.headYaw, t.headYaw, 9, dt)
  c.lie = THREE.MathUtils.damp(c.lie, t.lie, 5, dt)
  const k = 1 - Math.exp(-13 * dt)
  c.footL.lerp(t.footL, k)
  c.footR.lerp(t.footR, k)
  c.handL.lerp(t.handL, k)
  c.handR.lerp(t.handR, k)
}

interface PoseCtx {
  toRig: (w: THREE.Vector3, out: THREE.Vector3) => THREE.Vector3
  torsoPt: (x: number, y: number, z: number, out: THREE.Vector3) => THREE.Vector3
  reduced: boolean
  bearing: number
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const LAP_L = W3(-0.13, 0.66, -0.1)
const LAP_R = W3(0.13, 0.66, -0.1)
const _hang = new THREE.Vector3()

function targetPose(b: Brain, T: Pose, t: number, dt: number, c: PoseCtx) {
  const g = b.gesture
  const gt = b.gt
  const A = b.amp
  const lift = b.lift

  // posture
  switch (b.mode) {
    case "stand":
      T.hipY = HIP_STAND; T.hipZ = 0; T.lean = 0.03; T.headPitch = 0; T.lie = 0
      T.footL.set(-0.11, FOOT_Y, 0); T.footR.set(0.11, FOOT_Y, 0)
      T.handL.set(-0.27, 0.8, 0.02); T.handR.set(0.27, 0.8, 0.02)
      break
    case "sitChair":
      T.hipY = 0.6; T.hipZ = 0; T.lean = 0.1; T.headPitch = 0.1; T.lie = 0
      T.footL.set(-0.12, FOOT_Y, -0.4); T.footR.set(0.12, FOOT_Y, -0.4)
      T.handL.set(-0.16, 0.69, -0.2); T.handR.set(0.16, 0.69, -0.2)
      break
    case "sitBean":
      T.hipY = 0.47; T.hipZ = 0; T.lean = 0.12; T.headPitch = 0.05; T.lie = 0
      T.footL.set(-0.17, FOOT_Y, -0.46); T.footR.set(0.17, FOOT_Y, -0.46)
      T.handL.set(-0.2, 0.62, -0.28); T.handR.set(0.2, 0.62, -0.28)
      break
    case "sitFloor":
      T.hipY = 0.2; T.hipZ = 0; T.lean = 0.05; T.headPitch = 0; T.lie = 0
      T.footL.set(0.12, FOOT_Y, -0.2); T.footR.set(-0.12, FOOT_Y, -0.2)
      T.handL.set(-0.3, 0.3, -0.3); T.handR.set(0.3, 0.3, -0.3)
      break
    case "squat":
      T.hipY = 0.42; T.hipZ = 0; T.lean = 0.5; T.headPitch = -0.1; T.lie = 0
      T.footL.set(-0.16, FOOT_Y, -0.08); T.footR.set(0.16, FOOT_Y, -0.08)
      T.handL.set(-0.2, 0.4, -0.3); T.handR.set(0.2, 0.4, -0.3)
      break
    case "lie":
      T.hipY = HIP_STAND; T.hipZ = 0; T.lean = 0; T.headPitch = 0; T.lie = 1
      T.footL.set(-0.1, HIP_STAND - 0.7, 0); T.footR.set(0.1, HIP_STAND - 0.7, 0)
      T.handL.set(-0.27, HIP_STAND + 0.1, 0.06); T.handR.set(0.27, HIP_STAND + 0.1, 0.06)
      break
  }
  T.torsoYaw = 0
  T.headYaw = 0

  // walking layer
  if (b.mode === "stand" && A > 0.02) {
    const ph = b.phase
    const s = Math.sin(ph)
    const cs = Math.cos(ph)
    T.footL.z += -s * 0.26 * A
    T.footR.z += s * 0.26 * A
    T.footL.y += Math.max(0, cs) * 0.1 * A
    T.footR.y += Math.max(0, -cs) * 0.1 * A
    T.hipY -= Math.abs(s) * 0.03 * A
    T.handL.z += s * 0.18 * A
    T.handR.z += -s * 0.18 * A
    T.handL.y += 0.04 * A
    T.handR.y += 0.04 * A
    T.lean += 0.05 * A
    T.torsoYaw = -s * 0.08 * A
  }

  // typing swivel decays whenever he is doing something else
  const typing = g === "type" || g === "typeMon"
  if (!typing) {
    b.turn = THREE.MathUtils.damp(b.turn, 0, 8, dt)
    b.swivel = THREE.MathUtils.damp(b.swivel, 0, 8, dt)
  }

  switch (g) {
    case "type":
    case "typeMon": {
      const ph = t % CYCLE
      const want = c.reduced ? 0 : smooth(8, 9.4, ph) * (1 - smooth(11.4, 12.8, ph))
      b.turn = THREE.MathUtils.damp(b.turn, want, 8, dt)
      const turn = b.turn
      const burst = smooth(-0.15, 0.4, Math.sin(t * 0.5 + 1.2))
      const stroke = (i: number) => Math.max(0, Math.sin(t * (9.2 + i * 2.3) + i * 2.1))
      const wx = (i: number) => Math.sin(t * (1.9 + i * 0.5) + i) * 0.03 * burst
      const wz = (i: number) => Math.sin(t * (1.4 + i * 0.4) + i * 1.7) * 0.022 * burst
      const rest = smooth(0.05, 0.35, turn)
      const wave = smooth(0.45, 0.85, turn)
      const ly = lift.laptop ?? 0
      const torsoYaw = c.bearing * 0.5 * turn
      T.torsoYaw = torsoYaw
      T.lean = lerp(0.1, 0, turn)
      T.headPitch = 0.1 * (1 - turn) + Math.sin(t * 1.1) * 0.025
      T.headYaw = torsoYaw + Math.sin(t * 0.6) * 0.05 * (1 - turn) + (g === "typeMon" ? 0.55 * (1 - turn) : 0)
      T.handL.set(-0.09 + wx(0), 0.835 - stroke(0) * 0.012 * burst + (1 - burst) * 0.008 + ly, -0.47 + wz(0))
      T.handR.set(0.09 + wx(1), 0.835 - stroke(1) * 0.012 * burst + (1 - burst) * 0.008 + ly, -0.47 + wz(1))
      T.handL.lerp(LAP_L, rest)
      T.handR.lerp(LAP_R, rest)
      c.torsoPt(0.34 + Math.sin(t * 10) * 0.07 * wave, 0.82, -0.2, _a)
      T.handR.lerp(_a, wave)
      b.swivel = torsoYaw * 0.95
      break
    }
    case "sleep":
      T.lean = 0
      break
    case "lamp": {
      const reach = smooth(0.2, 1.0, gt) * (1 - smooth(2.1, 2.8, gt))
      T.lean += 0.25 * reach
      T.headPitch = -0.1 * reach
      T.handR.lerp(c.toRig(SPOTS.lampSwitch, _a), reach)
      break
    }
    case "read": {
      const k = smooth(0, 0.9, gt)
      const flip = Math.pow(Math.max(0, Math.sin(gt * 1.5)), 10) * 0.07
      T.handR.lerp(_a.set(0.1 + flip, 1.12, -0.34), k)
      T.handL.lerp(_b.set(-0.12, 1.1, -0.32), k)
      T.lean += 0.08 * k
      T.headPitch = -0.3 * k
      break
    }
    case "eat": {
      const u = (gt % 3.4) / 3.4
      c.toRig(SPOTS.bowl, _a)
      c.torsoPt(0, 0.62, -0.2, _b)
      let m = 0
      if (u < 0.3) m = 0
      else if (u < 0.5) m = ease((u - 0.3) / 0.2)
      else if (u < 0.8) m = 1
      else m = 1 - ease((u - 0.8) / 0.2)
      T.handR.lerpVectors(_a, _b, m)
      T.handL.copy(c.toRig(SPOTS.bowlLeft, _hang))
      T.lean = 0.5 - 0.22 * m
      T.headPitch = -0.2 + (m > 0.9 ? Math.sin(gt * 9) * 0.05 : 0)
      break
    }
    case "fridge": {
      const reachH = smooth(0, 0.9, gt) * (1 - smooth(1.5, 2.0, gt))
      const inside = smooth(1.6, 2.3, gt) * (1 - smooth(2.9, 3.4, gt))
      const drink = smooth(3.9, 4.6, gt) * (1 - smooth(7.0, 7.6, gt))
      const bend = Math.max(reachH, inside)
      T.hipY = lerp(HIP_STAND, 0.74, bend)
      T.lean += 0.5 * bend
      T.headPitch = -0.15 * bend
      T.handR.lerp(c.toRig(SPOTS.fridgeHandle, _a), reachH)
      T.handR.lerp(c.toRig(SPOTS.fridgeInside, _a), inside)
      c.torsoPt(0, 0.62, -0.2, _b)
      T.handR.lerp(_b, drink)
      T.lean -= 0.04 * drink
      T.headPitch += 0.35 * drink
      break
    }
    case "think": {
      const k = smooth(0, 0.8, gt)
      c.torsoPt(0.05, 0.62, -0.17, _a)
      T.handR.lerp(_a, k)
      T.handL.lerp(c.torsoPt(-0.08, 0.28, -0.22, _b), k)
      T.headPitch = 0.12 * k
      T.headYaw = Math.sin(gt * 0.7) * 0.35 * k
      T.torsoYaw = Math.sin(gt * 0.5) * 0.08 * k
      break
    }
    case "look": {
      const k = smooth(0, 0.8, gt)
      T.headPitch = 0.55 * k
      T.handR.lerp(_a.set(0.16, 1.2, -0.3), k)
      break
    }
    case "window": {
      const k = smooth(0, 1.0, gt)
      T.handR.lerp(c.toRig(SPOTS.sillR, _a), k)
      T.handL.lerp(c.toRig(SPOTS.sillL, _b), k)
      T.lean += 0.12 * k
      T.headPitch = 0.08 * k
      T.headYaw = Math.sin(gt * 0.6) * 0.45 * k
      break
    }
    case "water": {
      const k = smooth(0, 1.0, gt) * (1 - smooth(8.2, 9, gt))
      T.handR.lerp(c.toRig(SPOTS.plantTop, _a), k)
      T.handL.lerp(_b.set(-0.2, 0.95, -0.05), k)
      T.lean += 0.12 * k
      T.headPitch = -0.2 * k
      break
    }
    case "dance": {
      const w = t * 6.5
      T.hipY -= 0.03 + Math.abs(Math.sin(w)) * 0.05
      T.lean = 0.05 + Math.sin(w) * 0.05
      T.headPitch = Math.sin(w * 2) * 0.12
      T.torsoYaw = Math.sin(w * 0.5) * 0.25
      T.headYaw = Math.sin(w * 0.5) * 0.2
      T.handL.set(-0.3, 1.25 + Math.sin(w) * 0.15, -0.12)
      T.handR.set(0.3, 1.25 + Math.sin(w + Math.PI) * 0.15, -0.12)
      T.footL.y += Math.max(0, Math.sin(w)) * 0.05
      T.footR.y += Math.max(0, -Math.sin(w)) * 0.05
      break
    }
    case "write": {
      const k = smooth(0, 0.9, gt)
      c.toRig(SPOTS.board, _a)
      T.handR.lerp(_a, k)
      T.handR.x += Math.sin(gt * 2.2) * 0.08 * k
      T.handR.y += Math.sin(gt * 4.4) * 0.05 * k
      T.handL.lerp(_b.set(-0.2, 0.95, -0.05), k)
      T.lean += 0.1 * k
      break
    }
    case "rummage": {
      const k = smooth(0, 0.8, gt)
      c.toRig(SPOTS.bag, _a)
      T.handR.lerp(_a.addScaledVector(_hang.set(Math.sin(gt * 3) * 0.04, 0, 0), 1), k)
      T.handL.lerp(c.toRig(SPOTS.bag, _b).add(_hang.set(-0.12, 0, Math.cos(gt * 2.4) * 0.04)), k)
      T.headPitch = -0.25 * k
      break
    }
    case "chill": {
      const ph = gt % 12
      const up = smooth(7, 8.2, ph) * (1 - smooth(10.2, 11.4, ph))
      T.handL.lerp(_a.set(-0.25, 1.05, -0.05), up)
      T.handR.lerp(_b.set(0.25, 1.05, -0.05), up)
      T.lean = 0.05 - 0.05 * up
      T.headYaw = Math.sin(gt * 0.5) * 0.4 * (1 - up)
      T.headPitch = 0.05 + 0.25 * up
      break
    }
    default:
      break
  }
}

function useSoftTex(kind: "blob" | "z" | "note") {
  return useTex(() => {
    const { c, ctx } = canvas2d(64, 64)
    if (kind === "blob") {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      g.addColorStop(0, "#ffffff")
      g.addColorStop(0.55, "#777777")
      g.addColorStop(1, "#000000")
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 64, 64)
    } else {
      ctx.clearRect(0, 0, 64, 64)
      ctx.fillStyle = "#ffffff"
      ctx.strokeStyle = "rgba(40,50,90,0.85)"
      ctx.lineWidth = 6
      ctx.font = "bold 50px system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const ch = kind === "z" ? "Z" : "♪"
      ctx.strokeText(ch, 32, 34)
      ctx.fillText(ch, 32, 34)
    }
    return new THREE.CanvasTexture(c)
  }, [kind])
}

interface AvatarScratch {
  S: THREE.Vector3
  E: THREE.Vector3
  H: THREE.Vector3
  pole: THREE.Vector3
}

function driveArm(
  s: AvatarScratch, tm: THREE.Matrix4, a: ReturnType<typeof useLimb>, side: number,
  sh: THREE.Mesh | null, hand: THREE.Vector3
) {
  s.S.set(side * 0.23, 0.46, 0).applyMatrix4(tm)
  s.pole.set(side * 0.8, -0.9, 0.4)
  solveLimb(s.S, hand, s.pole, ARM1, ARM2, s.E, s.H)
  if (a.upper.current) placeLimb(a.upper.current, s.S, s.E)
  if (a.lower.current) placeLimb(a.lower.current, s.E, s.H)
  a.joint.current?.position.copy(s.E)
  a.end.current?.position.copy(s.H)
  sh?.position.copy(s.S)
}

function driveLeg(
  s: AvatarScratch, a: ReturnType<typeof useLimb>, side: number, foot: THREE.Mesh | null,
  ankle: THREE.Vector3, mode: Mode, hipY: number, hipZ: number
) {
  s.S.set(side * 0.115, hipY - 0.02, hipZ)
  if (mode === "sitFloor") s.pole.set(side * 1, 0, -0.2)
  else if (mode === "lie") s.pole.set(side * 0.1, 0, -1)
  else s.pole.set(side * 0.1, 0.3, -1)
  solveLimb(s.S, ankle, s.pole, LEG1, LEG2, s.E, s.H)
  if (a.upper.current) placeLimb(a.upper.current, s.S, s.E)
  if (a.lower.current) placeLimb(a.lower.current, s.E, s.H)
  a.joint.current?.position.copy(s.E)
  foot?.position.set(s.H.x, s.H.y - 0.03, s.H.z - 0.05)
}

/**
 * The person. Walks around the room with a grid path-finder, and a small
 * script runner (see `planFor`) turns a click on any object into a sequence:
 * get up from the chair → walk over → do the thing → go back to work.
 */
function Avatar({
  m, command, onActivity,
}: {
  m: Mats
  command: RefObject<Command>
  onActivity?: (id: RoomHotspotId) => void
}) {
  const reduced = useContext(ReducedCtx)
  const brainRef = useBrain()
  const root = useRef<THREE.Group>(null)
  const lieG = useRef<THREE.Group>(null)
  const rig = useRef<THREE.Group>(null)
  const pelvis = useRef<THREE.Mesh>(null)
  const torso = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Mesh>(null)
  const eyeR = useRef<THREE.Mesh>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const shL = useRef<THREE.Mesh>(null)
  const shR = useRef<THREE.Mesh>(null)
  const armL = useLimb()
  const armR = useLimb()
  const legL = useLimb()
  const legR = useLimb()
  const footL = useRef<THREE.Mesh>(null)
  const footR = useRef<THREE.Mesh>(null)
  const heldR = useRef<THREE.Group>(null)
  const can = useRef<THREE.Group>(null)
  const sticks = useRef<THREE.Group>(null)
  const book = useRef<THREE.Group>(null)
  const wcan = useRef<THREE.Group>(null)
  const marker = useRef<THREE.Group>(null)
  const spout = useRef<THREE.Object3D>(null)
  const cover = useRef<THREE.Mesh>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const shadowMat = useRef<THREE.MeshBasicMaterial>(null)
  const zs = useRef<THREE.Group>(null)
  const notes = useRef<THREE.Group>(null)
  const drops = useRef<THREE.Group>(null)
  const blob = useSoftTex("blob")
  const zTex = useSoftTex("z")
  const noteTex = useSoftTex("note")
  const pose = useMemo(makePose, [])
  const tgt = useMemo(makePose, [])
  const lastLabel = useRef<RoomHotspotId | null>(null)
  const ctx = useMemo<PoseCtx>(
    () => ({
      reduced,
      bearing: 0,
      toRig: (w, out) => (rig.current ? rig.current.worldToLocal(out.copy(w)) : out.copy(w)),
      torsoPt: (x, y, z, out) => out.set(x, y, z).applyMatrix4(brainRef.current.tm),
    }),
    [reduced, brainRef]
  )
  const s = useMemo(
    () => ({
      cam: new THREE.Vector3(), S: new THREE.Vector3(), E: new THREE.Vector3(), H: new THREE.Vector3(),
      pole: new THREE.Vector3(), hp: new THREE.Vector3(), tmp: new THREE.Vector3(), tip: new THREE.Vector3(),
      bearing: -2.4, cover: 0, handR: new THREE.Vector3(),
    }),
    []
  )

  useLayoutEffect(() => {
    if (torso.current) torso.current.rotation.order = "YXZ"
  }, [])

  useFrame((state, dtRaw) => {
    const r = root.current
    const lg = lieG.current
    const rg = rig.current
    const tor = torso.current
    const hd = head.current
    if (!r || !lg || !rg || !tor || !hd) return
    const dt = Math.min(dtRaw, 0.1)
    const t = state.clock.elapsedTime
    const b = brainRef.current
    const cmd = command.current ?? { id: null, n: 0 }

    tickBrain(b, dt, cmd)
    if (lastLabel.current !== b.label) {
      lastLabel.current = b.label
      onActivity?.(b.label)
    }
    b.amp = THREE.MathUtils.damp(b.amp, b.speed > 0.15 ? 1 : 0, 8, dt)
    b.phase += dt * b.speed * 5.2

    // ── root transform (the bed / bean bag / laptop lift when hovered) ──
    const lift = b.at === "bed" ? b.lift.bed ?? 0 : b.at === "bean" ? b.lift.food ?? 0 : 0
    r.position.set(b.x, b.y + lift, b.z)
    r.rotation.y = b.yaw
    lg.position.set(0, HIP_STAND, 0)
    lg.rotation.x = pose.lie * (Math.PI / 2)
    rg.position.set(0, -HIP_STAND, 0)
    r.updateMatrixWorld(true)

    // where the viewer is, as seen from the person
    s.cam.copy(state.camera.position)
    r.worldToLocal(s.cam)
    const bearing = clamp(Math.atan2(-s.cam.x, -s.cam.z), -2.7, 2.7)
    s.bearing = THREE.MathUtils.damp(s.bearing, bearing, 3, dt)

    ctx.bearing = s.bearing
    targetPose(b, tgt, t, dt, ctx)
    dampPose(pose, tgt, dt)
    const P = pose

    // ── body ──
    const breath = Math.sin(t * 1.5) * 0.012
    tor.position.set(0, P.hipY + breath * 0.5, P.hipZ)
    tor.rotation.set(-(P.lean + breath), P.torsoYaw, 0)
    tor.updateMatrix()
    b.tm.copy(tor.matrix)
    if (pelvis.current) pelvis.current.position.set(0, P.hipY - 0.04, P.hipZ)
    const asleep = b.gesture === "sleep"
    hd.rotation.set(
      P.headPitch + Math.sin(t * 1.1) * 0.02 * (asleep ? 0 : 1),
      P.headYaw,
      Math.sin(t * 0.5) * 0.02
    )

    // ── arms & legs (IK) ──
    driveArm(s, b.tm, armL, -1, shL.current, P.handL)
    driveArm(s, b.tm, armR, 1, shR.current, P.handR)
    s.handR.copy(s.H)
    driveLeg(s, legL, -1, footL.current, P.footL, b.mode, P.hipY, P.hipZ)
    driveLeg(s, legR, 1, footR.current, P.footR, b.mode, P.hipY, P.hipZ)

    // ── face ──
    const blink = t % 3.9 < 0.11 || asleep ? 0.1 : 1
    if (eyeL.current) eyeL.current.scale.y = blink
    if (eyeR.current) eyeR.current.scale.y = blink
    if (mouth.current) {
      const talk = b.turn
      mouth.current.scale.x = 1 + talk * 0.8
      mouth.current.scale.y = 1 + talk * 0.9 + (b.gesture === "eat" && b.gt % 3.4 > 1.7 ? 0.8 : 0)
    }

    // ── things in his hands ──
    const g = b.gesture
    const gt = b.gt
    const held = heldR.current
    if (held) {
      held.position.copy(s.handR)
      const showCan = g === "fridge" && gt > 2.7
      const drink = smooth(3.9, 4.6, gt) * (1 - smooth(7.0, 7.6, gt))
      if (can.current) {
        can.current.visible = showCan
        can.current.rotation.set(-drink * 0.9, 0, 0)
      }
      if (sticks.current) sticks.current.visible = g === "eat"
      if (wcan.current) {
        wcan.current.visible = g === "water"
        wcan.current.rotation.set(0, 0, -0.15 - smooth(1.0, 1.8, gt) * 0.5 * (1 - smooth(8.2, 9, gt)))
      }
      if (marker.current) marker.current.visible = g === "write"
      if (book.current) {
        book.current.visible = g === "read"
      }
    }

    // ── floating Zzz / notes ──
    const head3 = hd.getWorldPosition(b.head)
    const updateFloaters = (grp: THREE.Group | null, on: boolean, rise: number) => {
      if (!grp) return
      grp.visible = on
      if (!on) return
      grp.children.forEach((c, i) => {
        const p = (t * 0.32 + i / grp.children.length) % 1
        c.position.set(head3.x + 0.15 + p * 0.3 + (i % 2) * 0.05, head3.y + 0.18 + p * rise, head3.z + Math.sin(p * 6 + i) * 0.05)
        const sc = 0.08 + p * 0.1
        c.scale.set(sc, sc, sc)
        const mat = (c as THREE.Sprite).material as THREE.SpriteMaterial
        mat.opacity = Math.sin(p * Math.PI) * 0.95
      })
    }
    updateFloaters(zs.current, asleep && P.lie > 0.8, 0.45)
    updateFloaters(notes.current, g === "dance", 0.6)

    // ── water drops ──
    const dr = drops.current
    if (dr) {
      const on = g === "water" && gt > 1.6 && gt < 8.2
      dr.visible = on
      if (on && spout.current) {
        spout.current.getWorldPosition(s.tip)
        dr.children.forEach((c, i) => {
          const p = (t * 1.6 + i / dr.children.length) % 1
          c.position.set(s.tip.x - 0.02 * p, s.tip.y - p * p * 0.55, s.tip.z + 0.02 * p)
        })
      }
    }

    // ── blanket over a sleeping person ──
    const want = asleep && P.lie > 0.9 ? 1 : 0
    s.cover = THREE.MathUtils.damp(s.cover, want, 5, dt)
    if (cover.current) {
      const a = Math.max(s.cover, 0.0001) * (1 + Math.sin(t * 1.5) * 0.012)
      cover.current.visible = s.cover > 0.02
      cover.current.scale.y = a
      cover.current.position.y = 0.6 + 0.16 * a
    }

    // ── soft shadow follows him ──
    if (shadow.current && shadowMat.current) {
      shadow.current.position.set(b.x, 0.054, b.z)
      shadowMat.current.opacity = 0.38 * (1 - clamp01(P.lie * 1.4))
    }
  })

  const limb = (a: ReturnType<typeof useLimb>, mat: THREE.MeshStandardMaterial, r1: number, l1: number, r2: number, l2: number, rj: number, endMat: THREE.MeshStandardMaterial, re: number) => (
    <>
      <mesh ref={a.upper} material={mat} castShadow>
        <capsuleGeometry args={[r1, l1 - r1 * 2, 4, 10]} />
      </mesh>
      <mesh ref={a.lower} material={mat} castShadow>
        <capsuleGeometry args={[r2, l2 - r2 * 2, 4, 10]} />
      </mesh>
      <mesh ref={a.joint} material={mat}>
        <sphereGeometry args={[rj, 12, 10]} />
      </mesh>
      {re > 0 && (
        <mesh ref={a.end} material={endMat}>
          <sphereGeometry args={[re, 12, 10]} />
        </mesh>
      )}
    </>
  )

  return (
    <>
      <group ref={root}>
        <group ref={lieG}>
          <group ref={rig}>
            {/* pelvis + legs */}
            <mesh ref={pelvis} material={m.pants} castShadow>
              <BoxG args={[0.4, 0.2, 0.3]} />
            </mesh>
            {limb(legL, m.pants, 0.065, LEG1, 0.058, LEG2, 0.062, m.pants, 0)}
            {limb(legR, m.pants, 0.065, LEG1, 0.058, LEG2, 0.062, m.pants, 0)}
            <mesh ref={footL} material={m.white} castShadow>
              <BoxG args={[0.13, 0.08, 0.24]} />
            </mesh>
            <mesh ref={footR} material={m.white} castShadow>
              <BoxG args={[0.13, 0.08, 0.24]} />
            </mesh>

            {/* Torso, head and face (front is -z) */}
            <group ref={torso} position={[0, 0.6, 0]}>
              <mesh position={[0, 0.25, 0]} material={m.hoodie} castShadow>
                <BoxG args={[0.42, 0.5, 0.26]} />
              </mesh>
              <mesh position={[0, 0.5, 0.1]} material={m.hoodie}>
                <BoxG args={[0.34, 0.14, 0.14]} />
              </mesh>
              <mesh position={[0, 0.54, 0]} material={m.skin}>
                <BoxG args={[0.1, 0.08, 0.1]} />
              </mesh>

              <group ref={head} position={[0, 0.58, 0]}>
                <mesh position={[0, 0.13, 0]} material={m.skin} castShadow>
                  <BoxG args={[0.27, 0.27, 0.25]} />
                </mesh>
                <mesh position={[0, 0.28, 0.0]} material={m.hair}>
                  <BoxG args={[0.3, 0.09, 0.28]} />
                </mesh>
                <mesh position={[0, 0.14, 0.115]} material={m.hair}>
                  <BoxG args={[0.3, 0.26, 0.07]} />
                </mesh>
                {[-0.145, 0.145].map((x) => (
                  <mesh key={x} position={[x, 0.2, 0.01]} material={m.hair}>
                    <BoxG args={[0.03, 0.16, 0.22]} />
                  </mesh>
                ))}
                <mesh position={[0, 0.255, -0.12]} material={m.hair}>
                  <BoxG args={[0.29, 0.06, 0.05]} />
                </mesh>
                <mesh position={[-0.07, 0.22, -0.125]} material={m.hair}>
                  <BoxG args={[0.07, 0.04, 0.04]} />
                </mesh>
                {[-0.14, 0.14].map((x) => (
                  <mesh key={x} position={[x, 0.12, 0]} material={m.skin}>
                    <BoxG args={[0.03, 0.07, 0.05]} />
                  </mesh>
                ))}
                <mesh position={[0, 0.17, 0]} material={m.accent2}>
                  <torusGeometry args={[0.17, 0.02, 8, 16, Math.PI]} />
                </mesh>
                {[-0.17, 0.17].map((x) => (
                  <mesh key={x} position={[x, 0.15, 0]} rotation-z={Math.PI / 2} material={m.accent2}>
                    <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
                  </mesh>
                ))}
                {[
                  [eyeL, -0.065],
                  [eyeR, 0.065],
                ].map(([ref, x]) => (
                  <mesh key={x as number} ref={ref as RefObject<THREE.Mesh>} position={[x as number, 0.14, -0.127]}>
                    <boxGeometry args={[0.04, 0.055, 0.008]} />
                    <meshStandardMaterial color="#1d1b2e" roughness={0.4} />
                    <mesh position={[0.008, 0.012, -0.005]}>
                      <boxGeometry args={[0.012, 0.012, 0.004]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                  </mesh>
                ))}
                <mesh position={[-0.065, 0.2, -0.128]} rotation-z={0.1} material={m.hair}>
                  <boxGeometry args={[0.06, 0.012, 0.008]} />
                </mesh>
                <mesh position={[0.065, 0.2, -0.128]} rotation-z={-0.1} material={m.hair}>
                  <boxGeometry args={[0.06, 0.012, 0.008]} />
                </mesh>
                <mesh position={[0, 0.105, -0.135]}>
                  <boxGeometry args={[0.03, 0.035, 0.03]} />
                  <meshStandardMaterial color="#d9a47d" roughness={0.8} />
                </mesh>
                <mesh ref={mouth} position={[0, 0.062, -0.128]}>
                  <boxGeometry args={[0.07, 0.014, 0.008]} />
                  <meshStandardMaterial color="#a8453f" roughness={0.6} />
                </mesh>
                {[-0.095, 0.095].map((x) => (
                  <mesh key={x} position={[x, 0.09, -0.127]}>
                    <boxGeometry args={[0.05, 0.03, 0.006]} />
                    <meshStandardMaterial color="#ff9aa2" transparent opacity={0.55} roughness={0.9} />
                  </mesh>
                ))}
              </group>
            </group>

            {/* Shoulders + IK arms live in the rig frame */}
            <mesh ref={shL} material={m.hoodie}>
              <sphereGeometry args={[0.065, 12, 10]} />
            </mesh>
            <mesh ref={shR} material={m.hoodie}>
              <sphereGeometry args={[0.065, 12, 10]} />
            </mesh>
            {limb(armL, m.hoodie, 0.05, ARM1, 0.044, ARM2, 0.05, m.skin, 0.048)}
            {limb(armR, m.hoodie, 0.05, ARM1, 0.044, ARM2, 0.05, m.skin, 0.048)}

            {/* Props in the right hand */}
            <group ref={heldR}>
              <group ref={can} visible={false}>
                <mesh position={[0, 0.02, -0.03]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.11, 10]} />
                  <meshStandardMaterial color="#d9443b" roughness={0.4} metalness={0.3} />
                </mesh>
              </group>
              <group ref={sticks} visible={false} rotation={[-0.6, 0, 0]}>
                {[-0.012, 0.012].map((x) => (
                  <mesh key={x} position={[x, 0, -0.1]}>
                    <BoxG args={[0.008, 0.008, 0.22]} />
                    <meshStandardMaterial color="#6c452b" />
                  </mesh>
                ))}
                <mesh position={[0, -0.01, -0.2]}>
                  <BoxG args={[0.04, 0.02, 0.03]} />
                  <meshStandardMaterial color="#f0d98a" />
                </mesh>
              </group>
              <group ref={book} visible={false} position={[-0.06, 0.02, -0.04]} rotation={[-0.7, 0, 0]}>
                <mesh position={[-0.05, 0, 0]}>
                  <BoxG args={[0.2, 0.03, 0.27]} />
                  <meshStandardMaterial color="#c2504a" roughness={0.8} />
                </mesh>
                <mesh position={[-0.05, 0.018, 0]}>
                  <BoxG args={[0.18, 0.006, 0.25]} />
                  <meshStandardMaterial color="#f6f1e6" />
                </mesh>
              </group>
              <group ref={wcan} visible={false}>
                <mesh position={[0, 0.03, -0.04]}>
                  <BoxG args={[0.12, 0.1, 0.1]} />
                  <meshStandardMaterial color="#6fa8ff" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.06, -0.12]} rotation-x={-0.6}>
                  <cylinderGeometry args={[0.012, 0.016, 0.14, 6]} />
                  <meshStandardMaterial color="#6fa8ff" roughness={0.5} />
                </mesh>
                <object3D ref={spout} position={[0, 0.1, -0.17]} />
              </group>
              <group ref={marker} visible={false} rotation={[-0.5, 0, 0]}>
                <mesh position={[0, 0, -0.04]}>
                  <BoxG args={[0.016, 0.016, 0.12]} />
                  <meshStandardMaterial color="#e0555f" />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Blanket pulled up over a sleeping person (the bed's own blanket is flat). */}
      <mesh ref={cover} position={[-1.68, 0.76, BED_LIE.z]} visible={false} material={m.blanket} castShadow>
        <BoxG args={[1.16, 0.32, 0.9]} />
      </mesh>

      <mesh ref={shadow} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial ref={shadowMat} color="#000000" alphaMap={blob} transparent opacity={0.38} depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={zs} visible={false}>
        {[0, 1, 2].map((i) => (
          <sprite key={i}>
            <spriteMaterial map={zTex} transparent depthWrite={false} toneMapped={false} />
          </sprite>
        ))}
      </group>
      <group ref={notes} visible={false}>
        {[0, 1, 2, 3].map((i) => (
          <sprite key={i}>
            <spriteMaterial map={noteTex} color={i % 2 ? "#ffd27a" : "#9fe0ff"} transparent depthWrite={false} toneMapped={false} />
          </sprite>
        ))}
      </group>
      <group ref={drops} visible={false}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i}>
            <BoxG args={[0.02, 0.03, 0.02]} />
            <meshBasicMaterial color="#8fc8ff" transparent opacity={0.85} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </>
  )
}

/** The swivel chair. It rolls out when he gets up and tucks back in when he sits. */
function Chair({ m }: { m: Mats }) {
  const brain = useBrain()
  const root = useRef<THREE.Group>(null)
  const top = useRef<THREE.Group>(null)
  const blob = useSoftTex("blob")
  useFrame(() => {
    const b = brain.current
    if (root.current) root.current.position.set(lerp(CHAIR_IN[0], CHAIR_OUT[0], b.chair), 0, lerp(CHAIR_IN[1], CHAIR_OUT[1], b.chair))
    if (top.current) top.current.rotation.y = b.swivel
  })
  return (
    <group ref={root} rotation-y={CHAIR_YAW}>
      <mesh position={[0, 0.053, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial color="#000000" alphaMap={blob} transparent opacity={0.38} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.25, 0]} material={m.metalDark}>
        <cylinderGeometry args={[0.04, 0.04, 0.36, 10]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * 0.16, 0.07, Math.sin(a) * 0.16]} rotation-y={-a} material={m.metalDark}>
              <BoxG args={[0.32, 0.035, 0.05]} />
            </mesh>
            <mesh position={[Math.cos(a) * 0.3, 0.035, Math.sin(a) * 0.3]} material={m.metalDark}>
              <sphereGeometry args={[0.035, 8, 8]} />
            </mesh>
          </group>
        )
      })}
      <group ref={top}>
        <mesh position={[0, 0.46, 0]} material={m.fabricNavy} castShadow>
          <BoxG args={[0.52, 0.09, 0.5]} />
        </mesh>
        <mesh position={[0, 0.88, 0.25]} rotation-x={0.08} material={m.fabricNavy} castShadow>
          <BoxG args={[0.5, 0.72, 0.08]} />
        </mesh>
        <mesh position={[0, 1.3, 0.27]} rotation-x={0.08} material={m.metalDark}>
          <BoxG args={[0.3, 0.16, 0.07]} />
        </mesh>
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.9, 0.2]} material={m.accent2}>
            <BoxG args={[0.04, 0.5, 0.05]} />
          </mesh>
        ))}
        {[-0.31, 0.31].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.62, 0.02]} material={m.metalDark}>
              <BoxG args={[0.04, 0.2, 0.04]} />
            </mesh>
            <mesh position={[x, 0.73, 0.04]} material={m.metalDark}>
              <BoxG args={[0.07, 0.04, 0.28]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** Laptop only — the person now lives in <Avatar> and walks in and out of this spot. */
function Workstation({ m }: { m: Mats }) {
  return (
    <group position={[0.2, 0, -1.9]} rotation-y={0.2}>
      <Laptop m={m} />
    </group>
  )
}


function DeskLamp({ m }: { m: Mats }) {
  const env = useEnv()
  const brain = useBrain()
  const light = useRef<THREE.PointLight>(null)
  const bulb = useRef<THREE.MeshStandardMaterial>(null)
  useFrame((state) => {
    const on = brain.current.lamp
    const k = 0.8 + env.current.lamps * 1.7
    if (light.current) light.current.intensity = (k + Math.sin(state.clock.elapsedTime * 3.1) * 0.12) * on
    if (bulb.current) bulb.current.emissiveIntensity = (0.7 + env.current.lamps * 1.8) * (0.08 + 0.92 * on)
  })
  return (
    <group position={[1.05, 0.78, -1.95]}>
      <mesh position={[0, 0.02, 0]} material={m.metalDark}>
        <cylinderGeometry args={[0.11, 0.13, 0.04, 10]} />
      </mesh>
      <mesh position={[0, 0.22, 0]} material={m.metalDark}>
        <cylinderGeometry args={[0.018, 0.018, 0.42, 6]} />
      </mesh>
      <group position={[-0.12, 0.44, 0.05]} rotation-z={0.5}>
        <mesh material={m.metalDark}>
          <coneGeometry args={[0.13, 0.18, 10, 1, true]} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial ref={bulb} color="#fff2cf" emissive="#ffd28a" emissiveIntensity={2.4} />
        </mesh>
      </group>
      <pointLight ref={light} position={[-0.2, 0.34, 0.16]} distance={2.4} intensity={2.4} color="#ffc98a" />
    </group>
  )
}

function Monitor({ m }: { m: Mats }) {
  const env = useEnv()
  const dash = useTex(() => makeCodeTexture("monitor"), [])
  const screen = useRef<THREE.MeshStandardMaterial>(null)
  useFrame((state) => {
    if (!screen.current) return
    const t = state.clock.elapsedTime
    const night = 1 - env.current.day * 0.5
    screen.current.emissiveIntensity =
      (0.7 + Math.sin(t * 1.7) * 0.1 + (t % 2.6 < 0.1 ? 0.35 : 0)) * (0.7 + night * 0.4)
  })
  return (
    <group position={[-0.56, 0.78, -2.2]} rotation-y={0.28} scale={0.9}>
      <mesh position={[0, 0.26, 0]} material={m.metalDark}>
        <BoxG args={[0.86, 0.5, 0.05]} />
      </mesh>
      <mesh position={[0, 0.26, 0.032]}>
        <planeGeometry args={[0.78, 0.42]} />
        <meshStandardMaterial
          ref={screen}
          map={dash}
          emissiveMap={dash}
          color="#1a2238"
          emissive="#ffffff"
          emissiveIntensity={0.8}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.06, 0]} material={m.metalDark}>
        <BoxG args={[0.1, 0.2, 0.08]} />
      </mesh>
      <mesh position={[0, -0.04, 0]} material={m.metalDark}>
        <BoxG args={[0.36, 0.04, 0.18]} />
      </mesh>
    </group>
  )
}

function Bookshelf({ m }: { m: Mats }) {
  const env = useEnv()
  const catMat = useRef<THREE.MeshStandardMaterial>(null)
  const catLight = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    const l = env.current.lamps
    if (catMat.current) catMat.current.emissiveIntensity = 0.35 + l * 0.9 + Math.sin(state.clock.elapsedTime * 1.6) * 0.05
    if (catLight.current) catLight.current.intensity = 0.15 + l * 0.7
  })
  // Open-front case standing flush against the back wall; the books really are visible now.
  const W = 0.8
  const H = 1.7
  const D = 0.62
  const shelves = [0.06, 0.45, 0.84, 1.23]
  const books = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; c: string; tilt: number }[] = []
    shelves.forEach((y, row) => {
      let x = -W / 2 + 0.06
      let i = 0
      while (x < W / 2 - 0.1) {
        const w = 0.05 + rnd(row * 17 + i * 3.1) * 0.05
        if (x + w > W / 2 - 0.05) break
        if (rnd(row * 5 + i * 7.7) < 0.12) {
          x += 0.11
          i++
          continue
        }
        const h = 0.22 + rnd(row * 11 + i * 2.3) * 0.12
        const lean = row === 1 && i === 5
        out.push({ x: x + w / 2, y: y + 0.02 + h / 2, w, h, c: BOOK_COLORS[(i + row * 2) % BOOK_COLORS.length], tilt: lean ? 0.28 : 0 })
        x += w + 0.008
        i++
      }
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <group position={[2.55, 0, BACK_Z + D / 2]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.02), H / 2, 0]} material={m.woodDark} castShadow>
          <BoxG args={[0.04, H, D]} />
        </mesh>
      ))}
      <mesh position={[0, H / 2, -D / 2 + 0.015]} material={m.wood}>
        <BoxG args={[W, H, 0.03]} />
      </mesh>
      <mesh position={[0, H - 0.02, 0]} material={m.woodDark} castShadow>
        <BoxG args={[W, 0.04, D]} />
      </mesh>
      <mesh position={[0, 0.03, 0.01]} material={m.woodDark}>
        <BoxG args={[W - 0.08, 0.06, D - 0.04]} />
      </mesh>
      {shelves.map((y) => (
        <mesh key={y} position={[0, y, 0.01]} material={m.woodLight}>
          <BoxG args={[W - 0.08, 0.03, D - 0.05]} />
        </mesh>
      ))}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.04]} rotation-z={b.tilt}>
          <BoxG args={[b.w, b.h, 0.34]} />
          <meshStandardMaterial color={b.c} roughness={0.85} />
        </mesh>
      ))}
      {/* White pixel-cat lamp on top — the room's mascot. */}
      <group position={[-0.12, H + 0.11, 0]}>
        <mesh>
          <BoxG args={[0.26, 0.22, 0.2]} />
          <meshStandardMaterial ref={catMat} color="#f4f6ff" emissive="#cfe3ff" emissiveIntensity={0.8} roughness={0.7} />
        </mesh>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, 0.14, 0]}>
            <BoxG args={[0.07, 0.08, 0.07]} />
            <meshStandardMaterial color="#f4f6ff" emissive="#cfe3ff" emissiveIntensity={0.8} />
          </mesh>
        ))}
        {[-0.07, 0.07].map((x) => (
          <mesh key={x} position={[x, 0.04, 0.11]}>
            <BoxG args={[0.04, 0.025, 0.01]} />
            <meshStandardMaterial color="#6fd6ff" emissive="#6fd6ff" emissiveIntensity={2} />
          </mesh>
        ))}
        <pointLight ref={catLight} position={[0, 0.1, 0.25]} distance={1.3} intensity={0.6} color="#bfe0ff" />
      </group>
      <group position={[0.24, H, 0]}>
        <mesh position={[0, 0.07, 0]} material={m.white}>
          <BoxG args={[0.12, 0.14, 0.12]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} material={m.plant}>
          <icosahedronGeometry args={[0.1, 0]} />
        </mesh>
      </group>
    </group>
  )
}

const BED_L = 1.78
const BED_W = 1.28
const NIGHTSTAND = { x: LEFT_X + 0.25, z: -0.8 }

function Bed({ m }: { m: Mats }) {
  const env = useEnv()
  const blanketTex = useTex(() => makeBlanketTexture(m.blanket.color, m.fabricNavy.color), [m])
  const lampMat = useRef<THREE.MeshStandardMaterial>(null)
  const lampLight = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const l = env.current.lamps
    if (lampMat.current) lampMat.current.emissiveIntensity = 0.5 + l * 1.4
    if (lampLight.current) lampLight.current.intensity = 0.15 + l * 0.9
  })
  return (
    <>
      {/* Bed: head against the left wall, long side flush with the back wall. */}
      <group position={[LEFT_X + BED_L / 2, 0, BACK_Z + BED_W / 2]}>
        <mesh position={[0, 0.26, 0]} material={m.woodDark} castShadow>
          <BoxG args={[BED_L, 0.32, BED_W]} />
        </mesh>
        <mesh position={[0, 0.46, 0]} material={m.white}>
          <BoxG args={[BED_L - 0.06, 0.14, BED_W - 0.06]} />
        </mesh>
        <mesh position={[0.2, 0.55, 0]}>
          <BoxG args={[1.32, 0.1, BED_W - 0.04]} />
          <meshStandardMaterial map={blanketTex} color="#ffffff" roughness={0.9} />
        </mesh>
        <mesh position={[-0.62, 0.58, 0]} material={m.white}>
          <BoxG args={[0.5, 0.14, 0.86]} />
        </mesh>
        <mesh position={[-BED_L / 2 + 0.04, 0.5, 0]} material={m.woodDark}>
          <BoxG args={[0.08, 0.62, BED_W + 0.02]} />
        </mesh>
      </group>
      {/* Nightstand: beside the pillow, on the room side, clear of the bed frame. */}
      <group position={[NIGHTSTAND.x, 0, NIGHTSTAND.z]}>
        <mesh position={[0, 0.18, 0]} material={m.wood} castShadow>
          <BoxG args={[0.5, 0.36, 0.46]} />
        </mesh>
        <mesh position={[0, 0.375, 0]} material={m.woodDark}>
          <BoxG args={[0.52, 0.03, 0.48]} />
        </mesh>
        <mesh position={[0.26, 0.2, 0]} material={m.metalDark}>
          <BoxG args={[0.02, 0.03, 0.14]} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <BoxG args={[0.16, 0.16, 0.16]} />
          <meshStandardMaterial ref={lampMat} color="#ffe9c2" emissive="#ffcf8a" emissiveIntensity={1.7} />
        </mesh>
        <pointLight ref={lampLight} position={[0.1, 0.55, 0.1]} distance={1.7} intensity={0.9} color="#ffcf8a" />
      </group>
    </>
  )
}

function Window({ m }: { m: Mats }) {
  const env = useEnv()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const refs = {
    skyBottom: useRef<THREE.MeshBasicMaterial>(null),
    skyTop: useRef<THREE.MeshBasicMaterial>(null),
    starsMat: useRef<THREE.MeshBasicMaterial>(null),
    stars: useRef<THREE.InstancedMesh>(null),
    sunGroup: useRef<THREE.Group>(null),
    sunMat: useRef<THREE.MeshBasicMaterial>(null),
    sunHalo: useRef<THREE.MeshBasicMaterial>(null),
    moonGroup: useRef<THREE.Group>(null),
    moonMat: useRef<THREE.MeshBasicMaterial>(null),
    moonHalo: useRef<THREE.MeshBasicMaterial>(null),
    clouds: useRef<THREE.Group>(null),
    cloudMat: useRef<THREE.MeshBasicMaterial>(null),
    far: useRef<THREE.MeshBasicMaterial>(null),
    near: useRef<THREE.MeshBasicMaterial>(null),
    lights: useRef<THREE.InstancedMesh>(null),
    lightsMat: useRef<THREE.MeshBasicMaterial>(null),
    glow: useRef<THREE.PointLight>(null),
  }
  const gradient = useTex(() => {
    const { c, ctx } = canvas2d(4, 64)
    const g = ctx.createLinearGradient(0, 0, 0, 64)
    g.addColorStop(0, "#ffffff")
    g.addColorStop(0.65, "#000000")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 4, 64)
    return new THREE.CanvasTexture(c)
  }, [])

  const NEAR = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({ x: -0.76 + i * 0.19, h: 0.16 + ((i * 13) % 7) * 0.055 })),
    []
  )
  const FAR = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({ x: -0.72 + i * 0.21, h: 0.3 + ((i * 5) % 6) * 0.05 })),
    []
  )
  const LIGHTS = useMemo(() => {
    const out: [number, number][] = []
    NEAR.forEach((b, bi2) => {
      for (let k = 0; k < 6; k++) {
        const y = 0.05 + Math.floor(k / 2) * 0.075
        if (y > b.h - 0.04 || rnd(bi2 * 11 + k * 3.3) < 0.35) continue
        out.push([b.x + (k % 2 ? 0.045 : -0.045), -0.62 + y])
      }
    })
    return out
  }, [NEAR])

  useLayoutEffect(() => {
    const mesh = refs.lights.current
    if (!mesh) return
    LIGHTS.forEach(([x, y], i) => {
      dummy.position.set(x, y, 0.082)
      dummy.scale.set(0.03, 0.035, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.count = LIGHTS.length
    mesh.instanceMatrix.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LIGHTS, dummy])

  useFrame((state) => {
    const e = env.current
    const t = state.clock.elapsedTime
    refs.skyBottom.current?.color.copy(e.skyBottom)
    refs.skyTop.current?.color.copy(e.skyTop)

    if (refs.starsMat.current) refs.starsMat.current.opacity = e.stars
    const stars = refs.stars.current
    if (stars && e.stars > 0.02) {
      for (let i = 0; i < 18; i++) {
        const twinkle = 0.45 + Math.abs(Math.sin(t * 1.4 + i * 0.9)) * 0.55
        dummy.position.set(-0.7 + (((i * 37) % 100) / 100) * 1.4, 0.2 + (((i * 53) % 100) / 100) * 0.38, 0)
        dummy.scale.setScalar(0.018 * twinkle)
        dummy.updateMatrix()
        stars.setMatrixAt(i, dummy.matrix)
      }
      stars.instanceMatrix.needsUpdate = true
    }

    const sg = refs.sunGroup.current
    if (sg) {
      sg.visible = e.sunVis > 0.01
      sg.position.set(-0.66 + 1.32 * e.sunP, -0.18 + Math.sin(Math.PI * e.sunP) * 0.46, 0.066)
      refs.sunMat.current?.color.copy(e.sunColor).lerp(WHITE, 0.45)
      if (refs.sunMat.current) refs.sunMat.current.opacity = e.sunVis
      refs.sunHalo.current?.color.copy(e.sunColor)
      if (refs.sunHalo.current) refs.sunHalo.current.opacity = 0.3 * e.sunVis
    }
    const mg = refs.moonGroup.current
    if (mg) {
      mg.visible = e.moonVis > 0.01
      mg.position.set(-0.66 + 1.32 * e.moonP, -0.12 + Math.sin(Math.PI * e.moonP) * 0.4, 0.064)
      if (refs.moonMat.current) refs.moonMat.current.opacity = e.moonVis
      if (refs.moonHalo.current) refs.moonHalo.current.opacity = 0.22 * e.moonVis
    }

    const cg = refs.clouds.current
    if (cg) {
      cg.visible = e.day > 0.08
      cg.children.forEach((child, i) => {
        child.position.x = ((t * (0.012 + i * 0.006) + i * 0.8) % 2.4) - 1.2
      })
      if (refs.cloudMat.current) {
        refs.cloudMat.current.opacity = e.day * 0.9
        refs.cloudMat.current.color.copy(e.sunColor).lerp(WHITE, 0.6)
      }
    }

    refs.far.current?.color.copy(e.skyBottom).multiplyScalar(0.84)
    refs.near.current?.color.copy(e.skyBottom).multiplyScalar(0.5)
    if (refs.lightsMat.current) refs.lightsMat.current.opacity = clamp01(1 - e.day * 1.6)
    if (refs.glow.current) {
      refs.glow.current.color.copy(e.skyBottom)
      refs.glow.current.intensity = 0.3 + e.day * 0.3
    }
  })

  return (
    <group position={[-2.9, 1.75, -0.45]} rotation-y={Math.PI / 2}>
      <mesh material={m.woodDark}>
        <BoxG args={[1.9, 1.4, 0.08]} />
      </mesh>

      {/* Sky: flat bottom colour + an alpha-gradient layer for the top colour. */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[1.74, 1.24]} />
        <meshBasicMaterial ref={refs.skyBottom} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.054]}>
        <planeGeometry args={[1.74, 1.24]} />
        <meshBasicMaterial ref={refs.skyTop} alphaMap={gradient} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      <instancedMesh ref={refs.stars} args={[undefined, undefined, 18]} position={[0, 0, 0.058]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={refs.starsMat} color="#dfe8ff" transparent toneMapped={false} />
      </instancedMesh>

      <group ref={refs.moonGroup} position={[0, 0, 0.064]}>
        <mesh>
          <circleGeometry args={[0.16, 18]} />
          <meshBasicMaterial ref={refs.moonHalo} color="#cfd8ff" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <circleGeometry args={[0.065, 14]} />
          <meshBasicMaterial ref={refs.moonMat} color="#f4f1ff" transparent toneMapped={false} />
        </mesh>
      </group>

      <group ref={refs.sunGroup} position={[0, 0, 0.066]}>
        <mesh>
          <circleGeometry args={[0.2, 20]} />
          <meshBasicMaterial ref={refs.sunHalo} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <circleGeometry args={[0.085, 16]} />
          <meshBasicMaterial ref={refs.sunMat} transparent toneMapped={false} />
        </mesh>
      </group>

      {/* Voxel clouds drifting across */}
      <group ref={refs.clouds} position={[0, 0, 0.07]}>
        {[0.22, 0.08, 0.3].map((y, i) => (
          <group key={i} position={[0, y, 0]} scale={0.8 + i * 0.12}>
            <mesh>
              <BoxG args={[0.26, 0.06, 0.01]} />
              <meshBasicMaterial ref={i === 0 ? refs.cloudMat : undefined} color="#ffffff" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[-0.03, 0.05, 0]}>
              <BoxG args={[0.15, 0.05, 0.01]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Skyline: far row, near row, lit windows after dark */}
      {FAR.map((b, i) => (
        <mesh key={`f${i}`} position={[b.x, -0.62 + b.h / 2, 0.074]}>
          <BoxG args={[0.2, b.h, 0.01]} />
          <meshBasicMaterial ref={i === 0 ? refs.far : undefined} color="#9bb0d8" toneMapped={false} />
        </mesh>
      ))}
      {NEAR.map((b, i) => (
        <mesh key={`n${i}`} position={[b.x, -0.62 + b.h / 2, 0.078]}>
          <BoxG args={[0.17, b.h, 0.01]} />
          <meshBasicMaterial ref={i === 0 ? refs.near : undefined} color="#5a6a90" toneMapped={false} />
        </mesh>
      ))}
      <instancedMesh ref={refs.lights} args={[undefined, undefined, 64]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={refs.lightsMat} color="#ffd98a" transparent toneMapped={false} />
      </instancedMesh>

      {/* Frame, mullions, sill */}
      <mesh position={[0, -0.14, 0.105]} material={m.woodDark}>
        <BoxG args={[1.74, 0.035, 0.03]} />
      </mesh>
      <mesh position={[0, 0, 0.105]} material={m.woodDark}>
        <BoxG args={[0.035, 1.24, 0.03]} />
      </mesh>
      <mesh position={[0, -0.72, 0.1]} material={m.woodLight}>
        <BoxG args={[2.0, 0.06, 0.2]} />
      </mesh>

      {/* Blinds, half drawn: top bar, slats and a pull cord */}
      <mesh position={[0, 0.65, 0.115]} material={m.woodDark}>
        <BoxG args={[1.82, 0.07, 0.05]} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, 0.58 - i * 0.05, 0.112]} rotation-x={-0.25} material={m.fabricNavy}>
          <BoxG args={[1.76, 0.034, 0.015]} />
        </mesh>
      ))}
      <mesh position={[0.78, 0.2, 0.112]} material={m.metalDark}>
        <BoxG args={[0.008, 0.42, 0.008]} />
      </mesh>
      <mesh position={[0.78, -0.02, 0.112]} material={m.white}>
        <BoxG args={[0.03, 0.04, 0.03]} />
      </mesh>

      {/* Glass streak */}
      <mesh position={[-0.35, -0.1, 0.118]} rotation-z={0.35}>
        <planeGeometry args={[0.12, 1.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      <pointLight ref={refs.glow} position={[0, 0, 0.6]} distance={2.4} intensity={0.5} color="#4a6ab8" />
    </group>
  )
}

const WIN = { x: -2.9, y: 1.75, z: -0.45 }

/** Light pouring through the window: a striped patch on the floor plus a faint shaft. */
function SunBeam() {
  const env = useEnv()
  const slat = useTex(() => makeSlatTexture(), [])
  const fade = useTex(() => makeFadeTexture(), [])
  const patch = useRef<THREE.Mesh>(null)
  const patchMat = useRef<THREE.MeshBasicMaterial>(null)
  const sheet = useRef<THREE.Mesh>(null)
  const sheetMat = useRef<THREE.MeshBasicMaterial>(null)
  const dir = useMemo(() => new THREE.Vector3(), [])
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3))
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2))
    g.setIndex([0, 1, 2, 2, 1, 3])
    return g
  }, [])
  useEffect(() => () => geom.dispose(), [geom])

  useFrame(() => {
    const e = env.current
    const vis = e.sunVis * smooth(0.25, 0.7, e.day)
    const p = e.sunP
    // Direction towards the sun as seen from the window.
    const elev = (20 + Math.sin(Math.PI * p) * 52) * DEG
    const c = Math.cos(elev)
    dir.set(-c * 0.95, Math.sin(elev), c * lerp(-0.3, 0.35, p)).normalize()
    const k = -dir.x / dir.y
    const kz = -dir.z / dir.y

    // Floor patch: where the window's bottom and top edges land.
    const yNear = WIN.y - 0.62 - 0.075
    const yFar = WIN.y + 0.62 - 0.075
    const near = WIN.x + k * yNear
    const farFull = WIN.x + k * yFar
    const far = Math.min(farFull, 2.95)
    const len = far - near
    const zc = clamp(WIN.z + kz * (WIN.y - 0.075), -1.55, 1.55)
    const show = vis > 0.02 && len > 0.05
    if (patch.current && patchMat.current) {
      patch.current.visible = show
      if (show) {
        patch.current.position.set((near + far) / 2, 0.075, zc)
        patch.current.scale.set(len, 1.74, 1)
        slat.repeat.x = clamp01(len / (farFull - near))
        patchMat.current.color.copy(e.sunColor)
        patchMat.current.opacity = 0.5 * vis
      }
    }

    // Shaft: one slanted sheet along the centre ray.
    const ay = WIN.y + 0.5
    const ax = WIN.x + 0.05
    let t = (ay - 0.09) / dir.y
    const exFull = ax - dir.x * t
    if (exFull > 2.95) t = (2.95 - ax) / -dir.x
    const ex = ax - dir.x * t
    const ey = ay - dir.y * t
    const ez = clamp(WIN.z - dir.z * t, -2.3, 2.3)
    const pos = geom.getAttribute("position") as THREE.BufferAttribute
    const hw = 0.8
    pos.setXYZ(0, ax, ay, WIN.z - hw)
    pos.setXYZ(1, ax, ay, WIN.z + hw)
    pos.setXYZ(2, ex, ey, ez - hw)
    pos.setXYZ(3, ex, ey, ez + hw)
    pos.needsUpdate = true
    if (sheet.current) sheet.current.visible = vis > 0.02
    if (sheetMat.current) {
      sheetMat.current.color.copy(e.sunColor)
      sheetMat.current.opacity = 0.17 * vis
    }
  })

  return (
    <>
      <mesh ref={patch} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={patchMat}
          map={slat}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={sheet} geometry={geom} frustumCulled={false}>
        <meshBasicMaterial
          ref={sheetMat}
          alphaMap={fade}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </>
  )
}

function Clock({ m }: { m: Mats }) {
  const clock = useContext(ClockCtx)
  const hourHand = useRef<THREE.Group>(null)
  const minHand = useRef<THREE.Group>(null)
  const secHand = useRef<THREE.Group>(null)
  const date = useMemo(() => new Date(), [])
  useFrame((state) => {
    const c = clock.current
    let hours: number
    let minutes: number
    let seconds: number
    if (c.live) {
      date.setTime(Date.now())
      seconds = date.getSeconds() + date.getMilliseconds() / 1000
      minutes = date.getMinutes() + seconds / 60
      hours = (date.getHours() % 12) + minutes / 60
    } else {
      hours = c.hour % 12
      minutes = (c.hour % 1) * 60
      seconds = state.clock.elapsedTime % 60
    }
    if (hourHand.current) hourHand.current.rotation.z = -(hours / 12) * Math.PI * 2
    if (minHand.current) minHand.current.rotation.z = -(minutes / 60) * Math.PI * 2
    if (secHand.current) secHand.current.rotation.z = -(seconds / 60) * Math.PI * 2
  })
  return (
    <group position={[1.05, 2.52, -ROOM_D / 2 + 0.12]}>
      <mesh rotation-x={Math.PI / 2} material={m.woodDark}>
        <cylinderGeometry args={[0.19, 0.19, 0.04, 16]} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <circleGeometry args={[0.16, 20]} />
        <meshStandardMaterial color="#f6f1e6" roughness={0.7} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        const big = i % 3 === 0
        return (
          <mesh key={i} position={[Math.sin(a) * 0.13, Math.cos(a) * 0.13, 0.03]} rotation-z={-a}>
            <BoxG args={[big ? 0.012 : 0.007, big ? 0.03 : 0.018, 0.004]} />
            <meshStandardMaterial color="#3a3350" />
          </mesh>
        )
      })}
      <group ref={hourHand} position={[0, 0, 0.036]}>
        <mesh position={[0, 0.03, 0]}>
          <BoxG args={[0.016, 0.075, 0.006]} />
          <meshStandardMaterial color="#2a2540" />
        </mesh>
      </group>
      <group ref={minHand} position={[0, 0, 0.042]}>
        <mesh position={[0, 0.045, 0]}>
          <BoxG args={[0.011, 0.11, 0.006]} />
          <meshStandardMaterial color="#2a2540" />
        </mesh>
      </group>
      <group ref={secHand} position={[0, 0, 0.048]}>
        <mesh position={[0, 0.05, 0]}>
          <BoxG args={[0.005, 0.12, 0.004]} />
          <meshStandardMaterial color="#e0555f" emissive="#e0555f" emissiveIntensity={0.4} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.052]}>
        <cylinderGeometry args={[0.012, 0.012, 0.008, 8]} />
        <meshStandardMaterial color="#e0555f" />
      </mesh>
    </group>
  )
}

function Poster({
  tex, size, position, tilt = 0, frame,
}: {
  tex: THREE.Texture
  size: [number, number]
  position: [number, number, number]
  tilt?: number
  frame: string
}) {
  return (
    <group position={position} rotation-z={tilt}>
      <mesh>
        <boxGeometry args={[size[0] + 0.04, size[1] + 0.04, 0.03]} />
        <meshStandardMaterial color={frame} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={size} />
        <meshStandardMaterial map={tex} roughness={0.9} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.18} />
      </mesh>
    </group>
  )
}

function WallDecor({ m }: { m: Mats }) {
  const dream = useTex(() => makeDreamPoster(), [])
  const planet = useTex(() => makePlanetPoster(), [])
  const ledMat = useRef<THREE.MeshStandardMaterial>(null)
  const ledMat2 = useRef<THREE.MeshStandardMaterial>(null)
  const env = useEnv()
  const backZ = -ROOM_D / 2 + 0.09

  useFrame(() => {
    const v = 0.6 + env.current.lamps * 1.6
    if (ledMat.current) ledMat.current.emissiveIntensity = v
    if (ledMat2.current) ledMat2.current.emissiveIntensity = v
  })

  const ledHex = `#${m.led.color.getHexString()}`

  return (
    <group>
      <Poster tex={dream} size={[0.58, 0.82]} position={[-2.2, 2.05, backZ]} frame="#151a2e" />
      <Poster tex={planet} size={[0.38, 0.38]} position={[-1.62, 1.86, backZ]} tilt={0.04} frame="#1c2440" />

      {/* Shelf above the desk — LED strip, books, pixel figure, hanging plant */}
      <group position={[-0.55, 2.15, WALL_Z + 0.13]}>
        <mesh material={m.wood} castShadow>
          <BoxG args={[1.5, 0.06, 0.26]} />
        </mesh>
        <mesh position={[0, -0.045, 0.1]}>
          <BoxG args={[1.46, 0.02, 0.03]} />
          <meshStandardMaterial ref={ledMat} color={ledHex} emissive={ledHex} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        {BOOK_COLORS.slice(0, 5).map((c, i) => (
          <mesh
            key={c}
            position={[-0.5 + i * 0.11, 0.13, 0]}
            rotation-z={(i % 2 === 0 ? 1 : -1) * 0.03}
          >
            <BoxG args={[0.08, 0.2, 0.2]} />
            <meshStandardMaterial color={c} roughness={0.85} />
          </mesh>
        ))}
        {/* Pixel figure */}
        <group position={[0.1, 0.03, 0.02]}>
          <mesh position={[0, 0.05, 0]} material={m.fabricBlue}>
            <BoxG args={[0.07, 0.08, 0.05]} />
          </mesh>
          <mesh position={[0, 0.12, 0]} material={m.skin}>
            <BoxG args={[0.07, 0.07, 0.06]} />
          </mesh>
          <mesh position={[0, 0.165, 0]} material={m.hair}>
            <BoxG args={[0.075, 0.03, 0.065]} />
          </mesh>
        </group>
        <mesh position={[0.55, 0.1, 0]} material={m.accent2}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 8]} />
        </mesh>
        <mesh position={[0.55, 0.24, 0]} material={m.plant}>
          <icosahedronGeometry args={[0.1, 0]} />
        </mesh>
        {/* Hanging vine */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh
            key={i}
            position={[-0.72 + Math.sin(i * 1.7) * 0.025, -0.07 - i * 0.1, 0.05]}
            material={i % 2 ? m.plant : m.plantDark}
          >
            <BoxG args={[0.07, 0.09, 0.04]} />
          </mesh>
        ))}
      </group>
      <WallGlow position={[-0.55, 1.82, -ROOM_D / 2 + 0.075]} size={[1.5, 0.7]} color={ledHex} />

      {/* Second shelf above the bed */}
      <group position={[-2.35, 2.75, WALL_Z + 0.13]}>
        <mesh material={m.wood} castShadow>
          <BoxG args={[1.1, 0.06, 0.26]} />
        </mesh>
        <mesh position={[0, -0.045, 0.1]}>
          <BoxG args={[1.06, 0.02, 0.03]} />
          <meshStandardMaterial ref={ledMat2} color={ledHex} emissive={ledHex} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        {[BOOK_COLORS[1], BOOK_COLORS[3], BOOK_COLORS[0], BOOK_COLORS[5]].map((c, i) => (
          <mesh key={i} position={[0.1 + i * 0.1, 0.13, 0]} rotation-z={(i % 2 ? -1 : 1) * 0.04}>
            <BoxG args={[0.08, 0.2 + (i % 2) * 0.03, 0.2]} />
            <meshStandardMaterial color={c} roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[-0.35, 0.09, 0]} material={m.white}>
          <BoxG args={[0.14, 0.12, 0.14]} />
        </mesh>
        <mesh position={[-0.35, 0.22, 0]} material={m.plant}>
          <icosahedronGeometry args={[0.11, 0]} />
        </mesh>
        <mesh position={[-0.2, 0.06, 0.02]} material={m.accent2}>
          <BoxG args={[0.06, 0.06, 0.06]} />
        </mesh>
      </group>
      <WallGlow position={[-2.35, 2.45, -ROOM_D / 2 + 0.075]} size={[1.1, 0.6]} color={ledHex} strength={0.8} />

      {/* Cork board above the laptop */}
      <group position={[0.35, 1.62, -ROOM_D / 2 + 0.1]}>
        <mesh material={m.woodDark}>
          <BoxG args={[1.3, 0.76, 0.03]} />
        </mesh>
        <mesh position={[0, 0, 0.02]} material={m.cork}>
          <BoxG args={[1.22, 0.68, 0.02]} />
        </mesh>
        {[
          ["#ffe066", -0.42, 0.18, 0.05],
          ["#ff9a76", -0.18, 0.05, -0.06],
          ["#8ad4ff", 0.1, 0.2, 0.04],
          ["#b8f0b0", 0.38, 0.06, -0.05],
          ["#ffe066", 0.22, -0.18, 0.06],
          ["#d9b8ff", -0.32, -0.17, -0.04],
        ].map(([c, x, y, r], i) => (
          <mesh key={i} position={[x as number, y as number, 0.035]} rotation-z={r as number}>
            <planeGeometry args={[0.15, 0.15]} />
            <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={0.2} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Whiteboard with sticky notes */}
      <group position={[WALL_X + 0.02, 1.95, 1.25]} rotation-y={Math.PI / 2}>
        <mesh>
          <BoxG args={[1.15, 0.72, 0.03]} />
          <meshStandardMaterial color="#f4f6f8" roughness={0.75} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={`line-${i}`} position={[-0.35, 0.16 - i * 0.14, 0.02]}>
            <planeGeometry args={[0.36, 0.02]} />
            <meshStandardMaterial color="#8a96a8" toneMapped={false} />
          </mesh>
        ))}
        {["#ffe066", "#ff9a76", "#8ad4ff"].map((c, i) => (
          <mesh key={c} position={[0.24 + i * 0.16, 0.14 - (i % 2) * 0.26, 0.02]} rotation-z={(i - 1) * 0.06}>
            <planeGeometry args={[0.12, 0.12]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.25} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <Clock m={m} />
    </group>
  )
}

const FRIDGE = { x: 1.72, z: BACK_Z + 0.62 * 0.36 + 0.01 }

function Fridge({ m }: { m: Mats }) {
  const brain = useBrain()
  const door = useRef<THREE.Group>(null)
  const inner = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const open = brain.current.fridge
    if (door.current) door.current.rotation.y = -1.15 * open
    if (inner.current) inner.current.intensity = open * 0.9
  })
  return (
    <group position={[FRIDGE.x, 0, FRIDGE.z]} scale={0.72}>
      <mesh position={[0, 0.72, 0]} material={m.white} castShadow>
        <BoxG args={[0.76, 1.44, 0.62]} />
      </mesh>
      {/* Inside: shows once the door swings open */}
      <mesh position={[0, 0.72, 0.305]}>
        <BoxG args={[0.66, 1.3, 0.03]} />
        <meshStandardMaterial color="#e9f3f6" emissive="#bfe6f0" emissiveIntensity={0.25} roughness={0.7} />
      </mesh>
      {[0.3, 0.62, 0.94, 1.22].map((y) => (
        <mesh key={y} position={[0, y, 0.34]} material={m.metal}>
          <BoxG args={[0.66, 0.02, 0.1]} />
        </mesh>
      ))}
      {[-0.2, 0, 0.2].map((x, i) => (
        <mesh key={x} position={[x, 0.7, 0.35]}>
          <cylinderGeometry args={[0.035, 0.035, 0.1, 8]} />
          <meshStandardMaterial color={i === 1 ? "#d9443b" : "#e0a53f"} roughness={0.45} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0.1, 1.0, 0.35]}>
        <BoxG args={[0.14, 0.14, 0.08]} />
        <meshStandardMaterial color="#8ad4ff" roughness={0.6} />
      </mesh>
      <pointLight ref={inner} position={[0, 0.8, 0.5]} distance={1.4} intensity={0} color="#dff6ff" />
      {/* Cardboard box on top */}
      <mesh position={[0.05, 1.52, 0]} material={m.woodLight}>
        <BoxG args={[0.5, 0.16, 0.4]} />
      </mesh>
      <group ref={door} position={[-0.38, 0.72, 0.34]}>
        <mesh position={[0.38, 0, 0]} material={m.white}>
          <BoxG args={[0.76, 1.4, 0.06]} />
        </mesh>
        <mesh position={[0.38, 0.28, 0.04]} material={m.metal}>
          <BoxG args={[0.76, 0.02, 0.02]} />
        </mesh>
        <mesh position={[0.62, 0.46, 0.06]} material={m.metalDark}>
          <BoxG args={[0.04, 0.2, 0.04]} />
        </mesh>
        <mesh position={[0.62, 0.1, 0.06]} material={m.metalDark}>
          <BoxG args={[0.04, 0.3, 0.04]} />
        </mesh>
        {[
          ["#ffe066", 0.5, -0.2, 0.05],
          ["#ff9a76", 0.66, -0.42, -0.08],
          ["#8ad4ff", 0.58, 0.55, 0.06],
        ].map(([c, x, y, r], i) => (
          <mesh key={i} position={[x as number, y as number, 0.034]} rotation-z={r as number}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={0.3} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.02, 0]} material={m.metalDark}>
        <BoxG args={[0.7, 0.04, 0.56]} />
      </mesh>
    </group>
  )
}

function FoodTable({ m }: { m: Mats }) {
  const steam = useRef<THREE.Group>(null)
  useFrame((state) => {
    const g = steam.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.children.forEach((child, i) => {
      const phase = (t * 0.28 + i / 3) % 1
      child.position.set(Math.sin(t * 1.3 + i * 2.1) * 0.025, phase * 0.32, Math.cos(t + i) * 0.015)
      const mesh = child as THREE.Mesh
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(phase * Math.PI) * 0.45
      mesh.scale.setScalar(0.7 + phase * 0.8)
    })
  })
  return (
    <group position={[1.35, 0, 0.95]}>
      <mesh position={[0, 0.3, 0]} material={m.wood} castShadow>
        <BoxG args={[0.96, 0.07, 0.66]} />
      </mesh>
      {[[-0.38, 0.24], [0.38, 0.24], [-0.38, -0.24], [0.38, -0.24]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.13, z]} material={m.woodDark}>
          <BoxG args={[0.06, 0.26, 0.06]} />
        </mesh>
      ))}
      {/* Ramen bowl */}
      <group position={[0, 0.36, 0.14]}>
        <mesh material={m.white} castShadow>
          <cylinderGeometry args={[0.18, 0.12, 0.1, 14]} />
        </mesh>
        <mesh position={[0, 0.056, 0]}>
          <cylinderGeometry args={[0.155, 0.155, 0.02, 14]} />
          <meshStandardMaterial color="#e3b04b" roughness={0.8} />
        </mesh>
        <mesh position={[-0.05, 0.075, 0.03]}>
          <BoxG args={[0.06, 0.02, 0.06]} />
          <meshStandardMaterial color="#f5efe0" />
        </mesh>
        <mesh position={[0.05, 0.075, -0.03]}>
          <BoxG args={[0.05, 0.02, 0.05]} />
          <meshStandardMaterial color="#6fa85a" />
        </mesh>
        <mesh position={[0.1, 0.14, 0]} rotation-z={0.5} material={m.woodDark}>
          <BoxG args={[0.22, 0.012, 0.012]} />
        </mesh>
        <group ref={steam} position={[0, 0.1, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}>
              <BoxG args={[0.04, 0.05, 0.04]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
      {/* Soda can */}
      <mesh position={[0.3, 0.4, 0.0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 10]} />
        <meshStandardMaterial color="#d9443b" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Snack boxes */}
      <mesh position={[0.34, 0.4, -0.16]} material={m.accent}>
        <BoxG args={[0.18, 0.14, 0.14]} />
      </mesh>
      <mesh position={[0.3, 0.52, -0.14]} rotation-y={0.3}>
        <BoxG args={[0.14, 0.1, 0.12]} />
        <meshStandardMaterial color="#e0553f" roughness={0.8} />
      </mesh>
      {/* Bean bag */}
      <mesh position={[0, 0.17, 0.75]} scale={[1, 0.58, 1]} material={m.bean} castShadow>
        <icosahedronGeometry args={[0.38, 1]} />
      </mesh>
    </group>
  )
}

function Plants({ m }: { m: Mats }) {
  const sway = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (sway.current) sway.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.04
  })
  return (
    <group>
      <group position={[-2.65, 0, 2.05]}>
        <mesh position={[0, 0.18, 0]} material={m.white} castShadow>
          <BoxG args={[0.34, 0.36, 0.34]} />
        </mesh>
        <group ref={sway} position={[0, 0.36, 0]}>
          <mesh position={[0, 0.24, 0]} material={m.plantDark}>
            <cylinderGeometry args={[0.03, 0.04, 0.5, 6]} />
          </mesh>
          {Array.from({ length: 9 }).map((_, i) => {
            const a = (i / 9) * Math.PI * 2
            const upper = i % 2
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * (upper ? 0.1 : 0.17), 0.36 + upper * 0.2 + (i % 3) * 0.04, Math.sin(a) * (upper ? 0.1 : 0.17)]}
                rotation-z={Math.cos(a) * 0.55}
                rotation-x={Math.sin(a) * 0.55}
                material={upper ? m.plant : m.plantDark}
              >
                <BoxG args={[0.24, 0.05, 0.1]} />
              </mesh>
            )
          })}
        </group>
      </group>
      <group position={[1.1, 0.78, -1.68]}>
        <mesh position={[0, 0.05, 0]} material={m.white}>
          <cylinderGeometry args={[0.055, 0.05, 0.1, 8]} />
        </mesh>
        <mesh position={[0, 0.15, 0]} material={m.plant}>
          <capsuleGeometry args={[0.04, 0.1, 3, 6]} />
        </mesh>
      </group>
    </group>
  )
}

function Backpack({ m }: { m: Mats }) {
  return (
    <group position={[-1.0, 0.05, 0.55]} rotation-y={0.5}>
      <mesh position={[0, 0.24, 0]} material={m.metalDark} castShadow>
        <BoxG args={[0.34, 0.48, 0.22]} />
      </mesh>
      <mesh position={[0.16, 0.16, 0]} material={m.fabricNavy}>
        <BoxG args={[0.14, 0.2, 0.2]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={m.fabricNavy}>
        <BoxG args={[0.1, 0.04, 0.05]} />
      </mesh>
      <mesh position={[0, 0.32, 0.115]}>
        <planeGeometry args={[0.1, 0.1]} />
        <meshStandardMaterial color="#9fe0d0" emissive="#9fe0d0" emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
    </group>
  )
}

function TrashBin({ m }: { m: Mats }) {
  return (
    <group position={[-0.88, 0, -1.2]}>
      <mesh position={[0, 0.16, 0]} material={m.fabricNavy} castShadow>
        <BoxG args={[0.26, 0.32, 0.26]} />
      </mesh>
      <mesh position={[0, 0.325, 0]} material={m.metalDark}>
        <BoxG args={[0.2, 0.02, 0.2]} />
      </mesh>
      <mesh position={[0.02, 0.37, 0]} rotation-z={0.3}>
        <BoxG args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#f4efe6" />
      </mesh>
    </group>
  )
}

/** Headphone stand + console, now on a little side table instead of floating above the floor. */
function Accessories({ m }: { m: Mats }) {
  const head = useRef<THREE.Group>(null)
  const led = useRef<THREE.MeshStandardMaterial>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (head.current) head.current.rotation.y = t * 0.45
    if (led.current) led.current.emissiveIntensity = 1.4 + Math.sin(t * 4) * 0.8
  })
  return (
    <group position={[SIDE_X, 0, SIDE_Z]}>
      <mesh position={[0, 0.03, 0]} material={m.woodDark}>
        <cylinderGeometry args={[0.2, 0.22, 0.06, 14]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={m.woodDark}>
        <cylinderGeometry args={[0.04, 0.04, 0.34, 8]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={m.wood} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
      </mesh>
      <group position={[-0.08, 0.42, -0.04]}>
        <mesh position={[0, 0.015, 0]} material={m.metalDark}>
          <cylinderGeometry args={[0.1, 0.12, 0.03, 10]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} material={m.metalDark}>
          <cylinderGeometry args={[0.018, 0.018, 0.3, 6]} />
        </mesh>
        <group ref={head} position={[0, 0.34, 0]}>
          <mesh material={m.fabricBlue}>
            <torusGeometry args={[0.13, 0.022, 8, 18, Math.PI]} />
          </mesh>
          <mesh position={[-0.13, -0.02, 0]} material={m.accent2}>
            <cylinderGeometry args={[0.05, 0.05, 0.05, 10]} />
          </mesh>
          <mesh position={[0.13, -0.02, 0]} material={m.accent2}>
            <cylinderGeometry args={[0.05, 0.05, 0.05, 10]} />
          </mesh>
        </group>
      </group>
      <group position={[0.14, 0.455, 0.12]} rotation-y={-0.4}>
        <mesh material={m.metalDark}>
          <BoxG args={[0.22, 0.06, 0.13]} />
        </mesh>
        <mesh position={[-0.06, 0.04, 0]} material={m.accent}>
          <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
        </mesh>
        <mesh position={[0.06, 0.04, 0]}>
          <BoxG args={[0.05, 0.012, 0.012]} />
          <meshStandardMaterial ref={led} color="#7fe3ff" emissive="#7fe3ff" emissiveIntensity={1.5} />
        </mesh>
      </group>
    </group>
  )
}

function Carpet({ m }: { m: Mats }) {
  const tex = useTex(() => makeCarpetTexture(m.carpet.color, m.carpetEdge.color), [m])
  return (
    <mesh position={[0.1, 0.047, 0.15]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[3.1, 2.2]} />
      <meshStandardMaterial map={tex} color="#ffffff" roughness={0.95} />
    </mesh>
  )
}

function DecorCubes({ m }: { m: Mats }) {
  const g = useRef<THREE.Group>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!g.current) return
    g.current.children.forEach((child, i) => {
      child.position.y = 0.12 + Math.sin(t * 1.1 + i * 1.7) * 0.05
      child.rotation.y = t * (0.3 + i * 0.1)
    })
  })
  return (
    <group ref={g}>
      <mesh position={[-1.9, 0.12, 2.2]} material={m.white}>
        <BoxG args={[0.16, 0.16, 0.16]} />
      </mesh>
      <mesh position={[2.8, 0.12, 1.6]} material={m.accent}>
        <BoxG args={[0.13, 0.13, 0.13]} />
      </mesh>
      <mesh position={[1.9, 0.12, 2.2]} material={m.accent2}>
        <BoxG args={[0.14, 0.14, 0.14]} />
      </mesh>
    </group>
  )
}

/* ───────────────────────── soft shadows, dust, camera ────────────────────── */

/** Cheap ambient occlusion: dark soft blobs under furniture and along the walls. */
function ContactShadows() {
  const blob = useTex(() => {
    const { c, ctx } = canvas2d(64, 64)
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, "#ffffff")
    g.addColorStop(0.55, "#777777")
    g.addColorStop(1, "#000000")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])
  const fade = useTex(() => makeFadeTexture(), [])
  const items: [number, number, number, number, number][] = [
    [-1.975, -1.725, 2.2, 1.8, 0.5], // bed
    [-2.615, -0.8, 0.9, 0.8, 0.4], // nightstand
    [0.2, -1.95, 2.6, 1.3, 0.42], // desk
    [2.55, -2.05, 1.3, 1.1, 0.5], // bookshelf
    [1.72, -2.12, 0.95, 0.85, 0.45], // fridge
    [1.35, 0.95, 1.6, 1.2, 0.4], // table
    [1.35, 1.7, 1.1, 1.1, 0.4], // bean bag
    [-2.65, 2.05, 0.9, 0.9, 0.4], // plant
    [-1.0, 0.55, 0.6, 0.5, 0.35], // backpack
    [-0.88, -1.2, 0.5, 0.5, 0.35], // bin
    [SIDE_X, SIDE_Z, 0.9, 0.9, 0.35], // side table
  ]
  const mat = (o: number) => (
    <meshBasicMaterial color="#000000" alphaMap={blob} transparent opacity={o} depthWrite={false} toneMapped={false} />
  )
  return (
    <group>
      {items.map(([x, z, w, d, o], i) => (
        <mesh key={i} position={[x, 0.052, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[w, d]} />
          {mat(o)}
        </mesh>
      ))}
      {/* Where the floor meets the two walls */}
      <mesh position={[0, 0.053, -ROOM_D / 2 + 0.3]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[ROOM_W, 0.6]} />
        <meshBasicMaterial color="#000000" alphaMap={fade} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
      <group position={[-ROOM_W / 2 + 0.3, 0.053, 0]} rotation-y={Math.PI / 2}>
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[ROOM_D, 0.6]} />
          <meshBasicMaterial color="#000000" alphaMap={fade} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/** Dust drifting through the sunbeam — only shows while the sun is out. */
function DustMotes() {
  const env = useEnv()
  const mesh = useRef<THREE.InstancedMesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: -2.4 + rnd(i * 1.7) * 2.6,
        y: 0.6 + rnd(i * 3.1) * 1.7,
        z: -1.4 + rnd(i * 5.3) * 2.2,
        s: 0.4 + rnd(i * 7.7),
        p: rnd(i * 9.1) * 6.28,
      })),
    []
  )
  useFrame((state) => {
    const e = env.current
    const vis = e.sunVis * smooth(0.25, 0.7, e.day)
    const mm = mesh.current
    if (!mm) return
    mm.visible = vis > 0.02
    if (!mm.visible) return
    if (mat.current) {
      mat.current.opacity = 0.6 * vis
      mat.current.color.copy(e.sunColor)
    }
    const t = state.clock.elapsedTime
    seeds.forEach((d, i) => {
      dummy.position.set(
        d.x + Math.sin(t * 0.2 * d.s + d.p) * 0.25,
        d.y + Math.sin(t * 0.15 * d.s + d.p * 1.3) * 0.15,
        d.z + Math.cos(t * 0.18 * d.s + d.p) * 0.2
      )
      dummy.scale.setScalar(0.012 * (0.6 + 0.4 * Math.sin(t * d.s + d.p)))
      dummy.updateMatrix()
      mm.setMatrixAt(i, dummy.matrix)
    })
    mm.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 26]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial ref={mat} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </instancedMesh>
  )
}

/* ───────────────────────────── camera rig ───────────────────────────────── */

type CamTarget = { position: THREE.Vector3; lookAt: THREE.Vector3 }

// A slightly higher, wider three-quarter view so the whole diorama sits inside
// the frame with air around it.
const HOME_CAM: CamTarget = {
  position: new THREE.Vector3(5.4, 4.4, 6.2),
  lookAt: new THREE.Vector3(-0.15, 0.95, -0.55),
}

// Per-object camera presets — a tight-but-complete look at the focused object,
// keeping its neighbouring context in frame.
const CAM_PRESETS: Partial<Record<RoomHotspotId, CamTarget>> = {
  laptop: { position: new THREE.Vector3(3.0, 2.7, 3.2), lookAt: new THREE.Vector3(0.2, 1.1, -1.6) },
  lamp: { position: new THREE.Vector3(4.4, 3.0, 3.2), lookAt: new THREE.Vector3(1.0, 1.3, -1.9) },
  monitor: { position: new THREE.Vector3(2.6, 2.9, 3.6), lookAt: new THREE.Vector3(-0.56, 1.2, -2.2) },
  shelf: { position: new THREE.Vector3(5.0, 3.0, 2.2), lookAt: new THREE.Vector3(2.55, 1.2, -2.05) },
  bed: { position: new THREE.Vector3(1.6, 3.0, 3.0), lookAt: new THREE.Vector3(-1.95, 0.7, -1.72) },
  fridge: { position: new THREE.Vector3(4.6, 2.9, 2.0), lookAt: new THREE.Vector3(1.72, 0.9, -2.0) },
  food: { position: new THREE.Vector3(4.6, 2.9, 4.6), lookAt: new THREE.Vector3(1.35, 0.5, 0.95) },
  window: { position: new THREE.Vector3(2.4, 3.0, 2.6), lookAt: new THREE.Vector3(-2.85, 1.8, -0.45) },
  clock: { position: new THREE.Vector3(4.0, 3.4, 3.0), lookAt: new THREE.Vector3(1.05, 2.5, -2.3) },
  posters: { position: new THREE.Vector3(2.0, 3.2, 3.0), lookAt: new THREE.Vector3(-1.9, 2.0, -2.3) },
  plant: { position: new THREE.Vector3(1.0, 2.8, 5.0), lookAt: new THREE.Vector3(-2.65, 0.7, 2.05) },
  backpack: { position: new THREE.Vector3(2.8, 2.8, 4.0), lookAt: new THREE.Vector3(-1.0, 0.35, 0.55) },
  whiteboard: { position: new THREE.Vector3(1.2, 3.0, 4.2), lookAt: new THREE.Vector3(-2.8, 1.6, 1.25) },
  carpet: { position: new THREE.Vector3(3.4, 4.2, 4.2), lookAt: new THREE.Vector3(0.1, 0.1, 0.2) },
  accessories: { position: new THREE.Vector3(5.2, 2.6, 3.0), lookAt: new THREE.Vector3(2.45, 0.6, 0.55) },
}

interface DragState {
  dragging: boolean
  lastX: number
  lastY: number
  lastT: number
  /** Smoothed values the camera actually uses… */
  yaw: number
  pitch: number
  /** …chasing the values the pointer sets. */
  yawT: number
  pitchT: number
  /** Release velocity (rad/s) so a flick keeps coasting. */
  vx: number
  vy: number
  idleUntil: number
  zoom: number
  zoomTarget: number
}

const YAW_LIMIT = 1.1
const _off = new THREE.Vector3()
const _tgt = new THREE.Vector3()
const Y_AXIS = new THREE.Vector3(0, 1, 0)

function CameraRig({
  focus, drag, reduced,
}: {
  focus: RoomHotspotId | null
  drag: RefObject<DragState>
  reduced: boolean
}) {
  const look = useRef(HOME_CAM.lookAt.clone())
  const offset = useMemo(() => HOME_CAM.position.clone().sub(HOME_CAM.lookAt), [])
  const lastFocus = useRef<{ id: RoomHotspotId | null; at: number }>({ id: null, at: -10 })

  useFrame(({ camera }, dt) => {
    const step = Math.min(dt, 0.1)
    const d = drag.current
    const now = performance.now() / 1000
    const focused = focus && CAM_PRESETS[focus] ? CAM_PRESETS[focus]! : null

    if (lastFocus.current.id !== focus) lastFocus.current = { id: focus, at: now }
    // Fly gently for a moment after the focus changes, then track tightly.
    const settling = now - lastFocus.current.at < 1.4

    if (!d.dragging) {
      // A flick keeps coasting, then the view drifts back to the hero framing.
      d.yawT = clamp(d.yawT + d.vx * step, -YAW_LIMIT, YAW_LIMIT)
      d.pitchT = clamp(d.pitchT + d.vy * step, -0.5, 0.6)
      const decay = Math.exp(-3.5 * step)
      d.vx *= decay
      d.vy *= decay
      if (now > d.idleUntil) {
        d.yawT = THREE.MathUtils.damp(d.yawT, 0, 0.7, step)
        d.pitchT = THREE.MathUtils.damp(d.pitchT, 0, 0.7, step)
      }
    }
    d.yaw = THREE.MathUtils.damp(d.yaw, d.yawT, 10, step)
    d.pitch = THREE.MathUtils.damp(d.pitch, d.pitchT, 10, step)
    d.zoom = THREE.MathUtils.damp(d.zoom, d.zoomTarget, 6, step)

    if (focused) {
      const k = 1 - Math.exp(-3.2 * step)
      camera.position.lerp(focused.position, k)
      look.current.lerp(focused.lookAt, k)
    } else {
      const drift = !reduced && !d.dragging ? Math.sin(now * 0.28) * 0.035 : 0
      _off.copy(offset).applyAxisAngle(Y_AXIS, d.yaw + drift).multiplyScalar(d.zoom)
      _off.y += d.pitch * 3 + (reduced ? 0 : Math.sin(now * 0.45) * 0.05)
      _tgt.copy(HOME_CAM.lookAt).add(_off)
      const k = 1 - Math.exp(-(settling ? 3.2 : 9) * step)
      camera.position.lerp(_tgt, k)
      look.current.lerp(HOME_CAM.lookAt, 1 - Math.exp(-(settling ? 3.2 : 6) * step))
    }
    camera.lookAt(look.current)
  })
  return null
}

/* ─────────────────────────────── scene root ─────────────────────────────── */

interface RoomWorldProps {
  identity: Identity
  hour: number
  clock: { current: ClockState }
  hovered: RoomHotspotId | null
  selected: RoomHotspotId | null
  onHover: (id: RoomHotspotId | null) => void
  onSelect: (id: RoomHotspotId) => void
  drag: RefObject<DragState>
  reduced: boolean
  command: RefObject<Command>
  onActivity: (id: RoomHotspotId) => void
}

function RoomWorld({
  identity, hour, clock, hovered, selected, onHover, onSelect, drag, reduced, command, onActivity,
}: RoomWorldProps) {
  const [brain] = useState<BrainRef>(() => ({ current: createBrain() }))
  const m = useMemo(() => makeMats(identity), [identity])

  // Dispose the previous palette once it is no longer mounted.
  const previous = useRef<Mats | null>(null)
  useEffect(() => {
    const old = previous.current
    previous.current = m
    return () => {
      if (old) Object.values(old).forEach((mat) => mat.dispose())
    }
  }, [m])

  // `env` is the live, damped state every part reads; `target` is where the
  // clock says it should be heading.
  const [env] = useState<EnvRef>(() => ({ current: sampleEnv(hour) }))
  const target = useMemo(() => sampleEnv(hour), [hour])
  const targetRef = useRef(target)
  targetRef.current = target

  const spot = (id: RoomHotspotId) => ({ id, hovered, selected, onHover, onSelect })

  return (
    <EnvCtx.Provider value={env}>
      <BrainCtx.Provider value={brain}>
      <ClockCtx.Provider value={clock}>
        <ReducedCtx.Provider value={reduced}>
        <EnvDriver target={targetRef} />
        <Lighting />

        <Room m={m} />
        <Carpet m={m} />
        <SunBeam />
        <DustMotes />
        <ContactShadows />

        <Hotspot {...spot("bed")}><Bed m={m} /></Hotspot>
        <TrashBin m={m} />
        <Desk m={m} />
        <Avatar m={m} command={command} onActivity={onActivity} />
        <Chair m={m} />
        <Hotspot {...spot("laptop")} lift={0.02}><Workstation m={m} /></Hotspot>
        <Hotspot {...spot("lamp")}><DeskLamp m={m} /></Hotspot>
        <Hotspot {...spot("monitor")}><Monitor m={m} /></Hotspot>
        <Hotspot {...spot("shelf")}><Bookshelf m={m} /></Hotspot>

        <Window m={m} />
        <WallDecor m={m} />

        <Hotspot {...spot("fridge")}><Fridge m={m} /></Hotspot>
        <Hotspot {...spot("food")}><FoodTable m={m} /></Hotspot>
        <Hotspot {...spot("plant")}><Plants m={m} /></Hotspot>
        <Hotspot {...spot("backpack")}><Backpack m={m} /></Hotspot>
        <Hotspot {...spot("accessories")}><Accessories m={m} /></Hotspot>
        <DecorCubes m={m} />

        <HoverGlow active={hovered ?? selected} />
        <CameraRig focus={selected} drag={drag} reduced={reduced} />
        </ReducedCtx.Provider>
      </ClockCtx.Provider>
      </BrainCtx.Provider>
    </EnvCtx.Provider>
  )
}

type Side = "left" | "right" | "center"
type PinEls = { current: Partial<Record<RoomHotspotId, HTMLDivElement | null>> }
const PIN_ENTRIES = Object.entries(POINTS) as [RoomHotspotId, [number, number, number]][]

/**
 * Projects every hot-spot onto the screen and moves its pin DOM node directly,
 * in the same frame as the render. No React state in the loop, so the pins
 * stay glued to the objects instead of trailing a few frames behind.
 */
function PinProjector({
  els, onSide,
}: {
  els: PinEls
  onSide: (id: RoomHotspotId, side: Side) => void
}) {
  const vec = useMemo(() => new THREE.Vector3(), [])
  const sides = useRef<Partial<Record<RoomHotspotId, Side>>>({})

  useFrame(({ camera, size }) => {
    // The rig moved the camera this frame; refresh its matrices before projecting.
    camera.updateMatrixWorld()
    for (const [id, p] of PIN_ENTRIES) {
      const el = els.current[id]
      if (!el) continue
      vec.set(p[0], p[1], p[2]).project(camera)
      // Pins that project off-screen (or behind the camera) are hidden, not clamped.
      if (!(vec.z < 1 && Math.abs(vec.x) < 0.94 && Math.abs(vec.y) < 0.94)) {
        el.style.visibility = "hidden"
        continue
      }
      const x = ((vec.x + 1) / 2) * size.width
      const y = ((1 - vec.y) / 2) * size.height
      el.style.visibility = "visible"
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      const side: Side = x > size.width * 0.62 ? "right" : x < size.width * 0.38 ? "left" : "center"
      if (sides.current[id] !== side) {
        sides.current[id] = side
        onSide(id, side)
      }
    }
  })
  return null
}

/* ───────────────────────────── time-of-day hooks ─────────────────────────── */

function readStoredMode(): TimeMode {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v && (MODES as string[]).includes(v)) return v as TimeMode
  } catch {
    /* storage can be blocked — fall through */
  }
  return DEFAULT_MODE
}

const nowHour = () => {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

/** Local clock hour, refreshed twice a minute — the env damps the rest. */
function useLiveHour(enabled: boolean) {
  const [hour, setHour] = useState(nowHour)
  useEffect(() => {
    if (!enabled) return
    setHour(nowHour())
    const id = window.setInterval(() => setHour(nowHour()), 30_000)
    return () => window.clearInterval(id)
  }, [enabled])
  return hour
}

/* ───────────────────────────────── HUD ───────────────────────────────────── */

// The scene wrapper captures the pointer for drag-to-orbit, so every
// interactive HUD element must stop pointer events from reaching it.
const stopDrag = {
  onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  onPointerUp: (e: React.PointerEvent) => e.stopPropagation(),
}

const chip =
  "rounded-xl border border-border bg-card/85 text-foreground shadow-lg backdrop-blur-md"

function TitleChip() {
  return (
    <div className={`${chip} flex items-center gap-2.5 px-3 py-1.5`}>
      <span className="flex items-center gap-1" aria-hidden>
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
      </span>
      <svg viewBox="0 0 16 16" className="size-3.5 text-muted-foreground" fill="currentColor" aria-hidden>
        <path d="M8 1.5 1 7.6h2V14h3.6V9.8h2.8V14H13V7.6h2L8 1.5Z" />
      </svg>
      <span className="text-[11.5px] font-semibold tracking-tight">My Room.exe</span>
    </div>
  )
}

const ACTIVITY_TASK: Partial<Record<RoomHotspotId, ReturnType<typeof bi>>> = {
  bed: bi("Recharging (sleeping)", "Isi ulang tenaga (tidur)"),
  food: bi("Ramen break", "Istirahat makan ramen"),
  fridge: bi("Grabbing a cold drink", "Ambil minuman dingin"),
  lamp: bi("Flipping the desk lamp", "Nyalain / matiin lampu meja"),
  shelf: bi("Reading a book", "Baca buku"),
  window: bi("Watching the sky", "Lihat pemandangan"),
  clock: bi("Checking the time", "Cek jam"),
  posters: bi("Admiring the posters", "Lihat-lihat poster"),
  plant: bi("Watering the plant", "Siram tanaman"),
  backpack: bi("Digging through the backpack", "Cari sesuatu di tas"),
  accessories: bi("Music break", "Dengerin musik"),
  whiteboard: bi("Sketching on the whiteboard", "Corat-coret whiteboard"),
  carpet: bi("Chilling on the carpet", "Santai di karpet"),
}

function TaskCard({ phase, activity }: { phase: Phase; activity: RoomHotspotId }) {
  const { t } = useLang()
  const task = ACTIVITY_TASK[activity] ?? TASK[phase]
  return (
    <div className={`${chip} hidden items-center gap-2.5 px-3 py-2 sm:flex`}>
      <span className="grid size-6 place-items-center rounded-full bg-it/15 text-it">
        <Play className="size-3 fill-current" />
      </span>
      <div className="leading-tight">
        <div className="text-[10px] text-muted-foreground">{t(bi("Current task", "Tugas saat ini"))}</div>
        <div className="text-[12px] font-semibold">{t(task)}</div>
      </div>
    </div>
  )
}

function KeyHint({ action }: { action: string | null }) {
  const { t } = useLang()
  return (
    <div className={`${chip} hidden items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground sm:flex`}>
      <span>{action ?? t(bi("Press", "Tekan"))}</span>
      <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">E</kbd>
      <span>{t(bi("to interact", "untuk interaksi"))}</span>
    </div>
  )
}

function ControlsLegend() {
  const { t } = useLang()
  const rows: [string, string][] = [
    [t(bi("Drag", "Geser")), t(bi("Rotate camera", "Putar kamera"))],
    ["Ctrl + Scroll", t(bi("Zoom in/out", "Zoom in/out"))],
    [t(bi("Hover", "Hover")), t(bi("Inspect objects", "Lihat objek"))],
    [t(bi("Click", "Klik")), t(bi("Send him there", "Suruh avatar ke sana"))],
  ]
  return (
    <div className={`${chip} absolute bottom-2 left-2 hidden px-3 py-2 text-[10.5px] leading-[1.5] sm:block sm:bottom-3 sm:left-3`}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="w-[4.6rem] font-semibold">{k}</span>
          <span className="text-muted-foreground">: {v}</span>
        </div>
      ))}
    </div>
  )
}

function TimeChip({
  mode, phase, onMode,
}: {
  mode: TimeMode
  phase: Phase
  onMode: (m: TimeMode) => void
}) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mode !== "live") return
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [mode])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onDown, true)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const hh = mode === "live" ? now.getHours() : Math.floor(PRESET_HOUR[mode])
  const mm = mode === "live" ? now.getMinutes() : Math.round((PRESET_HOUR[mode] % 1) * 60)
  const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
  const PhaseIcon = MODE_ICON[phase]

  return (
    <div ref={box} className="pointer-events-auto relative" {...stopDrag}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`${chip} flex items-center gap-2 px-3 py-1.5 text-[11.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-it`}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <PhaseIcon className="size-3.5 text-amber-500" />
          <span>{t(PHASE_LABEL[phase])}</span>
          <span className="text-muted-foreground">•</span>
          <span className="tabular-nums">{time}</span>
          {mode === "live" && (
            <span className="ml-0.5 size-1.5 animate-pulse rounded-full bg-emerald-500" aria-label="live" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t(bi("Time of day settings", "Pengaturan waktu"))}
          className={`${chip} grid size-8 place-items-center outline-none focus-visible:ring-2 focus-visible:ring-it`}
        >
          <Settings className="size-3.5" />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className={`${chip} absolute right-0 top-full z-40 mt-1.5 w-52 p-1.5`}
        >
          <div className="px-2 pb-1 pt-0.5 text-[10px] text-muted-foreground">
            {t(bi("Time of day", "Waktu"))}
          </div>
          {MODES.map((id) => {
            const Icon = MODE_ICON[id]
            const on = id === mode
            return (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  onMode(id)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] outline-none transition-colors hover:bg-muted focus-visible:bg-muted ${
                  on ? "bg-muted font-semibold" : ""
                }`}
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="flex-1">{t(MODE_LABEL[id])}</span>
                {id !== "live" && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {String(Math.floor(PRESET_HOUR[id])).padStart(2, "0")}:{String(Math.round((PRESET_HOUR[id] % 1) * 60)).padStart(2, "0")}
                  </span>
                )}
                {on && <span className="size-1.5 rounded-full bg-emerald-500" />}
              </button>
            )
          })}
          <p className="px-2 pb-1 pt-1.5 text-[10px] leading-snug text-muted-foreground">
            {t(bi("Live follows your device's clock.", "Live mengikuti jam perangkatmu."))}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────── main component ──────────────────────────── */

interface MyRoomSceneProps {
  identity: Identity
  /** Called with the clicked hot-spot so the hero can open its panel. */
  onOpenHotspot: (id: RoomHotspotId) => void
  /** Hot-spot currently described by the panel, if any. */
  activeHotspot: RoomHotspotId | null
}

export default function MyRoomScene({ identity, onOpenHotspot, activeHotspot }: MyRoomSceneProps) {
  const { t } = useLang()
  const [hovered, setHovered] = useState<RoomHotspotId | null>(null)
  const command = useRef<Command>({ id: null, n: 0 })
  const [activity, setActivity] = useState<RoomHotspotId>("laptop")
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const [mode, setMode] = useState<TimeMode>(readStoredMode)
  const liveHour = useLiveHour(mode === "live")
  const hour = mode === "live" ? liveHour : PRESET_HOUR[mode]
  const phase = phaseOf(hour)
  const bloom = useMemo(() => bloomAt(hour), [hour])

  const clock = useRef<ClockState>({ live: mode === "live", hour })
  useEffect(() => {
    clock.current = { live: mode === "live", hour }
  }, [mode, hour])

  const drag = useRef<DragState>({
    dragging: false, lastX: 0, lastY: 0, lastT: 0,
    yaw: 0, pitch: 0, yawT: 0, pitchT: 0, vx: 0, vy: 0,
    idleUntil: 0, zoom: 1, zoomTarget: 1,
  })
  const dragMoved = useRef(0)
  const root = useRef<HTMLDivElement>(null)
  const inside = useRef(false)
  const hoveredRef = useRef<RoomHotspotId | null>(null)
  const pinEls = useRef<Partial<Record<RoomHotspotId, HTMLDivElement | null>>>({})
  const [sideMap, setSideMap] = useState<Partial<Record<RoomHotspotId, Side>>>({})

  useEffect(() => {
    hoveredRef.current = hovered
  }, [hovered])

  const register = useCallback((id: RoomHotspotId, el: HTMLDivElement | null) => {
    pinEls.current[id] = el
  }, [])
  const onSide = useCallback((id: RoomHotspotId, side: Side) => {
    setSideMap((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))
  }, [])

  const pickMode = useCallback((next: TimeMode) => {
    setMode(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const select = useCallback(
    (id: RoomHotspotId) => {
      document.body.style.cursor = ""
      // The person in the room walks over and does the thing.
      command.current = { id, n: command.current.n + 1 }
      onOpenHotspot(id)
    },
    [onOpenHotspot]
  )

  // "Press E to interact": opens whatever is hovered (laptop by default), but
  // only while the pointer or focus is on the room so it never steals typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "e" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return
      if (!inside.current) return
      select(hoveredRef.current ?? "laptop")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [select])

  // Ctrl/⌘ + scroll (and trackpad pinch) zooms; plain scroll still scrolls the page.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const d = drag.current
      d.zoomTarget = THREE.MathUtils.clamp(d.zoomTarget * (1 + e.deltaY * 0.0018), 0.72, 1.2)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const endDrag = useCallback(() => {
    const d = drag.current
    if (!d.dragging) return
    d.dragging = false
    // Hold the view for a few seconds, then it eases back to the hero framing.
    d.idleUntil = performance.now() / 1000 + 3
  }, [])

  const hoveredAction = hovered ? roomHotspots.find((h) => h.id === hovered)?.action : null

  return (
    <div
      ref={root}
      className={`relative w-full select-none touch-pan-y ${
        hovered ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      }`}
      // The canvas is absolutely positioned, so the wrapper must supply the
      // height itself — otherwise the grid row collapses to nothing.
      style={{ aspectRatio: "6 / 5" }}
      onPointerEnter={() => {
        inside.current = true
      }}
      onFocus={() => {
        inside.current = true
      }}
      onBlur={() => {
        inside.current = false
      }}
      onPointerDown={(e) => {
        const d = drag.current
        d.dragging = true
        d.lastX = e.clientX
        d.lastY = e.clientY
        d.lastT = e.timeStamp
        d.vx = 0
        d.vy = 0
        dragMoved.current = 0
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d.dragging) return
        const dx = e.clientX - d.lastX
        const dy = e.clientY - d.lastY
        const dtMs = Math.max((e.timeStamp - d.lastT) / 1000, 0.008)
        d.lastX = e.clientX
        d.lastY = e.clientY
        d.lastT = e.timeStamp
        dragMoved.current += Math.abs(dx) + Math.abs(dy)
        d.yawT = THREE.MathUtils.clamp(d.yawT + dx * 0.006, -YAW_LIMIT, YAW_LIMIT)
        d.pitchT = THREE.MathUtils.clamp(d.pitchT + dy * 0.004, -0.5, 0.6)
        d.vx = THREE.MathUtils.lerp(d.vx, THREE.MathUtils.clamp((dx * 0.006) / dtMs, -3, 3), 0.35)
        d.vy = THREE.MathUtils.lerp(d.vy, THREE.MathUtils.clamp((dy * 0.004) / dtMs, -2, 2), 0.35)
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => {
        inside.current = false
        endDrag()
      }}
    >
      {/* Soft bloom behind the diorama — tinted by the time of day so the room
          floats on the page instead of sitting in a rectangle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-14%] -z-10 rounded-[50%] opacity-[0.22] blur-2xl transition-[background-color] duration-[1400ms]"
        style={{
          backgroundColor: bloom,
          WebkitMaskImage: "radial-gradient(closest-side, #000 30%, transparent 78%)",
          maskImage: "radial-gradient(closest-side, #000 30%, transparent 78%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[18%] bottom-[6%] -z-10 h-16 rounded-[50%] blur-2xl"
        style={{ background: "radial-gradient(closest-side, rgba(20,24,44,0.35), transparent)" }}
      />

      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [5.4, 4.4, 6.2], fov: 38 }}
        onCreated={({ camera }) => camera.lookAt(-0.15, 0.95, -0.55)}
        onPointerMissed={() => setHovered(null)}
        style={{ background: "transparent" }}
      >
        <RoomWorld
          identity={identity}
          hour={hour}
          clock={clock}
          hovered={hovered}
          selected={activeHotspot}
          onHover={setHovered}
          onSelect={(id) => {
            // A drag that ends on an object shouldn't also "click" it.
            if (dragMoved.current > 8) return
            select(id)
          }}
          drag={drag}
          reduced={reduced}
          command={command}
          onActivity={setActivity}
        />
        <PinProjector els={pinEls} onSide={onSide} />
      </Canvas>

      {/* Pins: the four main interactions keep a visible label; the rest are a
          dot until hovered, focused, or opened in the panel. Their position is
          written straight to the DOM by <PinProjector>. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {roomHotspots.map((h) => (
          <RoomPin
            key={h.id}
            id={h.id}
            register={register}
            side={sideMap[h.id] ?? "center"}
            label={t(h.action)}
            active={hovered === h.id || activeHotspot === h.id}
            onClick={() => select(h.id)}
            onHover={(on) => setHovered(on ? h.id : null)}
          />
        ))}
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute left-2 top-8 flex flex-col items-start gap-1.5 sm:left-3">
          <TitleChip />
          <TaskCard phase={phase} activity={activity} />
        </div>
        <div className="absolute right-2 top-8 flex flex-col items-end gap-1.5 sm:right-3">
          <TimeChip mode={mode} phase={phase} onMode={pickMode} />
          <KeyHint action={hoveredAction ? t(hoveredAction) : null} />
        </div>
        <ControlsLegend />
      </div>
    </div>
  )
}

/* ──────────────────────────────── pins ───────────────────────────────────── */

const HOTSPOT_ICON: Record<RoomHotspotId, LucideIcon> = {
  laptop: LaptopIcon,
  monitor: MonitorIcon,
  shelf: Library,
  bed: BedIcon,
  fridge: Box,
  food: Utensils,
  window: Eye,
  clock: ClockIcon,
  posters: ImageIcon,
  plant: Sprout,
  backpack: BackpackIcon,
  lamp: Lamp,
  whiteboard: ClipboardList,
  carpet: Armchair,
  accessories: Headphones,
}

/** Interactions that stay labelled at rest (from `sm` up). */
const PRIMARY_PINS = new Set<RoomHotspotId>(["laptop", "bed", "food", "fridge"])

function RoomPin({
  id, register, side, label, active, onClick, onHover,
}: {
  id: RoomHotspotId
  register: (id: RoomHotspotId, el: HTMLDivElement | null) => void
  side: Side
  label: string
  active: boolean
  onClick: () => void
  onHover: (on: boolean) => void
}) {
  const primary = PRIMARY_PINS.has(id)
  const Icon = HOTSPOT_ICON[id]

  return (
    // Outer node is positioned imperatively (translate3d); hidden until the
    // projector has placed it, and while its object is off-screen.
    <div
      ref={(el) => register(id, el)}
      style={{ visibility: "hidden", willChange: "transform" }}
      className="pointer-events-auto absolute left-0 top-0 z-20"
      // Keep the drag-to-orbit layer from capturing the pointer and eating the
      // click — a pin press must stay a press, not a camera drag.
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <button
          type="button"
          onClick={onClick}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          onFocus={() => onHover(true)}
          onBlur={() => onHover(false)}
          aria-label={label}
          className="group relative flex items-center justify-center outline-none"
        >
          {/* Dot */}
          <span
            className={`relative flex size-3.5 items-center justify-center rounded-full transition-transform duration-200 ${
              active ? "scale-125" : "group-hover:scale-110"
            }`}
          >
            <span
              className={`absolute inset-0 rounded-full ${
                active ? "bg-white/50" : "bg-white/30 group-hover:bg-white/50"
              }`}
            />
            <span
              className={`size-1.5 rounded-full transition-colors ${
                active ? "bg-emerald-400" : "bg-emerald-500"
              }`}
            />
            {!active && (
              <span className="absolute size-3.5 animate-ping rounded-full bg-emerald-400/30 [animation-duration:2.4s]" />
            )}
          </span>

          {/* Label — always on for primary pins (sm+), otherwise on hover/focus/open. */}
          <span
            className={`absolute flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card/95 py-1 pl-2 pr-2.5 text-[10.5px] font-medium text-foreground shadow-lg backdrop-blur-md transition-all duration-200 ${
              side === "right"
                ? "left-[calc(100%+4px)] top-1/2 -translate-y-1/2"
                : side === "left"
                  ? "right-[calc(100%+4px)] top-1/2 -translate-y-1/2"
                  : "left-1/2 top-[calc(100%+6px)] -translate-x-1/2"
            } ${
              active
                ? "pointer-events-none scale-100 opacity-100"
                : primary
                  ? "pointer-events-none scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 sm:scale-100 sm:opacity-100"
                  : "pointer-events-none scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
            }`}
          >
            <Icon className="size-3 shrink-0 text-muted-foreground" />
            {label}
          </span>
        </button>
      </div>
    </div>
  )
}