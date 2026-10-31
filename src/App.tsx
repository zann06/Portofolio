import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUp } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider, useLang, bi } from "@/lib/i18n"
import { Preloader } from "@/components/portfolio/Preloader"
import { Navbar } from "@/components/portfolio/Navbar"
import { Hero } from "@/components/portfolio/Hero"
import { About } from "@/components/portfolio/About"
import { WhatIDo } from "@/components/portfolio/WhatIDo"
import { SelectedWorks } from "@/components/portfolio/SelectedWorks"
import { Experience } from "@/components/portfolio/Experience"
import { Skills } from "@/components/portfolio/Skills"
import { Approach } from "@/components/portfolio/Approach"
import { CertificateVault } from "@/components/portfolio/CertificateVault"
import { Contact } from "@/components/portfolio/Contact"
import { Footer } from "@/components/portfolio/Footer"

// Floating shortcut that appears once the hero is scrolled past — the footer
// "back to top" link stays, this one is reachable from anywhere. Sits on the
// left so it never fights the toast stack in the bottom-right corner.
function BackToTop() {
  const { t } = useLang()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t(bi("Back to top", "Kembali ke atas"))}
          className="fixed bottom-6 left-6 z-40 size-11 rounded-full border border-border bg-background/90 backdrop-blur-md shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <ArrowUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export function App() {
  const [loading, setLoading] = useState(true)
  const [activeIdentity, setActiveIdentity] = useState<"IT" | "ESPORTS">("IT")

  const handleLoadingComplete = useCallback(() => setLoading(false), [])

  return (
    <LanguageProvider>
      <ThemeProvider defaultTheme="dark" storageKey="portfolio-theme">
        {loading && <Preloader onComplete={handleLoadingComplete} />}
        <div className="relative min-h-svh bg-background">
          <Navbar activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} />
          <main>
            <Hero activeIdentity={activeIdentity} />
            <About />
            <WhatIDo activeIdentity={activeIdentity} />
            <SelectedWorks identity={activeIdentity} />
            <Experience identity={activeIdentity} />
            <Skills identity={activeIdentity} />
            <Approach />
            <CertificateVault identity={activeIdentity} />
            <Contact />
          </main>
          <Footer />
          <BackToTop />
        </div>
      </ThemeProvider>
    </LanguageProvider>
  )
}

export default App
