import type { InvoiceData } from "@/components/invoice-form"
import { type InvoiceSectionKey, INVOICE_SECTIONS } from "./invoice-system-prompt"

export interface InvoiceSuggestion {
  title: string
  description: string
  prompt: string
}

export function getInvoiceSuggestions(data: InvoiceData): InvoiceSuggestion[] {
  const suggestions: InvoiceSuggestion[] = []

  if (data.items.length === 0) {
    suggestions.push({
      title: "Add @items from description",
      description: "Describe your services and let AI create line items",
      prompt:
        "Create @items for the following services: [describe your services, hours, and rates here]",
    })
    suggestions.push({
      title: "Load sample @items",
      description: "Generate example line items to get started",
      prompt:
        "Generate 3 sample @items for a freelance web development invoice with realistic descriptions, quantities, and prices.",
    })
  } else {
    suggestions.push({
      title: "Add more @items",
      description: "Add additional line items to the invoice",
      prompt:
        "Add the following new @items to my invoice: [describe additional services or products here]",
    })
    suggestions.push({
      title: "Review totals and @items",
      description: "Check line items for accuracy and formatting",
      prompt:
        "Review my @items for consistency. Check descriptions, quantities, and pricing. Suggest improvements if needed.",
    })
  }

  if (!data.from.companyName) {
    suggestions.push({
      title: "Fill in @from details",
      description: "Set up your company/sender information",
      prompt:
        "Fill in the @from section with this company info: [enter your company name, address, and email here]",
    })
  }

  if (!data.billTo.name) {
    suggestions.push({
      title: "Fill in @bill-to details",
      description: "Set up the client/recipient information",
      prompt:
        "Fill in the @bill-to section with this client info: [enter client name, address, and email here]",
    })
  }

  suggestions.push({
    title: "Create invoice from description",
    description: "Describe your work and fill all sections at once",
    prompt:
      "Create a complete invoice for @all sections based on this description: [describe the project, client, your company, services provided, and amounts here]",
  })

  return suggestions
}

const MENTION_REGEX = /@(all|invoice-details|from|bill-to|items|adjustments|custom-fields|notes)\b/g

export function extractMentions(text: string): InvoiceSectionKey[] {
  const mentions: InvoiceSectionKey[] = []
  for (const match of text.matchAll(MENTION_REGEX)) {
    if (match[1] === "all") {
      return INVOICE_SECTIONS.map((s) => s.key)
    }
    const key = match[1] as InvoiceSectionKey
    if (INVOICE_SECTIONS.some((s) => s.key === key) && !mentions.includes(key)) {
      mentions.push(key)
    }
  }
  return mentions
}
