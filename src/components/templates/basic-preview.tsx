import type { CVData } from "@/components/cv-form"
import { ensureUrl, formatPhoneDisplay } from "@/lib/utils"

function formatMonth(value: string): string {
  if (!value) return ""
  const [year, month] = value.split("-")
  if (!year || !month) return value
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

const WORK_TYPE_LABELS: Record<string, string> = { "full-time": "Full-Time", "part-time": "Part-Time", internship: "Internship" }
const LOCATION_LABELS: Record<string, string> = { "work-from-office": "Work From Office", "work-from-anywhere": "Work From Anywhere", hybrid: "Hybrid" }
const EDUCATION_CATEGORY_LABELS: Record<string, string> = { university: "University", college: "College / Institute", school: "School (K-12)", polytechnic: "Polytechnic / Vocational", academy: "Academy", "language-center": "Language / Tuition Center", "online-platform": "Online Learning Platform", "professional-association": "Professional Association" }

export function BasicPreview({ data }: { data: CVData }) {
  const { personalInfo, summary, experience, education, skills, awards, certificates, languages, projects, volunteer } = data

  return (
    <article id="cv-content" className="cv-page mx-auto">
      {/* Header */}
      <header className="flex items-start gap-4">
        {personalInfo.usePhoto && personalInfo.photoUrl && (
          <img
            src={personalInfo.photoUrl}
            alt=""
            className="size-16 shrink-0 rounded-full border border-neutral-200 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          {personalInfo.fullName && (
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              {personalInfo.fullName}
            </h1>
          )}
          {personalInfo.jobTitle && (
            <p className="mt-0.5 text-sm text-neutral-500">{personalInfo.jobTitle}</p>
          )}
          {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedIn) && (
            <p className="mt-2 text-xs text-neutral-500">
              {[personalInfo.email, personalInfo.phone ? formatPhoneDisplay(personalInfo.phone) : "", personalInfo.location, personalInfo.linkedIn ? `linkedin.com/in/${personalInfo.linkedIn}` : ""].filter(Boolean).join(" \u00b7 ")}
            </p>
          )}
        </div>
      </header>

      {data.sectionOrder.map((sectionId) => {
        switch (sectionId) {
          case "summary":
            if (!summary) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.summaryTitle}</h2>
                <p className="mt-2 text-xs leading-relaxed text-neutral-700">{summary}</p>
              </section>
            )
          case "experience":
            if (!experience.some((e) => e.company || e.title)) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.experienceTitle}</h2>
                {experience.filter((e) => e.company || e.title).map((entry) => (
                  <section key={entry.id} className="mt-4">
                    <h3 className="text-sm font-semibold text-neutral-900">{entry.title}{entry.title && entry.company ? " at " : ""}{entry.url ? <a href={ensureUrl(entry.url)} target="_blank" rel="noopener noreferrer" className="underline">{entry.company}</a> : entry.company}</h3>
                    {(entry.startDate || entry.endDate || entry.current) && (
                      <p className="text-xs text-neutral-500">{[formatMonth(entry.startDate), entry.current ? "Present" : entry.endDate ? formatMonth(entry.endDate) : "Present"].filter(Boolean).join(" \u2013 ")}</p>
                    )}
                    {(entry.workType || entry.locationPolicy) && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {[WORK_TYPE_LABELS[entry.workType], LOCATION_LABELS[entry.locationPolicy]].filter(Boolean).join(" \u00b7 ")}
                      </p>
                    )}
                    {entry.description && (
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                        {entry.description.split("\n").filter((l) => l.trim()).map((line, i) => (
                          <li key={i} className="text-xs leading-relaxed text-neutral-700">{line.trim()}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </section>
            )
          case "education":
            if (!education.some((e) => e.institution || e.degree)) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.educationTitle}</h2>
                {education.filter((e) => e.institution || e.degree).map((entry) => (
                  <section key={entry.id} className="mt-4">
                    <h3 className="text-sm font-semibold text-neutral-900">{[entry.degree, entry.institution].filter(Boolean).join(" \u2013 ")}</h3>
                    {(entry.startDate || entry.endDate || entry.current || entry.gpa || entry.category) && (
                      <p className="text-xs text-neutral-500">{[
                        [formatMonth(entry.startDate), entry.current ? "Present" : formatMonth(entry.endDate)].filter(Boolean).join(" \u2013 "),
                        entry.category ? EDUCATION_CATEGORY_LABELS[entry.category] : "",
                        entry.gpa ? `GPA: ${entry.gpa}` : "",
                      ].filter(Boolean).join(" \u00b7 ")}</p>
                    )}
                  </section>
                ))}
              </section>
            )
          case "skills":
            if (!skills.some((c) => c.items.length > 0)) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.skillsTitle}</h2>
                <div className="mt-2 space-y-1">
                  {skills.filter((c) => c.items.length > 0).map((category) => (
                    <p key={category.id} className="text-xs text-neutral-700">
                      {category.name && <span className="font-semibold text-neutral-900">{category.name}: </span>}
                      {category.items.join(", ")}.
                    </p>
                  ))}
                </div>
              </section>
            )
          case "awards":
            if (!awards.some((e) => e.title)) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.awardsTitle}</h2>
                {awards.filter((e) => e.title).map((entry) => (
                  <section key={entry.id} className="mt-4">
                    <h3 className="text-sm font-semibold text-neutral-900">{[entry.title, entry.issuer].filter(Boolean).join(" \u2013 ")}</h3>
                    {entry.date && <p className="text-xs text-neutral-500">{formatMonth(entry.date)}</p>}
                    {entry.description && <p className="mt-1 text-xs leading-relaxed text-neutral-700">{entry.description}</p>}
                    {entry.url && <a href={ensureUrl(entry.url)} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-neutral-500 underline">{entry.url}</a>}
                  </section>
                ))}
              </section>
            )
          case "certificates":
            if (!certificates.some((e) => e.name)) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.certificatesTitle}</h2>
                {certificates.filter((e) => e.name).map((entry) => (
                  <section key={entry.id} className="mt-4">
                    <h3 className="text-sm font-semibold text-neutral-900">{entry.url ? <a href={ensureUrl(entry.url)} target="_blank" rel="noopener noreferrer" className="underline">{entry.name}</a> : entry.name}{entry.name && entry.issuer ? " \u2013 " : ""}{entry.issuer}</h3>
                    <p className="text-xs text-neutral-500">{[[entry.date ? formatMonth(entry.date) : "", entry.expiryDate ? formatMonth(entry.expiryDate) : ""].filter(Boolean).join(" – "), entry.credentialId ? `ID: ${entry.credentialId}` : ""].filter(Boolean).join(" \u00b7 ")}</p>
                  </section>
                ))}
              </section>
            )
          case "languages":
            if (!languages.some((e) => e.language)) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.languagesTitle}</h2>
                <ul className="mt-2 space-y-1">
                  {languages.filter((e) => e.language).map((entry) => (
                    <li key={entry.id} className="text-xs text-neutral-700">
                      {entry.language}
                      {entry.proficiency && <span className="text-neutral-500">{" \u2013 "}{entry.proficiency}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )
          case "projects":
            if (projects.length === 0) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.projectsTitle}</h2>
                {projects.map((entry) => (
                  <section key={entry.id} className="mt-4">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {entry.url ? <a href={ensureUrl(entry.url)} className="underline" target="_blank" rel="noopener noreferrer">{entry.name}</a> : entry.name}
                    </h3>
                    {entry.description && <p className="mt-1 text-xs leading-relaxed text-neutral-700">{entry.description}</p>}
                  </section>
                ))}
              </section>
            )
          case "volunteer":
            if (!volunteer.some((e) => e.organization || e.role)) return null
            return (
              <section key={sectionId} className="mt-6">
                <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.volunteerTitle}</h2>
                {volunteer.filter((e) => e.organization || e.role).map((entry) => (
                  <section key={entry.id} className="mt-4">
                    <h3 className="text-sm font-semibold text-neutral-900">{[entry.role, entry.organization].filter(Boolean).join(" at ")}</h3>
                    {(entry.startDate || entry.endDate || entry.current) && (
                      <p className="text-xs text-neutral-500">{[formatMonth(entry.startDate), entry.current ? "Present" : entry.endDate ? formatMonth(entry.endDate) : "Present"].filter(Boolean).join(" \u2013 ")}</p>
                    )}
                    {entry.description && (
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                        {entry.description.split("\n").filter((l) => l.trim()).map((line, i) => (
                          <li key={i} className="text-xs leading-relaxed text-neutral-700">{line.trim()}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </section>
            )
          default:
            return null
        }
      })}
    </article>
  )
}
