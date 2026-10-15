import { motion } from "framer-motion"
import { Blocks, Compass, Trophy } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Compass,
    title: "Find the signal",
    description: "I start by understanding the people, constraints, and outcome behind the brief before choosing a solution.",
  },
  {
    number: "02",
    icon: Blocks,
    title: "Build with intent",
    description: "I turn the clearest direction into practical systems, thoughtful interfaces, and work that can ship.",
  },
  {
    number: "03",
    icon: Trophy,
    title: "Measure the impact",
    description: "I use feedback, data, and iteration to make the result stronger after launch—not just prettier before it.",
  },
]

export function Approach() {
  return (
    <section className="border-y border-border bg-muted/20 py-24 md:py-32 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-12 bg-foreground/30" />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              How I work
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Clear thinking before clever execution.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            The best work sits between strategy and craft. This is the rhythm I bring to products, research, and competitive teams.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-it/50"
              >
                <div className="mb-12 flex items-start justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-it/10 text-it">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-mono text-xs tracking-widest text-muted-foreground/60">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
