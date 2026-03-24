import type { CVData } from "@/components/cv-form"
import type { CVSectionKey } from "./cv-system-prompt"

export interface ApplySuggestionArgs {
  section: CVSectionKey
  content: string
  experienceIndex?: number
}

export function applySuggestionToCV(
  data: CVData,
  args: ApplySuggestionArgs,
): CVData {
  const { section, content, experienceIndex } = args

  switch (section) {
    case "summary":
      return { ...data, summary: content }

    case "experience":
      if (experienceIndex !== undefined && data.experience[experienceIndex]) {
        const experience = [...data.experience]
        experience[experienceIndex] = {
          ...experience[experienceIndex],
          description: content,
        }
        return { ...data, experience }
      }
      return data

    case "personal-info":
      // For personal info, expect JSON-like structured content
      try {
        const parsed = JSON.parse(content)
        return {
          ...data,
          personalInfo: { ...data.personalInfo, ...parsed },
        }
      } catch {
        return data
      }

    case "education":
    case "skills":
    case "awards":
    case "certificates":
    case "languages":
      // These complex sections are better edited manually
      // The AI provides the text, user copies and pastes
      return data

    default:
      return data
  }
}
