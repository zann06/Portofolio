import { useState, useEffect } from "react"
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion"
import { Menu, X } from "lucide-react"
import { useLang, bi, type Lang } from "@/lib/i18n"
import { scrollToSection, scrollToTop } from "@/lib/smooth-scroll"

interface NavbarProps {
  activeIdentity: "IT" | "ESPORTS"
  onIdentityChange: (identity: "IT" | "ESPORTS") => void
}

const navLinks = [
  { label: bi("About", "Tentang"), href: "#about" },
  { label: bi("Work", "Karya"), href: "#works" },
  { label: bi("Experience", "Pengalaman"), href: "#experience" },
  { label: bi("Skills", "Keahlian"), href: "#skills" },
  { label: bi("Certificates", "Sertifikat"), href: "#certificates" },
  { label: bi("Contact", "Kontak"), href: "#contact" },
]

function LanguageToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center gap-1 bg-muted rounded-full p-1">
      {(["en", "id"] as const).map((code) => (
        <button
          key={code}
          onClick={() => setLang(code as Lang)}
          aria-label={`Switch to ${code === "en" ? "English" : "Indonesia"}`}
          className={`relative px-3 py-1.5 text-xs font-semibold uppercase rounded-full transition-colors duration-200 ${
            lang === code ? "text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {lang === code && (
            <motion.span
              className="absolute inset-0 rounded-full bg-foreground"
              layoutId="lang-pill"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <span className="relative z-10">{code}</span>
        </button>
      ))}
    </div>
  )
}

export function Navbar({ activeIdentity, onIdentityChange }: NavbarProps) {
  const { t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Scroll-spy: highlight the nav link of the section currently in view.
  const [activeSection, setActiveSection] = useState<string>("")

  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Track which section the viewport is currently in (fixed navbar offset).
  useEffect(() => {
    const ids = navLinks.map((l) => l.href.slice(1))
    const onScroll = () => {
      const pos = window.scrollY + 160
      let current = ""
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= pos) current = id
      }
      setActiveSection(current)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  const handleLink = (href: string) => {
    setMenuOpen(false)
    scrollToSection(href)
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-transparent"
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                scrollToTop()
              }}
              className="font-semibold text-sm tracking-tight text-foreground"
              whileHover={{ opacity: 0.7 }}
              transition={{ duration: 0.2 }}
            >
              FRF
            </motion.a>

            {/* Desktop Nav — scroll-spy highlights the section in view */}
            <nav className="hidden md:flex items-center gap-5">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.slice(1)
                return (
                  <button
                    key={link.href}
                    onClick={() => handleLink(link.href)}
                    className={`relative text-sm transition-colors duration-200 ${
                      isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(link.label)}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-dot"
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 size-1 rounded-full bg-foreground"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Identity + language switchers */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageToggle />
              <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                {(["IT", "ESPORTS"] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => onIdentityChange(id)}
                    className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 ${
                      activeIdentity === id
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {activeIdentity === id && (
                      <motion.span
                        className={`absolute inset-0 rounded-full ${
                          activeIdentity === "IT" ? "bg-it" : "bg-esports"
                        }`}
                        layoutId="identity-pill"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center gap-2">
              <button
                className="p-2 text-foreground"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Scroll progress — hairline gradient under the header */}
        <motion.div
          style={{ scaleX: progress }}
          className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-it via-foreground to-esports"
        />
      </motion.header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background pt-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col p-6 gap-2">
              {/* Switchers Mobile */}
              <div className="flex gap-2 mb-4">
                {(["IT", "ESPORTS"] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => onIdentityChange(id)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                      activeIdentity === id
                        ? id === "IT"
                          ? "bg-it text-white border-it"
                          : "bg-esports text-white border-esports"
                        : "bg-transparent text-muted-foreground border-border"
                    }`}
                  >
                    {id}
                  </button>
                ))}
                <LanguageToggle />
              </div>
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  onClick={() => handleLink(link.href)}
                  className={`text-left py-3 text-xl font-medium border-b border-border/50 transition-colors ${
                    activeSection === link.href.slice(1)
                      ? "text-foreground"
                      : "text-foreground/70 hover:text-muted-foreground"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {t(link.label)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
