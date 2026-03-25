import { useState } from "react"
import { format, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const DATE_FORMATS = ["dd MMM yyyy", "yyyy-MM-dd", "dd-MM-yyyy", "MM/dd/yyyy"]

function parseDate(str: string): Date | undefined {
  if (!str) return undefined
  for (const fmt of DATE_FORMATS) {
    try {
      const d = parse(str, fmt, new Date())
      if (!isNaN(d.getTime())) return d
    } catch { /* continue */ }
  }
  return undefined
}

interface DatePickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function DatePicker({
  label,
  value,
  onChange,
  disabled,
  placeholder = "Select date...",
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(() => parseDate(value))

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) setDate(parseDate(value))
    setOpen(isOpen)
  }

  function handleSelect(selected: Date | undefined) {
    if (!selected) return
    setDate(selected)
    onChange(format(selected, "dd MMM yyyy"))
    setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-8 w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{value || placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            defaultMonth={date}
            showOutsideDays
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
