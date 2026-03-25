import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { FormField } from "@/components/form/form-field"
import { AddressFields } from "@/components/form/address-fields"
import { SectionList } from "@/components/form/section-list"
import {
  Building2,
  ChevronDown,
  FileText,
  ListOrdered,
  Palette,
  Plus,
  SlidersHorizontal,
  StickyNote,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────

export interface SenderInfo {
  companyName: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  email: string
  logoUrl: string
}

export interface RecipientInfo {
  name: string
  address: string
  city: string
  stateRegion: string
  postalCode: string
  country: string
  email: string
}

export interface InvoiceSubItem {
  id: string
  label: string
  qty: number
  unitPrice: number
  amount: number
}

export interface InvoiceLineItem {
  id: string
  description: string
  period: string
  qty: number
  unitPrice: number
  amount: number
  subItems: InvoiceSubItem[]
}

export interface InvoiceAdjustment {
  id: string
  label: string
  type: "add" | "deduct"
  mode: "percentage" | "fixed"
  value: number
}

export interface InvoiceData {
  invoiceNumber: string
  dateOfIssue: string
  dateDue: string
  currency: string
  accentColor: string
  from: SenderInfo
  billTo: RecipientInfo
  items: InvoiceLineItem[]
  adjustments: InvoiceAdjustment[]
  notes: string
  taxRate: number
}

// ── Currency ───────────────────────────────────────────────

export const CURRENCY_OPTIONS = [
  { value: "USD", flag: "🇺🇸", label: "USD — US Dollar" },
  { value: "EUR", flag: "🇪🇺", label: "EUR — Euro" },
  { value: "GBP", flag: "🇬🇧", label: "GBP — British Pound" },
  { value: "IDR", flag: "🇮🇩", label: "IDR — Indonesian Rupiah" },
  { value: "SGD", flag: "🇸🇬", label: "SGD — Singapore Dollar" },
  { value: "AUD", flag: "🇦🇺", label: "AUD — Australian Dollar" },
  { value: "JPY", flag: "🇯🇵", label: "JPY — Japanese Yen" },
  { value: "MYR", flag: "🇲🇾", label: "MYR — Malaysian Ringgit" },
] as const

const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  IDR: "id-ID",
  SGD: "en-SG",
  AUD: "en-AU",
  JPY: "ja-JP",
  MYR: "ms-MY",
}

export function formatCurrency(amount: number, currency: string): string {
  const locale = CURRENCY_LOCALE[currency] ?? "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount)
}

export function generateInvoiceNumber(): string {
  if (typeof window === "undefined") return "IN-00000001"
  const counter = Number(localStorage.getItem("invoice-counter") ?? "0") + 1
  localStorage.setItem("invoice-counter", String(counter))
  return `IN-${String(counter).padStart(8, "0")}`
}

// ── Calculations ───────────────────────────────────────────

export function calcSubtotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

export function calcTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100)
}

export function calcAdjustmentAmount(
  adj: InvoiceAdjustment,
  subtotal: number,
): number {
  const raw = adj.mode === "percentage" ? subtotal * (adj.value / 100) : adj.value
  return adj.type === "deduct" ? -raw : raw
}

export function calcAdjustmentsTotal(
  adjustments: InvoiceAdjustment[],
  subtotal: number,
): number {
  return adjustments.reduce(
    (sum, adj) => sum + calcAdjustmentAmount(adj, subtotal),
    0,
  )
}

export function calcTotal(
  items: InvoiceLineItem[],
  taxRate: number,
  adjustments: InvoiceAdjustment[] = [],
): number {
  const subtotal = calcSubtotal(items)
  const tax = calcTax(subtotal, taxRate)
  const adj = calcAdjustmentsTotal(adjustments, subtotal)
  return subtotal + tax + adj
}

// ── Form Component ─────────────────────────────────────────

interface InvoiceFormProps {
  data: InvoiceData
  onChange: (data: InvoiceData) => void
}

