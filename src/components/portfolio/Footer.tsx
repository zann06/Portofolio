import { motion } from "framer-motion"
import { ArrowUp, Mail } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "@/components/portfolio/SocialIcons"

// lucide-react dropped brand/logo icons (Instagram included), so this one is
// defined locally the same way GithubIcon/LinkedinIcon are in SocialIcons.tsx.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.5" y1="6.5" y2="6.5" />
    </svg>
  )
}

const socialLinks = [
  { label: "GitHub", href: "https://github.com/zann06", icon: GithubIcon },
  { label: "LinkedIn", href: "https://linkedin.com/in/farid-rizky-fauzan", icon: LinkedinIcon },
  { label: "Instagram", href: "https://www.instagram.com/frrdznnn/", icon: InstagramIcon },
  { label: "Email", href: "mailto:fauzan.faridrizky@gmail.com", icon: Mail },
]

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="border-t border-border px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="font-bold text-lg tracking-tight text-foreground mb-2">
              Farid Rizky Fauzan
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Two sides. One identity. — Technology meets competition.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex gap-3">
            {socialLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={link.label}
                  className="size-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-primary-foreground transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              )
            })}
          </div>

          {/* Back to top */}
          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -2 }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to top
            <ArrowUp className="size-4" />
          </motion.button>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-muted-foreground">
          <div>
            &copy; {new Date().getFullYear()} Farid Rizky Fauzan. All rights reserved.
          </div>
          <div>Built with React, Tailwind CSS, and Framer Motion.</div>
        </div>
      </div>
    </footer>
  )
}