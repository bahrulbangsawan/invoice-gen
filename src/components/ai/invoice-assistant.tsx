import { useCallback, useMemo, useRef, useState } from "react"
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type SuggestionAdapter,
} from "@assistant-ui/react"
import type { InvoiceData, InvoiceSubItem, InvoiceAdjustment } from "@/components/invoice-form"
import { AssistantModal } from "@/components/assistant-ui/assistant-modal"
import { InvoiceDataContext } from "./invoice-data-context"
import { ApiKeyDialog } from "./api-key-dialog"
import { useApiKey } from "./use-api-key"
import {
  createOpenRouterAdapter,
  type ApplyAction,
} from "./openrouter-adapter"
import {
  buildSystemPrompt,
  type InvoiceSectionKey,
} from "./invoice-system-prompt"
import { getInvoiceSuggestions } from "./invoice-suggestions"
import { KeyRound } from "lucide-react"
import { PdfAttachmentAdapter } from "./pdf-attachment-adapter"

// ── Apply logic ────────────────────────────────────────────

/** Pure function: apply a single action to InvoiceData and return new data */
function applyOneAction(data: InvoiceData, action: ApplyAction): InvoiceData {
  switch (action.section) {
    case "invoice-details": {
      const parts = action.content.split("|").map((s) => s.trim())
      const updates: Partial<Pick<InvoiceData, "invoiceNumber" | "dateOfIssue" | "dateDue" | "currency">> = {}
      if (parts[0]) updates.invoiceNumber = parts[0]
      if (parts[1]) updates.dateOfIssue = parts[1]
      if (parts[2]) updates.dateDue = parts[2]
      if (parts[3]) updates.currency = parts[3]
      return { ...data, ...updates }
    }

    case "from": {
      const parts = action.content.split("|").map((s) => s.trim())
      const fields = ["companyName", "address", "city", "state", "postalCode", "country", "email"] as const
      const updates: Partial<Record<(typeof fields)[number], string>> = {}
      for (let i = 0; i < fields.length; i++) {
        const val = parts[i]
        if (val) updates[fields[i]] = val
      }
      return { ...data, from: { ...data.from, ...updates } }
    }

    case "bill-to": {
      const parts = action.content.split("|").map((s) => s.trim())
      const fields = ["name", "address", "city", "stateRegion", "postalCode", "country", "email"] as const
      const updates: Partial<Record<(typeof fields)[number], string>> = {}
      for (let i = 0; i < fields.length; i++) {
        const val = parts[i]
        if (val) updates[fields[i]] = val
      }
      return { ...data, billTo: { ...data.billTo, ...updates } }
    }

    case "items": {
      const rawLines = action.content.split("\n").filter((l) => l.trim())

      // Parse lines into items and sub-items
      const parsedItems: { description: string; period: string; qty: number; unitPrice: number; subItems: { label: string; qty: number; unitPrice: number }[] }[] = []

      for (const line of rawLines) {
        if (line.startsWith("  > ") || line.startsWith("  >")) {
          // Sub-item line
          if (parsedItems.length === 0) continue
          const subContent = line.replace(/^\s*>\s*/, "")
          const parts = subContent.split("|").map((s) => s.trim())
          parsedItems[parsedItems.length - 1].subItems.push({
            label: parts[0] ?? "",
            qty: Number(parts[1]) || 0,
            unitPrice: Number(parts[2]) || 0,
          })
        } else {
          // Main item line
          const parts = line.split("|").map((s) => s.trim())
          if (!parts[0]) continue
          parsedItems.push({
            description: parts[0],
            period: parts[1] ?? "",
            qty: Number(parts[2]) || 1,
            unitPrice: Number(parts[3]) || 0,
            subItems: [],
          })
        }
      }

      // Merge with existing items (match by description)
      const existingMap = new Map(
        data.items.map((item) => [item.description.toLowerCase(), item]),
      )

      for (const parsed of parsedItems) {
        const key = parsed.description.toLowerCase()
        const existing = existingMap.get(key)

        const subItems: InvoiceSubItem[] = parsed.subItems.map((s) => ({
          id: crypto.randomUUID(),
          label: s.label,
          qty: s.qty,
          unitPrice: s.unitPrice,
          amount: s.qty * s.unitPrice,
        }))

        existingMap.set(key, {
          id: existing?.id ?? crypto.randomUUID(),
          description: parsed.description,
          period: parsed.period,
          qty: parsed.qty,
          unitPrice: parsed.unitPrice,
          amount: parsed.qty * parsed.unitPrice,
          subItems: subItems.length > 0 ? subItems : existing?.subItems ?? [],
        })
      }

      return { ...data, items: [...existingMap.values()] }
    }

    case "adjustments": {
      const rawLines = action.content.split("\n").filter((l) => l.trim())
      const parsed: InvoiceAdjustment[] = rawLines.map((line) => {
        const parts = line.split("|").map((s) => s.trim())
        return {
          id: crypto.randomUUID(),
          label: parts[0] ?? "",
          type: (parts[1] === "add" ? "add" : "deduct") as "add" | "deduct",
          mode: (parts[2] === "percentage" ? "percentage" : "fixed") as "percentage" | "fixed",
          value: Number(parts[3]) || 0,
        }
      })
      return { ...data, adjustments: parsed }
    }

    case "notes":
      return { ...data, notes: action.content }

    default:
      return data
  }
}

// ── Component ──────────────────────────────────────────────

interface InvoiceAssistantProps {
  data: InvoiceData
  onApply: (data: InvoiceData) => void
}

export function InvoiceAssistant({ data, onApply }: InvoiceAssistantProps) {
  const { apiKey } = useApiKey()
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)

  // Use ref to always have latest data in the callback without recreating adapter
  const dataRef = useRef(data)
  dataRef.current = data
  const onApplyRef = useRef(onApply)
  onApplyRef.current = onApply

  const handleApplyAction = useCallback((actions: ApplyAction[]) => {
    let current = dataRef.current
    for (const action of actions) {
      current = applyOneAction(current, action)
    }
    onApplyRef.current(current)
  }, [])

  const buildSystemPromptWithMention = useCallback(
    (sections?: InvoiceSectionKey[]) => buildSystemPrompt(data, sections),
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

  const suggestions = useMemo(() => getInvoiceSuggestions(data), [data])

  const suggestionAdapter: SuggestionAdapter = useMemo(
    () => ({
      generate: async () => suggestions.map((s) => ({ prompt: s.prompt })),
    }),
    [suggestions],
  )

  const pdfAdapter = useMemo(() => new PdfAttachmentAdapter(), [])

  const runtime = useLocalRuntime(adapter, {
    adapters: {
      attachments: pdfAdapter,
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
      <InvoiceDataContext value={data}>
        <AssistantRuntimeProvider runtime={runtime}>
          <AssistantModal />
        </AssistantRuntimeProvider>
      </InvoiceDataContext>
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
