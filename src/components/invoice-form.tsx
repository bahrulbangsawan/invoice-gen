import { useTranslation } from "@/i18n"
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
import { DatePicker } from "@/components/form/date-picker"
import { FormField } from "@/components/form/form-field"
import { AddressFields } from "@/components/form/address-fields"
import { PeriodRangePicker } from "@/components/form/period-range-picker"
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
  kecamatan: string
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
  kecamatan: string
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

export interface InvoiceCustomField {
  id: string
  label: string
  value: string
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
  customFields: InvoiceCustomField[]
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
  const { t } = useTranslation()
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
          const ownAmount = Number(updated.qty) * Number(updated.unitPrice)
          const subTotal = updated.subItems.reduce((s, si) => s + si.amount, 0)
          updated.amount = ownAmount + subTotal
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
        const newSubItems = item.subItems.filter((s) => s.id !== subId)
        const ownAmount = Number(item.qty) * Number(item.unitPrice)
        const subTotal = newSubItems.reduce((s, si) => s + si.amount, 0)
        return { ...item, subItems: newSubItems, amount: ownAmount + subTotal }
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
        const newSubItems = item.subItems.map((sub) => {
          if (sub.id !== subId) return sub
          const updated = { ...sub, [field]: value }
          if (field === "qty" || field === "unitPrice") {
            updated.amount = Number(updated.qty) * Number(updated.unitPrice)
          }
          return updated
        })
        const ownAmount = Number(item.qty) * Number(item.unitPrice)
        const subTotal = newSubItems.reduce((s, si) => s + si.amount, 0)
        return { ...item, subItems: newSubItems, amount: ownAmount + subTotal }
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

  // ── Custom fields ──

  function addCustomField() {
    onChange({
      ...data,
      customFields: [
        ...data.customFields,
        { id: crypto.randomUUID(), label: "", value: "" },
      ],
    })
  }

  function removeCustomField(id: string) {
    onChange({
      ...data,
      customFields: data.customFields.filter((f) => f.id !== id),
    })
  }

