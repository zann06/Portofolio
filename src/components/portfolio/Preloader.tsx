import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLang, bi } from "@/lib/i18n"

interface PreloaderProps {
  onComplete: () => void
}

export function Preloader({ onComplete }: PreloaderProps) {
  const { t } = useLang()
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<"loading" | "reveal">("loading")

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setPhase("reveal"), 200)
          setTimeout(() => onComplete(), 1400)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 80)
    return () => clearInterval(interval)
  }, [onComplete])

  const displayProgress = Math.min(Math.round(progress), 100)

  return (
    <AnimatePresence>
      {phase !== "reveal" || progress < 100 ? (
        <motion.div
          className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center"
          animate={phase === "reveal" ? { y: "-100%" } : {}}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] as const, delay: 0.1 }}
        >
          <div className="w-full max-w-xs px-8">
            <motion.div
              className="mb-8 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-muted-foreground text-xs tracking-[0.3em] uppercase mb-2">
                Portfolio
              </div>
              <div className="text-foreground font-semibold text-xl tracking-tight">
                Farid Rizky Fauzan
              </div>
            </motion.div>

            <div className="relative h-px bg-foreground/10 w-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-foreground"
                style={{ width: `${displayProgress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>

            <div className="flex justify-between items-center mt-3">
              <span className="text-muted-foreground text-xs tracking-widest">
                {t(bi("Loading", "Memuat"))}
              </span>
              <span className="text-foreground text-xs font-mono">
                {displayProgress}%
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}