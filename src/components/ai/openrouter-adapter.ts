import type { ChatModelAdapter } from "@assistant-ui/react"
import type { InvoiceSectionKey } from "./invoice-system-prompt"
import { extractMentions } from "./invoice-suggestions"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_MODEL = "deepseek/deepseek-v3.2"

export interface ApplyAction {
  section: InvoiceSectionKey
  content: string
  index?: number
}

interface OpenRouterAdapterOptions {
  apiKey: string
  model?: string
  systemPrompt: string
  buildSystemPromptWithMention: (sections?: InvoiceSectionKey[]) => string
  onApplyAction?: (actions: ApplyAction[]) => void
}

/** Parse <apply section="..."> tags from AI response */
function parseApplyTags(text: string): ApplyAction[] {
  const actions: ApplyAction[] = []
  const regex =
    /<apply\s+section="([^"]+)"(?:\s+index="(\d+)")?>([\s\S]*?)<\/apply>/g
  let match = regex.exec(text)
  while (match !== null) {
    actions.push({
      section: match[1] as InvoiceSectionKey,
      content: match[3].trim(),
      index: match[2] !== undefined ? Number.parseInt(match[2], 10) : undefined,
    })
    match = regex.exec(text)
  }
  return actions
}

/** Strip entire <apply>...</apply> blocks from display text */
function stripApplyBlocks(text: string): string {
  return text
    .replace(/<apply\s+section="[^"]*"(?:\s+index="\d+")?>([\s\S]*?)<\/apply>/g, "")
    .trim()
}

export function createOpenRouterAdapter({
  apiKey,
  model = DEFAULT_MODEL,
  buildSystemPromptWithMention,
  onApplyAction,
}: OpenRouterAdapterOptions): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user")
      const lastUserText =
        lastUserMessage?.content
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("") ?? ""
      const mentions = extractMentions(lastUserText)
      const systemPrompt = buildSystemPromptWithMention(
        mentions.length >= 5 ? undefined : mentions.length > 0 ? mentions : undefined,
      )

      const openRouterMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((m) => {
          const textContent = m.content
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("")

          const attachmentText =
            m.role === "user" && "attachments" in m
              ? (m.attachments ?? [])
                  .flatMap((a) => a.content?.filter((c) => c.type === "text") ?? [])
                  .map((c) => c.text)
                  .join("\n")
              : ""

          return {
            role: m.role as "user" | "assistant",
            content: attachmentText
              ? `${attachmentText}\n\n${textContent}`
              : textContent,
          }
        }),
      ]

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "Invoice Generator",
        },
        body: JSON.stringify({
          model,
          messages: openRouterMessages,
          stream: true,
        }),
        signal: abortSignal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `OpenRouter API error (${response.status})`
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error?.message ?? errorMessage
        } catch {
          // use default message
        }
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullText = ""
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue
            const chunk = trimmed.slice(6)
            if (chunk === "[DONE]") continue

            try {
              const parsed = JSON.parse(chunk)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                fullText += delta
                const openCount = (fullText.match(/<apply\s/g) || []).length
                const closeCount = (fullText.match(/<\/apply>/g) || []).length
                const displayText =
                  openCount > closeCount
                    ? "Writing..."
                    : stripApplyBlocks(fullText)
                yield {
                  content: [
                    { type: "text" as const, text: displayText },
                  ],
                }
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      const actions = fullText ? parseApplyTags(fullText) : []
      if (onApplyAction && actions.length > 0) {
        onApplyAction(actions)
      }

      if (fullText) {
        const finalText = actions.length > 0 ? "Done." : stripApplyBlocks(fullText)
        yield {
          content: [
            { type: "text" as const, text: finalText },
          ],
        }
      }
    },
  }
}
