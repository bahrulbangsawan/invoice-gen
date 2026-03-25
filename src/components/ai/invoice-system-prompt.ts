import type { InvoiceData } from "@/components/invoice-form"
import { formatCurrency, calcSubtotal, calcTax, calcTotal, calcAdjustmentAmount } from "@/components/invoice-form"

const INVOICE_SECTION_KEYS = [
  "invoice-details",
  "from",
  "bill-to",
  "items",
  "adjustments",
  "notes",
] as const

export type InvoiceSectionKey = (typeof INVOICE_SECTION_KEYS)[number]

export const INVOICE_SECTIONS: { key: InvoiceSectionKey; label: string }[] = [
  { key: "invoice-details", label: "Invoice Details" },
  { key: "from", label: "From" },
  { key: "bill-to", label: "Bill To" },
  { key: "items", label: "Line Items" },
  { key: "adjustments", label: "Adjustments" },
  { key: "notes", label: "Notes" },
]

function serializeInvoice(data: InvoiceData): string {
  const parts: string[] = []

  parts.push(
    `[Invoice Details] Number: ${data.invoiceNumber} | Issued: ${data.dateOfIssue} | Due: ${data.dateDue} | Currency: ${data.currency}`,
  )

  const f = data.from
  if (f.companyName || f.email) {
    parts.push(
      `[From] ${f.companyName} | ${f.address} | ${f.city} | ${f.state} | ${f.postalCode} | ${f.country} | ${f.email}`,
    )
  }

  const b = data.billTo
  if (b.name || b.email) {
    parts.push(
      `[Bill To] ${b.name} | ${b.address} | ${b.city} | ${b.stateRegion} | ${b.postalCode} | ${b.country} | ${b.email}`,
    )
  }

  if (data.items.length > 0) {
    const entries = data.items
      .map((item, i) => {
        let line = `[Item #${i}] ${item.description} | ${item.period} | Qty: ${item.qty} | Unit: ${formatCurrency(item.unitPrice, data.currency)} | Amount: ${formatCurrency(item.amount, data.currency)}`
        if (item.subItems.length > 0) {
          const subs = item.subItems
            .map(
              (s) =>
                `  > ${s.label} | Qty: ${s.qty} | Unit: ${formatCurrency(s.unitPrice, data.currency)} | Amount: ${formatCurrency(s.amount, data.currency)}`,
            )
            .join("\n")
          line += `\n${subs}`
        }
        return line
      })
      .join("\n")
    parts.push(entries)
  }

  if (data.adjustments.length > 0) {
    const adjEntries = data.adjustments
      .map((adj) => {
        const amount = calcAdjustmentAmount(adj, calcSubtotal(data.items))
        return `  ${adj.type === "deduct" ? "−" : "+"} ${adj.label}: ${adj.mode === "percentage" ? `${adj.value}%` : formatCurrency(adj.value, data.currency)} = ${formatCurrency(amount, data.currency)}`
      })
      .join("\n")
    parts.push(`[Adjustments]\n${adjEntries}`)
  }

  const subtotal = calcSubtotal(data.items)
  const tax = calcTax(subtotal, data.taxRate)
  const total = calcTotal(data.items, data.taxRate, data.adjustments)
  parts.push(
    `[Totals] Subtotal: ${formatCurrency(subtotal, data.currency)} | Tax (${data.taxRate}%): ${formatCurrency(tax, data.currency)} | Total: ${formatCurrency(total, data.currency)}`,
  )

  if (data.notes) {
    parts.push(`[Notes] ${data.notes}`)
  }

  return parts.join("\n")
}

