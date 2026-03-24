import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  error?: string
  onBlur?: () => void
  disabled?: boolean
  multiline?: boolean
  rows?: number
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  onBlur,
  disabled,
  multiline,
  rows = 2,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea
          placeholder={placeholder}
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
        />
      ) : (
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface FormFieldCustomProps {
  label: string
  error?: string
  children: ReactNode
}

export function FormFieldCustom({ label, error, children }: FormFieldCustomProps) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
