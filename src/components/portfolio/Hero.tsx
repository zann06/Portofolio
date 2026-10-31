import { lazy, Suspense, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown, ArrowUpRight, Download } from "lucide-react"
import { useLang, bi } from "@/lib/i18n"
import { asset } from "@/lib/utils"

// three.js (+R3F) is ~600KB, so the island loads as its own chunk after the
// page is interactive — the hero renders instantly with a quiet placeholder.
const IslandScene = lazy(() => import("@/components/portfolio/IslandScene"))

const EASE = [0.22, 1, 0.36, 1] as const

interface HeroProps {
  activeIdentity: "IT" | "ESPORTS"
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
}

export function Hero({ activeIdentity }: HeroProps) {
  const { t } = useLang()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const scrollToAbout = () => {
    document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
          {/* Eyebrow */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-12 bg-foreground/30" />
            <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              {t(
                activeIdentity === "IT"
                  ? bi("Technology & Development", "Teknologi & Pengembangan")
                  : bi("Esports & Organization", "Esports & Organisasi")
              )}
            </span>
          </motion.div>

          {/* Name */}
          <motion.div variants={itemVariants} className="mb-4">
            <h1 className="text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.9] tracking-tight text-foreground">
              Farid
              <br />
              Rizky
              <br />
              <span className="text-muted-foreground/30">Fauzan</span>
            </h1>
          </motion.div>

          {/* Identity Tags */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-2 mb-10"
          >
            <motion.span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-500 ${
                activeIdentity === "IT"
                  ? "bg-it text-white border-it"
                  : "bg-transparent text-muted-foreground border-border"
              }`}
              layout
            >
              <span className="size-1.5 rounded-full bg-current" />
              {t(bi("IT & Technology", "IT & Teknologi"))}
            </motion.span>
            <motion.span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-500 ${
                activeIdentity === "ESPORTS"
                  ? "bg-esports text-white border-esports"
                  : "bg-transparent text-muted-foreground border-border"
              }`}
              layout
            >
              <span className="size-1.5 rounded-full bg-current" />
              {t(bi("Esports & Organization", "Esports & Organisasi"))}
            </motion.span>
          </motion.div>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="max-w-xl text-lg text-muted-foreground leading-relaxed"
          >
            {t(
              activeIdentity === "IT"
                ? bi("Full-stack developer and UX researcher building thoughtful digital products — from web applications to data-driven platforms.", "Full-stack developer dan UX researcher yang membangun produk digital yang thoughtful — dari aplikasi web hingga platform berbasis data.")
                : bi("Esports manager and strategist leading competitive teams, managing organizations, and developing athletes at the national level.", "Manajer dan strategis esports yang memimpin tim kompetitif, mengelola organisasi, dan membina atlet hingga level nasional.")
            )}
          </motion.p>

          {/* CTA */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mt-10">
            <motion.button
              onClick={() => document.querySelector("#works")?.scrollIntoView({ behavior: "smooth" })}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                activeIdentity === "IT"
                  ? "bg-it text-white hover:bg-it/85"
                  : "bg-esports text-white hover:bg-esports/85"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t(bi("View My Work", "Lihat Karya Saya"))}
            </motion.button>
            <motion.button
              onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-muted transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t(bi("Get in Touch", "Hubungi Saya"))}
            </motion.button>
            <motion.a
              href={asset("/cv/farid-rizky-fauzan-cv.pdf")}
              download="Farid-Rizky-Fauzan-CV.pdf"
              className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-muted transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t(bi("Download CV", "Unduh CV"))} <Download className="size-4" />
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-6 mt-16 pt-10 border-t border-border max-w-lg"
          >
            {[
              { value: "3+", label: bi("Years Experience", "Tahun Pengalaman") },
              { value: "15+", label: bi("Projects Shipped", "Proyek Selesai") },
              { value: "9+", label: bi("Teams Managed", "Tim Dikelola") },
            ].map((stat) => (
              <div key={t(stat.label)}>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(stat.label)}</div>
              </div>
            ))}
          </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 24 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
            className="relative hidden lg:block"
          >
            <Suspense fallback={<div className="aspect-[5/4] w-full animate-pulse rounded-2xl bg-muted/40" />}>
              <IslandScene identity={activeIdentity} />
            </Suspense>
            <div className="pointer-events-none absolute -top-4 -right-4 flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-md">
              <span
                className={`size-1.5 rounded-full ${activeIdentity === "IT" ? "bg-it" : "bg-esports"}`}
              />
              {t(bi("Available for selected work", "Terbuka untuk kerja terpilih"))}
            </div>
            <div className="absolute -bottom-5 -left-5">
              <div className="rounded-xl border border-border bg-card/90 px-4 py-3 shadow-xl backdrop-blur-md">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t(bi("Drag to orbit", "Geser untuk memutar"))}
                </div>
                <a
                  href="https://zann06.github.io/TinyWorld/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors"
                >
                  {t(bi("From TinyWorld — open demo", "Dari TinyWorld — buka demo"))} <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.button
        onClick={scrollToAbout}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <span className="text-xs tracking-widest uppercase">{t(bi("Scroll", "Gulir"))}</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ArrowDown className="size-4" />
        </motion.div>
      </motion.button>
    </section>
  )
}