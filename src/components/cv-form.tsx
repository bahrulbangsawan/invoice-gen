import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { PhoneInput } from "@/components/reui/phone-input"
import { Switch } from "@/components/ui/switch"
import { Plus, X, Upload, Trash2 } from "lucide-react"

export interface PersonalInfo {
  fullName: string
  jobTitle: string
  email: string
  phone: string
  location: string
  linkedIn: string
  photoUrl: string
  usePhoto: boolean
}

export interface ExperienceEntry {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  startDate: string
  endDate: string
  current: boolean
}

export interface AwardEntry {
  id: string
  title: string
  issuer: string
  date: string
  description: string
  url: string
}

export interface CertificateEntry {
  id: string
  name: string
  issuer: string
  date: string
  credentialId: string
  url: string
}

export interface LanguageEntry {
  id: string
  language: string
  proficiency: string
}

export type CVStyle = "basic" | "harvard" | "simple" | "standard"

export interface SkillCategory {
  id: string
  name: string
  items: string[]
}

export interface CVData {
  personalInfo: PersonalInfo
  summaryTitle: string
  summary: string
  experienceTitle: string
  experience: ExperienceEntry[]
  educationTitle: string
  education: EducationEntry[]
  skillsTitle: string
  skills: SkillCategory[]
  awardsTitle: string
  awards: AwardEntry[]
  certificatesTitle: string
  certificates: CertificateEntry[]
  languagesTitle: string
  languages: LanguageEntry[]
}

interface CVFormProps {
  data: CVData
  onChange: (data: CVData) => void
}

