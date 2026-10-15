import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { Code2, Layout, BarChart3, Trophy, Users, Target } from "lucide-react"

const EASE = [0.22, 1, 0.36, 1] as const

interface WhatIDoProps {
  activeIdentity: "IT" | "ESPORTS"
}

const itServices = [
  {
    icon: Code2,
    title: "Web Development",
    description: "Building full-stack web applications with modern frameworks — React, Next.js, Node.js, and TypeScript.",
  },
  {
    icon: Layout,
    title: "UI/UX Design",
    description: "Designing clean, intuitive interfaces and conducting user research to create products people love to use.",
  },
  {
    icon: BarChart3,
    title: "Data & Research",
    description: "Analyzing data, building dashboards, and conducting research to inform product and business decisions.",
  },
]

const esportsServices = [
  {
    icon: Trophy,
    title: "Esports Management",
    description: "Managing competitive teams end-to-end — from roster building and recruitment to tournament operations.",
  },
  {
    icon: Users,
    title: "Athlete Development",
    description: "Developing training programs, mentoring athletes, and building team culture that drives performance.",
  },
  {
    icon: Target,
    title: "Game Strategy & Meta",
    description: "Researching meta, analyzing opponents, and crafting strategic playbooks for competitive success.",
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
              What I Do
            </span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-12 max-w-2xl"
          >
            {activeIdentity === "IT" ? "Building digital products that solve real problems." : "Leading teams and strategies that win."}
          </motion.h2>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            {services.map((service) => (
              <motion.div
                key={service.title}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group border border-border rounded-2xl p-8 bg-card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="size-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-primary-foreground transition-colors duration-300">
                  <service.icon className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
