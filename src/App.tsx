import { useState, useCallback } from "react"
import { ThemeProvider } from "@/components/theme-provider"
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

export function App() {
  const [loading, setLoading] = useState(true)
  const [activeIdentity, setActiveIdentity] = useState<"IT" | "ESPORTS">("IT")

  const handleLoadingComplete = useCallback(() => setLoading(false), [])

  return (
    <ThemeProvider defaultTheme="dark" storageKey="portfolio-theme">
      {loading && <Preloader onComplete={handleLoadingComplete} />}
      <div className="relative min-h-svh bg-background">
        <Navbar activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} />
        <main>
          <Hero activeIdentity={activeIdentity} />
          <About />
          <WhatIDo activeIdentity={activeIdentity} />
          <SelectedWorks />
          <Experience />
          <Skills />
          <Approach />
          <CertificateVault />
          <Contact />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}

export default App
