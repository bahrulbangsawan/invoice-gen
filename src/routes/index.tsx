import { lazy, Suspense, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown, Download, FileJson, FileText, Loader2, Upload, UserRoundPen } from "lucide-react"
import { CVForm, type CVData, type CVStyle } from "@/components/cv-form"
import { CVPreview } from "@/components/cv-preview"

const CVAssistant = lazy(() =>
  import("@/components/ai/cv-assistant").then(m => ({ default: m.CVAssistant }))
)
import sampleData from "@/data/sample-cv.json"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Route = createFileRoute("/")({ component: CVGenerator })

const initialData: CVData = {
  personalInfo: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedIn: "",
    photoUrl: "",
    usePhoto: false,
  },
  sectionOrder: ["summary", "experience", "education", "skills", "awards", "certificates", "languages", "projects", "volunteer"],
  summaryTitle: "Professional Summary",
  summary: "",
  experienceTitle: "Work Experience",
  experience: [],
  educationTitle: "Education",
  education: [],
  skillsTitle: "Skills",
  skills: [],
  awardsTitle: "Awards",
  awards: [],
  certificatesTitle: "Certificates",
  certificates: [],
  languagesTitle: "Languages",
  languages: [],
  projectsTitle: "Projects",
  projects: [],
  volunteerTitle: "Volunteer & Community",
  volunteer: [],
}

