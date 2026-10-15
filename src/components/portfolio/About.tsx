import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { IdentityCard3D } from "@/components/portfolio/IdentityCard3D"
import { asset } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

export function About() {
  return (
    <section id="about" className="py-24 md:py-32 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-foreground/30" />
            <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              About
            </span>
          </motion.div>

          <div className="grid md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-7">
              <motion.h2
                variants={itemVariants}
                className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-8"
              >
                Two sides.
                <br />
                <span className="text-muted-foreground/40">One identity.</span>
              </motion.h2>

              <motion.div variants={itemVariants} className="space-y-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                <p>
                  I'm <span className="text-foreground font-medium">Farid Rizky Fauzan</span> —
                  a developer, researcher, and esports manager who believes technology and
                  competitive gaming aren't separate worlds, but complementary disciplines.
                </p>
                <p>
                  On the technology side, I build web applications, design user experiences,
                  and conduct research that turns data into decisions. On the esports side,
                  I manage teams, develop athletes, and craft strategies that win tournaments.
                </p>
                <p>
                  My work lives at the intersection of these two worlds — where software
                  meets competition, where data meets strategy, and where leadership meets
                  innovation.
                </p>
              </motion.div>
            </div>

            <div className="md:col-span-5">
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-6"
              >
                {/* Profile Image as a floating 3D ID badge */}
                <IdentityCard3D
                  image={asset("/fauzan.jpg")}
                  alt="Farid Rizky Fauzan"
                  name="Farid Rizky Fauzan"
                  title="Developer & Esports Manager"
                />

                {/* Profile Card */}
                <div className="border border-border rounded-2xl p-6 bg-card">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Location</span>
                      <span className="text-foreground font-medium">Indonesia</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Focus</span>
                      <span className="text-foreground font-medium">IT & Esports</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-foreground font-medium flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Available
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Languages</span>
                      <span className="text-foreground font-medium">EN, ID</span>
                    </div>
                  </div>
                </div>

                {/* Two Sides Card */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border rounded-xl p-5 bg-card">
                    <div className="text-xs text-it mb-2 tracking-widest uppercase font-medium">Side A</div>
                    <div className="font-semibold text-foreground">IT</div>
                    <div className="text-xs text-muted-foreground mt-1">Development, UX, Research</div>
                  </div>
                  <div className="border border-border rounded-xl p-5 bg-card">
                    <div className="text-xs text-esports mb-2 tracking-widest uppercase font-medium">Side B</div>
                    <div className="font-semibold text-foreground">Esports</div>
                    <div className="text-xs text-muted-foreground mt-1">Management, Strategy, Leadership</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}