export function buildSystemPrompt(
  data: InvoiceData,
  mentionedSections?: InvoiceSectionKey[],
): string {
  const invoiceText = serializeInvoice(data)

  const focusInstruction = mentionedSections?.length
    ? `\nUser is targeting these sections: ${mentionedSections.join(", ")}. Use a SEPARATE <apply section="..."> block for EACH section listed.`
    : ""

  return `Invoice editing assistant. Invoice help only.

WHEN USER ASKS TO EDIT A SECTION:
Respond with ONLY this exact format:
<apply section="SECTION_NAME">
THE NEW COMPLETE TEXT THAT WILL REPLACE THE EXISTING CONTENT
</apply>
Done.

CRITICAL RULES FOR <apply> TAG CONTENT:
- Write ONLY the final new text. Do NOT include the old text.
- Do NOT write "replaced with" or "changed to" — just write the new content directly.
- The content inside <apply> will completely overwrite the existing field.

QUESTIONS about invoice: answer in 1-2 sentences.
OFF-TOPIC: reply "I can only help with invoice content."
NEVER repeat/list/echo invoice data. No explanations.

Valid sections: invoice-details, from, bill-to, items, adjustments, notes

MULTI-SECTION EDITING:
When the user asks to edit or fill multiple sections at once, you MUST include a separate
<apply section="SECTION_NAME"> block for EACH section. Do NOT skip any requested section.
Example for 2 sections:
<apply section="from">Acme Corp | 123 Main St | San Francisco | CA | 94107 | US | billing@acme.com</apply>
<apply section="items">
Web Development | Mar 1–31, 2026 | 1 | 5000
</apply>

SECTION FORMATS (use | as separator):

Invoice Details (InvoiceNumber | DateOfIssue | DateDue | Currency):
<apply section="invoice-details">
IN-00000001 | 2026-03-01 | 2026-04-01 | USD
</apply>
Leave a field empty to keep its current value (e.g., "IN-00000001 | | | " only changes the number).

From (CompanyName | Address | City | State | PostalCode | Country | Email):
<apply section="from">
Acme Corp | 123 Main Street | San Francisco | California | 94107 | United States | billing@acme.com
</apply>

Bill To (Name | Address | City | StateRegion | PostalCode | Country | Email):
<apply section="bill-to">
Client Inc | 456 Client Avenue | Jakarta | DKI Jakarta | 12930 | Indonesia | client@example.com
</apply>

Items (one line per item — Description | Period | Qty | UnitPrice):
<apply section="items">
Web Development | Mar 1–31, 2026 | 1 | 5000
Hosting & Maintenance | Mar 2026 | 1 | 500
</apply>
Sub-items on next lines prefixed with "  > " (two spaces, >, space): Label | Qty | UnitPrice
<apply section="items">
API Integration | Q1 2026 | 1 | 3000
  > Endpoint Development | 5 | 400
  > Testing & QA | 3 | 200
</apply>

Adjustments (one line per adjustment — Label | Type(add/deduct) | Mode(percentage/fixed) | Value):
<apply section="adjustments">
Service Charge | add | percentage | 10
Discount | deduct | fixed | 50000
Down Payment | deduct | fixed | 1000000
</apply>

Notes (plain text):
<apply section="notes">
Payment due within 30 days. Bank: Acme Bank, Account: 1234567890.
</apply>

IMPORTANT: Include ALL existing items plus new ones when editing items. Do not drop items.

NATURAL LANGUAGE ITEM GENERATION:
When the user describes services or products in natural language (e.g., "I built a website for $5000 and did monthly hosting for $500"), convert them into properly formatted line items with reasonable descriptions, quantities, and unit prices.

PDF INVOICE IMPORT:
When the user uploads a PDF (text between "--- Uploaded Invoice (PDF) ---" and "--- End of uploaded invoice ---"), parse the raw text and map it to invoice sections. Use @all or the mentioned sections. Generate a separate <apply> block for EACH section you can extract data for. Map content as follows:
- Invoice number, dates, currency → invoice-details
- Sender/company info → from
- Client/bill-to info → bill-to
- Line items/services/products → items (use pipe format, one per line)
- Notes/terms/payment info → notes
Do NOT ask for confirmation — directly generate all <apply> blocks from the uploaded invoice.

INVOICE DATA:
${invoiceText}${focusInstruction}`
}
