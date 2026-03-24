import type { ChatModelAdapter } from "@assistant-ui/react"
import type { CVSectionKey } from "./cv-system-prompt"
import { extractMentions } from "./cv-suggestions"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_MODEL = "deepseek/deepseek-v3.2"

export interface ApplyAction {
  section: CVSectionKey
  content: string
  index?: number
}

interface OpenRouterAdapterOptions {
  apiKey: string
  model?: string
  systemPrompt: string
  buildSystemPromptWithMention: (section?: CVSectionKey) => string
  onApplyAction?: (action: ApplyAction) => void
}

/** Parse <apply section="..."> tags from AI response */
function parseApplyTags(text: string): ApplyAction[] {
  const actions: ApplyAction[] = []
  const regex =
    /<apply\s+section="([^"]+)"(?:\s+index="(\d+)")?>([\s\S]*?)<\/apply>/g
  let match = regex.exec(text)
  while (match !== null) {
    actions.push({
      section: match[1] as CVSectionKey,
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
        mentions.length >= 10 ? undefined : mentions[0],
      )

      const openRouterMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join(""),
        })),
      ]

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "CV Builder",
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
                // If an <apply tag has started, show "Writing..." instead of raw tag content
                const hasOpenApply = fullText.includes("<apply")
                const hasCloseApply = fullText.includes("</apply>")
                const displayText =
                  hasOpenApply && !hasCloseApply
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

      // After streaming completes, parse <apply> tags and execute them
      const actions = fullText ? parseApplyTags(fullText) : []
      if (onApplyAction) {
        for (const action of actions) {
          onApplyAction(action)
        }
      }

      // Final yield: "Done." if we applied changes, otherwise show clean text
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
