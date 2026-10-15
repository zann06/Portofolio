import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"

interface NavbarProps {
  activeIdentity: "IT" | "ESPORTS"
  onIdentityChange: (identity: "IT" | "ESPORTS") => void
}

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#works" },
  { label: "Experience", href: "#experience" },
  { label: "Skills", href: "#skills" },
  { label: "Certificates", href: "#certificates" },
  { label: "Contact", href: "#contact" },
]

export function Navbar({ activeIdentity, onIdentityChange }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
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
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: "smooth" })
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
              className="font-semibold text-sm tracking-tight text-foreground"
              whileHover={{ opacity: 0.7 }}
              transition={{ duration: 0.2 }}
            >
              FRF
            </motion.a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleLink(link.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Identity Switcher */}
            <div className="hidden md:flex items-center gap-3">
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
              {/* Identity Switcher Mobile */}
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
              </div>
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  onClick={() => handleLink(link.href)}
                  className="text-left py-3 text-xl font-medium text-foreground border-b border-border/50 hover:text-muted-foreground transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {link.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}