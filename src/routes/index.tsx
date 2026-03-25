import { lazy, Suspense, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown, Download, FileJson, FileText, Loader2, Upload, Receipt } from "lucide-react"
import { InvoiceForm, type InvoiceData, generateInvoiceNumber } from "@/components/invoice-form"
import { InvoicePreview } from "@/components/invoice-preview"

const InvoiceAssistant = lazy(() =>
  import("@/components/ai/invoice-assistant").then(m => ({ default: m.InvoiceAssistant }))
)
import sampleData from "@/data/sample-invoice.json"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Route = createFileRoute("/")({ component: InvoiceGenerator })

const initialData: InvoiceData = {
  invoiceNumber: "",
  dateOfIssue: "",
  dateDue: "",
  currency: "USD",
  accentColor: "#f48120",
  from: {
    companyName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    email: "",
    logoUrl: "",
  },
  billTo: {
    name: "",
    address: "",
    city: "",
    stateRegion: "",
    postalCode: "",
    country: "",
    email: "",
  },
  items: [],
  adjustments: [],
  notes: "",
  taxRate: 0,
}

function InvoiceGenerator() {
  const [data, setData] = useState<InvoiceData>(() => ({
    ...initialData,
    invoiceNumber: typeof window !== "undefined" ? generateInvoiceNumber() : "IN-00000001",
  }))
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEmpty = !data.from.companyName.trim() && data.items.length === 0

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as InvoiceData
        setData(imported)
      } catch {
        alert("Invalid JSON file. Please select a valid Invoice JSON export.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined") return

    setGenerating(true)
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const { InvoiceDocument } = await import("@/components/invoice-pdf")

      const blob = await pdf(<InvoiceDocument data={data} />).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = getFileName("pdf")
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF generation failed:", err)
      alert("Failed to generate PDF. Check the browser console for details.")
    } finally {
      setGenerating(false)
    }
  }

  const getFileName = (ext: string) => {
    const now = new Date()
    const dt = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
    return data.invoiceNumber
      ? `Invoice-${data.invoiceNumber}-${dt}.${ext}`
      : `Invoice-${dt}.${ext}`
  }

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = getFileName("json")
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <h1 className="sr-only">Invoice Generator — Bahrul Bangsawan</h1>
      <div className="h-svh w-full overflow-y-auto border-b border-border md:w-1/2 md:border-r md:border-b-0">
        <div className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b border-border bg-background px-6 py-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload data-icon="inline-start" />
            <span className="hidden sm:inline">Import JSON</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJSON}
          />
          <Button
            variant="outline"
            size="lg"
            onClick={() => setData(sampleData as InvoiceData)}
          >
            <Receipt data-icon="inline-start" />
            <span className="hidden sm:inline">Load Sample Invoice</span>
          </Button>
        </div>
        <div className="p-6">
          <InvoiceForm data={data} onChange={setData} />
        </div>
      </div>
      <div className="h-svh w-full overflow-y-auto bg-muted/50 md:w-1/2">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/50 px-6 py-3">
          <div className="ml-auto hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" disabled={isEmpty || generating}>
                  {generating ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Download data-icon="inline-start" />
                  )}
                  {generating ? "Generating..." : "Download"}
                  <ChevronDown className="ml-1 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <FileText className="mr-2 size-4" />
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadJSON}>
                  <FileJson className="mr-2 size-4" />
                  Download as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-6">
          <InvoicePreview data={data} />
        </div>
      </div>
      {/* Floating download button — mobile only */}
      <div className="fixed bottom-6 left-6 z-50 md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" disabled={isEmpty || generating} className="size-12 rounded-full shadow-lg">
              {generating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <FileText className="mr-2 size-4" />
              Download as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadJSON}>
              <FileJson className="mr-2 size-4" />
              Download as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Suspense fallback={null}>
        <InvoiceAssistant data={data} onApply={setData} />
      </Suspense>
    </div>
  )
}
