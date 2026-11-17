// One-off verification: project world points for each hot-spot to screen %,
// using the exact camera/aspect/canvas used by MyRoomScene.
// Run: node scripts/verify-pins.mjs
import * as THREE from "three"

const camera = new THREE.PerspectiveCamera(38, 5 / 4, 0.1, 100)
camera.position.set(6.4, 3.9, 6.2)
camera.lookAt(0.05, 0.95, -0.35)
camera.updateMatrixWorld()
camera.updateProjectionMatrix()

const targets = {
  laptop: [0.2, 1.32, -1.72],
  lamp: [0.93, 1.5, -1.9],
  monitor: [-0.9, 1.3, -1.92],
  shelf: [2.55, 1.3, -1.0],
  bed: [-2.05, 0.75, -1.35],
  fridge: [2.5, 1.15, 1.35],
  food: [1.35, 0.62, 0.95],
  window: [-2.82, 1.85, -0.45],
  clock: [1.05, 2.52, -2.28],
  posters: [-1.6, 2.05, -2.3],
  whiteboard: [2.2, 1.95, -2.3],
  plant: [-2.7, 0.95, 1.5],
  backpack: [-1.0, 0.45, 0.55],
  accessories: [-0.75, 0.3, 1.55],
  carpet: [0.1, 0.06, 0.15],
}

const out = {}
for (const [id, p] of Object.entries(targets)) {
  const v = new THREE.Vector3(...p).project(camera)
  out[id] = {
    left: ((v.x + 1) / 2) * 100,
    top: ((1 - v.y) / 2) * 100,
  }
}

console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [
  k,
  { left: `${v.left.toFixed(1)}%`, top: `${v.top.toFixed(1)}%` },
])), null, 2))
