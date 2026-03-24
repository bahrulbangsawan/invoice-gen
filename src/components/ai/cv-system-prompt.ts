import type { CVData } from "@/components/cv-form"

const CV_SECTION_KEYS = [
  "personal-info",
  "summary",
  "experience",
  "education",
  "skills",
  "awards",
  "certificates",
  "languages",
  "projects",
  "volunteer",
] as const

export type CVSectionKey = (typeof CV_SECTION_KEYS)[number]

export const CV_SECTIONS: { key: CVSectionKey; label: string }[] = [
  { key: "personal-info", label: "Personal Info" },
  { key: "summary", label: "Summary" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "awards", label: "Awards" },
  { key: "certificates", label: "Certificates" },
  { key: "languages", label: "Languages" },
  { key: "projects", label: "Projects" },
  { key: "volunteer", label: "Volunteer" },
]

function serializeCV(data: CVData): string {
  const parts: string[] = []

  const p = data.personalInfo
  if (p.fullName || p.jobTitle) {
    parts.push(
      `[Personal Info] Name: ${p.fullName} | Title: ${p.jobTitle} | Email: ${p.email} | Phone: ${p.phone} | Location: ${p.location} | LinkedIn: ${p.linkedIn}`,
    )
  }

  if (data.summary) {
    parts.push(`[Summary] ${data.summary}`)
  }

  if (data.experience.length > 0) {
    const entries = data.experience
      .map(
        (e, i) =>
          `[Experience #${i}] ${e.title} at ${e.company}${e.url ? ` (${e.url})` : ""} (${e.startDate}–${e.current ? "Present" : e.endDate})${e.workType ? ` [${e.workType}]` : ""}${e.locationPolicy ? ` [${e.locationPolicy}]` : ""}: ${e.description}`,
      )
      .join("\n")
    parts.push(entries)
  }

  if (data.education.length > 0) {
    const entries = data.education
      .map(
        (e) =>
          `[Education] ${e.degree} at ${e.institution} (${e.startDate}–${e.current ? "Present" : e.endDate})${e.category ? ` [${e.category}]` : ""}${e.gpa ? ` GPA: ${e.gpa}` : ""}`,
      )
      .join("\n")
    parts.push(entries)
  }

  if (data.skills.length > 0) {
    const entries = data.skills
      .map((c) => `[Skills: ${c.name}] ${c.items.join(", ")}`)
      .join("\n")
    parts.push(entries)
  }

  if (data.awards.length > 0) {
    const entries = data.awards
      .map((a) => `[Award] ${a.title} — ${a.issuer} (${a.date}): ${a.description}${a.url ? ` | ${a.url}` : ""}`)
      .join("\n")
    parts.push(entries)
  }

  if (data.certificates.length > 0) {
    const entries = data.certificates
      .map((c) => `[Certificate] ${c.name} — ${c.issuer} (${[c.date, c.expiryDate].filter(Boolean).join(" – ")})${c.credentialId ? ` ID: ${c.credentialId}` : ""}${c.url ? ` | ${c.url}` : ""}`)
      .join("\n")
    parts.push(entries)
  }

  if (data.languages.length > 0) {
    const entries = data.languages
      .map((l) => `[Language] ${l.language}: ${l.proficiency}`)
      .join("\n")
    parts.push(entries)
  }

  if (data.projects.length > 0) {
    const entries = data.projects
      .map((p) => `[Projects] ${p.name} | ${p.url} | ${p.description}`)
      .join("\n")
    parts.push(entries)
  }

  if (data.volunteer.length > 0) {
    const entries = data.volunteer
      .map(
        (v) =>
          `[Volunteer] ${v.organization} | ${v.role} | ${v.startDate} | ${v.current ? "Present" : v.endDate} | ${v.description}`,
      )
      .join("\n")
    parts.push(entries)
  }

  return parts.join("\n")
}

export function buildSystemPrompt(
  data: CVData,
  mentionedSection?: CVSectionKey,
): string {
  const cvText = serializeCV(data)

  const focusInstruction = mentionedSection
    ? `\nUser is targeting: ${mentionedSection}. Use <apply section="${mentionedSection}"> to update it directly.`
    : ""

  return `CV editing assistant. CV/resume help only.

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
- Example: if user says "change summary to a farmer", write a NEW farmer summary from scratch.

QUESTIONS about CV: answer in 1-2 sentences.
OFF-TOPIC: reply "I can only help with CV content."
NEVER repeat/list/echo CV data. No explanations.

Valid sections: summary, experience, education, skills, awards, certificates, languages, projects, volunteer

SECTION FORMATS (use | as separator, one entry per line):

Experience (use index for specific entry's description):
<apply section="experience" index="0">bullet1
bullet2</apply>

Experience (full entries without index — Company | URL | Title | WorkType | LocationPolicy | StartDate | EndDate | Description):
<apply section="experience">
Acme Corp | https://acme.com | Software Engineer | full-time | remote | 2020-01 | Present | Led frontend architecture
Startup Inc | | Junior Dev | contract | on-site | 2018-06 | 2019-12 | Built REST APIs
</apply>
WorkType values: full-time, part-time, contract, freelance, internship, apprenticeship
LocationPolicy values: on-site, remote, work-from-anywhere, hybrid

Skills (CategoryName: items):
<apply section="skills">
Hard Skills: TypeScript, React, Node.js
Soft Skills: Leadership, Communication
</apply>

Languages (Language: Proficiency):
<apply section="languages">
English: Professional
Indonesian: Native
</apply>

Awards (Title | Issuer | Date | Description | URL):
<apply section="awards">
Best Innovation | Startup Weekend | 2021-11 | Won first place for building an AI platform | https://example.com/award
</apply>

Certificates (Name | Issuer | Date | ExpiryDate | CredentialId | URL):
<apply section="certificates">
AWS Solutions Architect | Amazon Web Services | 2023-04 | 2026-04 | AWS-SAA-2023 | https://aws.amazon.com/verify
</apply>

Education (Degree | Institution | StartDate | EndDate | GPA | Category):
<apply section="education">
B.S. Computer Science | MIT | 2013-09 | 2017-06 | 3.8 | university
</apply>
Category values: university, college, school, polytechnic, academy, language-center, online-platform, professional-association

Projects (Name | URL | Description):
<apply section="projects">
CV Builder | https://cv.bahrul.me | AI-powered CV builder with real-time preview
</apply>

Volunteer (Organization | Role | StartDate | EndDate | Description):
<apply section="volunteer">
Red Cross | Volunteer Coordinator | 2020-01 | 2021-06 | Organized community outreach programs
</apply>

IMPORTANT: Include ALL existing entries plus new ones. Do not drop entries.

CV DATA:
${cvText}${focusInstruction}`
}
