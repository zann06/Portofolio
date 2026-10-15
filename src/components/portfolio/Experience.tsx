import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { experiences, type Category } from "@/data/portfolio"

const EASE = [0.22, 1, 0.36, 1] as const

type Filter = "ALL" | "IT" | "ESPORTS"

const filters: Filter[] = ["ALL", "IT", "ESPORTS"]

function matchesFilter(category: Category, filter: Filter): boolean {
  if (filter === "ALL") return true
  if (category === "BOTH") return true
  return category === filter
}

export function Experience() {
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL")

  const filtered = experiences.filter((e) => matchesFilter(e.category, activeFilter))

  return (
    <section id="experience" className="py-24 md:py-32 px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-foreground/30" />
              <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                Experience
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-xl">
              A track record across both worlds.
            </h2>
          </div>

          {/* Filters */}
          <div className="flex gap-1 bg-background rounded-full p-1 w-fit border border-border">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`relative px-4 py-2 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === filter
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeFilter === filter && (
                  <motion.span
                    className={`absolute inset-0 rounded-full ${
                      filter === "IT" ? "bg-it" : filter === "ESPORTS" ? "bg-esports" : "bg-foreground"
                    }`}
                    layoutId="exp-filter"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{filter}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <motion.div layout className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

          <AnimatePresence mode="popLayout">
            {filtered.map((exp, index) => (
              <motion.div
                key={exp.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: EASE }}
                className={`relative flex flex-col md:flex-row gap-6 mb-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-0 md:left-1/2 top-2 size-3 rounded-full bg-foreground border-4 border-background md:-translate-x-1/2 z-10" />

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1" />

                {/* Content */}
                <div className="flex-1 pl-8 md:pl-0 md:px-8">
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="border border-border rounded-2xl p-6 bg-card hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                        {exp.category === "BOTH" ? "IT + ESPORTS" : exp.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{exp.period}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {exp.role}
                    </h3>
                    <div className="text-sm text-muted-foreground mb-4">
                      {exp.organization}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {exp.description}
                    </p>
                    <ul className="space-y-2">
                      {exp.highlights.map((highlight, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 size-1 rounded-full bg-foreground/40 shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