function CVGenerator() {
  const [data, setData] = useState<CVData>(initialData)
  const [style, setStyle] = useState<CVStyle>("basic")
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as CVData
        setData(imported)
      } catch {
        alert("Invalid JSON file. Please select a valid CV JSON export.")
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
      const { CVDocument } = await import("@/components/cv-pdf")

      const blob = await pdf(<CVDocument data={data} style={style} />).toBlob()

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
    const dt = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`
    const name = data.personalInfo.fullName
    return name ? `CV-${name.replace(/\s+/g, "-")}-${dt}.${ext}` : `CV-${dt}.${ext}`
  }

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadMarkdown = () => {
    const lines: string[] = []
    const { personalInfo } = data

    // Header
    if (personalInfo.fullName) lines.push(`# ${personalInfo.fullName}`)
    if (personalInfo.jobTitle) lines.push(`**${personalInfo.jobTitle}**`)

    const contact: string[] = []
    if (personalInfo.email) contact.push(personalInfo.email)
    if (personalInfo.phone) contact.push(personalInfo.phone)
    if (personalInfo.location) contact.push(personalInfo.location)
    if (personalInfo.linkedIn) contact.push(`linkedin.com/in/${personalInfo.linkedIn}`)
    if (contact.length) lines.push("", contact.join(" | "))

    // Summary
    if (data.summary) {
      lines.push("", `## ${data.summaryTitle}`, "", data.summary)
    }

    // Experience
    if (data.experience.length) {
      lines.push("", `## ${data.experienceTitle}`)
      for (const exp of data.experience) {
        const period = exp.current ? `${exp.startDate} – Present` : `${exp.startDate} – ${exp.endDate}`
        const tags = [exp.workType, exp.locationPolicy].filter(Boolean).join(" · ")
        lines.push("", `### ${exp.title} — ${exp.company}`, `*${period}*${tags ? ` | ${tags}` : ""}`)
        if (exp.description) {
          for (const bullet of exp.description.split("\n")) {
            if (bullet.trim()) lines.push(`- ${bullet.trim()}`)
          }
        }
      }
    }

    // Education
    if (data.education.length) {
      lines.push("", `## ${data.educationTitle}`)
      for (const edu of data.education) {
        const period = edu.current ? `${edu.startDate} – Present` : `${edu.startDate} – ${edu.endDate}`
        lines.push("", `### ${edu.degree} — ${edu.institution}`, `*${period}*${edu.category ? ` | ${edu.category}` : ""}`)
      }
    }

    // Skills
    if (data.skills.length) {
      lines.push("", `## ${data.skillsTitle}`)
      for (const cat of data.skills) {
        lines.push("", `**${cat.name}:** ${cat.items.join(", ")}`)
      }
    }

    // Awards
    if (data.awards.length) {
      lines.push("", `## ${data.awardsTitle}`)
      for (const award of data.awards) {
        lines.push("", `### ${award.title}`, `*${award.issuer} — ${award.date}*`)
        if (award.description) lines.push("", award.description)
      }
    }

    // Certificates
    if (data.certificates.length) {
      lines.push("", `## ${data.certificatesTitle}`)
      for (const cert of data.certificates) {
        const dateRange = [cert.date, cert.expiryDate].filter(Boolean).join(" – ")
        lines.push(`- **${cert.name}** — ${cert.issuer}${dateRange ? ` (${dateRange})` : ""}`)
      }
    }

    // Languages
    if (data.languages.length) {
      lines.push("", `## ${data.languagesTitle}`)
      for (const lang of data.languages) {
        lines.push(`- ${lang.language}: ${lang.proficiency}`)
      }
    }

    // Projects
    if (data.projects.length) {
      lines.push("", `## ${data.projectsTitle}`)
      for (const proj of data.projects) {
        const link = proj.url ? ` — [${proj.url}](${proj.url})` : ""
        lines.push(`- **${proj.name}**${link}${proj.description ? `: ${proj.description}` : ""}`)
      }
    }

    // Volunteer
    if (data.volunteer.length) {
      lines.push("", `## ${data.volunteerTitle}`)
      for (const vol of data.volunteer) {
        const period = vol.current ? `${vol.startDate} – Present` : `${vol.startDate} – ${vol.endDate}`
        lines.push("", `### ${vol.role} — ${vol.organization}`, `*${period}*`)
        if (vol.description) {
          for (const bullet of vol.description.split("\n")) {
            if (bullet.trim()) lines.push(`- ${bullet.trim()}`)
          }
        }
      }
    }

    triggerDownload(lines.join("\n"), getFileName("md"), "text/markdown")
  }

  const handleDownloadJSON = () => {
    triggerDownload(JSON.stringify(data, null, 2), getFileName("json"), "application/json")
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <h1 className="sr-only">CV Builder & Resume Generator — Bahrul Bangsawan</h1>
      <div className="h-svh w-full overflow-y-auto border-b border-border md:w-1/2 md:border-r md:border-b-0">
        <div className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b border-border bg-background px-6 py-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload data-icon="inline-start" />
            Import JSON
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
            onClick={() => setData(sampleData as CVData)}
          >
            <UserRoundPen data-icon="inline-start" />
            Pre-Fill Example
          </Button>
        </div>
        <div className="p-6">
          <CVForm data={data} onChange={setData} />
        </div>
      </div>
      <div className="h-svh w-full overflow-y-auto bg-muted/50 md:w-1/2">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border bg-muted/50 px-6 py-3">
          <div className="flex gap-1">
            {(["basic", "harvard", "simple", "standard"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={style === s ? "default" : "outline"}
                onClick={() => setStyle(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
          <div className="ml-auto hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" disabled={generating}>
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
                <DropdownMenuItem onClick={handleDownloadMarkdown}>
                  <FileText className="mr-2 size-4" />
                  Download as Markdown
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
          <CVPreview data={data} style={style} />
        </div>
      </div>
      {/* Floating download button — mobile only */}
      <div className="fixed bottom-6 left-6 z-50 md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" disabled={generating} className="size-12 rounded-full shadow-lg">
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
            <DropdownMenuItem onClick={handleDownloadMarkdown}>
              <FileText className="mr-2 size-4" />
              Download as Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadJSON}>
              <FileJson className="mr-2 size-4" />
              Download as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Suspense fallback={null}>
        <CVAssistant data={data} onApply={setData} />
      </Suspense>
    </div>
  )
}
