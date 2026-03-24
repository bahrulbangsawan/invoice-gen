import type { CVData } from "@/components/cv-form"

function formatMonth(value: string): string {
  if (!value) return ""
  const [year, month] = value.split("-")
  if (!year || !month) return value
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function SimplePreview({ data }: { data: CVData }) {
  const { personalInfo, summary, experience, education, skills, awards, certificates, languages, portfolio } = data

  const hasContent =
    personalInfo.fullName ||
    summary ||
    experience.some((e) => e.company || e.title) ||
    education.some((e) => e.institution || e.degree) ||
    skills.some((c) => c.items.length > 0) ||
    awards.some((e) => e.title) ||
    certificates.some((e) => e.name) ||
    languages.some((e) => e.language)

  if (!hasContent) {
    return (
      <article id="cv-content" className="cv-page mx-auto">
        <p className="text-center text-sm text-neutral-400">Fill in the form to see your CV preview.</p>
      </article>
    )
  }

  return (
    <article id="cv-content" className="cv-page mx-auto">
      {/* Header — centered */}
      <header className="text-center">
        {personalInfo.fullName && (
          <h1 className="text-xl font-bold tracking-tight text-neutral-700">
            {personalInfo.fullName}
          </h1>
        )}
        {personalInfo.jobTitle && (
          <p className="mt-0.5 text-sm text-neutral-700">{personalInfo.jobTitle}</p>
        )}
        {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedIn) && (
          <p className="mt-2 text-xs text-neutral-500">
            {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedIn ? `linkedin.com/in/${personalInfo.linkedIn}` : ""].filter(Boolean).join(" \u00b7 ")}
          </p>
        )}
      </header>

      {/* Summary */}
      {summary && (
        <section className="mt-6">
          <h2 className="border-b-2 border-neutral-900 pb-1 text-sm font-bold text-neutral-900">{data.summaryTitle}</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-700">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.some((e) => e.company || e.title) && (
        <section className="mt-6">
          <h2 className="border-b-2 border-neutral-900 pb-1 text-sm font-bold text-neutral-900">{data.experienceTitle}</h2>
          {experience.filter((e) => e.company || e.title).map((entry) => (
            <section key={entry.id} className="mt-4">
              {entry.title && <h3 className="text-sm font-bold text-neutral-700">{entry.title}</h3>}
              <p className="text-xs text-neutral-700">
                {[
                  entry.company,
                  (entry.startDate || entry.endDate || entry.current)
                    ? [formatMonth(entry.startDate), entry.current ? "Present" : entry.endDate ? formatMonth(entry.endDate) : "Present"].filter(Boolean).join(" \u2013 ")
                    : "",
                ].filter(Boolean).join(" | ")}
              </p>
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
      )}

      {/* Education */}
      {education.some((e) => e.institution || e.degree) && (
        <section className="mt-6">
          <h2 className="border-b-2 border-neutral-900 pb-1 text-sm font-bold text-neutral-900">{data.educationTitle}</h2>
          {education.filter((e) => e.institution || e.degree).map((entry) => (
            <section key={entry.id} className="mt-4">
              {entry.degree && <h3 className="text-sm font-bold text-neutral-700">{entry.degree}</h3>}
              <p className="text-xs text-neutral-700">
                {[
                  entry.institution,
                  (entry.startDate || entry.endDate || entry.current)
                    ? [formatMonth(entry.startDate), entry.current ? "Present" : formatMonth(entry.endDate)].filter(Boolean).join(" \u2013 ")
                    : "",
                ].filter(Boolean).join(" | ")}
              </p>
              {entry.gpa && <p className="text-xs text-neutral-600">GPA: {entry.gpa}</p>}
            </section>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.some((c) => c.items.length > 0) && (
        <section className="mt-6">
          <h2 className="border-b-2 border-neutral-900 pb-1 text-sm font-bold text-neutral-900">{data.skillsTitle}</h2>
          <div className="mt-2 space-y-1">
            {skills.filter((c) => c.items.length > 0).map((category) => (
              <p key={category.id} className="text-xs text-neutral-700">
                {category.name && <span className="font-semibold">{category.name}: </span>}
                {category.items.join(", ")}.
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Awards */}
      {awards.some((e) => e.title) && (
        <section className="mt-6">
          <h2 className="border-b-2 border-neutral-900 pb-1 text-sm font-bold text-neutral-900">{data.awardsTitle}</h2>
          {awards.filter((e) => e.title).map((entry) => (
            <section key={entry.id} className="mt-4">
              <h3 className="text-sm font-bold text-neutral-700">{entry.title}</h3>
              <p className="text-xs text-neutral-700">
                {[entry.issuer, entry.date ? formatMonth(entry.date) : ""].filter(Boolean).join(" | ")}
              </p>
              {entry.description && <p className="mt-1 text-xs leading-relaxed text-neutral-700">{entry.description}</p>}
              {entry.url && (
                <a href={entry.url} className="mt-1 block text-xs text-neutral-900 underline" target="_blank" rel="noopener noreferrer">{entry.url}</a>
              )}
            </section>
          ))}
        </section>
      )}

      {/* Certificates */}
      {certificates.some((e) => e.name) && (
        <section className="mt-6">
          <h2 className="border-b-2 border-neutral-900 pb-1 text-sm font-bold text-neutral-900">{data.certificatesTitle}</h2>
          {certificates.filter((e) => e.name).map((entry) => (
            <section key={entry.id} className="mt-4">
              <h3 className="text-sm font-bold text-neutral-700">{entry.name}</h3>
              <p className="text-xs text-neutral-700">
                {[entry.issuer, entry.date ? formatMonth(entry.date) : "", entry.credentialId ? `ID: ${entry.credentialId}` : ""].filter(Boolean).join(" | ")}
              </p>
              {entry.url && (
                <a href={entry.url} className="mt-1 block text-xs text-neutral-900 underline" target="_blank" rel="noopener noreferrer">{entry.url}</a>
              )}
            </section>
          ))}
        </section>
      )}

      {/* Languages */}
      {languages.some((e) => e.language) && (
        <section className="mt-6">
          <h2 className="border-b-2 border-neutral-900 pb-1 text-sm font-bold text-neutral-900">{data.languagesTitle}</h2>
          <ul className="mt-2 space-y-1">
            {languages.filter((e) => e.language).map((entry) => (
              <li key={entry.id} className="text-xs text-neutral-700">
                {entry.language}
                {entry.proficiency && <span> {"\u2013"} {entry.proficiency}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b-2 border-neutral-900 pb-1 text-sm font-bold text-neutral-900">{data.portfolioTitle}</h2>
          {portfolio.map((entry) => (
            <section key={entry.id} className="mt-4">
              <h3 className="text-sm font-bold text-neutral-700">
                {entry.url ? <a href={entry.url} className="underline" target="_blank" rel="noopener noreferrer">{entry.name}</a> : entry.name}
              </h3>
              {entry.description && <p className="mt-1 text-xs leading-relaxed text-neutral-700">{entry.description}</p>}
            </section>
          ))}
        </section>
      )}
    </article>
  )
}
