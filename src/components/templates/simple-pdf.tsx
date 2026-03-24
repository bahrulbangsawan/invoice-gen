import { Document, Page, View, Text, Link, StyleSheet } from "@react-pdf/renderer"
import type { CVData } from "@/components/cv-form"

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#ffffff", paddingTop: 32, paddingBottom: 32, paddingHorizontal: 40, fontSize: 9, color: "#404040", lineHeight: 1.5 },
  headerWrap: { textAlign: "center" },
  name: { fontSize: 16, fontWeight: 700, color: "#404040", letterSpacing: -0.3, marginBottom: 2 },
  jobTitle: { fontSize: 10, color: "#404040", marginTop: 2 },
  contact: { fontSize: 8, color: "#404040", marginTop: 6 },
  contactLink: { fontSize: 8, color: "#171717" },
  sectionWrap: { marginTop: 16 },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: "#171717", paddingBottom: 3, borderBottomWidth: 1.5, borderBottomColor: "#171717" },
  entryWrap: { marginTop: 10 },
  entryTitle: { fontSize: 10, fontWeight: "bold", color: "#404040" },
  entryMeta: { fontSize: 8, color: "#404040", marginTop: 1 },
  bodyText: { fontSize: 9, color: "#404040", lineHeight: 1.6 },
  bulletRow: { flexDirection: "row", marginTop: 2, paddingLeft: 4 },
  bulletDot: { width: 8, fontSize: 9, color: "#404040" },
  bulletText: { flex: 1, fontSize: 9, color: "#404040", lineHeight: 1.6 },
  skillRow: { marginTop: 3 },
  skillLabel: { fontWeight: "bold", color: "#404040" },
  langRow: { marginTop: 3 },
  langProficiency: { color: "#666666" },
  link: { fontSize: 8, color: "#171717", textDecoration: "underline", marginTop: 2 },
})

function formatMonth(value: string): string {
  if (!value) return ""
  const [year, month] = value.split("-")
  if (!year || !month) return value
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function CVDocument({ data }: { data: CVData }) {
  const { personalInfo, summary, experience, education, skills, awards, certificates, languages, portfolio } = data
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header — centered */}
        <View style={s.headerWrap}>
          {personalInfo.fullName && <Text style={s.name}>{personalInfo.fullName}</Text>}
          {personalInfo.jobTitle && <Text style={s.jobTitle}>{personalInfo.jobTitle}</Text>}
          {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedIn) && (
            <Text style={s.contact}>
              {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedIn ? `linkedin.com/in/${personalInfo.linkedIn}` : ""].filter(Boolean).join("  \u00b7  ")}
            </Text>
          )}
        </View>

        {/* Summary */}
        {summary && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>{data.summaryTitle}</Text>
            <Text style={[s.bodyText, { marginTop: 6 }]}>{summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.some((e) => e.company || e.title) && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>{data.experienceTitle}</Text>
            {experience.filter((e) => e.company || e.title).map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                {entry.title && <Text style={s.entryTitle}>{entry.title}</Text>}
                <Text style={s.entryMeta}>
                  {[
                    entry.company,
                    (entry.startDate || entry.endDate || entry.current)
                      ? [formatMonth(entry.startDate), entry.current ? "Present" : entry.endDate ? formatMonth(entry.endDate) : "Present"].filter(Boolean).join(" \u2013 ")
                      : "",
                  ].filter(Boolean).join(" | ")}
                </Text>
                {entry.description && entry.description.split("\n").filter((l) => l.trim()).map((line, i) => (
                  <View key={i} style={s.bulletRow}>
                    <Text style={s.bulletDot}>{"\u2022"}</Text>
                    <Text style={s.bulletText}>{line.trim()}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.some((e) => e.institution || e.degree) && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>{data.educationTitle}</Text>
            {education.filter((e) => e.institution || e.degree).map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                {entry.degree && <Text style={s.entryTitle}>{entry.degree}</Text>}
                <Text style={s.entryMeta}>
                  {[
                    entry.institution,
                    (entry.startDate || entry.endDate || entry.current)
                      ? [formatMonth(entry.startDate), entry.current ? "Present" : formatMonth(entry.endDate)].filter(Boolean).join(" \u2013 ")
                      : "",
                  ].filter(Boolean).join(" | ")}
                </Text>
                {entry.gpa && <Text style={s.entryMeta}>GPA: {entry.gpa}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.some((c) => c.items.length > 0) && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>{data.skillsTitle}</Text>
            {skills.filter((c) => c.items.length > 0).map((cat) => (
              <Text key={cat.id} style={[s.bodyText, s.skillRow]}>
                {cat.name && <Text style={s.skillLabel}>{cat.name}: </Text>}
                {cat.items.join(", ")}.
              </Text>
            ))}
          </View>
        )}

        {/* Awards */}
        {awards.some((e) => e.title) && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>{data.awardsTitle}</Text>
            {awards.filter((e) => e.title).map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                <Text style={s.entryTitle}>{entry.title}</Text>
                <Text style={s.entryMeta}>
                  {[entry.issuer, entry.date ? formatMonth(entry.date) : ""].filter(Boolean).join(" | ")}
                </Text>
                {entry.description && <Text style={[s.bodyText, { marginTop: 2 }]}>{entry.description}</Text>}
                {entry.url && <Link src={entry.url} style={s.link}>{entry.url}</Link>}
              </View>
            ))}
          </View>
        )}

        {/* Certificates */}
        {certificates.some((e) => e.name) && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>{data.certificatesTitle}</Text>
            {certificates.filter((e) => e.name).map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                <Text style={s.entryTitle}>{entry.name}</Text>
                <Text style={s.entryMeta}>
                  {[entry.issuer, entry.date ? formatMonth(entry.date) : "", entry.credentialId ? `ID: ${entry.credentialId}` : ""].filter(Boolean).join(" | ")}
                </Text>
                {entry.url && <Link src={entry.url} style={s.link}>{entry.url}</Link>}
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {languages.some((e) => e.language) && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>{data.languagesTitle}</Text>
            {languages.filter((e) => e.language).map((entry) => (
              <Text key={entry.id} style={[s.bodyText, s.langRow]}>
                {entry.language}
                {entry.proficiency && <Text style={s.langProficiency}> {"\u2013"} {entry.proficiency}</Text>}
              </Text>
            ))}
          </View>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>{data.portfolioTitle}</Text>
            {portfolio.map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                {entry.url ? <Link src={entry.url} style={s.entryTitle}>{entry.name}</Link> : <Text style={s.entryTitle}>{entry.name}</Text>}
                {entry.description && <Text style={[s.bodyText, { marginTop: 2 }]}>{entry.description}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
