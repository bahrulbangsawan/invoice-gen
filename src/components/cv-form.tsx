import { type ReactNode, useMemo, useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { PhoneInput } from "@/components/reui/phone-input"
import { Switch } from "@/components/ui/switch"
import { GripVertical, Info, X, Upload, Trash2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormField } from "@/components/form/form-field"
import { SectionList } from "@/components/form/section-list"

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

export type WorkType = "" | "full-time" | "part-time" | "internship"
export type LocationPolicy = "" | "work-from-office" | "work-from-anywhere" | "hybrid"

export const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: "", label: "Not specified" },
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "internship", label: "Internship" },
]

export const LOCATION_POLICY_OPTIONS: { value: LocationPolicy; label: string }[] = [
  { value: "", label: "Not specified" },
  { value: "work-from-office", label: "Work From Office" },
  { value: "work-from-anywhere", label: "Work From Anywhere" },
  { value: "hybrid", label: "Hybrid" },
]

export interface ExperienceEntry {
  id: string
  company: string
  url: string
  title: string
  workType: WorkType
  locationPolicy: LocationPolicy
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export type EducationCategory =
  | ""
  | "university"
  | "college"
  | "school"
  | "polytechnic"
  | "academy"
  | "language-center"
  | "online-platform"
  | "professional-association"

export const EDUCATION_CATEGORY_OPTIONS: { value: EducationCategory; label: string }[] = [
  { value: "", label: "Not specified" },
  { value: "university", label: "University" },
  { value: "college", label: "College / Institute" },
  { value: "school", label: "School (K-12)" },
  { value: "polytechnic", label: "Polytechnic / Vocational" },
  { value: "academy", label: "Academy" },
  { value: "language-center", label: "Language / Tuition Center" },
  { value: "online-platform", label: "Online Learning Platform" },
  { value: "professional-association", label: "Professional Association" },
]

export interface EducationEntry {
  id: string
  category: EducationCategory
  institution: string
  degree: string
  gpa: string
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
  expiryDate: string
  credentialId: string
  url: string
}

export interface LanguageEntry {
  id: string
  language: string
  proficiency: string
}

export interface ProjectEntry {
  id: string
  name: string
  url: string
  description: string
}

export interface VolunteerEntry {
  id: string
  organization: string
  role: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export type CVStyle = "basic" | "harvard" | "simple" | "standard"

export interface SkillCategory {
  id: string
  name: string
  items: string[]
}

export type CVSectionId =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "awards"
  | "certificates"
  | "languages"
  | "projects"
  | "volunteer"

export const DEFAULT_SECTION_ORDER: CVSectionId[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "awards",
  "certificates",
  "languages",
  "projects",
  "volunteer",
]

export interface CVData {
  personalInfo: PersonalInfo
  sectionOrder: CVSectionId[]
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
  projectsTitle: string
  projects: ProjectEntry[]
  volunteerTitle: string
  volunteer: VolunteerEntry[]
}

function dateDiffLabel(from: Date, to: Date) {
  let y = to.getFullYear() - from.getFullYear()
  let m = to.getMonth() - from.getMonth()
  let d = to.getDate() - from.getDate()
  if (d < 0) {
    m--
    d += new Date(to.getFullYear(), to.getMonth(), 0).getDate()
  }
  if (m < 0) {
    y--
    m += 12
  }
  const p: string[] = []
  if (y > 0) p.push(`${y} Year${y > 1 ? "s" : ""}`)
  if (m > 0) p.push(`${m} Month${m > 1 ? "s" : ""}`)
  if (d > 0) p.push(`${d} Day${d > 1 ? "s" : ""}`)
  return p.join(", ") || "0 Days"
}

interface CVFormProps {
  data: CVData
  onChange: (data: CVData) => void
}

export function CVForm({ data, onChange }: CVFormProps) {
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

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
          url: "",
          title: "",
          workType: "" as WorkType,
          locationPolicy: "" as LocationPolicy,
          startDate: "",
          endDate: "",
          current: false,
          description: "",
        },
      ],
    })
  }

  function removeExperience(id: string) {
    onChange({
      ...data,
      experience: data.experience.filter((e) => e.id !== id),
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`exp-${id}-company`]
      delete next[`exp-${id}-title`]
      delete next[`exp-${id}-url`]
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
        { id, category: "" as EducationCategory, institution: "", degree: "", gpa: "", startDate: "", endDate: "", current: false },
      ],
    })
  }

  function removeEducation(id: string) {
    onChange({
      ...data,
      education: data.education.filter((e) => e.id !== id),
    })
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
  }

  function removeSkillCategory(id: string) {
    onChange({ ...data, skills: data.skills.filter((c) => c.id !== id) })
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
  }

  function removeAward(id: string) {
    onChange({ ...data, awards: data.awards.filter((e) => e.id !== id) })
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
        { id, name: "", issuer: "", date: "", expiryDate: "", credentialId: "", url: "" },
      ],
    })
  }

  function removeCertificate(id: string) {
    onChange({
      ...data,
      certificates: data.certificates.filter((e) => e.id !== id),
    })
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
  }

  function removeLanguage(id: string) {
    onChange({
      ...data,
      languages: data.languages.filter((e) => e.id !== id),
    })
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

  function addProject() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      projects: [
        ...data.projects,
        { id, name: "", url: "", description: "" },
      ],
    })
  }

  function removeProject(id: string) {
    onChange({
      ...data,
      projects: data.projects.filter((e) => e.id !== id),
    })
  }

  function updateProject(
    id: string,
    field: keyof Omit<ProjectEntry, "id">,
    value: string,
  ) {
    onChange({
      ...data,
      projects: data.projects.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    })
  }

  // --- Volunteer ---
  function addVolunteer() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      volunteer: [
        ...data.volunteer,
        { id, organization: "", role: "", startDate: "", endDate: "", current: false, description: "" },
      ],
    })
  }

  function removeVolunteer(id: string) {
    onChange({
      ...data,
      volunteer: data.volunteer.filter((e) => e.id !== id),
    })
  }

  function updateVolunteer(
    id: string,
    field: keyof Omit<VolunteerEntry, "id">,
    value: string,
  ) {
    onChange({
      ...data,
      volunteer: data.volunteer.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    })
  }

  // --- Accordion summaries ---
  function experienceSummary(entry: ExperienceEntry, index: number) {
    if (entry.title && entry.company)
      return `${entry.title} at ${entry.company}`
    return entry.title || entry.company || `Experience #${index + 1}`
  }

  const totalExperience = useMemo(() => {
    const now = new Date()
    const intervals = data.experience
      .filter((e) => e.startDate)
      .map((e) => {
        const start = new Date(`${e.startDate}-01`)
        const end =
          e.current || !e.endDate ? now : new Date(`${e.endDate}-01`)
        return { start, end }
      })
      .filter(
        (i) =>
          !Number.isNaN(i.start.getTime()) &&
          !Number.isNaN(i.end.getTime()),
      )
    if (intervals.length === 0) return null

    const earliest = new Date(
      Math.min(...intervals.map((i) => i.start.getTime())),
    )
    const since = earliest.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })
    const spanLabel = dateDiffLabel(earliest, now)

    const sorted = [...intervals].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    )
    const merged: { start: Date; end: Date }[] = []
    for (const iv of sorted) {
      const last = merged[merged.length - 1]
      if (last && iv.start <= last.end) {
        if (iv.end > last.end) last.end = iv.end
      } else {
        merged.push({ start: new Date(iv.start), end: new Date(iv.end) })
      }
    }
    let totalMs = 0
    for (const block of merged) {
      totalMs += block.end.getTime() - block.start.getTime()
    }
    const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24))
    const refEnd = new Date(totalDays * 24 * 60 * 60 * 1000)
    const actualLabel = dateDiffLabel(new Date(0), refEnd)

    return { label: spanLabel, since, actualLabel }
  }, [data.experience])

  const sinceGraduation = useMemo(() => {
    const now = new Date()
    const uniEntries = data.education.filter(
      (e) => e.category === "university" && (e.endDate || e.current),
    )
    if (uniEntries.length === 0) return null

    const endDates = uniEntries.map((e) =>
      e.current ? now : new Date(`${e.endDate}-01`),
    ).filter((d) => !Number.isNaN(d.getTime()))
    if (endDates.length === 0) return null

    const latest = new Date(Math.max(...endDates.map((d) => d.getTime())))
    const label = dateDiffLabel(latest, now)
    const since = latest.toLocaleDateString("en-US", { month: "short", year: "numeric" })

    return { label, since }
  }, [data.education])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = data.sectionOrder.indexOf(active.id as CVSectionId)
    const newIndex = data.sectionOrder.indexOf(over.id as CVSectionId)
    if (oldIndex === -1 || newIndex === -1) return
    onChange({ ...data, sectionOrder: arrayMove(data.sectionOrder, oldIndex, newIndex) })
  }


  function renderSection(sectionId: CVSectionId): ReactNode {
    switch (sectionId) {
      case "summary":
        return (
          <section>
            <input
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
              value={data.summaryTitle}
              placeholder="Professional Summary"
              onChange={(e) => onChange({ ...data, summaryTitle: e.target.value })}
            />
            <div className="mt-3">
              <Textarea
                placeholder="Write a brief professional summary..."
                value={data.summary}
                aria-invalid={!!errors.summary}
                onChange={(e) => {
                  onChange({ ...data, summary: e.target.value })
                  if (errors.summary && e.target.value.length <= 500) updateError("summary", undefined)
                }}
                onBlur={(e) => {
                  updateError("summary", e.target.value.length > 500 ? "Maximum 500 characters" : undefined)
                }}
              />
              <div className="mt-1 flex justify-between">
                {errors.summary ? <p className="text-xs text-destructive">{errors.summary}</p> : <span />}
                <p className={`text-xs ${data.summary.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>{data.summary.length}/500</p>
              </div>
            </div>
          </section>
        )
      case "experience":
        return renderExperienceSection()
      case "education":
        return renderEducationSection()
      case "skills":
        return renderSkillsSection()
      case "awards":
        return renderAwardsSection()
      case "certificates":
        return renderCertificatesSection()
      case "languages":
        return renderLanguagesSection()
      case "projects":
        return renderProjectsSection()
      case "volunteer":
        return renderVolunteerSection()
      default:
        return null
    }
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={data.sectionOrder} strategy={verticalListSortingStrategy}>
          {data.sectionOrder.map((sectionId) => (
            <SortableSection key={sectionId} id={sectionId}>
              {renderSection(sectionId)}
            </SortableSection>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )

  function renderExperienceSection() {
    return (
      <SectionList<ExperienceEntry>
        title={data.experienceTitle}
        onTitleChange={(v) => onChange({ ...data, experienceTitle: v })}
        placeholder="Work Experience"
        items={data.experience}
        onReorder={(items) => onChange({ ...data, experience: items })}
        onAdd={addExperience}
        onRemove={removeExperience}
        addLabel="Add Experience"
        titleExtra={
          totalExperience && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              {totalExperience.label}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="flex-col items-start text-xs leading-relaxed">
                    <p>Career span: {totalExperience.label}</p>
                    <p>Actual working: {totalExperience.actualLabel}</p>
                    <p className="mt-1 opacity-70">Since {totalExperience.since}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          )
        }
        summary={experienceSummary}
        triggerExtra={(entry) =>
          entry.startDate ? (
            <span className="shrink-0 text-[0.625rem] text-muted-foreground">
              {dateDiffLabel(
                new Date(`${entry.startDate}-01`),
                entry.current || !entry.endDate
                  ? new Date()
                  : new Date(`${entry.endDate}-01`),
              )}
            </span>
          ) : null
        }
        hasError={(entry) =>
          !!(errors[`exp-${entry.id}-company`] || errors[`exp-${entry.id}-title`])
        }
        renderContent={(entry) => (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Company"
                placeholder="Company name"
                value={entry.company}
                error={errors[`exp-${entry.id}-company`]}
                onChange={(v) => {
                  updateExperience(entry.id, "company", v)
                  if (errors[`exp-${entry.id}-company`] && v.trim())
                    updateError(`exp-${entry.id}-company`, undefined)
                }}
                onBlur={() => {
                  updateError(
                    `exp-${entry.id}-company`,
                    !entry.company.trim() ? "Company is required" : undefined
                  )
                }}
              />
              <FormField
                label="Job Title"
                placeholder="Your role"
                value={entry.title}
                error={errors[`exp-${entry.id}-title`]}
                onChange={(v) => {
                  updateExperience(entry.id, "title", v)
                  if (errors[`exp-${entry.id}-title`] && v.trim())
                    updateError(`exp-${entry.id}-title`, undefined)
                }}
                onBlur={() => {
                  updateError(
                    `exp-${entry.id}-title`,
                    !entry.title.trim() ? "Job title is required" : undefined
                  )
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                label="Company URL"
                type="url"
                placeholder="https://..."
                value={entry.url}
                error={errors[`exp-${entry.id}-url`]}
                onChange={(v) => {
                  updateExperience(entry.id, "url", v)
                  if (
                    errors[`exp-${entry.id}-url`] &&
                    (!v || /^https?:\/\/.+/.test(v))
                  )
                    updateError(`exp-${entry.id}-url`, undefined)
                }}
                onBlur={() => {
                  updateError(
                    `exp-${entry.id}-url`,
                    entry.url && !/^https?:\/\/.+/.test(entry.url)
                      ? "Must start with http:// or https://"
                      : undefined
                  )
                }}
              />
              <div className="space-y-1.5">
                <Label>Work Type</Label>
                <Select value={entry.workType || "__empty__"} onValueChange={(v) => updateExperience(entry.id, "workType", v === "__empty__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {WORK_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || "__empty__"} value={opt.value || "__empty__"}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location Policy</Label>
                <Select value={entry.locationPolicy || "__empty__"} onValueChange={(v) => updateExperience(entry.id, "locationPolicy", v === "__empty__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                  <SelectContent>
                    {LOCATION_POLICY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || "__empty__"} value={opt.value || "__empty__"}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label="Start Date"
                type="month"
                value={entry.startDate}
                onChange={(v) => updateExperience(entry.id, "startDate", v)}
              />
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="month"
                  value={entry.current ? "" : entry.endDate}
                  disabled={entry.current}
                  onChange={(e) =>
                    updateExperience(entry.id, "endDate", e.target.value)
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
            <FormField
              label="Description"
              placeholder="Describe your responsibilities (one bullet per line)"
              value={entry.description}
              onChange={(v) => updateExperience(entry.id, "description", v)}
              multiline
            />
          </div>
        )}
      />
    )
  }

  function renderEducationSection() {
    return (
      <SectionList<EducationEntry>
        title={data.educationTitle}
        onTitleChange={(v) => onChange({ ...data, educationTitle: v })}
        placeholder="Education"
        items={data.education}
        onReorder={(items) => onChange({ ...data, education: items })}
        onAdd={addEducation}
        onRemove={removeEducation}
        addLabel="Add Education"
        titleExtra={
          sinceGraduation && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              {sinceGraduation.label}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="flex-col items-start text-xs leading-relaxed">
                    <p>Since last university graduation</p>
                    <p>Graduated: {sinceGraduation.since}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          )
        }
        summary={(entry, index) => {
          if (entry.degree && entry.institution)
            return `${entry.degree} – ${entry.institution}`
          return entry.degree || entry.institution || `Education #${index + 1}`
        }}
        triggerExtra={(entry) =>
          entry.startDate ? (
            <span className="shrink-0 text-[0.625rem] text-muted-foreground">
              {dateDiffLabel(
                new Date(`${entry.startDate}-01`),
                entry.current || !entry.endDate
                  ? new Date()
                  : new Date(`${entry.endDate}-01`),
              )}
            </span>
          ) : null
        }
        hasError={(entry) =>
          !!(errors[`edu-${entry.id}-institution`] || errors[`edu-${entry.id}-degree`])
        }
        renderContent={(entry) => (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={entry.category || "__empty__"} onValueChange={(v) => updateEducation(entry.id, "category", v === "__empty__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EDUCATION_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "__empty__"} value={opt.value || "__empty__"}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Institution"
                placeholder="University name"
                value={entry.institution}
                error={errors[`edu-${entry.id}-institution`]}
                onChange={(v) => {
                  updateEducation(entry.id, "institution", v)
                  if (errors[`edu-${entry.id}-institution`] && v.trim())
                    updateError(`edu-${entry.id}-institution`, undefined)
                }}
                onBlur={() => {
                  updateError(
                    `edu-${entry.id}-institution`,
                    !entry.institution.trim() ? "Institution is required" : undefined
                  )
                }}
              />
              <FormField
                label="Degree"
                placeholder="B.S. Computer Science"
                value={entry.degree}
                error={errors[`edu-${entry.id}-degree`]}
                onChange={(v) => {
                  updateEducation(entry.id, "degree", v)
                  if (errors[`edu-${entry.id}-degree`] && v.trim())
                    updateError(`edu-${entry.id}-degree`, undefined)
                }}
                onBlur={() => {
                  updateError(
                    `edu-${entry.id}-degree`,
                    !entry.degree.trim() ? "Degree is required" : undefined
                  )
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                label="GPA"
                placeholder="3.50"
                value={entry.gpa}
                onChange={(v) => updateEducation(entry.id, "gpa", v)}
              />
              <FormField
                label="Start Date"
                type="month"
                value={entry.startDate}
                onChange={(v) => updateEducation(entry.id, "startDate", v)}
              />
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="month"
                  value={entry.current ? "" : entry.endDate}
                  disabled={entry.current}
                  onChange={(e) => updateEducation(entry.id, "endDate", e.target.value)}
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
          </div>
        )}
      />
    )
  }

  function renderSkillsSection() {
    return (
      <SectionList<SkillCategory>
        title={data.skillsTitle}
        onTitleChange={(v) => onChange({ ...data, skillsTitle: v })}
        placeholder="Skills"
        items={data.skills}
        onReorder={(items) => onChange({ ...data, skills: items })}
        onAdd={addSkillCategory}
        onRemove={removeSkillCategory}
        addLabel="Add Category"
        titleExtra={
          data.skills.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {data.skills.reduce((sum, c) => sum + c.items.length, 0)} skills
            </span>
          )
        }
        summary={(category) => {
          if (category.name && category.items.length > 0)
            return `${category.name} (${category.items.length})`
          return category.name || "Untitled Category"
        }}
        renderContent={(category) => (
          <div className="space-y-3">
            <FormField
              label="Category Name"
              placeholder="e.g. Hard Skills, Soft Skills, Tools"
              value={category.name}
              onChange={(v) => updateSkillCategoryName(category.id, v)}
            />
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
        )}
      />
    )
  }

  function renderAwardsSection() {
    return (
      <SectionList<AwardEntry>
        title={data.awardsTitle}
        onTitleChange={(v) => onChange({ ...data, awardsTitle: v })}
        placeholder="Awards"
        items={data.awards}
        onReorder={(items) => onChange({ ...data, awards: items })}
        onAdd={addAward}
        onRemove={removeAward}
        addLabel="Add Award"
        titleExtra={
          data.awards.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {data.awards.length} {data.awards.length === 1 ? "award" : "awards"}
            </span>
          )
        }
        summary={(entry, index) => {
          if (entry.title && entry.issuer)
            return `${entry.title} – ${entry.issuer}`
          return entry.title || entry.issuer || `Award #${index + 1}`
        }}
        renderContent={(entry) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Title"
                placeholder="Award name"
                value={entry.title}
                onChange={(v) => updateAward(entry.id, "title", v)}
              />
              <FormField
                label="Issuer"
                placeholder="Issuing organization"
                value={entry.issuer}
                onChange={(v) => updateAward(entry.id, "issuer", v)}
              />
              <FormField
                label="Date"
                type="month"
                value={entry.date}
                onChange={(v) => updateAward(entry.id, "date", v)}
              />
            </div>
            <FormField
              label="Description"
              placeholder="Brief description"
              value={entry.description}
              onChange={(v) => updateAward(entry.id, "description", v)}
              multiline
            />
            <FormField
              label="URL"
              type="url"
              placeholder="https://..."
              value={entry.url}
              error={errors[`award-${entry.id}-url`]}
              onChange={(v) => {
                updateAward(entry.id, "url", v)
                if (
                  errors[`award-${entry.id}-url`] &&
                  (!v || /^https?:\/\/.+/.test(v))
                )
                  updateError(`award-${entry.id}-url`, undefined)
              }}
              onBlur={() => {
                updateError(
                  `award-${entry.id}-url`,
                  entry.url && !/^https?:\/\/.+/.test(entry.url)
                    ? "Must start with http:// or https://"
                    : undefined
                )
              }}
            />
          </>
        )}
      />
    )
  }

  function renderCertificatesSection() {
    return (
      <SectionList<CertificateEntry>
        title={data.certificatesTitle}
        onTitleChange={(v) => onChange({ ...data, certificatesTitle: v })}
        placeholder="Certificates"
        items={data.certificates}
        onReorder={(items) => onChange({ ...data, certificates: items })}
        onAdd={addCertificate}
        onRemove={removeCertificate}
        addLabel="Add Certificate"
        titleExtra={
          data.certificates.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {data.certificates.length} {data.certificates.length === 1 ? "certificate" : "certificates"}
            </span>
          )
        }
        summary={(entry, index) => {
          if (entry.name && entry.issuer)
            return `${entry.name} – ${entry.issuer}`
          return entry.name || entry.issuer || `Certificate #${index + 1}`
        }}
        triggerExtra={(entry) => {
          if (!entry.expiryDate) return null
          const expiry = new Date(`${entry.expiryDate}-01`)
          if (Number.isNaN(expiry.getTime())) return null
          const now = new Date()
          const isExpired = expiry < new Date(now.getFullYear(), now.getMonth(), 1)
          if (isExpired) {
            return (
              <span className="shrink-0 text-[0.625rem] text-destructive">
                Expired {dateDiffLabel(expiry, now)} ago
              </span>
            )
          }
          return (
            <span className="shrink-0 text-[0.625rem] text-muted-foreground">
              Expires in {dateDiffLabel(now, expiry)}
            </span>
          )
        }}
        renderContent={(entry) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Certificate Name"
                placeholder="Certificate name"
                value={entry.name}
                onChange={(v) => updateCertificate(entry.id, "name", v)}
              />
              <FormField
                label="Issuer"
                placeholder="Issuing organization"
                value={entry.issuer}
                onChange={(v) => updateCertificate(entry.id, "issuer", v)}
              />
              <FormField
                label="Issued Date"
                type="month"
                value={entry.date}
                onChange={(v) => updateCertificate(entry.id, "date", v)}
              />
              <FormField
                label="Expiry Date"
                type="month"
                value={entry.expiryDate}
                onChange={(v) => updateCertificate(entry.id, "expiryDate", v)}
              />
              <FormField
                label="Credential ID"
                placeholder="Optional credential ID"
                value={entry.credentialId}
                onChange={(v) => updateCertificate(entry.id, "credentialId", v)}
              />
              <FormField
                label="URL"
                type="url"
                placeholder="https://..."
                value={entry.url}
                error={errors[`cert-${entry.id}-url`]}
                onChange={(v) => {
                  updateCertificate(entry.id, "url", v)
                  if (
                    errors[`cert-${entry.id}-url`] &&
                    (!v || /^https?:\/\/.+/.test(v))
                  )
                    updateError(`cert-${entry.id}-url`, undefined)
                }}
                onBlur={() => {
                  updateError(
                    `cert-${entry.id}-url`,
                    entry.url && !/^https?:\/\/.+/.test(entry.url)
                      ? "Must start with http:// or https://"
                      : undefined
                  )
                }}
              />
            </div>
          </>
        )}
      />
    )
  }

  function renderLanguagesSection() {
    return (
      <SectionList<LanguageEntry>
        title={data.languagesTitle}
        onTitleChange={(v) => onChange({ ...data, languagesTitle: v })}
        placeholder="Languages"
        items={data.languages}
        onReorder={(items) => onChange({ ...data, languages: items })}
        onAdd={addLanguage}
        onRemove={removeLanguage}
        addLabel="Add Language"
        titleExtra={
          data.languages.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {data.languages.length} {data.languages.length === 1 ? "language" : "languages"}
            </span>
          )
        }
        summary={(entry, index) => {
          if (entry.language && entry.proficiency)
            return `${entry.language} – ${entry.proficiency}`
          return entry.language || `Language #${index + 1}`
        }}
        renderContent={(entry) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Language"
              placeholder="e.g. English"
              value={entry.language}
              onChange={(v) => updateLanguage(entry.id, "language", v)}
            />
            <FormField
              label="Proficiency"
              placeholder="e.g. Native, Fluent, Intermediate"
              value={entry.proficiency}
              onChange={(v) => updateLanguage(entry.id, "proficiency", v)}
            />
          </div>
        )}
      />
    )
  }

  function renderProjectsSection() {
    return (
      <SectionList<ProjectEntry>
        title={data.projectsTitle}
        onTitleChange={(v) => onChange({ ...data, projectsTitle: v })}
        placeholder="Projects"
        items={data.projects}
        onReorder={(items) => onChange({ ...data, projects: items })}
        onAdd={addProject}
        onRemove={removeProject}
        addLabel="Add Project"
        titleExtra={
          data.projects.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {data.projects.length} {data.projects.length === 1 ? "project" : "projects"}
            </span>
          )
        }
        summary={(entry, index) => entry.name || `Project ${index + 1}`}
        renderContent={(entry) => (
          <div className="grid gap-3">
            <FormField
              label="Name"
              placeholder="e.g. My Project"
              value={entry.name}
              onChange={(v) => updateProject(entry.id, "name", v)}
            />
            <FormField
              label="URL"
              type="url"
              placeholder="https://..."
              value={entry.url}
              onChange={(v) => updateProject(entry.id, "url", v)}
            />
            <FormField
              label="Description"
              placeholder="Brief description of the project"
              value={entry.description}
              onChange={(v) => updateProject(entry.id, "description", v)}
              multiline
              rows={2}
            />
          </div>
        )}
      />
    )
  }

  function renderVolunteerSection() {
    return (
      <SectionList<VolunteerEntry>
        title={data.volunteerTitle}
        onTitleChange={(v) => onChange({ ...data, volunteerTitle: v })}
        placeholder="Volunteer & Community"
        items={data.volunteer}
        onReorder={(items) => onChange({ ...data, volunteer: items })}
        onAdd={addVolunteer}
        onRemove={removeVolunteer}
        addLabel="Add Volunteer"
        titleExtra={
          data.volunteer.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {data.volunteer.length} {data.volunteer.length === 1 ? "activity" : "activities"}
            </span>
          )
        }
        summary={(entry, index) => {
          if (entry.role && entry.organization)
            return `${entry.role} at ${entry.organization}`
          return entry.role || entry.organization || `Volunteer #${index + 1}`
        }}
        triggerExtra={(entry) =>
          entry.startDate ? (
            <span className="shrink-0 text-[0.625rem] text-muted-foreground">
              {dateDiffLabel(
                new Date(`${entry.startDate}-01`),
                entry.current || !entry.endDate
                  ? new Date()
                  : new Date(`${entry.endDate}-01`),
              )}
            </span>
          ) : null
        }
        renderContent={(entry) => (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Organization"
                placeholder="Organization name"
                value={entry.organization}
                onChange={(v) => updateVolunteer(entry.id, "organization", v)}
              />
              <FormField
                label="Role"
                placeholder="Your role"
                value={entry.role}
                onChange={(v) => updateVolunteer(entry.id, "role", v)}
              />
              <FormField
                label="Start Date"
                type="month"
                value={entry.startDate}
                onChange={(v) => updateVolunteer(entry.id, "startDate", v)}
              />
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="month"
                  value={entry.current ? "" : entry.endDate}
                  disabled={entry.current}
                  onChange={(e) => updateVolunteer(entry.id, "endDate", e.target.value)}
                />
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={entry.current}
                    className="accent-primary"
                    onChange={(e) => {
                      onChange({
                        ...data,
                        volunteer: data.volunteer.map((vol) =>
                          vol.id === entry.id
                            ? { ...vol, current: e.target.checked, endDate: e.target.checked ? "" : vol.endDate }
                            : vol
                        ),
                      })
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Present</span>
                </label>
              </div>
            </div>
            <FormField
              label="Description"
              placeholder="Describe your contributions (one bullet per line)"
              value={entry.description}
              onChange={(v) => updateVolunteer(entry.id, "description", v)}
              multiline
            />
          </div>
        )}
      />
    )
  }
}

function SortableSection({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={{ ...style, contentVisibility: "auto", containIntrinsicSize: "auto 200px" }} className="relative">
      <div className="absolute -left-6 top-1 cursor-grab text-muted-foreground/50 hover:text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </div>
      <Separator className="mb-6" />
      {children}
    </div>
  )
}
