import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { Code2, Layout, BarChart3, Trophy, Users, Target } from "lucide-react"
import { useLang, bi } from "@/lib/i18n"

const EASE = [0.22, 1, 0.36, 1] as const

interface WhatIDoProps {
  activeIdentity: "IT" | "ESPORTS"
}

const itServices = [
  {
    icon: Code2,
    title: bi("Web Development", "Pengembangan Web"),
    description: bi(
      "Building full-stack web applications with modern frameworks — React, Next.js, Node.js, and TypeScript.",
      "Membangun aplikasi web full-stack dengan framework modern — React, Next.js, Node.js, dan TypeScript."
    ),
  },
  {
    icon: Layout,
    title: bi("UI/UX Design", "Desain UI/UX"),
    description: bi(
      "Designing clean, intuitive interfaces and conducting user research to create products people love to use.",
      "Merancang antarmuka yang bersih dan intuitif serta melakukan riset pengguna untuk menciptakan produk yang nyaman dipakai."
    ),
  },
  {
    icon: BarChart3,
    title: bi("Data & Research", "Data & Riset"),
    description: bi(
      "Analyzing data, building dashboards, and conducting research to inform product and business decisions.",
      "Menganalisis data, membangun dashboard, dan melakukan riset untuk mendukung keputusan produk dan bisnis."
    ),
  },
]

const esportsServices = [
  {
    icon: Trophy,
    title: bi("Esports Management", "Manajemen Esports"),
    description: bi(
      "Managing competitive teams end-to-end — from roster building and recruitment to tournament operations.",
      "Mengelola tim kompetitif secara end-to-end — dari pembentukan roster dan rekrutmen hingga operasional turnamen."
    ),
  },
  {
    icon: Users,
    title: bi("Athlete Development", "Pembinaan Atlet"),
    description: bi(
      "Developing training programs, mentoring athletes, and building team culture that drives performance.",
      "Menyusun program latihan, membina atlet, dan membangun budaya tim yang mendorong performa."
    ),
  },
  {
    icon: Target,
    title: bi("Game Strategy & Meta", "Strategi & Meta Game"),
    description: bi(
      "Researching meta, analyzing opponents, and crafting strategic playbooks for competitive success.",
      "Melakukan riset meta, menganalisis lawan, dan menyusun playbook strategis untuk sukses kompetitif."
    ),
  },
]

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export function WhatIDo({ activeIdentity }: WhatIDoProps) {
  const { t } = useLang()
  const services = activeIdentity === "IT" ? itServices : esportsServices

  return (
    <section className="py-24 md:py-32 px-6 lg:px-8 bg-muted/30">
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
              {t(bi("What I Do", "Apa yang Saya Kerjakan"))}
            </span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-12 max-w-2xl"
          >
            {t(
              activeIdentity === "IT"
                ? bi("Building digital products that solve real problems.", "Membangun produk digital yang memecahkan masalah nyata.")
                : bi("Leading teams and strategies that win.", "Memimpin tim dan strategi yang menang.")
            )}
          </motion.h2>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group border border-border rounded-2xl p-8 bg-card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="size-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-primary-foreground transition-colors duration-300">
                  <service.icon className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {t(service.title)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(service.description)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
