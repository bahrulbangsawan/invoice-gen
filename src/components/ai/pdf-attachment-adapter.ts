import type {
  AttachmentAdapter,
  PendingAttachment,
  CompleteAttachment,
  Attachment,
} from "@assistant-ui/react"

const MAX_TEXT_LENGTH = 15_000

/** Extract text from a PDF file using pdfjs-dist (dynamically imported) */
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ")
    if (text.trim()) pages.push(text.trim())
  }

  let fullText = pages.join("\n\n")
  if (fullText.length > MAX_TEXT_LENGTH) {
    fullText = `${fullText.slice(0, MAX_TEXT_LENGTH)}\n\n[Text truncated — only the first ${MAX_TEXT_LENGTH} characters are included]`
  }

  return fullText
}

export class PdfAttachmentAdapter implements AttachmentAdapter {
  accept = "application/pdf"

  async add({ file }: { file: File }): Promise<PendingAttachment> {
    const text = await extractPdfText(file)

    return {
      id: crypto.randomUUID(),
      type: "document",
      name: file.name,
      contentType: "application/pdf",
      file,
      content: text
        ? [{ type: "text" as const, text: `--- Uploaded CV (PDF) ---\n${text}\n--- End of uploaded CV ---` }]
        : [],
      status: { type: "requires-action", reason: "composer-send" },
    }
  }

  async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
    return {
      ...attachment,
      status: { type: "complete" },
      content: attachment.content ?? [],
    }
  }

  async remove(_attachment: Attachment): Promise<void> {
    // No server-side cleanup needed — everything is client-side
  }
}
