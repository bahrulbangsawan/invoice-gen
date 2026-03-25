import { type ReactNode, useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type DraggableAttributes } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { GripVertical, Plus, X } from "lucide-react"

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

import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"

function SortableItem({ id, children }: { id: string; children: (dragHandleProps: { attributes: DraggableAttributes; listeners: SyntheticListenerMap | undefined }) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  )
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
  const [openItems, setOpenItems] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !onReorder) return
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(items, oldIndex, newIndex))
  }

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
        {items.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <Accordion
                type="multiple"
                value={openItems}
                onValueChange={setOpenItems}
              >
                {items.map((entry, index) => (
                  <SortableItem key={entry.id} id={entry.id}>
                    {({ attributes, listeners }) => (
                      <AccordionItem value={entry.id}>
                        <AccordionTrigger className="min-w-0 items-center gap-2">
                          <span
                            className="inline-flex shrink-0 cursor-grab items-center text-muted-foreground/50 hover:text-muted-foreground"
                            {...attributes}
                            {...listeners}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="size-3.5" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {summary(entry, index)}
                          </span>
                          {triggerExtra?.(entry, index)}
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
                    )}
                  </SortableItem>
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        )}
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus /> {addLabel}
        </Button>
      </div>
    </section>
  )
}
