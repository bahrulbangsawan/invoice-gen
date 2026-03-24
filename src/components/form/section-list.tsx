import { type ReactNode, useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
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
  titleExtra?: ReactNode
  triggerExtra?: (entry: T, index: number) => ReactNode
}

function SortableItem({ id, dragHandle, children }: { id: string; dragHandle: ReactNode; children: ReactNode }) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  )
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <span
      className="inline-flex shrink-0 cursor-grab items-center text-muted-foreground/50 hover:text-muted-foreground"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-3.5" />
    </span>
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

  function handleAdd() {
    onAdd()
  }

  return (
    <section>
      <div className="flex items-center gap-3">
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
                    <AccordionItem value={entry.id}>
                      <AccordionTrigger className="min-w-0 items-center gap-2">
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
                  </SortableItem>
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        )}
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus /> {addLabel}
        </Button>
      </div>
    </section>
  )
}
