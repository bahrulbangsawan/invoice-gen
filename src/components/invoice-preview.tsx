import type { InvoiceData } from "@/components/invoice-form"
import { formatCurrency, calcSubtotal, calcTax, calcTotal, calcAdjustmentAmount } from "@/components/invoice-form"
import { useTranslation } from "@/i18n"

export function InvoicePreview({ data }: { data: InvoiceData }) {
  const { t } = useTranslation()
  const { from, billTo, items, adjustments, currency, taxRate } = data
  const subtotal = calcSubtotal(items)
  const tax = calcTax(subtotal, taxRate)
  const total = calcTotal(items, taxRate, adjustments)

  const isEmpty = !from.companyName && items.length === 0

  if (isEmpty) {
    return (
      <div className="flex min-h-[600px] items-center justify-center text-center text-muted-foreground">
        {t("preview.emptyState")}
      </div>
    )
  }

  return (
    <article className="invoice-page mx-auto">
      {/* Orange top bar */}
      <div className="h-1" style={{ backgroundColor: data.accentColor || "#f48120" }} />

      <div className="p-8">
        {/* Header: Invoice title + logo */}
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-bold">{t("preview.invoice")}</h1>
          {from.logoUrl && (
            <img
              src={from.logoUrl}
              alt={from.companyName}
              className="max-h-12 object-contain"
            />
          )}
        </div>

        {/* Metadata */}
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <span className="font-bold">{t("preview.invoiceNumber")}</span>
          <span>{data.invoiceNumber}</span>
          <span className="font-bold">{t("preview.dateOfIssue")}</span>
          <span>{data.dateOfIssue}</span>
          <span className="font-bold">{t("preview.dateDue")}</span>
          <span>{data.dateDue}</span>
        </div>

        {/* Separator */}
        <div className="my-6 border-t border-gray-300" />

        {/* Sender / Recipient two-column */}
        <div className="grid grid-cols-2 gap-8 text-xs">
          {/* Sender */}
          <div className="space-y-0.5">
            {from.companyName && (
              <p className="font-bold">{from.companyName}</p>
            )}
            {from.address && <p>{from.address}</p>}
            {(from.city || from.kecamatan || from.state || from.postalCode) && (
              <p>
                {(from.country === "Indonesia"
                  ? [from.kecamatan, from.city, from.state, from.postalCode]
                  : [from.city, from.state, from.postalCode]
                )
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {from.country && <p>{from.country}</p>}
            {from.email && <p>{from.email}</p>}
          </div>

          {/* Recipient */}
          <div className="space-y-0.5">
            <p className="font-bold">{t("preview.billTo")}</p>
            {billTo.name && <p>{billTo.name}</p>}
            {billTo.address && <p>{billTo.address}</p>}
            {(billTo.city || billTo.kecamatan || billTo.stateRegion || billTo.postalCode) && (
              <p>
                {(billTo.country === "Indonesia"
                  ? [billTo.kecamatan, billTo.city, billTo.stateRegion, billTo.postalCode]
                  : [billTo.city, billTo.stateRegion, billTo.postalCode]
                )
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {billTo.country && <p>{billTo.country}</p>}
            {billTo.email && <p>{billTo.email}</p>}
          </div>
        </div>

        {/* Amount due banner */}
        <p className="mt-6 text-base font-bold">
          {formatCurrency(total, currency)} {currency} {t("preview.due")}{" "}
          {data.dateDue}
        </p>

        {/* Line items table */}
        {items.length > 0 && (
          <div className="mt-6">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-gray-300 pb-2 text-[10px] font-medium text-gray-500">
              <span>{t("preview.description")}</span>
              <span className="w-16 text-right">{t("preview.qty")}</span>
              <span className="w-24 text-right">{t("preview.unitPrice")}</span>
              <span className="w-24 text-right">{t("preview.amount")}</span>
            </div>

            {/* Rows */}
            {items.map((item) => (
              <div key={item.id}>
                <div
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b py-3 text-xs"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  <div>
                    <p>{item.description}</p>
                    {item.period && (
                      <p className="text-[10px] text-gray-500">{item.period}</p>
                    )}
                  </div>
                  <span className="w-16 text-right">{item.qty}</span>
                  <span className="w-24 text-right">
                    {formatCurrency(item.unitPrice, currency)}
                  </span>
                  <span className="w-24 text-right">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </div>

                {/* Sub-items */}
                {item.subItems.map((sub) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b py-2 pl-4 text-[11px]"
                    style={{ borderColor: "#e5e5e5" }}
                  >
                    <span className="text-gray-600">{sub.label}</span>
                    <span className="w-16 text-right">{sub.qty}</span>
                    <span className="w-24 text-right">
                      {formatCurrency(sub.unitPrice, currency)}
                    </span>
                    <span className="w-24 text-right">
                      {formatCurrency(sub.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Footer totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between">
              <span>{t("preview.subtotal")}</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span>{t("preview.tax")} ({taxRate}%)</span>
                <span>{formatCurrency(tax, currency)}</span>
              </div>
            )}
            {adjustments.map((adj) => {
              const amount = calcAdjustmentAmount(adj, subtotal)
              return (
                <div key={adj.id} className="flex justify-between">
                  <span>
                    {adj.type === "deduct" ? "\u2212" : "+"} {adj.label || t("preview.adjustment")}
                    {adj.mode === "percentage" ? ` (${adj.value}%)` : ""}
                  </span>
                  <span>{formatCurrency(amount, currency)}</span>
                </div>
              )
            })}
            <div className="flex justify-between border-t pt-2">
              <span>{t("preview.total")}</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>{t("preview.amountDue")} ({currency})</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Custom fields */}
        {data.customFields.length > 0 && (
          <div className="mt-6 space-y-1 text-xs">
            {data.customFields.map((cf) => (
              <div key={cf.id} className="grid grid-cols-[8rem_1fr] gap-2">
                <span className="font-bold">{cf.label}</span>
                <span>{cf.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="mt-6 text-xs">
            <p className="font-bold text-gray-500">{t("preview.notes")}</p>
            <p className="mt-1 text-gray-500">{data.notes}</p>
          </div>
        )}
      </div>
    </article>
  )
}