  function updateCustomField(
    id: string,
    field: "label" | "value",
    value: string,
  ) {
    onChange({
      ...data,
      customFields: data.customFields.map((f) =>
        f.id === id ? { ...f, [field]: value } : f,
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
          <FileText className="size-4 text-muted-foreground" /> {t("form.invoiceDetails")}
        </h2>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr_1fr_auto] gap-3">
          <FormField
            label={t("form.invoiceNumber")}
            value={data.invoiceNumber}
            onChange={(v) => updateField("invoiceNumber", v)}
            placeholder={t("placeholders.invoiceNumber")}
          />
          <div className="space-y-1.5">
            <Label>{t("form.currency")}</Label>
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
          <DatePicker
            label={t("form.dateOfIssue")}
            value={data.dateOfIssue}
            onChange={(v) => updateField("dateOfIssue", v)}
          />
          <DatePicker
            label={t("form.dateDue")}
            value={data.dateDue}
            onChange={(v) => updateField("dateDue", v)}
          />
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Palette className="size-3" /> {t("form.color")}
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
                    aria-label={t("a11y.setAccentColor", { color: c })}
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
            <Building2 className="size-4 text-muted-foreground" /> {t("form.fromSection")}
          </span>
          <ChevronDown className="chevron size-4 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label={t("form.companyName")}
                value={data.from.companyName}
                onChange={(v) => updateFrom("companyName", v)}
                placeholder={t("placeholders.companyName")}
              />
              <FormField
                label={t("form.email")}
                type="email"
                value={data.from.email}
                onChange={(v) => updateFrom("email", v)}
                placeholder={t("placeholders.emailSender")}
              />
            </div>
            <FormField
              label={t("form.address")}
              value={data.from.address}
              onChange={(v) => updateFrom("address", v)}
              placeholder={t("placeholders.addressSender")}
              multiline
              rows={2}
            />
            <AddressFields
              values={{
                city: data.from.city,
                kecamatan: data.from.kecamatan,
                state: data.from.state,
                postalCode: data.from.postalCode,
                country: data.from.country,
              }}
              onChange={(updates) =>
                onChange({ ...data, from: { ...data.from, ...updates } })
              }
              stateLabel={t("form.state")}
              cityPlaceholder={t("placeholders.citySender")}
              statePlaceholder={t("placeholders.stateSender")}
            />
            <div className="space-y-1.5">
              <Label>{t("form.companyLogo")}</Label>
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
                  {data.from.logoUrl ? t("form.change") : t("form.upload")}
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
            <UserRound className="size-4 text-muted-foreground" /> {t("form.billToSection")}
          </span>
          <ChevronDown className="chevron size-4 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label={t("form.name")}
                value={data.billTo.name}
                onChange={(v) => updateBillTo("name", v)}
                placeholder={t("placeholders.clientName")}
              />
              <FormField
                label={t("form.email")}
                type="email"
                value={data.billTo.email}
                onChange={(v) => updateBillTo("email", v)}
                placeholder={t("placeholders.clientEmail")}
              />
            </div>
            <FormField
              label={t("form.address")}
              value={data.billTo.address}
              onChange={(v) => updateBillTo("address", v)}
              placeholder={t("placeholders.clientAddress")}
              multiline
              rows={2}
            />
            <AddressFields
              values={{
                city: data.billTo.city,
                kecamatan: data.billTo.kecamatan,
                state: data.billTo.stateRegion,
                postalCode: data.billTo.postalCode,
                country: data.billTo.country,
              }}
              onChange={(updates) => {
                // Map AddressValues keys to RecipientInfo keys
                const mapped: Partial<RecipientInfo> = {}
                for (const [key, val] of Object.entries(updates)) {
                  if (key === "state") {
                    mapped.stateRegion = val
                  } else {
                    (mapped as Record<string, string>)[key] = val
                  }
                }
                onChange({ ...data, billTo: { ...data.billTo, ...mapped } })
              }}
              stateLabel={t("form.stateRegion")}
              cityPlaceholder={t("placeholders.cityRecipient")}
              statePlaceholder={t("placeholders.stateRecipient")}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* ── Line Items ── */}
      <SectionList
        title={t("form.lineItems")}
        onTitleChange={() => {}}
        placeholder={t("form.lineItems")}
        titleIcon={<ListOrdered className="size-4 text-muted-foreground" />}
        items={data.items}
        onAdd={addItem}
        onRemove={removeItem}
        onReorder={reorderItems}
        addLabel={t("form.addItem")}
        summary={(item, i) => item.description || `Item ${i + 1}`}
        renderContent={(item) => (
          <div className="space-y-3">
            <FormField
              label={t("form.description")}
              value={item.description}
              onChange={(v) => updateItem(item.id, "description", v)}
              placeholder={t("placeholders.description")}
            />
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-3">
              <PeriodRangePicker
                value={item.period}
                onChange={(v) => updateItem(item.id, "period", v)}
              />
              <FormField
                label={t("form.qty")}
                type="number"
                value={String(item.qty)}
                onChange={(v) => updateItem(item.id, "qty", Number(v))}
                min={0}
              />
              <FormField
                label={t("form.unitPrice")}
                type="number"
                value={String(item.unitPrice)}
                onChange={(v) => updateItem(item.id, "unitPrice", Number(v))}
                min={0}
                step="0.01"
              />
              <FormField
                label={t("form.amount")}
                value={formatCurrency(item.qty * item.unitPrice, data.currency)}
                onChange={() => {}}
                disabled
              />
            </div>

            {/* Sub-items */}
            {item.subItems.length > 0 && (
              <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("form.subItems")}
                </p>
                {item.subItems.map((sub) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-2"
                  >
                    <FormField
                      label={t("form.label")}
                      value={sub.label}
                      onChange={(v) =>
                        updateSubItem(item.id, sub.id, "label", v)
                      }
                      placeholder={t("placeholders.subItemLabel")}
                    />
                    <FormField
                      label={t("form.qty")}
                      type="number"
                      value={String(sub.qty)}
                      onChange={(v) =>
                        updateSubItem(item.id, sub.id, "qty", Number(v))
                      }
                      min={0}
                    />
                    <FormField
                      label={t("form.unitPrice")}
                      type="number"
                      value={String(sub.unitPrice)}
                      onChange={(v) =>
                        updateSubItem(item.id, sub.id, "unitPrice", Number(v))
                      }
                      min={0}
                      step="0.01"
                    />
                    <FormField
                      label={t("form.amount")}
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
              <Plus className="size-3.5" /> {t("form.addSubItem")}
            </Button>
          </div>
        )}
      />

      <Separator />

      {/* ── Adjustments ── */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4 text-muted-foreground" /> {t("form.adjustments")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("form.adjustmentsDesc")}
        </p>
        <div className="mt-3 space-y-3">
          {data.adjustments.map((adj) => (
            <div
              key={adj.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-2"
            >
              <FormField
                label={t("form.label")}
                value={adj.label}
                onChange={(v) => updateAdjustment(adj.id, "label", v)}
                placeholder={t("placeholders.adjustmentLabel")}
              />
              <div className="space-y-1.5">
                <Label>{t("form.type")}</Label>
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
                    <SelectItem value="add">{t("form.typeAdd")}</SelectItem>
                    <SelectItem value="deduct">{t("form.typeDeduct")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("form.mode")}</Label>
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
                    <SelectItem value="fixed">{t("form.modeFixed")}</SelectItem>
                    <SelectItem value="percentage">{t("form.modePercentage")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormField
                label={adj.mode === "percentage" ? t("form.modePercentage") : t("form.amount")}
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
            <Plus className="size-3.5" /> {t("form.addAdjustment")}
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Notes & Settings ── */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="size-4 text-muted-foreground" /> {t("form.notesSettings")}
        </h2>
        <div className="mt-3 space-y-3">
          {data.customFields.map((cf) => (
            <div
              key={cf.id}
              className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
            >
              <FormField
                label={t("form.label")}
                value={cf.label}
                onChange={(v) => updateCustomField(cf.id, "label", v)}
                placeholder={t("placeholders.customFieldLabel")}
              />
              <FormField
                label={t("form.value")}
                value={cf.value}
                onChange={(v) => updateCustomField(cf.id, "value", v)}
                placeholder={t("placeholders.customFieldValue")}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCustomField(cf.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addCustomField}>
            <Plus className="size-3.5" /> {t("form.addField")}
          </Button>
          <FormField
            label={t("form.notes")}
            value={data.notes}
            onChange={(v) => updateField("notes", v)}
            placeholder={t("placeholders.notes")}
            multiline
            rows={3}
          />
        </div>
      </section>
    </div>
  )
}