export function InvoiceForm({ data, onChange }: InvoiceFormProps) {
  function updateField<K extends keyof InvoiceData>(
    field: K,
    value: InvoiceData[K]
  ) {
    onChange({ ...data, [field]: value })
  }

  function updateFrom(field: keyof SenderInfo, value: string) {
    onChange({ ...data, from: { ...data.from, [field]: value } })
  }

  function updateBillTo(field: keyof RecipientInfo, value: string) {
    onChange({ ...data, billTo: { ...data.billTo, [field]: value } })
  }

  // ── Line items ──

  function addItem() {
    const id = crypto.randomUUID()
    onChange({
      ...data,
      items: [
        ...data.items,
        {
          id,
          description: "",
          period: "",
          qty: 0,
          unitPrice: 0,
          amount: 0,
          subItems: [],
        },
      ],
    })
  }

  function removeItem(id: string) {
    onChange({ ...data, items: data.items.filter((i) => i.id !== id) })
  }

  function updateItem(
    id: string,
    field: keyof Omit<InvoiceLineItem, "id" | "subItems">,
    value: string | number
  ) {
    onChange({
      ...data,
      items: data.items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "qty" || field === "unitPrice") {
          updated.amount = Number(updated.qty) * Number(updated.unitPrice)
        }
        return updated
      }),
    })
  }

  function reorderItems(items: InvoiceLineItem[]) {
    onChange({ ...data, items })
  }

  // ── Sub-items ──

  function addSubItem(itemId: string) {
    onChange({
      ...data,
      items: data.items.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          subItems: [
            ...item.subItems,
            {
              id: crypto.randomUUID(),
              label: "",
              qty: 0,
              unitPrice: 0,
              amount: 0,
            },
          ],
        }
      }),
    })
  }

  function removeSubItem(itemId: string, subId: string) {
    onChange({
      ...data,
      items: data.items.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          subItems: item.subItems.filter((s) => s.id !== subId),
        }
      }),
    })
  }

  function updateSubItem(
    itemId: string,
    subId: string,
    field: keyof Omit<InvoiceSubItem, "id">,
    value: string | number
  ) {
    onChange({
      ...data,
      items: data.items.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          subItems: item.subItems.map((sub) => {
            if (sub.id !== subId) return sub
            const updated = { ...sub, [field]: value }
            if (field === "qty" || field === "unitPrice") {
              updated.amount = Number(updated.qty) * Number(updated.unitPrice)
            }
            return updated
          }),
        }
      }),
    })
  }

  // ── Adjustments ──

  function addAdjustment() {
    onChange({
      ...data,
      adjustments: [
        ...data.adjustments,
        {
          id: crypto.randomUUID(),
          label: "",
          type: "deduct",
          mode: "fixed",
          value: 0,
        },
      ],
    })
  }

  function removeAdjustment(id: string) {
    onChange({
      ...data,
      adjustments: data.adjustments.filter((a) => a.id !== id),
    })
  }

  function updateAdjustment(
    id: string,
    field: keyof Omit<InvoiceAdjustment, "id">,
    value: string | number,
  ) {
    onChange({
      ...data,
      adjustments: data.adjustments.map((a) =>
        a.id === id ? { ...a, [field]: value } : a,
      ),
    })
  }

  // ── Logo upload ──

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateFrom("logoUrl", ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <div className="space-y-6">
      {/* ── Invoice Details ── */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <FileText className="size-4 text-muted-foreground" /> Invoice Details
        </h2>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr_1fr_auto] gap-3">
          <FormField
            label="Invoice Number"
            value={data.invoiceNumber}
            onChange={(v) => updateField("invoiceNumber", v)}
            placeholder="IN-00000001"
          />
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select
              value={data.currency}
              onValueChange={(v) => updateField("currency", v)}
            >
              <SelectTrigger className="w-auto">
                <SelectValue>
                  {(() => {
                    const c = CURRENCY_OPTIONS.find(
                      (o) => o.value === data.currency
                    )
                    return c ? `${c.flag} ${c.value}` : data.currency
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.flag} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FormField
            label="Date of Issue"
            type="date"
            value={data.dateOfIssue}
            onChange={(v) => updateField("dateOfIssue", v)}
          />
          <FormField
            label="Date Due"
            type="date"
            value={data.dateDue}
            onChange={(v) => updateField("dateDue", v)}
          />
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Palette className="size-3" /> Color
            </Label>
            <div className="flex items-center gap-1">
              <label
                className="flex size-7 shrink-0 cursor-pointer rounded border border-input shadow-sm"
                style={{ backgroundColor: data.accentColor }}
              >
                <input
                  type="color"
                  value={data.accentColor}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="sr-only"
                />
              </label>
              {["#f48120", "#2563eb", "#16a34a", "#dc2626", "#7c3aed"].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField("accentColor", c)}
                    className="size-7 shrink-0 rounded border border-input transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                    aria-label={`Set accent color to ${c}`}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── From (Sender) ── */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium [&[data-state=open]>.chevron]:rotate-180">
          <span className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" /> From (Your
            Company)
          </span>
          <ChevronDown className="chevron size-4 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Company Name"
                value={data.from.companyName}
                onChange={(v) => updateFrom("companyName", v)}
                placeholder="Acme Corp"
              />
              <FormField
                label="Email"
                type="email"
                value={data.from.email}
                onChange={(v) => updateFrom("email", v)}
                placeholder="billing@example.com"
              />
            </div>
            <FormField
              label="Address"
              value={data.from.address}
              onChange={(v) => updateFrom("address", v)}
              placeholder="123 Main Street"
              multiline
              rows={2}
            />
            <AddressFields
              values={{
                city: data.from.city,
                state: data.from.state,
                postalCode: data.from.postalCode,
                country: data.from.country,
              }}
              onChange={(field, value) => updateFrom(field, value)}
              stateLabel="State"
              cityPlaceholder="San Francisco"
              statePlaceholder="California"
            />
            <div className="space-y-1.5">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-2">
                {data.from.logoUrl && (
                  <img
                    src={data.from.logoUrl}
                    alt=""
                    className="h-8 rounded border object-contain"
                  />
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-input bg-background px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground">
                  <Upload className="size-3" />
                  {data.from.logoUrl ? "Change" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
                {data.from.logoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFrom("logoUrl", "")}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* ── Bill To ── */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium [&[data-state=open]>.chevron]:rotate-180">
          <span className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" /> Bill To
          </span>
          <ChevronDown className="chevron size-4 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Name"
                value={data.billTo.name}
                onChange={(v) => updateBillTo("name", v)}
                placeholder="Client Name"
              />
              <FormField
                label="Email"
                type="email"
                value={data.billTo.email}
                onChange={(v) => updateBillTo("email", v)}
                placeholder="client@example.com"
              />
            </div>
            <FormField
              label="Address"
              value={data.billTo.address}
              onChange={(v) => updateBillTo("address", v)}
              placeholder="456 Client Avenue"
              multiline
              rows={2}
            />
            <AddressFields
              values={{
                city: data.billTo.city,
                state: data.billTo.stateRegion,
                postalCode: data.billTo.postalCode,
                country: data.billTo.country,
              }}
              onChange={(field, value) =>
                updateBillTo(
                  field === "state" ? "stateRegion" : field,
                  value
                )
              }
              stateLabel="State/Region"
              cityPlaceholder="Jakarta"
              statePlaceholder="DKI Jakarta"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* ── Line Items ── */}
      <SectionList
        title="Line Items"
        onTitleChange={() => {}}
        placeholder="Line Items"
        titleIcon={<ListOrdered className="size-4 text-muted-foreground" />}
        items={data.items}
        onAdd={addItem}
        onRemove={removeItem}
        onReorder={reorderItems}
        addLabel="Add Item"
        summary={(item, i) => item.description || `Item ${i + 1}`}
        renderContent={(item) => (
          <div className="space-y-3">
            <FormField
              label="Description"
              value={item.description}
              onChange={(v) => updateItem(item.id, "description", v)}
              placeholder="Service or product description"
            />
            <FormField
              label="Period"
              value={item.period}
              onChange={(v) => updateItem(item.id, "period", v)}
              placeholder="Feb 23–Mar 22, 2026"
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                label="Qty"
                type="number"
                value={String(item.qty)}
                onChange={(v) => updateItem(item.id, "qty", Number(v))}
                min={0}
              />
              <FormField
                label="Unit Price"
                type="number"
                value={String(item.unitPrice)}
                onChange={(v) => updateItem(item.id, "unitPrice", Number(v))}
                min={0}
                step="0.01"
              />
              <FormField
                label="Amount"
                value={formatCurrency(item.qty * item.unitPrice, data.currency)}
                onChange={() => {}}
                disabled
              />
            </div>

            {/* Sub-items */}
            {item.subItems.length > 0 && (
              <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Sub-items
                </p>
                {item.subItems.map((sub) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-2"
                  >
                    <FormField
                      label="Label"
                      value={sub.label}
                      onChange={(v) =>
                        updateSubItem(item.id, sub.id, "label", v)
                      }
                      placeholder="First 10"
                    />
                    <FormField
                      label="Qty"
                      type="number"
                      value={String(sub.qty)}
                      onChange={(v) =>
                        updateSubItem(item.id, sub.id, "qty", Number(v))
                      }
                      min={0}
                    />
                    <FormField
                      label="Unit Price"
                      type="number"
                      value={String(sub.unitPrice)}
                      onChange={(v) =>
                        updateSubItem(item.id, sub.id, "unitPrice", Number(v))
                      }
                      min={0}
                      step="0.01"
                    />
                    <FormField
                      label="Amount"
                      value={formatCurrency(
                        sub.qty * sub.unitPrice,
                        data.currency
                      )}
                      onChange={() => {}}
                      disabled
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubItem(item.id, sub.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addSubItem(item.id)}
            >
              <Plus className="size-3.5" /> Add Sub-Item
            </Button>
          </div>
        )}
      />

      <Separator />

      {/* ── Adjustments ── */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4 text-muted-foreground" /> Adjustments
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Service charges, discounts, down payments, etc.
        </p>
        <div className="mt-3 space-y-3">
          {data.adjustments.map((adj) => (
            <div
              key={adj.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-2"
            >
              <FormField
                label="Label"
                value={adj.label}
                onChange={(v) => updateAdjustment(adj.id, "label", v)}
                placeholder="e.g. Service Charge"
              />
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={adj.type}
                  onValueChange={(v) =>
                    updateAdjustment(adj.id, "type", v)
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">+ Add</SelectItem>
                    <SelectItem value="deduct">- Deduct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <Select
                  value={adj.mode}
                  onValueChange={(v) =>
                    updateAdjustment(adj.id, "mode", v)
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormField
                label={adj.mode === "percentage" ? "%" : "Amount"}
                type="number"
                value={String(adj.value)}
                onChange={(v) => updateAdjustment(adj.id, "value", Number(v))}
                min={0}
                step={adj.mode === "percentage" ? "0.1" : "0.01"}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAdjustment(adj.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addAdjustment}>
            <Plus className="size-3.5" /> Add Adjustment
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Notes & Settings ── */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="size-4 text-muted-foreground" /> Notes &
          Settings
        </h2>
        <div className="mt-3 space-y-3">
          <FormField
            label="Notes"
            value={data.notes}
            onChange={(v) => updateField("notes", v)}
            placeholder="Payment terms, bank details, or other notes..."
            multiline
            rows={3}
          />
        </div>
      </section>
    </div>
  )
}
