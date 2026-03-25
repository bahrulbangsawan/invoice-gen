import { useNavigate } from "@tanstack/react-router"
import { useTranslation, SUPPORTED_LOCALES, type Locale } from "@/i18n"
import { cn } from "@/lib/utils"

// ── SVG Flag Icons ─────────────────────────────────────────

function FlagGB({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 30"
      className={className}
      role="img"
      aria-label="English"
    >
      <clipPath id="gb-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#gb-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#gb-clip)" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  )
}

function FlagID({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 30"
      className={className}
      role="img"
      aria-label="Bahasa Indonesia"
    >
      <rect width="60" height="15" fill="#CE1126" />
      <rect width="60" height="15" y="15" fill="#fff" />
    </svg>
  )
}

const FLAG_COMPONENTS: Record<Locale, typeof FlagGB> = {
  en: FlagGB,
  id: FlagID,
}

// ── Component ──────────────────────────────────────────────

export function LanguageSwitcher() {
  const { locale, t } = useTranslation()
  const navigate = useNavigate()

  function handleSwitch(code: Locale) {
    if (code === locale) return
    navigate({ to: code === "en" ? "/" : `/${code}` })
  }

  return (
    <div
      className="flex items-center rounded-md border border-input bg-background"
      role="group"
      aria-label={t("a11y.switchLanguage")}
    >
      {SUPPORTED_LOCALES.map((lang, i) => {
        const Flag = FLAG_COMPONENTS[lang.code]
        const isActive = locale === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSwitch(lang.code)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors",
              i > 0 && "border-l border-input",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
            aria-current={isActive ? "true" : undefined}
            aria-label={lang.nativeName}
          >
            <Flag className="h-3 w-5 shrink-0 rounded-[1px] shadow-sm" />
            <span>{lang.code.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
