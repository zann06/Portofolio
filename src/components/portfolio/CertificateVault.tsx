import { useEffect, useState } from "react"
import { motion, AnimatePresence, useMotionValue, animate, type PanInfo } from "framer-motion"
import { Award, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react"
import { certificates, type Certificate } from "@/data/portfolio"
import { useLang, bi } from "@/lib/i18n"
import { asset } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

// Certificates can optionally carry a real photo/scan. Add `image?: string`
// to the Certificate type in `data/portfolio.ts` and point it at a file in
// `/public/certificates/...` — everything below falls back gracefully to
// the icon placeholder when an item has no image yet.
type CertificateWithImage = Certificate & { image?: string }

type Filter = "ALL" | "IT" | "ORGANIZATION"

const filters: Filter[] = ["ALL", "IT", "ORGANIZATION"]

type Breakpoint = "mobile" | "tablet" | "desktop"

// Same coverflow approach as Selected Works, tuned smaller since certificate
// cards carry less content: mobile stays near-flat with a one-card peek,
// desktop fans three cards out on either side.
const STAGE_CONFIG: Record<
  Breakpoint,
  { cardWidth: number; stageHeight: number; stepX: number; stepRotate: number; visibleDepth: number }
> = {
  mobile: { cardWidth: 224, stageHeight: 300, stepX: 142, stepRotate: 14, visibleDepth: 1 },
  tablet: { cardWidth: 252, stageHeight: 320, stepX: 176, stepRotate: 22, visibleDepth: 2 },
  desktop: { cardWidth: 272, stageHeight: 340, stepX: 200, stepRotate: 30, visibleDepth: 3 },
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

function CertificateVisual({
  cert,
  size = "card",
}: {
  cert: CertificateWithImage
  size?: "card" | "detail"
}) {
  const { t } = useLang()
  const iconSize = size === "card" ? "size-8" : "size-16"
  const gridSize = size === "card" ? "18px 18px" : "24px 24px"

  if (cert.image) {
    return (
      <img
        src={asset(cert.image)}
        alt={t(cert.title)}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
    )
  }

  return (
    <>
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid) 1px, transparent 1px)
          `,
          backgroundSize: gridSize,
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Award className={`${iconSize} text-foreground/10`} />
        <span className="text-[10px] font-medium text-muted-foreground/40 tracking-widest uppercase">
          {size === "card" ? "Certificate" : cert.category}
        </span>
      </div>
    </>
  )
}

export function CertificateVault() {
  const { t } = useLang()
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL")
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<CertificateWithImage | null>(null)
  const dragX = useMotionValue(0)
  const breakpoint = useBreakpoint()
  const { cardWidth, stageHeight, stepX, stepRotate, visibleDepth } = STAGE_CONFIG[breakpoint]

  const filtered = certificates.filter(
    (c) => activeFilter === "ALL" || c.category === activeFilter
  ) as CertificateWithImage[]

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
    <section id="certificates" className="py-24 md:py-32 px-6 lg:px-8 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-foreground/30" />
              <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                {t(bi("Certificate Vault", "Vault Sertifikat"))}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-xl">
              {t(bi("Verified credentials and achievements.", "Kredensial dan pencapaian terverifikasi."))}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Filters */}
            <div className="flex gap-1 bg-background rounded-full p-1 w-fit border border-border">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => changeFilter(filter)}
                  className={`relative px-4 py-2 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === filter
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {activeFilter === filter && (
                    <motion.span
                      className="absolute inset-0 bg-foreground rounded-full"
                      layoutId="cert-filter"
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
                className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Previous certificate"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => go(1)}
                disabled={active === filtered.length - 1}
                className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Next certificate"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Coverflow stage — one row, cards fan out in 3D instead of stacking into
           a tall grid. Sizing/rotation come from STAGE_CONFIG per breakpoint. */}
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
              {filtered.map((cert, index) => {
                const offset = index - active
                if (Math.abs(offset) > visibleDepth) return null
                const isActive = offset === 0
                const depth = Math.min(Math.abs(offset), visibleDepth)

                return (
                  <motion.button
                    key={cert.id}
                    className={`group absolute left-1/2 top-0 text-left rounded-2xl border bg-card overflow-hidden ${
                      isActive ? "border-foreground/20 shadow-xl" : "border-border shadow-sm"
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
                    onClick={() => (isActive ? setSelected(cert) : setActive(index))}
                    whileHover={isActive ? { y: -4 } : undefined}
                  >
                    {/* Visual */}
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/20 overflow-hidden">
                      <CertificateVisual cert={cert} size="card" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground">
                          {cert.category}
                        </span>
                      </div>
                      {cert.image && (
                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-muted-foreground transition-colors">
                        {t(cert.title)}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{t(cert.issuer)}</span>
                        <span className="shrink-0 ml-2">{cert.year}</span>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Position dots */}
        {filtered.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {filtered.map((cert, index) => (
              <button
                key={cert.id}
                onClick={() => setActive(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? "w-6 bg-foreground" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to ${cert.title}`}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {t(bi("No certificates in this category yet.", "Belum ada sertifikat di kategori ini."))}
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
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {/* Visual */}
              <div className="relative aspect-[16/8] bg-gradient-to-br from-muted to-muted/20">
                <CertificateVisual cert={selected} size="detail" />
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
                    {selected.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{selected.year}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t(selected.title)}</h3>
                <div className="text-sm text-muted-foreground mb-4">{t(selected.issuer)}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {t(selected.description)}
                </p>
                {selected.verificationUrl && (
                  <a
                    href={selected.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                  >
                    {t(bi("Verify Certificate", "Verifikasi Sertifikat"))}
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}