import { useState } from "react"
import type { FormEvent } from "react"
import { motion } from "framer-motion"
import { Mail, MapPin, Send } from "lucide-react"
import { toast } from "sonner"
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

const EASE = [0.22, 1, 0.36, 1] as const

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })

  // Static site with no inbox backend, so submit hands off to the visitor's
  // mail client with everything pre-filled to the real address.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Portfolio message from ${formData.name}`)
    const body = encodeURIComponent(
      `${formData.message}\n\n— ${formData.name} (${formData.email})`
    )
    window.location.href = `mailto:fauzan.faridrizky@gmail.com?subject=${subject}&body=${body}`
    toast.success("Opening your email app with the message pre-filled.")
  }

  return (
    <section id="contact" className="py-24 md:py-32 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-foreground/30" />
            <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Contact
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left */}
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                Let's build something together.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
                Whether you're looking for a developer, an esports manager, or
                someone who lives at the intersection of both — I'd love to hear
                from you.
              </p>

              <div className="space-y-4">
                <a
                  href="mailto:fauzan.faridrizky@gmail.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="size-10 rounded-full border border-border flex items-center justify-center group-hover:bg-foreground group-hover:text-primary-foreground transition-colors">
                    <Mail className="size-4" />
                  </div>
                  fauzan.faridrizky@gmail.com
                </a>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="size-10 rounded-full border border-border flex items-center justify-center">
                    <MapPin className="size-4" />
                  </div>
                  Indonesia
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href="https://github.com/zann06"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="size-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-primary-foreground transition-colors"
                  >
                    <GithubIcon className="size-4" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/farid-rizky-fauzan/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="size-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-primary-foreground transition-colors"
                  >
                    <LinkedinIcon className="size-4" />
                  </a>
                  <a
                    href="https://www.instagram.com/frrdznnn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="size-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-primary-foreground transition-colors"
                  >
                    <InstagramIcon className="size-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all resize-none"
                  placeholder="Tell me about your project or opportunity..."
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="inline-flex items-center gap-2 bg-foreground text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-foreground/80 transition-colors"
              >
                Send Message <Send className="size-4" />
              </motion.button>
              <p className="text-xs text-muted-foreground">
                Submitting opens your email app with everything pre-filled to
                fauzan.faridrizky@gmail.com.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}