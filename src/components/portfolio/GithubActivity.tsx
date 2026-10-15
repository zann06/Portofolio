import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { GitFork, Star, Users, ExternalLink, RefreshCw } from "lucide-react"

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

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return "today"
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

interface GithubActivityProps {
  username: string
  accentHex: string
}

/**
 * Live-ish GitHub snapshot for the IT filter: a real contribution heatmap
 * (fetched as an SVG image, so it's always current — no manual updates
 * needed) plus a few numbers and recently-pushed repos pulled straight from
 * GitHub's public REST API. Degrades quietly to a plain "view profile" link
 * if the API is unreachable or rate-limited, so it never blocks the page.
 */
export function GithubActivity({ username, accentHex }: GithubActivityProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [profile, setProfile] = useState<GithubUser | null>(null)
  const [repos, setRepos] = useState<GithubRepo[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus("loading")
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
          setStatus("ready")
        }
      } catch {
        if (!cancelled) setStatus("error")
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
            Pulled live from github.com/{username}
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
              Profile <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}
      </div>

      {status === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
          <RefreshCw className="size-5 text-muted-foreground" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Couldn't load live GitHub data right now — GitHub's public API is rate-limited for anonymous requests.
          </p>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
          >
            View profile on GitHub →
          </a>
        </div>
      ) : (
        <>
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
                      {timeAgo(repo.pushed_at)}
                    </span>
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                    {repo.description || "No description yet."}
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
        </>
      )}
    </motion.div>
  )
}