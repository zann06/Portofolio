import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GitFork, Star, Users, ExternalLink } from "lucide-react"
import { useLang, bi } from "@/lib/i18n"

const EASE = [0.22, 1, 0.36, 1] as const

interface GithubUser {
  public_repos: number
  followers: number
  html_url: string
}

interface GithubRepo {
  id: number
  name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  pushed_at: string
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  PHP: "#4F5D95",
  Java: "#b07219",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "C++": "#f34b7d",
  Shell: "#89e051",
}

// GitHub's anonymous REST API allows only 60 requests/hour per IP, so every
// successful load is cached in localStorage and reused for an hour. When the
// API is rate-limited, the last cached snapshot is shown (marked as saved)
// instead of an error — the error box only appears with no cache at all.
const CACHE_TTL = 60 * 60 * 1000

interface CacheShape {
  savedAt: number
  profile: GithubUser
  repos: GithubRepo[]
}

function readCache(username: string): CacheShape | null {
  try {
    const raw = localStorage.getItem(`github-cache-${username}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheShape
    if (!parsed?.profile || !Array.isArray(parsed?.repos)) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(username: string, data: Omit<CacheShape, "savedAt">) {
  try {
    localStorage.setItem(
      `github-cache-${username}`,
      JSON.stringify({ ...data, savedAt: Date.now() })
    )
  } catch {
    // Storage unavailable — the widget just stays fetch-only.
  }
}

function timeAgo(dateString: string, t: (v: ReturnType<typeof bi> | string) => string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return t(bi("today", "hari ini"))
  if (days < 30) return `${days} ${t(bi("d ago", "hr lalu"))}`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ${t(bi("mo ago", "bln lalu"))}`
  return `${Math.floor(months / 12)} ${t(bi("y ago", "thn lalu"))}`
}

interface GithubActivityProps {
  username: string
  accentHex: string
}

/**
 * Live-ish GitHub snapshot for the IT filter: a real contribution heatmap
 * (fetched as an SVG image, so it's always current — no manual updates
 * needed) plus a few numbers and recently-pushed repos pulled straight from
 * GitHub's public REST API. Successful responses are cached in localStorage
 * for an hour (the anonymous API quota is 60 req/hour per IP), and when the
 * API is rate-limited the last cached snapshot is shown marked as saved —
 * the error box only appears when there is no cache at all.
 */
export function GithubActivity({ username, accentHex }: GithubActivityProps) {
  const { t } = useLang()
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [profile, setProfile] = useState<GithubUser | null>(null)
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [stale, setStale] = useState(false)

  useEffect(() => {
    let cancelled = false
    const cached = readCache(username)

    if (cached) {
      setProfile(cached.profile)
      setRepos(cached.repos)
      setStale(Date.now() - cached.savedAt > CACHE_TTL)
      setStatus("ready")
    }

    async function load() {
      try {
        const [userRes, reposRes] = await Promise.all([
          fetch(`https://api.github.com/users/${username}`),
          fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=4`),
        ])
        if (!userRes.ok || !reposRes.ok) throw new Error("GitHub request failed")
        const userData: GithubUser = await userRes.json()
        const reposData: GithubRepo[] = await reposRes.json()
        if (!cancelled) {
          setProfile(userData)
          setRepos(reposData)
          setStale(false)
          setStatus("ready")
          writeCache(username, { profile: userData, repos: reposData })
        }
      } catch {
        // No cache to fall back on — only then surface the error state.
        if (!cancelled && !cached) setStatus("error")
      }
    }

    // Fresh cache covers this visit — don't burn the anonymous API quota.
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
      return () => {
        cancelled = true
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [username])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mb-10 rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              GitHub Activity
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(bi("Pulled live from", "Ditarik langsung dari"))} github.com/{username}
            {stale && (
              <span className="text-amber-600 dark:text-amber-400">
                {" · "}
                {t(bi("showing saved data (API limit reached)", "menampilkan data tersimpan (batas API tercapai)"))}
              </span>
            )}
          </p>
        </div>

        {status === "ready" && profile && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              {profile.followers}
            </div>
            <div className="text-muted-foreground">{profile.public_repos} repos</div>
            <a
              href={profile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground hover:text-muted-foreground transition-colors"
            >
              {t(bi("Profile", "Profil"))} <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {status === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* The heatmap rides a separate proxy that isn't rate-limited, so it
               keeps working even when GitHub's REST API quota is exhausted —
               only the repo/follower numbers go missing. */}
            <p className="mb-4 text-xs text-muted-foreground">
              {t(bi(
                "Live repo stats are temporarily unavailable (GitHub's anonymous API limit) — the contribution graph below is still live.",
                "Statistik repo sementara tidak tersedia (batas API anonim GitHub) — graf kontribusi di bawah tetap langsung."
              ))}
            </p>
            <div className="mb-6 overflow-x-auto rounded-xl border border-border bg-background p-4">
              <img
                src={`https://ghchart.rshah.org/${accentHex}/${username}?_=${new Date().toDateString()}`}
                alt={`${username}'s GitHub contribution graph`}
                className="h-auto min-w-[640px]"
                loading="lazy"
              />
            </div>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
            >
              {t(bi("View profile on GitHub →", "Lihat profil di GitHub →"))}
              <ExternalLink className="size-3.5" />
            </a>
          </motion.div>
        ) : (
          <motion.div
            key={status === "loading" ? "loading" : "ready"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Contribution heatmap — fetched as a live SVG, always current */}
            <div className="mb-6 overflow-x-auto rounded-xl border border-border bg-background p-4">
              <img
                src={`https://ghchart.rshah.org/${accentHex}/${username}?_=${new Date().toDateString()}`}
                alt={`${username}'s GitHub contribution graph`}
                className="h-auto min-w-[640px]"
                loading="lazy"
              />
            </div>

            {/* Recently pushed repos */}
            <div className="grid gap-3 sm:grid-cols-2">
              {status === "loading" &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}

              {status === "ready" &&
                repos.map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl border border-border p-4 transition-colors hover:border-foreground/20"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground group-hover:text-muted-foreground transition-colors">
                        {repo.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(repo.pushed_at, t)}
                      </span>
                    </div>
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                      {repo.description || t(bi("No description yet.", "Belum ada deskripsi."))}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {repo.language && (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: LANGUAGE_COLORS[repo.language] ?? "#8b8b8b" }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3" />
                        {repo.stargazers_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <GitFork className="size-3" />
                        {repo.forks_count}
                      </span>
                    </div>
                  </a>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
