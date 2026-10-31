import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { skills, type Skill } from "@/data/portfolio"
import { useLang, bi } from "@/lib/i18n"
import { GithubActivity } from "@/components/portfolio/GithubActivity"

const GITHUB_USERNAME = "zann06"

type Filter = "IT" | "ESPORTS"

const filters: Filter[] = ["IT", "ESPORTS"]

const LEVEL_LABELS = [
  bi("", ""),
  bi("Beginner", "Pemula"),
  bi("Familiar", "Familiar"),
  bi("Intermediate", "Menengah"),
  bi("Advanced", "Lanjutan"),
  bi("Expert", "Ahli"),
]

function levelPercent(level: number): number {
  return Math.round((level / 5) * 100)
}

function SkillRow({ skill, index }: { skill: Skill; index: number }) {
  const { t } = useLang()
  const accent = skill.category === "IT" ? "var(--it)" : "var(--esports)"
  const percent = levelPercent(skill.level)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{skill.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{percent}%</span>
      </div>
      {/* 5-segment meter — reads as a level scale rather than a raw progress bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((seg) => (
          <motion.span
            key={seg}
            className={`h-1.5 flex-1 rounded-full ${seg <= skill.level ? "" : "bg-muted"}`}
            style={seg <= skill.level ? { backgroundColor: accent } : undefined}
            initial={{ opacity: 0, scaleY: 0.3 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.3, delay: index * 0.04 + seg * 0.05 }}
          />
        ))}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground/60">
        {t(LEVEL_LABELS[skill.level])}
      </div>
    </motion.div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function Skills() {
  const { t } = useLang()
  const [activeFilter, setActiveFilter] = useState<Filter>("IT")
  const filtered = skills.filter((s) => s.category === activeFilter)
  const groups = [...new Set(filtered.map((s) => s.group))]

  const expertCount = filtered.filter((s) => s.level === 5).length
  const avgLevel = filtered.length > 0
    ? (filtered.reduce((sum, s) => sum + s.level, 0) / filtered.length).toFixed(1)
    : "0"

  return (
    <section id="skills" className="py-24 md:py-32 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-foreground/30" />
              <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                {t(bi("Skills", "Keahlian"))}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-xl">
              {t(bi("Tools and capabilities across both disciplines.", "Tools dan kemampuan di kedua disiplin."))}
            </h2>
          </div>

          {/* Filters */}
          <div className="flex gap-1 bg-muted rounded-full p-1 w-fit">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`relative px-4 py-2 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === filter
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeFilter === filter && (
                  <motion.span
                    className={`absolute inset-0 rounded-full ${
                      filter === "IT" ? "bg-it" : "bg-esports"
                    }`}
                    layoutId="skills-filter"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{filter}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={String(filtered.length)} label={t(bi("Total Skills", "Total Skill"))} />
          <StatCard value={String(expertCount)} label={t(bi("Expert Level", "Level Ahli"))} />
          <StatCard value={avgLevel} label={t(bi("Avg. Level", "Rata-rata Level"))} />
          <StatCard value={String(groups.length)} label={t(bi("Skill Groups", "Grup Skill"))} />
        </div>

        {/* Live GitHub snapshot — only makes sense for the IT side */}
        <AnimatePresence>
          {activeFilter === "IT" && (
            <GithubActivity username={GITHUB_USERNAME} accentHex="2563eb" />
          )}
        </AnimatePresence>

        {/* Skills Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {groups.map((group) => (
              <div
                key={group}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20"
              >
                <div className="mb-5 flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: activeFilter === "IT" ? "var(--it)" : "var(--esports)",
                    }}
                  />
                  <h3 className="text-sm font-semibold tracking-wide text-foreground">
                    {group}
                  </h3>
                </div>
                <div className="space-y-4">
                  {filtered
                    .filter((s) => s.group === group)
                    .map((skill, i) => (
                      <SkillRow key={skill.name} skill={skill} index={i} />
                    ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}