export function CVForm({ data, onChange }: CVFormProps) {
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [openExperience, setOpenExperience] = useState<string[]>([])
  const [openEducation, setOpenEducation] = useState<string[]>([])
  const [openSkills, setOpenSkills] = useState<string[]>([])
  const [openAwards, setOpenAwards] = useState<string[]>([])
  const [openCertificates, setOpenCertificates] = useState<string[]>([])
  const [openLanguages, setOpenLanguages] = useState<string[]>([])

  // --- Error management ---
  function updateError(key: string, error: string | undefined) {
    setErrors((prev) => {
      if (error) return { ...prev, [key]: error }
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // --- Personal info ---
  function updatePersonal(field: keyof PersonalInfo, value: string) {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value },
    })
  }

  // --- Experience ---
  function addExperience() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      experience: [
        ...data.experience,
        {
          id,
          company: "",
          title: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
        },
      ],
    })
    setOpenExperience((prev) => [...prev, id])
  }

  function removeExperience(id: string) {
    onChange({
      ...data,
      experience: data.experience.filter((e) => e.id !== id),
    })
    setOpenExperience((prev) => prev.filter((v) => v !== id))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`exp-${id}-company`]
      delete next[`exp-${id}-title`]
      return next
    })
  }

  function updateExperience(
    id: string,
    field: keyof Omit<ExperienceEntry, "id">,
    value: string
  ) {
    onChange({
      ...data,
      experience: data.experience.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    })
  }

  // --- Education ---
  function addEducation() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      education: [
        ...data.education,
        { id, institution: "", degree: "", startDate: "", endDate: "", current: false },
      ],
    })
    setOpenEducation((prev) => [...prev, id])
  }

  function removeEducation(id: string) {
    onChange({
      ...data,
      education: data.education.filter((e) => e.id !== id),
    })
    setOpenEducation((prev) => prev.filter((v) => v !== id))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`edu-${id}-institution`]
      delete next[`edu-${id}-degree`]
      return next
    })
  }

  function updateEducation(
    id: string,
    field: keyof Omit<EducationEntry, "id">,
    value: string
  ) {
    onChange({
      ...data,
      education: data.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    })
  }

  // --- Skills ---
  function addSkillCategory() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      skills: [...data.skills, { id, name: "", items: [] }],
    })
    setOpenSkills((prev) => [...prev, id])
  }

  function removeSkillCategory(id: string) {
    onChange({ ...data, skills: data.skills.filter((c) => c.id !== id) })
    setOpenSkills((prev) => prev.filter((v) => v !== id))
    setSkillInputs((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function updateSkillCategoryName(id: string, name: string) {
    onChange({
      ...data,
      skills: data.skills.map((c) => (c.id === id ? { ...c, name } : c)),
    })
  }

  function handleCategorySkillKeyDown(
    categoryId: string,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = (skillInputs[categoryId] ?? "").trim()
      const category = data.skills.find((c) => c.id === categoryId)
      if (trimmed && category && !category.items.includes(trimmed)) {
        onChange({
          ...data,
          skills: data.skills.map((c) =>
            c.id === categoryId ? { ...c, items: [...c.items, trimmed] } : c
          ),
        })
        setSkillInputs((prev) => ({ ...prev, [categoryId]: "" }))
      }
    }
  }

  function removeSkillFromCategory(categoryId: string, skill: string) {
    onChange({
      ...data,
      skills: data.skills.map((c) =>
        c.id === categoryId
          ? { ...c, items: c.items.filter((s) => s !== skill) }
          : c
      ),
    })
  }

  function skillCategorySummary(category: SkillCategory) {
    if (category.name && category.items.length > 0)
      return `${category.name} (${category.items.length})`
    return category.name || "Untitled Category"
  }

  // --- Awards ---
  function addAward() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      awards: [
        ...data.awards,
        { id, title: "", issuer: "", date: "", description: "", url: "" },
      ],
    })
    setOpenAwards((prev) => [...prev, id])
  }

  function removeAward(id: string) {
    onChange({ ...data, awards: data.awards.filter((e) => e.id !== id) })
    setOpenAwards((prev) => prev.filter((v) => v !== id))
  }

  function updateAward(
    id: string,
    field: keyof Omit<AwardEntry, "id">,
    value: string
  ) {
    onChange({
      ...data,
      awards: data.awards.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    })
  }

  // --- Certificates ---
  function addCertificate() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      certificates: [
        ...data.certificates,
        { id, name: "", issuer: "", date: "", credentialId: "", url: "" },
      ],
    })
    setOpenCertificates((prev) => [...prev, id])
  }

  function removeCertificate(id: string) {
    onChange({
      ...data,
      certificates: data.certificates.filter((e) => e.id !== id),
    })
    setOpenCertificates((prev) => prev.filter((v) => v !== id))
  }

  function updateCertificate(
    id: string,
    field: keyof Omit<CertificateEntry, "id">,
    value: string
  ) {
    onChange({
      ...data,
      certificates: data.certificates.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    })
  }

  // --- Languages ---
  function addLanguage() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      languages: [
        ...data.languages,
        { id, language: "", proficiency: "" },
      ],
    })
    setOpenLanguages((prev) => [...prev, id])
  }

  function removeLanguage(id: string) {
    onChange({
      ...data,
      languages: data.languages.filter((e) => e.id !== id),
    })
    setOpenLanguages((prev) => prev.filter((v) => v !== id))
  }

  function updateLanguage(
    id: string,
    field: keyof Omit<LanguageEntry, "id">,
    value: string
  ) {
    onChange({
      ...data,
      languages: data.languages.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    })
  }

  // --- Accordion summaries ---
  function experienceSummary(entry: ExperienceEntry, index: number) {
    if (entry.title && entry.company)
      return `${entry.title} at ${entry.company}`
    return entry.title || entry.company || `Experience #${index + 1}`
  }

  function educationSummary(entry: EducationEntry, index: number) {
    if (entry.degree && entry.institution)
      return `${entry.degree} \u2013 ${entry.institution}`
    return entry.degree || entry.institution || `Education #${index + 1}`
  }

  function awardSummary(entry: AwardEntry, index: number) {
    if (entry.title && entry.issuer)
      return `${entry.title} \u2013 ${entry.issuer}`
    return entry.title || entry.issuer || `Award #${index + 1}`
  }

  function certificateSummary(entry: CertificateEntry, index: number) {
    if (entry.name && entry.issuer)
      return `${entry.name} \u2013 ${entry.issuer}`
    return entry.name || entry.issuer || `Certificate #${index + 1}`
  }

  function languageSummary(entry: LanguageEntry, index: number) {
    if (entry.language && entry.proficiency)
      return `${entry.language} \u2013 ${entry.proficiency}`
    return entry.language || `Language #${index + 1}`
  }

  return (
    <div className="space-y-6">
      {/* ── Personal Info ── */}
      <section>
        <h2 className="text-sm font-medium">Personal Information</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Bahrul Bangsawan"
              value={data.personalInfo.fullName}
              aria-invalid={!!errors.fullName}
              onChange={(e) => {
                updatePersonal("fullName", e.target.value)
                if (errors.fullName && e.target.value.trim().length >= 2)
                  updateError("fullName", undefined)
              }}
              onBlur={(e) => {
                const v = e.target.value.trim()
                updateError(
                  "fullName",
                  !v
                    ? "Full name is required"
                    : v.length < 2
                      ? "At least 2 characters"
                      : undefined
                )
              }}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              placeholder="Growthacker"
              value={data.personalInfo.jobTitle}
              onChange={(e) => updatePersonal("jobTitle", e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="saya@bahrul.me"
              value={data.personalInfo.email}
              aria-invalid={!!errors.email}
              onChange={(e) => {
                updatePersonal("email", e.target.value)
                if (
                  errors.email &&
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)
                )
                  updateError("email", undefined)
              }}
              onBlur={(e) => {
                const v = e.target.value
                updateError(
                  "email",
                  !v.trim()
                    ? "Email is required"
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                      ? "Invalid email format"
                      : undefined
                )
              }}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <PhoneInput
              placeholder="Enter phone number"
              defaultCountry="ID"
              value={data.personalInfo.phone || undefined}
              onChange={(value) => {
                updatePersonal("phone", String(value ?? ""))
                if (errors.phone) updateError("phone", undefined)
              }}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Makassar, Indonesia"
              value={data.personalInfo.location}
              onChange={(e) => updatePersonal("location", e.target.value)}
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-1.5">
            <Label htmlFor="linkedIn">LinkedIn</Label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>linkedin.com/in/</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="linkedIn"
                placeholder="bahrulbangsawan"
                value={data.personalInfo.linkedIn}
                onChange={(e) => updatePersonal("linkedIn", e.target.value)}
              />
            </InputGroup>
          </div>

          {/* Photo Profile */}
          <div className="col-span-full space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                id="usePhoto"
                checked={data.personalInfo.usePhoto}
                onCheckedChange={(checked) =>
                  onChange({
                    ...data,
                    personalInfo: { ...data.personalInfo, usePhoto: checked },
                  })
                }
              />
              <Label htmlFor="usePhoto">Use Photo Profile</Label>
            </div>
            {data.personalInfo.usePhoto && (
              <div className="flex items-center gap-3">
                {data.personalInfo.photoUrl ? (
                  <>
                    <img
                      src={data.personalInfo.photoUrl}
                      alt="Profile"
                      className="size-16 rounded-full border border-border object-cover"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onChange({
                          ...data,
                          personalInfo: { ...data.personalInfo, photoUrl: "" },
                        })
                      }
                    >
                      <Trash2 className="size-3" /> Remove
                    </Button>
                  </>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-foreground/30">
                    <Upload className="size-4" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 2 * 1024 * 1024) {
                          updateError("photo", "Max file size is 2MB")
                          return
                        }
                        updateError("photo", undefined)
                        const reader = new FileReader()
                        reader.onload = () => {
                          onChange({
                            ...data,
                            personalInfo: {
                              ...data.personalInfo,
                              photoUrl: reader.result as string,
                            },
                          })
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                )}
                {errors.photo && (
                  <p className="text-xs text-destructive">{errors.photo}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Professional Summary ── */}
      <section>
        <input
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          value={data.summaryTitle}
          placeholder="Professional Summary"
          onChange={(e) =>
            onChange({ ...data, summaryTitle: e.target.value })
          }
        />
        <div className="mt-3">
          <Textarea
            placeholder="Write a brief professional summary..."
            value={data.summary}
            aria-invalid={!!errors.summary}
            onChange={(e) => {
              onChange({ ...data, summary: e.target.value })
              if (errors.summary && e.target.value.length <= 500)
                updateError("summary", undefined)
            }}
            onBlur={(e) => {
              updateError(
                "summary",
                e.target.value.length > 500
                  ? "Maximum 500 characters"
                  : undefined
              )
            }}
          />
          <div className="mt-1 flex justify-between">
            {errors.summary ? (
              <p className="text-xs text-destructive">{errors.summary}</p>
            ) : (
              <span />
            )}
            <p
              className={`text-xs ${data.summary.length > 500 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {data.summary.length}/500
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Work Experience ── */}
      <section>
        <input
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          value={data.experienceTitle}
          placeholder="Work Experience"
          onChange={(e) =>
            onChange({ ...data, experienceTitle: e.target.value })
          }
        />
        <div className="mt-3 space-y-3">
          {data.experience.length > 0 && (
            <Accordion
              type="multiple"
              value={openExperience}
              onValueChange={setOpenExperience}
            >
              {data.experience.map((entry, index) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger className="items-center gap-2">
                    <span className="flex-1 truncate">
                      {experienceSummary(entry, index)}
                    </span>
                    {(errors[`exp-${entry.id}-company`] ||
                      errors[`exp-${entry.id}-title`]) && (
                      <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                    )}
                    <span
                      role="button"
                      tabIndex={-1}
                      className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeExperience(entry.id)
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Company</Label>
                        <Input
                          placeholder="Company name"
                          value={entry.company}
                          aria-invalid={
                            !!errors[`exp-${entry.id}-company`]
                          }
                          onChange={(e) => {
                            updateExperience(
                              entry.id,
                              "company",
                              e.target.value
                            )
                            if (
                              errors[`exp-${entry.id}-company`] &&
                              e.target.value.trim()
                            )
                              updateError(
                                `exp-${entry.id}-company`,
                                undefined
                              )
                          }}
                          onBlur={(e) => {
                            updateError(
                              `exp-${entry.id}-company`,
                              !e.target.value.trim()
                                ? "Company is required"
                                : undefined
                            )
                          }}
                        />
                        {errors[`exp-${entry.id}-company`] && (
                          <p className="text-xs text-destructive">
                            {errors[`exp-${entry.id}-company`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Job Title</Label>
                        <Input
                          placeholder="Your role"
                          value={entry.title}
                          aria-invalid={
                            !!errors[`exp-${entry.id}-title`]
                          }
                          onChange={(e) => {
                            updateExperience(
                              entry.id,
                              "title",
                              e.target.value
                            )
                            if (
                              errors[`exp-${entry.id}-title`] &&
                              e.target.value.trim()
                            )
                              updateError(
                                `exp-${entry.id}-title`,
                                undefined
                              )
                          }}
                          onBlur={(e) => {
                            updateError(
                              `exp-${entry.id}-title`,
                              !e.target.value.trim()
                                ? "Job title is required"
                                : undefined
                            )
                          }}
                        />
                        {errors[`exp-${entry.id}-title`] && (
                          <p className="text-xs text-destructive">
                            {errors[`exp-${entry.id}-title`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Start Date</Label>
                        <Input
                          type="month"
                          value={entry.startDate}
                          onChange={(e) =>
                            updateExperience(
                              entry.id,
                              "startDate",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>End Date</Label>
                        <Input
                          type="month"
                          value={entry.current ? "" : entry.endDate}
                          disabled={entry.current}
                          onChange={(e) =>
                            updateExperience(
                              entry.id,
                              "endDate",
                              e.target.value
                            )
                          }
                        />
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={entry.current}
                            className="accent-primary"
                            onChange={(e) => {
                              onChange({
                                ...data,
                                experience: data.experience.map((exp) =>
                                  exp.id === entry.id
                                    ? { ...exp, current: e.target.checked, endDate: e.target.checked ? "" : exp.endDate }
                                    : exp
                                ),
                              })
                            }}
                          />
                          <span className="text-xs text-muted-foreground">Present</span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe your responsibilities (one bullet per line)"
                        value={entry.description}
                        onChange={(e) =>
                          updateExperience(
                            entry.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <Button variant="outline" size="sm" onClick={addExperience}>
            <Plus /> Add Experience
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Education ── */}
      <section>
        <input
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          value={data.educationTitle}
          placeholder="Education"
          onChange={(e) =>
            onChange({ ...data, educationTitle: e.target.value })
          }
        />
        <div className="mt-3 space-y-3">
          {data.education.length > 0 && (
            <Accordion
              type="multiple"
              value={openEducation}
              onValueChange={setOpenEducation}
            >
              {data.education.map((entry, index) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger className="items-center gap-2">
                    <span className="flex-1 truncate">
                      {educationSummary(entry, index)}
                    </span>
                    {(errors[`edu-${entry.id}-institution`] ||
                      errors[`edu-${entry.id}-degree`]) && (
                      <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                    )}
                    <span
                      role="button"
                      tabIndex={-1}
                      className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeEducation(entry.id)
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Institution</Label>
                        <Input
                          placeholder="University name"
                          value={entry.institution}
                          aria-invalid={
                            !!errors[`edu-${entry.id}-institution`]
                          }
                          onChange={(e) => {
                            updateEducation(
                              entry.id,
                              "institution",
                              e.target.value
                            )
                            if (
                              errors[`edu-${entry.id}-institution`] &&
                              e.target.value.trim()
                            )
                              updateError(
                                `edu-${entry.id}-institution`,
                                undefined
                              )
                          }}
                          onBlur={(e) => {
                            updateError(
                              `edu-${entry.id}-institution`,
                              !e.target.value.trim()
                                ? "Institution is required"
                                : undefined
                            )
                          }}
                        />
                        {errors[`edu-${entry.id}-institution`] && (
                          <p className="text-xs text-destructive">
                            {errors[`edu-${entry.id}-institution`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Degree</Label>
                        <Input
                          placeholder="B.S. Computer Science"
                          value={entry.degree}
                          aria-invalid={
                            !!errors[`edu-${entry.id}-degree`]
                          }
                          onChange={(e) => {
                            updateEducation(
                              entry.id,
                              "degree",
                              e.target.value
                            )
                            if (
                              errors[`edu-${entry.id}-degree`] &&
                              e.target.value.trim()
                            )
                              updateError(
                                `edu-${entry.id}-degree`,
                                undefined
                              )
                          }}
                          onBlur={(e) => {
                            updateError(
                              `edu-${entry.id}-degree`,
                              !e.target.value.trim()
                                ? "Degree is required"
                                : undefined
                            )
                          }}
                        />
                        {errors[`edu-${entry.id}-degree`] && (
                          <p className="text-xs text-destructive">
                            {errors[`edu-${entry.id}-degree`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Start Date</Label>
                        <Input
                          type="month"
                          value={entry.startDate}
                          onChange={(e) =>
                            updateEducation(
                              entry.id,
                              "startDate",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>End Date</Label>
                        <Input
                          type="month"
                          value={entry.current ? "" : entry.endDate}
                          disabled={entry.current}
                          onChange={(e) =>
                            updateEducation(
                              entry.id,
                              "endDate",
                              e.target.value
                            )
                          }
                        />
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={entry.current}
                            className="accent-primary"
                            onChange={(e) => {
                              onChange({
                                ...data,
                                education: data.education.map((edu) =>
                                  edu.id === entry.id
                                    ? { ...edu, current: e.target.checked, endDate: e.target.checked ? "" : edu.endDate }
                                    : edu
                                ),
                              })
                            }}
                          />
                          <span className="text-xs text-muted-foreground">Present</span>
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <Button variant="outline" size="sm" onClick={addEducation}>
            <Plus /> Add Education
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Skills ── */}
      <section>
        <input
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          value={data.skillsTitle}
          placeholder="Skills"
          onChange={(e) =>
            onChange({ ...data, skillsTitle: e.target.value })
          }
        />
        <div className="mt-3 space-y-3">
          {data.skills.length > 0 && (
            <Accordion
              type="multiple"
              value={openSkills}
              onValueChange={setOpenSkills}
            >
              {data.skills.map((category) => (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger className="items-center gap-2">
                    <span className="flex-1 truncate">
                      {skillCategorySummary(category)}
                    </span>
                    <span
                      role="button"
                      tabIndex={-1}
                      className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSkillCategory(category.id)
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Category Name</Label>
                        <Input
                          placeholder="e.g. Hard Skills, Soft Skills, Tools"
                          value={category.name}
                          onChange={(e) =>
                            updateSkillCategoryName(
                              category.id,
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Skills</Label>
                        <Input
                          placeholder="Type a skill and press Enter"
                          value={skillInputs[category.id] ?? ""}
                          onChange={(e) =>
                            setSkillInputs((prev) => ({
                              ...prev,
                              [category.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) =>
                            handleCategorySkillKeyDown(category.id, e)
                          }
                        />
                      </div>
                      {category.items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {category.items.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() =>
                                removeSkillFromCategory(category.id, skill)
                              }
                            >
                              {skill}
                              <X className="size-2.5" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <Button variant="outline" size="sm" onClick={addSkillCategory}>
            <Plus /> Add Category
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Awards ── */}
      <section>
        <input
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          value={data.awardsTitle}
          placeholder="Awards"
          onChange={(e) =>
            onChange({ ...data, awardsTitle: e.target.value })
          }
        />
        <div className="mt-3 space-y-3">
          {data.awards.length > 0 && (
            <Accordion
              type="multiple"
              value={openAwards}
              onValueChange={setOpenAwards}
            >
              {data.awards.map((entry, index) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger className="items-center gap-2">
                    <span className="flex-1 truncate">
                      {awardSummary(entry, index)}
                    </span>
                    <span
                      role="button"
                      tabIndex={-1}
                      className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeAward(entry.id)
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input
                          placeholder="Award name"
                          value={entry.title}
                          onChange={(e) =>
                            updateAward(entry.id, "title", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Issuer</Label>
                        <Input
                          placeholder="Issuing organization"
                          value={entry.issuer}
                          onChange={(e) =>
                            updateAward(entry.id, "issuer", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Date</Label>
                        <Input
                          type="month"
                          value={entry.date}
                          onChange={(e) =>
                            updateAward(entry.id, "date", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Brief description"
                        value={entry.description}
                        onChange={(e) =>
                          updateAward(
                            entry.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <Label>URL</Label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={entry.url}
                        aria-invalid={!!errors[`award-${entry.id}-url`]}
                        onChange={(e) => {
                          updateAward(entry.id, "url", e.target.value)
                          if (
                            errors[`award-${entry.id}-url`] &&
                            (!e.target.value || /^https?:\/\/.+/.test(e.target.value))
                          )
                            updateError(`award-${entry.id}-url`, undefined)
                        }}
                        onBlur={(e) => {
                          const v = e.target.value
                          updateError(
                            `award-${entry.id}-url`,
                            v && !/^https?:\/\/.+/.test(v)
                              ? "Must start with http:// or https://"
                              : undefined
                          )
                        }}
                      />
                      {errors[`award-${entry.id}-url`] && (
                        <p className="text-xs text-destructive">
                          {errors[`award-${entry.id}-url`]}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <Button variant="outline" size="sm" onClick={addAward}>
            <Plus /> Add Award
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Certificates ── */}
      <section>
        <input
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          value={data.certificatesTitle}
          placeholder="Certificates"
          onChange={(e) =>
            onChange({ ...data, certificatesTitle: e.target.value })
          }
        />
        <div className="mt-3 space-y-3">
          {data.certificates.length > 0 && (
            <Accordion
              type="multiple"
              value={openCertificates}
              onValueChange={setOpenCertificates}
            >
              {data.certificates.map((entry, index) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger className="items-center gap-2">
                    <span className="flex-1 truncate">
                      {certificateSummary(entry, index)}
                    </span>
                    <span
                      role="button"
                      tabIndex={-1}
                      className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCertificate(entry.id)
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Certificate Name</Label>
                        <Input
                          placeholder="Certificate name"
                          value={entry.name}
                          onChange={(e) =>
                            updateCertificate(
                              entry.id,
                              "name",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Issuer</Label>
                        <Input
                          placeholder="Issuing organization"
                          value={entry.issuer}
                          onChange={(e) =>
                            updateCertificate(
                              entry.id,
                              "issuer",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Date</Label>
                        <Input
                          type="month"
                          value={entry.date}
                          onChange={(e) =>
                            updateCertificate(
                              entry.id,
                              "date",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Credential ID</Label>
                        <Input
                          placeholder="Optional credential ID"
                          value={entry.credentialId}
                          onChange={(e) =>
                            updateCertificate(
                              entry.id,
                              "credentialId",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <Label>URL</Label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={entry.url}
                        aria-invalid={!!errors[`cert-${entry.id}-url`]}
                        onChange={(e) => {
                          updateCertificate(entry.id, "url", e.target.value)
                          if (
                            errors[`cert-${entry.id}-url`] &&
                            (!e.target.value || /^https?:\/\/.+/.test(e.target.value))
                          )
                            updateError(`cert-${entry.id}-url`, undefined)
                        }}
                        onBlur={(e) => {
                          const v = e.target.value
                          updateError(
                            `cert-${entry.id}-url`,
                            v && !/^https?:\/\/.+/.test(v)
                              ? "Must start with http:// or https://"
                              : undefined
                          )
                        }}
                      />
                      {errors[`cert-${entry.id}-url`] && (
                        <p className="text-xs text-destructive">
                          {errors[`cert-${entry.id}-url`]}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <Button variant="outline" size="sm" onClick={addCertificate}>
            <Plus /> Add Certificate
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Languages ── */}
      <section>
        <input
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          value={data.languagesTitle}
          placeholder="Languages"
          onChange={(e) =>
            onChange({ ...data, languagesTitle: e.target.value })
          }
        />
        <div className="mt-3 space-y-3">
          {data.languages.length > 0 && (
            <Accordion
              type="multiple"
              value={openLanguages}
              onValueChange={setOpenLanguages}
            >
              {data.languages.map((entry, index) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger className="items-center gap-2">
                    <span className="flex-1 truncate">
                      {languageSummary(entry, index)}
                    </span>
                    <span
                      role="button"
                      tabIndex={-1}
                      className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeLanguage(entry.id)
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Language</Label>
                        <Input
                          placeholder="e.g. English"
                          value={entry.language}
                          onChange={(e) =>
                            updateLanguage(
                              entry.id,
                              "language",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Proficiency</Label>
                        <Input
                          placeholder="e.g. Native, Fluent, Intermediate"
                          value={entry.proficiency}
                          onChange={(e) =>
                            updateLanguage(
                              entry.id,
                              "proficiency",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <Button variant="outline" size="sm" onClick={addLanguage}>
            <Plus /> Add Language
          </Button>
        </div>
      </section>
    </div>
  )
}
