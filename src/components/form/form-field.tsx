import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MonthPicker } from "@/components/form/month-picker"

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
  step?: string | number
  min?: string | number
  max?: string | number
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
  step,
  min,
  max,
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
      ) : type === "month" ? (
        <MonthPicker
          value={value}
          onChange={onChange}
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
          step={step}
          min={min}
          max={max}
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
