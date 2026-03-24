import { Document, Page, View, Text, Link, StyleSheet } from "@react-pdf/renderer"
import type { CVData } from "@/components/cv-form"

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 40,
    fontSize: 9,
    color: "#404040",
    lineHeight: 1.5,
  },
  headerWrap: { alignItems: "center", marginBottom: 4 },
  name: { fontSize: 16, fontWeight: 700, color: "#171717", letterSpacing: -0.3, textAlign: "center" },
  contact: { fontSize: 8, color: "#737373", marginTop: 6, textAlign: "center" },
  sectionWrap: { marginTop: 10 },
  sectionTitleWrap: {
    borderTopWidth: 1,
    borderTopColor: "#171717",
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleText: {
    fontSize: 8,
    fontWeight: 700,
    color: "#171717",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  entryWrap: { marginTop: 6 },
  entryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitle: { fontSize: 10, fontWeight: "bold", color: "#404040", flex: 1 },
  entryDate: { fontSize: 8, color: "#404040", marginLeft: 8, flexShrink: 0 },
  bodyText: { fontSize: 9, color: "#404040", lineHeight: 1.6 },
  bulletRow: { flexDirection: "row", marginTop: 2, paddingLeft: 4 },
  bulletDot: { width: 8, fontSize: 9, color: "#404040" },
  bulletText: { flex: 1, fontSize: 9, color: "#404040", lineHeight: 1.6 },
  skillRow: { marginTop: 3 },
  skillLabel: { fontWeight: "bold", color: "#404040" },
  langRow: { marginTop: 3 },
  langProficiency: { color: "#666666" },
  link: { fontSize: 8, color: "#171717", textDecoration: "underline", marginTop: 2 },
  entrySubtext: { fontSize: 8, color: "#404040", marginTop: 1 },
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
        {/* Header */}
        <View style={s.headerWrap}>
          {personalInfo.fullName && <Text style={s.name}>{personalInfo.fullName}</Text>}
          {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedIn) && (
            <Text style={s.contact}>
              {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedIn ? `linkedin.com/in/${personalInfo.linkedIn}` : ""].filter(Boolean).join("  |  ")}
            </Text>
          )}
        </View>

        {/* Summary */}
        {summary && (
          <View style={s.sectionWrap}>
            <View style={s.sectionTitleWrap}><Text style={s.sectionTitleText}>{data.summaryTitle}</Text></View>
            <Text style={[s.bodyText, { marginTop: 6 }]}>{summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.some((e) => e.company || e.title) && (
          <View style={s.sectionWrap}>
            <View style={s.sectionTitleWrap}><Text style={s.sectionTitleText}>{data.experienceTitle}</Text></View>
            {experience.filter((e) => e.company || e.title).map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                <View style={s.entryRow}>
                  <Text style={s.entryTitle}>
                    {entry.title}{entry.title && entry.company ? ", " : ""}{entry.company}
                  </Text>
                  {(entry.startDate || entry.endDate || entry.current) && (
                    <Text style={s.entryDate}>
                      {[formatMonth(entry.startDate), entry.current ? "Present" : entry.endDate ? formatMonth(entry.endDate) : "Present"].filter(Boolean).join(" \u2013 ")}
                    </Text>
                  )}
                </View>
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
            <View style={s.sectionTitleWrap}><Text style={s.sectionTitleText}>{data.educationTitle}</Text></View>
            {education.filter((e) => e.institution || e.degree).map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                <View style={s.entryRow}>
                  <Text style={s.entryTitle}>
                    {entry.degree}{entry.degree && entry.institution ? ", " : ""}{entry.institution}
                  </Text>
                  {(entry.startDate || entry.endDate || entry.current) && (
                    <Text style={s.entryDate}>
                      {[formatMonth(entry.startDate), entry.current ? "Present" : formatMonth(entry.endDate)].filter(Boolean).join(" \u2013 ")}
                    </Text>
                  )}
                </View>
                {entry.gpa && <Text style={s.entryDate}>GPA: {entry.gpa}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.some((c) => c.items.length > 0) && (
          <View style={s.sectionWrap}>
            <View style={s.sectionTitleWrap}><Text style={s.sectionTitleText}>{data.skillsTitle}</Text></View>
            {skills.filter((c) => c.items.length > 0).map((cat) => (
              <Text key={cat.id} style={[s.bodyText, s.skillRow]}>
                {cat.name && <Text style={s.skillLabel}>{cat.name}: </Text>}
                {cat.items.join(", ")}
              </Text>
            ))}
          </View>
        )}

        {/* Awards */}
        {awards.some((e) => e.title) && (
          <View style={s.sectionWrap}>
            <View style={s.sectionTitleWrap}><Text style={s.sectionTitleText}>{data.awardsTitle}</Text></View>
            {awards.filter((e) => e.title).map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                <View style={s.entryRow}>
                  <Text style={s.entryTitle}>
                    {entry.title}{entry.issuer ? `, ${entry.issuer}` : ""}
                  </Text>
                  {entry.date && <Text style={s.entryDate}>{formatMonth(entry.date)}</Text>}
                </View>
                {entry.description && <Text style={[s.bodyText, { marginTop: 2 }]}>{entry.description}</Text>}
                {entry.url && <Link src={entry.url} style={s.link}>{entry.url}</Link>}
              </View>
            ))}
          </View>
        )}

        {/* Certificates */}
        {certificates.some((e) => e.name) && (
          <View style={s.sectionWrap}>
            <View style={s.sectionTitleWrap}><Text style={s.sectionTitleText}>{data.certificatesTitle}</Text></View>
            {certificates.filter((e) => e.name).map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                <View style={s.entryRow}>
                  <Text style={s.entryTitle}>
                    {entry.name}{entry.issuer ? `, ${entry.issuer}` : ""}
                  </Text>
                  {entry.date && <Text style={s.entryDate}>{formatMonth(entry.date)}</Text>}
                </View>
                {entry.credentialId && <Text style={s.entrySubtext}>Credential ID: {entry.credentialId}</Text>}
                {entry.url && <Link src={entry.url} style={s.link}>{entry.url}</Link>}
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {languages.some((e) => e.language) && (
          <View style={s.sectionWrap}>
            <View style={s.sectionTitleWrap}><Text style={s.sectionTitleText}>{data.languagesTitle}</Text></View>
            {languages.filter((e) => e.language).map((entry) => (
              <Text key={entry.id} style={[s.bodyText, s.langRow]}>
                <Text style={{ fontWeight: "bold" }}>{entry.language}</Text>
                {entry.proficiency && <Text style={s.langProficiency}> {"\u2013"} {entry.proficiency}</Text>}
              </Text>
            ))}
          </View>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <View style={s.sectionWrap}>
            <View style={s.sectionTitleWrap}><Text style={s.sectionTitleText}>{data.portfolioTitle}</Text></View>
            {portfolio.map((entry) => (
              <View key={entry.id} style={s.entryWrap} wrap={false}>
                <View style={s.entryRow}>
                  {entry.url ? <Link src={entry.url} style={s.entryTitle}>{entry.name}</Link> : <Text style={s.entryTitle}>{entry.name}</Text>}
                </View>
                {entry.description && <Text style={[s.bodyText, { marginTop: 2 }]}>{entry.description}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
