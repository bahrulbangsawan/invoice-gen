import { useState, useCallback } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Download, Loader2, UserRoundPen } from "lucide-react"
import { CVForm, type CVData } from "@/components/cv-form"
import { CVPreview } from "@/components/cv-preview"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: CVGenerator })

const initialData: CVData = {
  personalInfo: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedIn: "",
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
}

const sampleData: CVData = {
  personalInfo: {
    fullName: "Bahrul Bangsawan",
    jobTitle: "Growth Hacker & Full-Stack Engineer",
    email: "saya@bahrul.me",
    phone: "+6281234567890",
    location: "Makassar, Indonesia",
    linkedIn: "bahrulbangsawan",
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
      items: ["TypeScript", "React", "TanStack Start", "Node.js", "PostgreSQL", "Tailwind CSS"],
    },
    {
      id: "skill-cat-2",
      name: "Soft Skills",
      items: ["Leadership", "Communication", "Problem Solving", "A/B Testing", "Data Analytics"],
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
}

function CVGenerator() {
  const [data, setData] = useState<CVData>(initialData)
  const [generating, setGenerating] = useState(false)

  const handleDownloadPDF = useCallback(async () => {
    const element = document.getElementById("cv-content")
    if (!element) return

    setGenerating(true)
    try {
      const [html2canvasMod, jsPDFMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ])
      const html2canvas = html2canvasMod.default
      const { jsPDF } = jsPDFMod

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.98)
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pageWidth - margin * 2
      const contentHeight = (canvas.height * contentWidth) / canvas.width
      let position = margin

      // First page
      pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight)

      // Add extra pages if content overflows
      let remainingHeight = contentHeight - (pageHeight - margin * 2)
      while (remainingHeight > 0) {
        pdf.addPage()
        position = margin - (contentHeight - remainingHeight)
        pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight)
        remainingHeight -= pageHeight - margin * 2
      }

      const filename = data.personalInfo.fullName
        ? `${data.personalInfo.fullName.replace(/\s+/g, "-")}-CV.pdf`
        : "CV.pdf"
      pdf.save(filename)
    } catch (err) {
      console.error("PDF generation failed:", err)
    } finally {
      setGenerating(false)
    }
  }, [data.personalInfo.fullName])

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <div className="w-full overflow-y-auto border-b border-border md:h-svh md:w-1/2 md:border-r md:border-b-0">
        <div className="flex items-center justify-end border-b border-border px-6 py-3">
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
        <div className="flex items-center justify-end border-b border-border px-6 py-3">
          <Button
            size="lg"
            onClick={handleDownloadPDF}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            {generating ? "Generating..." : "Download PDF"}
          </Button>
        </div>
        <div className="p-6">
          <CVPreview data={data} />
        </div>
      </div>
    </div>
  )
}
