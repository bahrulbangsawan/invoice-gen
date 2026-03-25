import { type ReactNode, useId } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MonthPicker } from "@/components/form/month-picker"

function formatWithSeparator(val: string): string {
  const num = val.replace(/[^\d]/g, "")
  if (!num) return ""
  return Number(num).toLocaleString("id-ID")
}

function parseFromSeparator(val: string): string {
  const num = val.replace(/[^\d]/g, "")
  return num || "0"
}

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
  numeric?: boolean
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
  numeric,
}: FormFieldProps) {
  const id = useId()
  const inputId = `field-${id}`
  const errorId = error ? `${inputId}-error` : undefined
  const ariaDescribedBy = errorId || undefined

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      {multiline ? (
        <Textarea
          id={inputId}
          placeholder={placeholder}
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
        />
      ) : type === "month" ? (
        <MonthPicker
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      ) : numeric ? (
        <Input
          id={inputId}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={formatWithSeparator(value)}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          onChange={(e) => onChange(parseFromSeparator(e.target.value))}
          onBlur={onBlur}
          disabled={disabled}
        />
      ) : (
        <Input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
        />
      )}
      {error && <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>}
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
