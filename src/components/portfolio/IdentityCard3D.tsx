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

// Deterministic bar widths so the "barcode" doesn't reshuffle on re-render.
const BARCODE_PATTERN = [2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 1, 4, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1]

interface IdentityCard3DProps {
  image: string
  alt: string
  name: string
  title: string
  idCode?: string
}

/**
 * A floating "ID badge" treatment for the profile photo — a different 3D
 * language from the laptop rig used in the hero. The card tilts toward the
 * pointer, with a holographic sheen sweeping across a foil layer above the
 * photo, and a small "Verified" chip plus a barcode strip physically
 * detached and elevated above the card surface (biggest translateZ), so
 * they cast shadow and visibly separate from the card when it tilts.
 */
export function IdentityCard3D({ image, alt, name, title, idCode = "FRF-2026-001" }: IdentityCard3DProps) {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const springConfig = { stiffness: 140, damping: 16, mass: 0.5 }
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [7, -7]), springConfig)
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-8, 8]), springConfig)
  const chipX = useSpring(useTransform(rawX, [-0.5, 0.5], [-6, 6]), springConfig)
  const chipY = useSpring(useTransform(rawY, [-0.5, 0.5], [-4, 4]), springConfig)
  const sheenX = useTransform(rawX, [-0.5, 0.5], [20, 80])
  const sheenY = useTransform(rawY, [-0.5, 0.5], [20, 80])
  const pointerSheen = useTransform(
    [sheenX, sheenY],
    (latest: number[]) =>
      `radial-gradient(circle at ${latest[0]}% ${latest[1]}%, rgba(255,255,255,0.35), transparent 45%)`
  )

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

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative pb-5 pr-4 [perspective:1600px]"
    >
      <motion.div
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative"
      >
        {/* Card body */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative aspect-square overflow-hidden rounded-2xl border border-border shadow-xl"
          style={{ transform: "translateZ(0px)" }}
        >
          {/* Back layer: faint barcode/grid texture behind the photo */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `
                linear-gradient(var(--grid) 1px, transparent 1px),
                linear-gradient(90deg, var(--grid) 1px, transparent 1px)
              `,
              backgroundSize: "18px 18px",
            }}
          />

          <img
            src={image}
            alt={alt}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />

          {/* Holographic foil sweep, tracks the pointer */}
          {!prefersReducedMotion && (
            <motion.div
              className="pointer-events-none absolute inset-0 mix-blend-overlay"
              style={{ background: pointerSheen }}
            />
          )}
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              background:
                "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.5) 35%, rgba(120,180,255,0.35) 45%, transparent 60%)",
              backgroundSize: "250% 250%",
            }}
            animate={prefersReducedMotion ? {} : { backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
          />

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="text-lg font-bold text-foreground">{name}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
          </div>
        </motion.div>

        {/* Floating "Verified" chip — highest elevation, pops off the card */}
        <motion.div
          className="absolute -right-3 -top-3 flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-sm"
          style={{
            translateZ: 70,
            x: prefersReducedMotion ? 0 : chipX,
            y: prefersReducedMotion ? 0 : chipY,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium tracking-wide text-foreground">Verified</span>
        </motion.div>

        {/* Barcode strip — detached and elevated at the card's bottom edge */}
        <motion.div
          className="absolute -bottom-4 left-4 right-4 flex items-center gap-3 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm"
          style={{
            translateZ: 55,
            x: prefersReducedMotion ? 0 : chipX,
            y: prefersReducedMotion ? 0 : chipY,
          }}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
        >
          <div className="flex h-5 items-stretch gap-[1.5px]">
            {BARCODE_PATTERN.map((w, i) => (
              <span
                key={i}
                className="bg-foreground/80"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground shrink-0">
            {idCode}
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}