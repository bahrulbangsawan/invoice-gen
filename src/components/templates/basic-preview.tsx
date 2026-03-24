import { Mail, Phone, MapPin, Link } from "lucide-react"
import type { CVData } from "@/components/cv-form"

function formatMonth(value: string): string {
  if (!value) return ""
  const [year, month] = value.split("-")
  if (!year || !month) return value
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function BasicPreview({ data }: { data: CVData }) {
  const { personalInfo, summary, experience, education, skills, awards, certificates, languages } = data

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
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
              {personalInfo.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" />{personalInfo.email}</span>}
              {personalInfo.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{personalInfo.phone}</span>}
              {personalInfo.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{personalInfo.location}</span>}
              {personalInfo.linkedIn && <span className="inline-flex items-center gap-1"><Link className="size-3" />linkedin.com/in/{personalInfo.linkedIn}</span>}
            </div>
          )}
        </div>
      </header>

      {summary && (
        <section className="mt-6">
          <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.summaryTitle}</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-700">{summary}</p>
        </section>
      )}

      {experience.some((e) => e.company || e.title) && (
        <section className="mt-6">
          <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.experienceTitle}</h2>
          {experience.filter((e) => e.company || e.title).map((entry) => (
            <section key={entry.id} className="mt-4">
              <h3 className="text-sm font-semibold text-neutral-900">{[entry.title, entry.company].filter(Boolean).join(" at ")}</h3>
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
      )}

      {education.some((e) => e.institution || e.degree) && (
        <section className="mt-6">
          <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.educationTitle}</h2>
          {education.filter((e) => e.institution || e.degree).map((entry) => (
            <section key={entry.id} className="mt-4">
              <h3 className="text-sm font-semibold text-neutral-900">{[entry.degree, entry.institution].filter(Boolean).join(" \u2013 ")}</h3>
              {(entry.startDate || entry.endDate || entry.current) && (
                <p className="text-xs text-neutral-500">{[formatMonth(entry.startDate), entry.current ? "Present" : formatMonth(entry.endDate)].filter(Boolean).join(" \u2013 ")}</p>
              )}
            </section>
          ))}
        </section>
      )}

      {skills.some((c) => c.items.length > 0) && (
        <section className="mt-6">
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
      )}

      {awards.some((e) => e.title) && (
        <section className="mt-6">
          <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.awardsTitle}</h2>
          {awards.filter((e) => e.title).map((entry) => (
            <section key={entry.id} className="mt-4">
              <h3 className="text-sm font-semibold text-neutral-900">{[entry.title, entry.issuer].filter(Boolean).join(" \u2013 ")}</h3>
              {entry.date && <p className="text-xs text-neutral-500">{formatMonth(entry.date)}</p>}
              {entry.description && <p className="mt-1 text-xs leading-relaxed text-neutral-700">{entry.description}</p>}
              {entry.url && <p className="mt-1 text-xs text-neutral-500 underline">{entry.url}</p>}
            </section>
          ))}
        </section>
      )}

      {certificates.some((e) => e.name) && (
        <section className="mt-6">
          <h2 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-900">{data.certificatesTitle}</h2>
          {certificates.filter((e) => e.name).map((entry) => (
            <section key={entry.id} className="mt-4">
              <h3 className="text-sm font-semibold text-neutral-900">{[entry.name, entry.issuer].filter(Boolean).join(" \u2013 ")}</h3>
              <p className="text-xs text-neutral-500">{[entry.date ? formatMonth(entry.date) : "", entry.credentialId ? `ID: ${entry.credentialId}` : ""].filter(Boolean).join(" \u00b7 ")}</p>
              {entry.url && <p className="mt-1 text-xs text-neutral-500 underline">{entry.url}</p>}
            </section>
          ))}
        </section>
      )}

      {languages.some((e) => e.language) && (
        <section className="mt-6">
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
      )}
    </article>
  )
}
