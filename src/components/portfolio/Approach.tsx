import { motion } from "framer-motion"
import { Blocks, Compass, Trophy } from "lucide-react"
import { useLang, bi } from "@/lib/i18n"

const steps = [
  {
    number: "01",
    icon: Compass,
    title: bi("Find the signal", "Menemukan sinyal"),
    description: bi(
      "I start by understanding the people, constraints, and outcome behind the brief before choosing a solution.",
      "Saya mulai dengan memahami orang, kendala, dan hasil yang diinginkan di balik brief sebelum memilih solusi."
    ),
  },
  {
    number: "02",
    icon: Blocks,
    title: bi("Build with intent", "Membangun dengan niat"),
    description: bi(
      "I turn the clearest direction into practical systems, thoughtful interfaces, and work that can ship.",
      "Saya mengubah arah yang paling jelas menjadi sistem yang praktis, antarmuka yang thoughtful, dan karya yang bisa dirilis."
    ),
  },
  {
    number: "03",
    icon: Trophy,
    title: bi("Measure the impact", "Mengukur dampaknya"),
    description: bi(
      "I use feedback, data, and iteration to make the result stronger after launch—not just prettier before it.",
      "Saya memakai umpan balik, data, dan iterasi untuk membuat hasil makin kuat setelah rilis—bukan sekadar lebih cantik sebelum rilis."
    ),
  },
]

export function Approach() {
  const { t } = useLang()
  return (
    <section className="border-y border-border bg-muted/20 py-24 md:py-32 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-12 bg-foreground/30" />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t(bi("How I work", "Cara saya bekerja"))}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            {t(bi("Clear thinking before clever execution.", "Berpikir jernih sebelum eksekusi yang pintar."))}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {t(bi(
              "The best work sits between strategy and craft. This is the rhythm I bring to products, research, and competitive teams.",
              "Karya terbaik berada di antara strategi dan craft. Ini ritme yang saya bawa ke produk, riset, dan tim kompetitif."
            ))}
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
                <h3 className="text-xl font-semibold text-foreground">{t(step.title)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(step.description)}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
