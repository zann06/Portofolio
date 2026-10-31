import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X } from "lucide-react"
import { useLang, bi } from "@/lib/i18n"
import { asset } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

type Track = "IT" | "ESPORTS"
type CvLang = "EN" | "ID"

interface CvDialogProps {
  open: boolean
  onClose: () => void
  /** Preselects the track from the navbar identity toggle. */
  identity: "IT" | "ESPORTS"
}

/**
 * Download-CV picker: the site carries four ATS-friendly CVs (IT/Esports x
 * English/Indonesian). Track preselects from the navbar identity toggle and
 * language from the site language; both can be overridden before downloading.
 */
export function CvDialog({ open, onClose, identity }: CvDialogProps) {
  const { t, lang } = useLang()
  const [track, setTrack] = useState<Track>(identity)
  const [cvLang, setCvLang] = useState<CvLang>(lang === "id" ? "ID" : "EN")

  // Re-sync the presets each time the dialog opens.
  useEffect(() => {
    if (open) {
      setTrack(identity)
      setCvLang(lang === "id" ? "ID" : "EN")
    }
  }, [open, identity, lang])

  // Close on Escape so keyboard users aren't trapped
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  // Generated PDFs use "Esports" (mixed case) in their filenames.
  const trackPart = track === "IT" ? "IT" : "Esports"
  const file = `Farid-Rizky-Fauzan-CV-${trackPart}-${cvLang}.pdf`

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={t(bi("Download CV", "Unduh CV"))}
        >
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <button
              onClick={onClose}
              aria-label={t(bi("Close", "Tutup"))}
              className="absolute top-4 right-4 size-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-1">
              {t(bi("Download CV", "Unduh CV"))}
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              {t(bi(
                "Pick a track and language — all versions are ATS-friendly PDFs.",
                "Pilih jalur dan bahasa — semua versi PDF ramah ATS."
              ))}
            </p>

            {/* Track */}
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t(bi("Track", "Jalur"))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "IT" as Track, label: bi("IT", "IT") },
                  { value: "ESPORTS" as Track, label: bi("Esports", "Esports") },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTrack(opt.value)}
                    className={`py-2.5 text-sm font-medium rounded-xl border transition-all ${
                      track === opt.value
                        ? opt.value === "IT"
                          ? "bg-it text-white border-it"
                          : "bg-esports text-white border-esports"
                        : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {t(opt.label)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="mb-5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t(bi("Language", "Bahasa"))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "EN" as CvLang, label: bi("English", "Inggris") },
                  { value: "ID" as CvLang, label: bi("Indonesian", "Indonesia") },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCvLang(opt.value)}
                    className={`py-2.5 text-sm font-medium rounded-xl border transition-all ${
                      cvLang === opt.value
                        ? "bg-foreground text-primary-foreground border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {t(opt.label)}
                  </button>
                ))}
              </div>
            </div>

            <a
              href={asset(`/cv/${file}`)}
              download={file}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-foreground/80 transition-colors"
            >
              {t(bi("Download CV", "Unduh CV"))} <Download className="size-4" />
            </a>
            <div className="mt-3 text-center font-mono text-[10px] text-muted-foreground/70 truncate">
              {file}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
