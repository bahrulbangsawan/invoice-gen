import { createContext, useContext } from "react"
import type { CVData } from "@/components/cv-form"

export const CVDataContext = createContext<CVData | null>(null)

export function useCVData() {
  return useContext(CVDataContext)
}
