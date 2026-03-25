import { type ReactNode, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { GripVertical, Plus, X } from "lucide-react"
import { useTranslation } from "@/i18n"
import type { DragHandleProps } from "./section-list-sortable"

interface SectionListProps<T extends { id: string }> {
  title: string
  onTitleChange: (value: string) => void
  placeholder: string
  items: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  onReorder?: (items: T[]) => void
  addLabel: string
  summary: (entry: T, index: number) => string
  hasError?: (entry: T) => boolean
  renderContent: (entry: T, index: number) => ReactNode
  titleIcon?: ReactNode
  titleExtra?: ReactNode
  triggerExtra?: (entry: T, index: number) => ReactNode
}

// Module-level cache so the dynamic import only happens once
type SortableModule = typeof import("./section-list-sortable")
let sortableModuleCache: SortableModule | null = null
let sortableModulePromise: Promise<SortableModule> | null = null

function useSortableModule() {
  const [mod, setMod] = useState(sortableModuleCache)
  useEffect(() => {
    if (sortableModuleCache) {
      setMod(sortableModuleCache)
      return
    }
    if (!sortableModulePromise) {
      sortableModulePromise = import("./section-list-sortable")
    }
    sortableModulePromise.then((m) => {
      sortableModuleCache = m
      setMod(m)
    })
  }, [])
  return mod
}

export function SectionList<T extends { id: string }>({
  title,
  onTitleChange,
  placeholder,
  items,
  onAdd,
  onRemove,
  onReorder,
  addLabel,
  summary,
  hasError,
  renderContent,
  titleIcon,
  titleExtra,
  triggerExtra,
}: SectionListProps<T>) {
  const { t } = useTranslation()
  const [openItems, setOpenItems] = useState<string[]>([])
  const sortable = useSortableModule()

  function renderAccordionItem(
    entry: T,
    index: number,
    dragHandle?: DragHandleProps,
  ) {
    return (
      <AccordionItem key={entry.id} value={entry.id}>
        <AccordionTrigger className="min-w-0 items-center gap-2">
          {dragHandle && (
            <span
              className="inline-flex shrink-0 cursor-grab items-center text-muted-foreground/50 hover:text-muted-foreground"
              aria-label={t("a11y.dragToReorder")}
              {...dragHandle.attributes}
              {...dragHandle.listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="size-3.5" aria-hidden="true" />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">
            {summary(entry, index)}
          </span>
          {triggerExtra?.(entry, index)}
          {hasError?.(entry) && (
            <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("a11y.removeItem")}
            className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(entry.id)
            }}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </AccordionTrigger>
        <AccordionContent>{renderContent(entry, index)}</AccordionContent>
      </AccordionItem>
    )
  }

  const accordion = (
    <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
      {sortable
        ? items.map((entry, index) => (
            <sortable.SortableItem key={entry.id} id={entry.id}>
              {(dragHandle) => renderAccordionItem(entry, index, dragHandle)}
            </sortable.SortableItem>
          ))
        : items.map((entry, index) => renderAccordionItem(entry, index))}
    </Accordion>
  )

  return (
    <section>
      <div className="flex items-center gap-2">
        {titleIcon}
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          value={title}
          placeholder={placeholder}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        {titleExtra}
      </div>
      <div className="mt-3 space-y-3">
        {items.length > 0 &&
          (sortable && onReorder ? (
            <sortable.SortableList
              ids={items.map((i) => i.id)}
              onReorder={(oldIndex, newIndex) =>
                onReorder(sortable.arrayMove(items, oldIndex, newIndex))
              }
            >
              {accordion}
            </sortable.SortableList>
          ) : (
            accordion
          ))}
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus /> {addLabel}
        </Button>
      </div>
    </section>
  )
}
