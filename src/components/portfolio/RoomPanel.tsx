import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { useLang } from "@/lib/i18n"
import { roomHotspots, type RoomHotspotId } from "@/data/room"

const EASE = [0.22, 1, 0.36, 1] as const

interface RoomPanelProps {
  hotspot: RoomHotspotId | null
  onClose: () => void
}

/**
 * Contextual panel for the hero diorama. Sits over the scene like an in-game
 * inspection card: header with the object name, short body copy, optional
 * bullet facts, chips, and a single outbound CTA. Escape and the back button
 * both return to the room overview.
 */
export function RoomPanel({ hotspot, onClose }: RoomPanelProps) {
  const { t } = useLang()
  const data = hotspot ? roomHotspots.find((h) => h.id === hotspot) : null

  useEffect(() => {
    if (!hotspot) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [hotspot, onClose])

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key={data.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-auto max-h-[15rem] w-full overflow-y-auto rounded-2xl border border-border bg-card/95 p-4 text-foreground shadow-xl backdrop-blur-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                aria-label={t({ en: "Back to room", id: "Kembali ke kamar" })}
                className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
              </button>
              {data.eyebrow && (
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t(data.eyebrow)}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t({ en: "Interactive", id: "Interaktif" })}
            </span>
          </div>

          <h3 className="text-sm font-semibold leading-snug text-foreground">{t(data.label)}</h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{t(data.body)}</p>

          {data.points && (
            <ul className="mt-2.5 space-y-1">
              {data.points.map((point) => (
                <li key={point.en} className="flex gap-2 text-[12px] text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  {t(point)}
                </li>
              ))}
            </ul>
          )}

          {data.tags && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {data.link && (
            <a
              href={data.link.href}
              {...(data.link.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-it transition-colors hover:opacity-80"
            >
              {t(data.link.label)} <ArrowUpRight className="size-3.5" />
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
