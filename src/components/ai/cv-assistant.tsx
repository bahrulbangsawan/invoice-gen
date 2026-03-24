import { useCallback, useMemo, useRef, useState } from "react"
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type SuggestionAdapter,
} from "@assistant-ui/react"
import type { CVData } from "@/components/cv-form"
import { AssistantModal } from "@/components/assistant-ui/assistant-modal"
import { ApiKeyDialog } from "./api-key-dialog"
import { useApiKey } from "./use-api-key"
import {
  createOpenRouterAdapter,
  type ApplyAction,
} from "./openrouter-adapter"
import { buildSystemPrompt, type CVSectionKey } from "./cv-system-prompt"
import { getCVSuggestions } from "./cv-suggestions"
import { KeyRound } from "lucide-react"

interface CVAssistantProps {
  data: CVData
  onApply: (data: CVData) => void
}

export function CVAssistant({ data, onApply }: CVAssistantProps) {
  const { apiKey } = useApiKey()
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)

  // Use ref to always have latest data in the callback without recreating adapter
  const dataRef = useRef(data)
  dataRef.current = data
  const onApplyRef = useRef(onApply)
  onApplyRef.current = onApply

  const handleApplyAction = useCallback((action: ApplyAction) => {
    const current = dataRef.current
    const setter = onApplyRef.current

    switch (action.section) {
      case "summary":
        setter({ ...current, summary: action.content })
        break

      case "experience": {
        if (action.index !== undefined && current.experience[action.index]) {
          // Update specific entry's description
          const experience = [...current.experience]
          experience[action.index] = {
            ...experience[action.index],
            description: action.content,
          }
          setter({ ...current, experience })
        }
        // Without index, don't touch experience (too complex)
        break
      }

      case "skills": {
        // Parse "Category: item1, item2" lines and merge with existing
        const lines = action.content.split("\n").filter((l) => l.trim())
        const existingMap = new Map(
          current.skills.map((cat) => [cat.name.toLowerCase(), cat]),
        )

        for (const line of lines) {
          const colonIdx = line.indexOf(":")
          if (colonIdx <= 0) continue
          const name = line.slice(0, colonIdx).trim()
          const items = line
            .slice(colonIdx + 1)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
          const key = name.toLowerCase()
          const existing = existingMap.get(key)
          if (existing) {
            const merged = [...new Set([...existing.items, ...items])]
            existingMap.set(key, { ...existing, name, items: merged })
          } else {
            existingMap.set(key, {
              id: crypto.randomUUID(),
              name,
              items,
            })
          }
        }

        setter({ ...current, skills: [...existingMap.values()] })
        break
      }

      case "languages": {
        // Merge: match by language name, add new ones
        const langLines = action.content.split("\n").filter((l) => l.trim())
        const existingMap = new Map(
          current.languages.map((l) => [l.language.toLowerCase(), l]),
        )

        for (const line of langLines) {
          const parts = line.split(":").map((s) => s.trim())
          const language = parts[0] ?? line.trim()
          const proficiency = parts[1] ?? ""
          const key = language.toLowerCase()
          if (!existingMap.has(key)) {
            existingMap.set(key, {
              id: crypto.randomUUID(),
              language,
              proficiency,
            })
          } else if (proficiency) {
            const existing = existingMap.get(key)!
            existingMap.set(key, { ...existing, proficiency })
          }
        }

        setter({ ...current, languages: [...existingMap.values()] })
        break
      }

      case "awards": {
        // Format: "Title | Issuer | Date | Description" per line
        const awardLines = action.content.split("\n").filter((l) => l.trim())
        const existingAwards = new Map(
          current.awards.map((a) => [a.title.toLowerCase(), a]),
        )

        for (const line of awardLines) {
          const parts = line.split("|").map((s) => s.trim())
          const title = parts[0] ?? ""
          if (!title) continue
          const key = title.toLowerCase()
          const existing = existingAwards.get(key)
          existingAwards.set(key, {
            id: existing?.id ?? crypto.randomUUID(),
            title,
            issuer: parts[1] ?? existing?.issuer ?? "",
            date: parts[2] ?? existing?.date ?? "",
            description: parts[3] ?? existing?.description ?? "",
            url: existing?.url ?? "",
          })
        }

        setter({ ...current, awards: [...existingAwards.values()] })
        break
      }

      case "certificates": {
        // Format: "Name | Issuer | Date | CredentialId" per line
        const certLines = action.content.split("\n").filter((l) => l.trim())
        const existingCerts = new Map(
          current.certificates.map((c) => [c.name.toLowerCase(), c]),
        )

        for (const line of certLines) {
          const parts = line.split("|").map((s) => s.trim())
          const name = parts[0] ?? ""
          if (!name) continue
          const key = name.toLowerCase()
          const existing = existingCerts.get(key)
          existingCerts.set(key, {
            id: existing?.id ?? crypto.randomUUID(),
            name,
            issuer: parts[1] ?? existing?.issuer ?? "",
            date: parts[2] ?? existing?.date ?? "",
            credentialId: parts[3] ?? existing?.credentialId ?? "",
            url: existing?.url ?? "",
          })
        }

        setter({ ...current, certificates: [...existingCerts.values()] })
        break
      }

      case "education": {
        // Format: "Degree | Institution | StartDate | EndDate" per line
        const eduLines = action.content.split("\n").filter((l) => l.trim())
        const existingEdu = new Map(
          current.education.map((e) => [
            `${e.degree}|${e.institution}`.toLowerCase(),
            e,
          ]),
        )

        for (const line of eduLines) {
          const parts = line.split("|").map((s) => s.trim())
          const degree = parts[0] ?? ""
          const institution = parts[1] ?? ""
          if (!degree) continue
          const key = `${degree}|${institution}`.toLowerCase()
          const existing = existingEdu.get(key)
          const endDate = parts[3] ?? existing?.endDate ?? ""
          existingEdu.set(key, {
            id: existing?.id ?? crypto.randomUUID(),
            degree,
            institution,
            gpa: parts[4] ?? existing?.gpa ?? "",
            startDate: parts[2] ?? existing?.startDate ?? "",
            endDate: endDate === "Present" ? "" : endDate,
            current: endDate === "Present",
          })
        }

        setter({ ...current, education: [...existingEdu.values()] })
        break
      }

      case "portfolio": {
        // Format: "Name | URL | Description" per line
        const portLines = action.content.split("\n").filter((l) => l.trim())
        const existingPort = new Map(
          current.portfolio.map((p) => [p.name.toLowerCase(), p]),
        )

        for (const line of portLines) {
          const parts = line.split("|").map((s) => s.trim())
          const name = parts[0] ?? ""
          if (!name) continue
          const key = name.toLowerCase()
          const existing = existingPort.get(key)
          existingPort.set(key, {
            id: existing?.id ?? crypto.randomUUID(),
            name,
            url: parts[1] ?? existing?.url ?? "",
            description: parts[2] ?? existing?.description ?? "",
          })
        }

        setter({ ...current, portfolio: [...existingPort.values()] })
        break
      }

      default:
        break
    }
  }, [])

  const buildSystemPromptWithMention = useCallback(
    (section?: CVSectionKey) => buildSystemPrompt(data, section),
    [data],
  )

  const adapter = useMemo(
    () =>
      createOpenRouterAdapter({
        apiKey: apiKey || "placeholder",
        systemPrompt: buildSystemPrompt(data),
        buildSystemPromptWithMention,
        onApplyAction: handleApplyAction,
      }),
    [apiKey, data, buildSystemPromptWithMention, handleApplyAction],
  )

  const suggestions = useMemo(() => getCVSuggestions(data), [data])

  const suggestionAdapter: SuggestionAdapter = useMemo(
    () => ({
      generate: async () => suggestions.map((s) => ({ prompt: s.prompt })),
    }),
    [suggestions],
  )

  const runtime = useLocalRuntime(adapter, {
    adapters: {
      suggestion: suggestionAdapter,
    },
  })

  if (!apiKey) {
    return (
      <>
        <NoKeyButton onClick={() => setKeyDialogOpen(true)} />
        <ApiKeyDialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen} />
      </>
    )
  }

  return (
    <>
      <AssistantRuntimeProvider runtime={runtime}>
        <AssistantModal />
      </AssistantRuntimeProvider>
      <button
        type="button"
        onClick={() => setKeyDialogOpen(true)}
        className="fixed right-4 bottom-18 z-50 flex size-8 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-transform hover:scale-110 hover:bg-accent active:scale-90"
        aria-label="API Key Settings"
      >
        <KeyRound className="size-4" />
      </button>
      <ApiKeyDialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen} />
    </>
  )
}

function NoKeyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-4 bottom-4 z-50 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-transform hover:scale-110 active:scale-90"
      aria-label="Set up AI Assistant"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-6"
      >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="m2 14 2-2-2-2" />
        <path d="m22 14-2-2 2-2" />
      </svg>
    </button>
  )
}
