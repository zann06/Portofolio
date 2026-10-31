import { useEffect, useState } from "react"
import { motion, AnimatePresence, useMotionValue, animate, type PanInfo } from "framer-motion"
import { ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react"
import { projects, type Category } from "@/data/portfolio"
import { useLang, bi } from "@/lib/i18n"
import { asset } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

// Projects can optionally carry a real cover screenshot/photo. Add
// `coverImage?: string` to the Project type in `data/portfolio.ts` and point
// it at a file in `/public/projects/...`; cards without one keep the
// generated letter-mark background so nothing looks broken while you fill
// covers in gradually.
type ProjectWithCover = ReturnType<typeof projects.filter>[number] & {
  coverImage?: string
}

type Filter = "ALL" | "IT" | "ESPORTS"

const filters: Filter[] = ["ALL", "IT", "ESPORTS"]

type Breakpoint = "mobile" | "tablet" | "desktop"

// Distinct tuning per breakpoint: mobile gets a tighter, flatter carousel
// that mostly shows one card with a peek of its neighbor (so it reads as
// "swipe" rather than a cramped 3D stack); desktop gets the full coverflow
// with three cards fanned out on either side.
const STAGE_CONFIG: Record<
  Breakpoint,
  { cardWidth: number; stageHeight: number; stepX: number; stepRotate: number; visibleDepth: number }
> = {
  mobile: { cardWidth: 262, stageHeight: 460, stepX: 168, stepRotate: 14, visibleDepth: 1 },
  tablet: { cardWidth: 300, stageHeight: 500, stepX: 210, stepRotate: 22, visibleDepth: 2 },
  desktop: { cardWidth: 330, stageHeight: 540, stepX: 250, stepRotate: 30, visibleDepth: 3 },
}

function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop")

  useEffect(() => {
    function update() {
      const width = window.innerWidth
      if (width < 640) setBreakpoint("mobile")
      else if (width < 1024) setBreakpoint("tablet")
      else setBreakpoint("desktop")
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return breakpoint
}

function matchesFilter(category: Category, filter: Filter): boolean {
  if (filter === "ALL") return true
  if (category === "BOTH") return true
  return category === filter
}

export function SelectedWorks() {
  const { t } = useLang()
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL")
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<ProjectWithCover | null>(null)
  const dragX = useMotionValue(0)
  const breakpoint = useBreakpoint()
  const { cardWidth, stageHeight, stepX, stepRotate, visibleDepth } = STAGE_CONFIG[breakpoint]

  const filtered = (projects as ProjectWithCover[]).filter((p) =>
    matchesFilter(p.category, activeFilter)
  )

  // Close the detail dialog on Escape so keyboard users aren't trapped
  useEffect(() => {
    if (!selected) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selected])

  function changeFilter(filter: Filter) {
    setActiveFilter(filter)
    setActive(0)
  }

  function go(delta: number) {
    setActive((current) => Math.max(0, Math.min(filtered.length - 1, current + delta)))
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const threshold = stepX / 2.5
    if (info.offset.x < -threshold || info.velocity.x < -600) {
      go(1)
    } else if (info.offset.x > threshold || info.velocity.x > 600) {
      go(-1)
    }
    animate(dragX, 0, { type: "spring", stiffness: 380, damping: 38 })
  }

  return (
    <section id="works" className="py-24 md:py-32 px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-foreground/30" />
              <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                {t(bi("Selected Works", "Karya Pilihan"))}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-xl">
              {t(bi("Projects that bridge technology and competition.", "Proyek yang menjembatani teknologi dan kompetisi."))}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Filters */}
            <div className="flex gap-1 bg-muted rounded-full p-1 w-fit">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => changeFilter(filter)}
                  className={`relative px-4 py-2 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === filter
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {activeFilter === filter && (
                    <motion.span
                      className={`absolute inset-0 rounded-full ${
                        filter === "IT" ? "bg-it" : filter === "ESPORTS" ? "bg-esports" : "bg-foreground"
                      }`}
                      layoutId="works-filter"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{filter}</span>
                </button>
              ))}
            </div>

            {/* Prev / next — desktop and tablet only; mobile relies on swipe + dots */}
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => go(-1)}
                disabled={active === 0}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Previous project"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => go(1)}
                disabled={active === filtered.length - 1}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Next project"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Coverflow stage — one row, cards fan out in 3D instead of stacking.
           Sizing and rotation intensity come from STAGE_CONFIG per breakpoint:
           mobile stays close to flat with a peek of the next card, desktop
           gets the full fanned-out 3D stack. */}
        <div
          className="relative mx-auto cursor-grab touch-pan-y select-none active:cursor-grabbing"
          style={{ perspective: "1800px", height: stageHeight }}
        >
          <motion.div
            className="absolute inset-0"
            drag="x"
            style={{ x: dragX }}
            dragElastic={0.12}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
          >
            <AnimatePresence initial={false}>
              {filtered.map((project, index) => {
                const offset = index - active
                if (Math.abs(offset) > visibleDepth) return null
                const isActive = offset === 0
                const depth = Math.min(Math.abs(offset), visibleDepth)

                return (
                  <motion.article
                    key={project.id}
                    className={`absolute left-1/2 top-0 rounded-2xl border bg-card overflow-hidden ${
                      isActive
                        ? "border-foreground/20 shadow-xl cursor-pointer"
                        : "border-border shadow-sm cursor-pointer"
                    }`}
                    style={{ transformStyle: "preserve-3d", width: cardWidth }}
                    initial={false}
                    animate={{
                      x: `calc(-50% + ${offset * stepX}px)`,
                      rotateY: Math.max(-stepRotate * visibleDepth, Math.min(stepRotate * visibleDepth, offset * -stepRotate)),
                      scale: isActive ? 1 : 1 - depth * 0.1,
                      opacity: 1 - depth * 0.32,
                      zIndex: 20 - depth,
                    }}
                    transition={{ duration: 0.55, ease: EASE }}
                    onClick={() => {
                      // Not the focused card yet — first click just brings it
                      // to the center, same as before.
                      if (!isActive) {
                        setActive(index)
                        return
                      }
                      // Already focused — a click here opens the detail dialog.
                      setSelected(project)
                    }}
                    whileHover={isActive ? { y: -4 } : undefined}
                  >
                    {/* Project Visual */}
                    <div
                      className={`relative h-40 sm:h-44 lg:h-48 overflow-hidden ${
                        project.category === "IT"
                          ? "bg-gradient-to-br from-it/20 via-card to-it/5"
                          : project.category === "ESPORTS"
                            ? "bg-gradient-to-br from-esports/20 via-card to-esports/5"
                            : "bg-gradient-to-br from-it/15 via-card to-esports/15"
                      }`}
                    >
                      {project.coverImage ? (
                        <>
                          <img
                            src={asset(project.coverImage)}
                            alt={t(project.title)}
                            loading="lazy"
                            className="absolute inset-0 size-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
                        </>
                      ) : (
                        <>
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{
                              backgroundImage: `
                                linear-gradient(var(--grid) 1px, transparent 1px),
                                linear-gradient(90deg, var(--grid) 1px, transparent 1px)
                              `,
                              backgroundSize: "24px 24px",
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className={`font-mono text-6xl sm:text-7xl font-bold tracking-tighter ${
                                project.category === "IT"
                                  ? "text-it/20"
                                  : project.category === "ESPORTS"
                                    ? "text-esports/20"
                                    : "text-foreground/10"
                              }`}
                            >
                              {t(project.title).charAt(0)}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-end justify-between">
                        <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-foreground/50">
                          {t(bi("Case study", "Studi kasus"))} // {project.id.toUpperCase()}
                        </span>
                        {!project.coverImage && (
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((bar) => (
                              <span key={bar} className="h-5 sm:h-6 w-1 rounded-full bg-foreground/20" />
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Category badge */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 text-[10px] sm:text-[11px] font-medium rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground">
                          {project.category === "BOTH" ? "IT + ESPORTS" : project.category}
                        </span>
                      </div>
                      {/* Year */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 text-[10px] sm:text-[11px] font-medium rounded-full bg-background/80 backdrop-blur-sm border border-border text-muted-foreground">
                          {project.year}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-1">
                          {t(project.title)}
                        </h3>
                        <ArrowUpRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{t(project.subtitle)}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                        {t(project.description)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tags.slice(0, breakpoint === "mobile" ? 2 : 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-md bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > (breakpoint === "mobile" ? 2 : 3) && (
                          <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-md bg-muted text-muted-foreground">
                            +{project.tags.length - (breakpoint === "mobile" ? 2 : 3)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Position dots */}
        {filtered.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {filtered.map((project, index) => (
              <button
                key={project.id}
                onClick={() => setActive(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? "w-6 bg-foreground" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to ${project.title}`}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {t(bi("No projects in this category yet.", "Belum ada proyek di kategori ini."))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={t(selected.title)}
          >
            <div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="relative w-full max-w-2xl bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {/* Visual */}
              <div
                className={`relative aspect-[16/8] overflow-hidden ${
                  selected.category === "IT"
                    ? "bg-gradient-to-br from-it/20 via-card to-it/5"
                    : selected.category === "ESPORTS"
                      ? "bg-gradient-to-br from-esports/20 via-card to-esports/5"
                      : "bg-gradient-to-br from-it/15 via-card to-esports/15"
                }`}
              >
                {selected.coverImage ? (
                  <img
                    src={asset(selected.coverImage)}
                    alt={t(selected.title)}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-7xl font-bold tracking-tighter text-foreground/10">
                      {t(selected.title).charAt(0)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="absolute top-4 right-4 size-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                    {selected.category === "BOTH" ? "IT + ESPORTS" : selected.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{selected.year}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{t(selected.title)}</h3>
                <div className="text-sm text-muted-foreground mb-4">{t(selected.subtitle)}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {t(selected.description)}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {selected.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs font-medium rounded-md bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {selected.link && (
                  <button
                    onClick={() => window.open(selected.link, "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                  >
                    {selected.link.includes("github.com")
                      ? t(bi("View on GitHub", "Lihat di GitHub"))
                      : t(bi("Visit live site", "Kunjungi situs live"))}
                    <ExternalLink className="size-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}