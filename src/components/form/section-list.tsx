import { type ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Plus, X } from "lucide-react"

interface SectionListProps<T extends { id: string }> {
  title: string
  onTitleChange: (value: string) => void
  placeholder: string
  items: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  addLabel: string
  summary: (entry: T, index: number) => string
  hasError?: (entry: T) => boolean
  renderContent: (entry: T, index: number) => ReactNode
}

export function SectionList<T extends { id: string }>({
  title,
  onTitleChange,
  placeholder,
  items,
  onAdd,
  onRemove,
  addLabel,
  summary,
  hasError,
  renderContent,
}: SectionListProps<T>) {
  const [openItems, setOpenItems] = useState<string[]>([])

  function handleAdd() {
    onAdd()
    // The new item's id will be the last one after onAdd updates
    // We handle this by re-rendering — the accordion opens via parent
  }

  return (
    <section>
      <input
        className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
        value={title}
        placeholder={placeholder}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <div className="mt-3 space-y-3">
        {items.length > 0 && (
          <Accordion
            type="multiple"
            value={openItems}
            onValueChange={setOpenItems}
          >
            {items.map((entry, index) => (
              <AccordionItem key={entry.id} value={entry.id}>
                <AccordionTrigger className="items-center gap-2">
                  <span className="flex-1 truncate">
                    {summary(entry, index)}
                  </span>
                  {hasError?.(entry) && (
                    <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                  )}
                  <span
                    role="button"
                    tabIndex={-1}
                    className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(entry.id)
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  {renderContent(entry, index)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus /> {addLabel}
        </Button>
      </div>
    </section>
  )
}
