import { createContext, useContext } from "react"
import type { InvoiceData } from "@/components/invoice-form"

export const InvoiceDataContext = createContext<InvoiceData | null>(null)

export function useInvoiceData() {
  return useContext(InvoiceDataContext)
}
