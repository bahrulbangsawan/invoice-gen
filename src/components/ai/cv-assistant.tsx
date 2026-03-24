import { useCallback, useMemo, useRef, useState } from "react"
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type SuggestionAdapter,
} from "@assistant-ui/react"
import type { CVData, ExperienceEntry } from "@/components/cv-form"
import { AssistantModal } from "@/components/assistant-ui/assistant-modal"
import { CVDataContext } from "./cv-data-context"
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
      case "personal-info": {
        // Format: "FullName | JobTitle | Email | Phone | Location | LinkedIn"
        const parts = action.content.split("|").map((s) => s.trim())
        const fields = ["fullName", "jobTitle", "email", "phone", "location", "linkedIn"] as const
        const updates: Partial<Record<(typeof fields)[number], string>> = {}
        for (let i = 0; i < fields.length; i++) {
          const val = parts[i]
          if (val) updates[fields[i]] = val
        }
        setter({ ...current, personalInfo: { ...current.personalInfo, ...updates } })
        break
      }

      case "summary":
        setter({ ...current, summary: action.content })
        break

      case "experience": {
        if (action.index !== undefined && current.experience[action.index]) {
          // Update specific entry — description only (bullets)
          const experience = [...current.experience]
          experience[action.index] = {
            ...experience[action.index],
            description: action.content,
          }
          setter({ ...current, experience })
        } else if (action.index === undefined) {
          // Format: "Company | URL | Title | WorkType | LocationPolicy | StartDate | EndDate | Description" per line
          const rawLines = action.content.split("\n").filter((l) => l.trim())
          // Merge continuation lines (lines without enough | separators) into the previous entry
          const expLines: string[] = []
          for (const line of rawLines) {
            const pipeCount = (line.match(/\|/g) || []).length
            if (pipeCount >= 6) {
              // Full entry line (Company | URL | Title | WorkType | LocationPolicy | StartDate | EndDate | Description)
              expLines.push(line)
            } else if (expLines.length > 0) {
              // Continuation line — append to previous entry's description
              const prev = expLines[expLines.length - 1]
              const lastPipe = prev.lastIndexOf("|")
              if (lastPipe >= 0) {
                // Append with \n so it becomes a separate bullet in the description
                expLines[expLines.length - 1] = `${prev}\n${line.trim()}`
              }
            }
          }

          const existingExp = new Map(
            current.experience.map((e) => [
              `${e.company}|${e.title}`.toLowerCase(),
              e,
            ]),
          )

          for (const line of expLines) {
            const parts = line.split("|").map((s) => s.trim())
            const company = parts[0] ?? ""
            if (!company) continue
            const title = parts[2] ?? ""
            const key = `${company}|${title}`.toLowerCase()
            const existing = existingExp.get(key)
            const endDate = parts[6] ?? existing?.endDate ?? ""
            // Description is everything after the 7th pipe — may contain \n for bullets
            // Also handle ;; separator for multi-bullet descriptions
            const rawDesc = parts.slice(7).join("|").trim()
            const description = rawDesc
              ? rawDesc.split(";;").map((s) => s.trim()).join("\n")
              : existing?.description ?? ""
            existingExp.set(key, {
              id: existing?.id ?? crypto.randomUUID(),
              company,
              url: parts[1] ?? existing?.url ?? "",
              title,
              workType: (parts[3] ?? existing?.workType ?? "") as ExperienceEntry["workType"],
              locationPolicy: (parts[4] ?? existing?.locationPolicy ?? "") as ExperienceEntry["locationPolicy"],
              startDate: parts[5] ?? existing?.startDate ?? "",
              endDate: endDate === "Present" ? "" : endDate,
              current: endDate === "Present",
              description,
            })
          }

          setter({ ...current, experience: [...existingExp.values()] })
        }
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
        // Format: "Title | Issuer | Date | Description | URL" per line
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
            url: parts[4] ?? existing?.url ?? "",
          })
        }

        setter({ ...current, awards: [...existingAwards.values()] })
        break
      }

      case "certificates": {
        // Format: "Name | Issuer | Date | ExpiryDate | CredentialId | URL" per line
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
            expiryDate: parts[3] ?? existing?.expiryDate ?? "",
            credentialId: parts[4] ?? existing?.credentialId ?? "",
            url: parts[5] ?? existing?.url ?? "",
          })
        }

        setter({ ...current, certificates: [...existingCerts.values()] })
        break
      }

      case "education": {
        // Format: "Degree | Institution | StartDate | EndDate | GPA | Category" per line
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
            category: (parts[5] ?? existing?.category ?? "") as import("@/components/cv-form").EducationCategory,
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

      case "projects": {
        // Format: "Name | URL | Description" per line
        const portLines = action.content.split("\n").filter((l) => l.trim())
        const existingPort = new Map(
          current.projects.map((p) => [p.name.toLowerCase(), p]),
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

        setter({ ...current, projects: [...existingPort.values()] })
        break
      }

      case "volunteer": {
        // Format: "Organization | Role | StartDate | EndDate | Description" per line
        const rawVolLines = action.content.split("\n").filter((l) => l.trim())
        const volLines: string[] = []
        for (const line of rawVolLines) {
          const pipeCount = (line.match(/\|/g) || []).length
          if (pipeCount >= 3) {
            volLines.push(line)
          } else if (volLines.length > 0) {
            volLines[volLines.length - 1] = `${volLines[volLines.length - 1]}\n${line.trim()}`
          }
        }

        const existingVol = new Map(
          current.volunteer.map((v) => [
            `${v.organization}|${v.role}`.toLowerCase(),
            v,
          ]),
        )

        for (const line of volLines) {
          const parts = line.split("|").map((s) => s.trim())
          const organization = parts[0] ?? ""
          const role = parts[1] ?? ""
          if (!organization) continue
          const key = `${organization}|${role}`.toLowerCase()
          const existing = existingVol.get(key)
          const endDate = parts[3] ?? existing?.endDate ?? ""
          const rawDesc = parts.slice(4).join("|").trim()
          const description = rawDesc
            ? rawDesc.split(";;").map((s) => s.trim()).join("\n")
            : existing?.description ?? ""
          existingVol.set(key, {
            id: existing?.id ?? crypto.randomUUID(),
            organization,
            role,
            startDate: parts[2] ?? existing?.startDate ?? "",
            endDate: endDate === "Present" ? "" : endDate,
            current: endDate === "Present",
            description,
          })
        }

        setter({ ...current, volunteer: [...existingVol.values()] })
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
      <CVDataContext value={data}>
        <AssistantRuntimeProvider runtime={runtime}>
          <AssistantModal />
        </AssistantRuntimeProvider>
      </CVDataContext>
      <button
        type="button"
        onClick={() => setKeyDialogOpen(true)}
        className="fixed right-4 bottom-18 z-50 flex size-8 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-transform hover:scale-110 hover:bg-accent hover:text-accent-foreground active:scale-90"
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
