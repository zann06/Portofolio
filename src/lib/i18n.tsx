import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type Lang = "en" | "id"

/** A string that exists in both site languages. */
export interface Bi {
  en: string
  id: string
}

/** Shorthand for building bilingual strings in data/UI files. */
export function bi(en: string, id: string): Bi {
  return { en, id }
}

const STORAGE_KEY = "portfolio-lang"

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "en" || saved === "id") return saved
    if (navigator.language?.toLowerCase().startsWith("id")) return "id"
  } catch {
    // Storage can be unavailable (private mode) — fall through to default.
  }
  return "en"
}

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Resolve a bilingual (or plain) string in the active language. */
  t: (value: Bi | string) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next)
        try {
          localStorage.setItem(STORAGE_KEY, next)
        } catch {
          // Same as above — private mode just won't persist the choice.
        }
      },
      t: (v) => (typeof v === "string" ? v : v[lang]),
    }),
    [lang]
  )

  // Keep <html lang> in sync for screen readers and translation extensions.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>")
  return ctx
}
