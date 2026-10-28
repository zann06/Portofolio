import { useRef } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"

const EASE = [0.22, 1, 0.36, 1] as const

// 12-wide x 14-tall pixel map for a small original "desk buddy" robot.
// '.' = transparent, '1' = body, '2' = visor (accent), '3' = antenna tip,
// '4' = highlight. Kept generic/geometric on purpose — no borrowed IP.
const SPRITE = [
  "....33.....",
  "....1......",
  "...1111....",
  "..122221...",
  "..122221...",
  "..111111...",
  "...1111....",
  "..111111...",
  ".11111111..",
  ".14111141..",
  ".11111111..",
  ".111..111..",
  "..11..11...",
  "..11..11...",
]

// 5-wide x 4-tall pixel map for a tiny original "space invader" alien.
// Kept generic/geometric on purpose — no borrowed IP.
const INVADER_SPRITE = [".1.1.", "11111", "1.1.1", ".1.1."]

function PixelBuddy({ accentVar }: { accentVar: string }) {
  const cols = SPRITE[0].length
  const palette: Record<string, string> = {
    "1": "#e2e8f0",
    "2": accentVar,
    "3": "#f87171",
    "4": "#ffffff",
  }

  return (
    <motion.div
      animate={{ y: [0, -3, 0], x: [0, 5, 0, -5, 0] }}
      transition={{
        y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
        x: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
      }}
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        width: "74px",
        imageRendering: "pixelated",
      }}
    >
      {SPRITE.flatMap((row, rIdx) =>
        row.split("").map((cell, cIdx) => (
          <motion.div
            key={`${rIdx}-${cIdx}`}
            className="aspect-square"
            animate={cell === "2" ? { opacity: [1, 1, 0.75, 1, 1] } : {}}
            transition={
              cell === "2"
                ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
            style={{
              backgroundColor: cell === "." ? "transparent" : palette[cell],
            }}
          />
        ))
      )}
    </motion.div>
  )
}

function InvaderSprite({ color }: { color: string }) {
  const cols = INVADER_SPRITE[0].length
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        width: "17px",
        imageRendering: "pixelated",
      }}
    >
      {INVADER_SPRITE.flatMap((row, rIdx) =>
        row.split("").map((cell, cIdx) => (
          <div
            key={`${rIdx}-${cIdx}`}
            className="aspect-square"
            style={{ backgroundColor: cell === "." ? "transparent" : color }}
          />
        ))
      )}
    </div>
  )
}

interface Laptop3DProps {
  /** Real portrait, shown as a small "webcam window" popping off the screen. */
  image: string
  alt: string
  identity?: "IT" | "ESPORTS"
}

/**
 * A stylised open laptop rendered with CSS 3D transforms. The screen loops a
 * tiny original "space invaders" style scene: the idle desk-buddy sprite
 * stands defender duty at the bottom, rapid-firing accent-colored bolts
 * (with a muzzle flash on each shot) up at a dense wave of geometric alien
 * sprites that march side to side and sink. When the wave reaches the
 * bottom it fades out in a small burst (plus a soft screen flash) and
 * respawns at the top — a seamless, endless loop. The user's real portrait
 * sits in a small floating video-call window that leans out toward the
 * viewer via translateZ + pointer-tracked parallax. Tilts gently with the
 * pointer for depth; the shooter scene is skipped when the user prefers
 * reduced motion.
 */
