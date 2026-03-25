import { useEffect, useMemo } from "react"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { I18nProvider, getT, type Locale } from "@/i18n"

import appCss from "../styles.css?url"

// ── Helpers ────────────────────────────────────────────────

const BASE_URL = "https://invoice.bahrul.me"

function localeFromPath(pathname: string): Locale {
  return pathname === "/id" || pathname.startsWith("/id/") ? "id" : "en"
}

// ── Route ──────────────────────────────────────────────────

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // hreflang tags
      { rel: "alternate", hrefLang: "en", href: BASE_URL },
      { rel: "alternate", hrefLang: "id", href: `${BASE_URL}/id` },
      { rel: "alternate", hrefLang: "x-default", href: BASE_URL },
      // Favicons
      { rel: "icon", type: "image/x-icon", href: "/favicon-active/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-active/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-active/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon-active/apple-touch-icon.png" },
      { rel: "manifest", href: "/favicon-active/site.webmanifest" },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

// ── JSON-LD (static — author info doesn't change per locale) ──

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Invoice Generator — Bahrul Bangsawan",
  description:
    "Create, preview, and download professional invoices as PDF. Free online invoice generator with real-time preview and AI assistant.",
  url: BASE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "All",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: {
    "@type": "Person",
    name: "Bahrul Bangsawan",
    url: "https://linkedin.com/in/bahrulbangsawan",
  },
}

// ── Shell ──────────────────────────────────────────────────

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import("react-grab")
    }
  }, [])

  const jsonLdHtml = JSON.stringify(jsonLd)

  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

// ── Favicon visibility toggle ──────────────────────────────

const FAVICON_SELECTORS = [
  { selector: 'link[rel="icon"][sizes="32x32"]', file: "favicon-32x32.png" },
  { selector: 'link[rel="icon"][sizes="16x16"]', file: "favicon-16x16.png" },
  { selector: 'link[rel="icon"][type="image/x-icon"]', file: "favicon.ico" },
  { selector: 'link[rel="apple-touch-icon"]', file: "apple-touch-icon.png" },
]

function useFaviconVisibility() {
  useEffect(() => {
    function swapFavicons() {
      const folder = document.hidden ? "favicon-inactive" : "favicon-active"
      for (const { selector, file } of FAVICON_SELECTORS) {
        const link = document.querySelector<HTMLLinkElement>(selector)
        if (link) {
          link.href = `/${folder}/${file}`
        }
      }
    }

    document.addEventListener("visibilitychange", swapFavicons)
    return () => document.removeEventListener("visibilitychange", swapFavicons)
  }, [])
}

// ── Root Component ─────────────────────────────────────────

function RootComponent() {
  useFaviconVisibility()

  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPath(pathname)

  // Update <html lang> attribute on client
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const i18nValue = useMemo(
    () => ({ locale, t: getT(locale) }),
    [locale],
  )

  return (
    <I18nProvider value={i18nValue}>
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    </I18nProvider>
  )
}
