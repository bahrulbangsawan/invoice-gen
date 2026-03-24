import { useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown, Download, FileJson, FileText, Loader2, Upload, UserRoundPen } from "lucide-react"
import { CVForm, type CVData, type CVStyle } from "@/components/cv-form"
import { CVPreview } from "@/components/cv-preview"
import { CVAssistant } from "@/components/ai/cv-assistant"
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
  portfolioTitle: "Portfolio",
  portfolio: [],
}

const sampleData: CVData = {
  personalInfo: {
    fullName: "Bahrul Bangsawan",
    jobTitle: "Growthacker",
    email: "work@bahrul.me",
    phone: "+6281234567890",
    location: "Makassar, Indonesia",
    linkedIn: "bahrulbangsawan",
    photoUrl: "",
    usePhoto: false,
  },
  summaryTitle: "Professional Summary",
  summary:
    "Results-driven growth hacker and full-stack engineer with 6+ years of experience building scalable web applications and driving user acquisition strategies. Passionate about combining technical expertise with data-driven marketing to deliver measurable business growth. Experienced in leading cross-functional teams and shipping products from zero to thousands of daily active users.",
  experienceTitle: "Work Experience",
  experience: [
    {
      id: "exp-1",
      company: "TechStartup Asia",
      title: "Lead Growth Engineer",
      startDate: "2022-03",
      endDate: "",
      current: true,
      description:
        "Architected and deployed a referral engine that increased user sign-ups by 140% in 6 months\nBuilt real-time analytics dashboards using React, TanStack Query, and PostgreSQL\nLed a team of 4 engineers to redesign the onboarding flow, reducing drop-off by 35%\nImplemented A/B testing infrastructure serving 500K+ monthly experiments",
    },
    {
      id: "exp-2",
      company: "Digital Nusantara",
      title: "Full-Stack Developer",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      description:
        "Developed and maintained 12+ client-facing web applications using TypeScript and React\nDesigned RESTful APIs and database schemas serving 10K+ concurrent users\nReduced page load times by 60% through code-splitting and image optimization\nMentored 3 junior developers through code reviews and pair programming sessions",
    },
    {
      id: "exp-3",
      company: "Freelance",
      title: "Web Developer",
      startDate: "2017-01",
      endDate: "2019-05",
      current: false,
      description:
        "Delivered 20+ websites for SMEs across e-commerce, education, and hospitality sectors\nBuilt a custom CMS that reduced client content update time by 80%",
    },
  ],
  educationTitle: "Education",
  education: [
    {
      id: "edu-1",
      institution: "Universitas Hasanuddin",
      degree: "B.S. Informatics Engineering",
      gpa: "3.50",
      startDate: "2013-09",
      endDate: "2017-08",
      current: false,
    },
  ],
  skillsTitle: "Skills",
  skills: [
    {
      id: "skill-cat-1",
      name: "Hard Skills",
      items: [
        "TypeScript",
        "React",
        "TanStack Start",
        "Node.js",
        "PostgreSQL",
        "Tailwind CSS",
      ],
    },
    {
      id: "skill-cat-2",
      name: "Soft Skills",
      items: [
        "Leadership",
        "Communication",
        "Problem Solving",
        "A/B Testing",
        "Data Analytics",
      ],
    },
    {
      id: "skill-cat-3",
      name: "Tools",
      items: ["Cloudflare Workers", "Figma", "Git", "VS Code", "Docker"],
    },
  ],
  awardsTitle: "Awards",
  awards: [
    {
      id: "award-1",
      title: "Best Innovation Award",
      issuer: "Startup Weekend Makassar",
      date: "2021-11",
      description:
        "Won first place for building an AI-powered local business discovery platform in 54 hours.",
      url: "",
    },
  ],
  certificatesTitle: "Certificates",
  certificates: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023-04",
      credentialId: "AWS-SAA-2023-04",
      url: "",
    },
    {
      id: "cert-2",
      name: "Google Analytics Professional",
      issuer: "Google",
      date: "2022-09",
      credentialId: "GA-PRO-2022",
      url: "",
    },
  ],
  languagesTitle: "Languages",
  languages: [
    { id: "lang-1", language: "Indonesian", proficiency: "Native" },
    { id: "lang-2", language: "English", proficiency: "Professional" },
    { id: "lang-3", language: "Buginese", proficiency: "Native" },
  ],
  portfolioTitle: "Portfolio",
  portfolio: [
    {
      id: "port-1",
      name: "CV Builder",
      url: "https://cv.bahrul.me",
      description:
        "AI-powered CV builder with real-time preview and PDF export",
    },
  ],
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
        lines.push("", `### ${exp.title} — ${exp.company}`, `*${period}*`)
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
        lines.push("", `### ${edu.degree} — ${edu.institution}`, `*${period}*`)
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
        lines.push(`- **${cert.name}** — ${cert.issuer} (${cert.date})`)
      }
    }

    // Languages
    if (data.languages.length) {
      lines.push("", `## ${data.languagesTitle}`)
      for (const lang of data.languages) {
        lines.push(`- ${lang.language}: ${lang.proficiency}`)
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
      <div className="w-full overflow-y-auto border-b border-border md:h-svh md:w-1/2 md:border-r md:border-b-0">
        <div className="flex items-center justify-end gap-2 border-b border-border px-6 py-3">
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
            onClick={() => setData(sampleData)}
          >
            <UserRoundPen data-icon="inline-start" />
            Pre-Fill Example
          </Button>
        </div>
        <div className="p-6">
          <CVForm data={data} onChange={setData} />
        </div>
      </div>
      <div className="w-full overflow-y-auto bg-muted/50 md:h-svh md:w-1/2">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
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
          <div className="ml-auto">
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
      <CVAssistant data={data} onApply={setData} />
    </div>
  )
}