export function Laptop3D({ image, alt, identity = "IT" }: Laptop3DProps) {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const accentVar = identity === "IT" ? "var(--it)" : "var(--esports)"
  const accentBg = identity === "IT" ? "bg-it" : "bg-esports"
  const invaderColor = "#fb7185"

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const springConfig = { stiffness: 120, damping: 18, mass: 0.6 }
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]), springConfig)
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-10, 10]), springConfig)
  const breakoutX = useSpring(useTransform(rawX, [-0.5, 0.5], [-14, 14]), springConfig)
  const breakoutY = useSpring(useTransform(rawY, [-0.5, 0.5], [-8, 8]), springConfig)

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    rawX.set(0)
    rawY.set(0)
  }

  // Alien formation: 6 columns x 2 rows — a bigger, denser wave.
  const invaderCols = 6
  const invaderRows = 2

  // Laser bolts fired from the defender — five, tightly staggered, for a
  // rapid-fire feel rather than single lonely shots.
  const bolts = [
    { left: "42%", delay: 0 },
    { left: "47%", delay: 0.22 },
    { left: "50%", delay: 0.44 },
    { left: "53%", delay: 0.66 },
    { left: "58%", delay: 0.88 },
  ]

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto w-full max-w-md [perspective:1800px]"
    >
      {/* Scoped keyframes for the looping shooter scene */}
      <style>{`
        @keyframes laptop3d-invader-march {
          0% { transform: translateX(-16px); }
          100% { transform: translateX(16px); }
        }
        @keyframes laptop3d-invader-move {
          0% { transform: translateY(0px); }
          78% { transform: translateY(38px); }
          82% { transform: translateY(38px); }
          84% { transform: translateY(0px); }
          100% { transform: translateY(0px); }
        }
        @keyframes laptop3d-invader-fade {
          0% { opacity: 1; }
          76% { opacity: 1; }
          83% { opacity: 0; }
          90% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes laptop3d-explosion {
          0%, 74% { opacity: 0; transform: scale(0.3); }
          78% { opacity: 1; transform: scale(1.6); }
          84% { opacity: 0; transform: scale(2.1); }
          100% { opacity: 0; transform: scale(0.3); }
        }
        @keyframes laptop3d-screen-flash {
          0%, 75% { opacity: 0; }
          78% { opacity: 0.16; }
          85% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes laptop3d-laser-fire {
          0% { transform: translateY(0); opacity: 0; }
          8% { opacity: 1; }
          50% { opacity: 1; }
          68% { transform: translateY(-92px); opacity: 0; }
          100% { transform: translateY(-92px); opacity: 0; }
        }
        @keyframes laptop3d-muzzle-flash {
          0%, 3% { opacity: 0; transform: scale(0.5); }
          9% { opacity: 1; transform: scale(1.6); }
          20% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 0; transform: scale(0.5); }
        }
      `}</style>

      {/* Ambient glow behind the whole rig */}
      <div className={`absolute -inset-12 rounded-[3rem] ${accentBg}/20 blur-3xl`} />

      <motion.div
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative"
      >
        {/* Screen bezel */}
        <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950 p-3 pb-4 shadow-2xl">
          <div className="mb-2 flex items-center justify-center">
            <span className="size-1.5 rounded-full bg-neutral-700" />
          </div>

          <motion.div
            initial={{ clipPath: "inset(50% 0% 50% 0%)", opacity: 0 }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
            className="relative aspect-[16/10] overflow-hidden rounded-lg bg-neutral-950"
          >
            {/* Deep-space backdrop glow */}
            <div
              className="absolute inset-x-0 top-0 h-2/3"
              style={{
                background: `radial-gradient(120% 100% at 50% 0%, ${accentVar}33 0%, transparent 65%)`,
              }}
            />

            {/* HUD bar */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-2.5 font-mono text-[8px] uppercase tracking-wider text-neutral-400">
              <span>Wave 01</span>
              <span className="flex items-center gap-1">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="size-1 rounded-full"
                  style={{ backgroundColor: invaderColor }}
                />
                Hostiles inbound
              </span>
            </div>

            {!prefersReducedMotion && (
              <>
                {/* Position-only wrapper: sinks the wave, then snaps back to
                    the top while the formation itself is faded out (below),
                    so the reset never reads as a visible jump. */}
                <div
                  className="absolute inset-x-0 top-[16%] flex justify-center"
                  style={{ animation: "laptop3d-invader-move 5.5s linear infinite" }}
                >
                  {/* Alien formation — marches side to side, fades out near
                      the bottom of its dive, and fades back in at the top. */}
                  <div
                    className="grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${invaderCols}, 1fr)`,
                      animation:
                        "laptop3d-invader-march 1.6s ease-in-out infinite alternate, laptop3d-invader-fade 5.5s linear infinite",
                    }}
                  >
                    {Array.from({ length: invaderCols * invaderRows }).map((_, i) => (
                      <InvaderSprite key={i} color={invaderColor} />
                    ))}
                  </div>

                  {/* Hit burst — flashes right as the wave clears, independent
                      of the formation's own fade so it reads as an impact. */}
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background: `radial-gradient(circle, #fff 0%, ${invaderColor} 45%, transparent 75%)`,
                      animation: "laptop3d-explosion 5.5s linear infinite",
                    }}
                  />
                </div>

                {/* Soft whole-screen flash synced with the hit burst */}
                <div
                  className="pointer-events-none absolute inset-0 bg-white"
                  style={{ animation: "laptop3d-screen-flash 5.5s linear infinite" }}
                />

                {/* Laser bolts fired from the defender */}
                {bolts.map((bolt, i) => (
                  <span
                    key={i}
                    className="absolute bottom-[32%] h-3.5 w-[2px] rounded-full"
                    style={{
                      left: bolt.left,
                      backgroundColor: accentVar,
                      animation: "laptop3d-laser-fire 1.1s ease-out infinite",
                      animationDelay: `${bolt.delay}s`,
                    }}
                  />
                ))}

                {/* Muzzle flash on the defender, synced to each shot */}
                {bolts.map((bolt, i) => (
                  <span
                    key={`flash-${i}`}
                    className="pointer-events-none absolute bottom-[31%] size-2.5 -translate-x-1/2 rounded-full"
                    style={{
                      left: bolt.left,
                      background: `radial-gradient(circle, #fff 0%, ${accentVar} 60%, transparent 80%)`,
                      animation: "laptop3d-muzzle-flash 1.1s ease-out infinite",
                      animationDelay: `${bolt.delay}s`,
                    }}
                  />
                ))}
              </>
            )}

            {/* Defender — the idle desk-buddy sprite, now on shooting duty */}
            <div className="absolute inset-x-0 bottom-[16%] flex items-end justify-center">
              <PixelBuddy accentVar={accentVar} />
            </div>

            {/* Scanlines + vignette */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_20px_rgba(0,0,0,0.65)]" />
          </motion.div>
        </div>

        {/* Keyboard deck (foreshortened trapezoid for a fake perspective) */}
        <div
          className="relative -mt-px h-7 rounded-b-xl bg-gradient-to-b from-neutral-800 to-neutral-900 shadow-lg"
          style={{ clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0% 100%)" }}
        />
        <div className="mx-auto h-1.5 w-24 rounded-b-md bg-neutral-800/80" />

        {/* Real portrait — a small "video call" window leaning out of the
            screen via translateZ, so it pops toward the viewer without
            fighting the photo's plain background. */}
        <motion.div
          className="absolute -bottom-6 -right-4 w-[38%]"
          style={{
            translateZ: 130,
            x: prefersReducedMotion ? 0 : breakoutX,
            y: prefersReducedMotion ? 0 : breakoutY,
          }}
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, ease: EASE }}
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl border-2 border-neutral-900 bg-white shadow-[0_25px_35px_rgba(0,0,0,0.45)]">
            <img
              src={image}
              alt={alt}
              className="absolute inset-0 size-full object-cover object-top"
            />
            <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
              <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-[7px] font-medium uppercase tracking-wider text-white">
                Live
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}