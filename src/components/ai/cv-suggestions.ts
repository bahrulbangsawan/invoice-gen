import type { CVData } from "@/components/cv-form"
import { type CVSectionKey, CV_SECTIONS } from "./cv-system-prompt"

export interface CVSuggestion {
  title: string
  description: string
  prompt: string
}

export function getCVSuggestions(data: CVData): CVSuggestion[] {
  const suggestions: CVSuggestion[] = []

  if (data.summary) {
    suggestions.push({
      title: "Improve my @summary",
      description: "Make it more impactful and professional",
      prompt:
        "Improve my @summary to be more impactful and professional. Keep it concise but compelling.",
    })
  } else {
    suggestions.push({
      title: "Write a @summary",
      description: "Generate a professional summary from my CV",
      prompt:
        "Write a professional @summary based on my experience and skills. Keep it 3-4 sentences.",
    })
  }

  if (data.experience.length > 0) {
    suggestions.push({
      title: "Strengthen @experience bullets",
      description: "Add metrics and action verbs",
      prompt:
        "Review my @experience bullet points and rewrite them using strong action verbs and quantifiable achievements.",
    })
  }

  if (data.skills.length > 0) {
    suggestions.push({
      title: "Optimize @skills section",
      description: "Suggest missing skills for my role",
      prompt: `Based on my role as "${data.personalInfo.jobTitle}", review my @skills and suggest any important skills I might be missing.`,
    })
  }

  if (data.experience.length > 0 || data.summary) {
    suggestions.push({
      title: "Tailor for a job posting",
      description: "Paste a job description to optimize your CV",
      prompt:
        "I want to tailor my CV for a specific role. Here's the job description: [paste job description here]",
    })
  }

  suggestions.push({
    title: "Review my entire CV",
    description: "Get a full review of all sections",
    prompt:
      "Review @all sections and suggest improvements for each one. Focus on ATS optimization, strong action verbs, and quantified achievements.",
  })

  return suggestions
}

const MENTION_REGEX = /@(all|personal-info|summary|experience|education|skills|awards|certificates|languages|projects|volunteer)\b/g

export function extractMentions(text: string): CVSectionKey[] {
  const mentions: CVSectionKey[] = []
  for (const match of text.matchAll(MENTION_REGEX)) {
    if (match[1] === "all") {
      return CV_SECTIONS.map((s) => s.key)
    }
    const key = match[1] as CVSectionKey
    if (CV_SECTIONS.some((s) => s.key === key) && !mentions.includes(key)) {
      mentions.push(key)
    }
  }
  return mentions
}
