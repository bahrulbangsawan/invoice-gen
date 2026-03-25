import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import type { InvoiceData } from "@/components/invoice-form"
import {
  formatCurrency,
  calcSubtotal,
  calcTax,
  calcTotal,
  calcAdjustmentAmount,
} from "@/components/invoice-form"

// ── Date formatting ───────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a1a",
  },

  // Orange accent bar
  accentBar: {
    height: 4,
    backgroundColor: "#f48120",
    width: "100%",
  },

  // Header
  header: {
    padding: 30,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  logo: {
    maxHeight: 40,
    objectFit: "contain",
  },
  metaBlock: {
    marginTop: 16,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    width: 80,
    color: "#444444",
  },
  metaValue: {
    fontSize: 8,
    color: "#1a1a1a",
  },

  // From / Bill To
  partiesSection: {
    flexDirection: "row",
    paddingHorizontal: 30,
    paddingBottom: 20,
    gap: 30,
  },
  partyColumn: {
    flex: 1,
  },
  partyTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#444444",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  partyName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  partyText: {
    fontSize: 8,
    color: "#444444",
    lineHeight: 1.4,
  },

  // Amount due
  amountDueSection: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    marginBottom: 10,
  },
  amountDueText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },

  // Line items table
  table: {
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#444444",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  colDescription: {
    flex: 4,
  },
  colQty: {
    flex: 1,
    textAlign: "right",
  },
  colUnitPrice: {
    flex: 1,
    textAlign: "right",
  },
  colAmount: {
    flex: 1,
    textAlign: "right",
  },
  itemDescription: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  itemPeriod: {
    fontSize: 7,
    color: "#888888",
    marginTop: 2,
  },
  itemNumber: {
    fontSize: 9,
    color: "#1a1a1a",
    textAlign: "right",
  },

  // Sub-items
  subItemRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingLeft: 14,
    alignItems: "flex-start",
  },
  subItemLabel: {
    fontSize: 8,
    color: "#666666",
  },
  subItemNumber: {
    fontSize: 8,
    color: "#666666",
    textAlign: "right",
  },

  // Footer totals
  footer: {
    paddingHorizontal: 30,
    paddingTop: 16,
    alignItems: "flex-end",
  },
  totalsBlock: {
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: "#444444",
  },
  totalValue: {
    fontSize: 9,
    color: "#1a1a1a",
    textAlign: "right",
  },
  totalDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    marginTop: 4,
  },
  totalDueLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  totalDueValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    textAlign: "right",
  },

  // Notes
  notesSection: {
    paddingHorizontal: 30,
    paddingTop: 24,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#444444",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: "#444444",
    lineHeight: 1.4,
  },

  // Page number
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 30,
    fontSize: 7,
    color: "#888888",
  },
})

// ── Component ─────────────────────────────────────────────

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const subtotal = calcSubtotal(data.items)
  const tax = calcTax(subtotal, data.taxRate)
  const total = calcTotal(data.items, data.taxRate, data.adjustments)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Orange accent bar */}
        <View style={[styles.accentBar, { backgroundColor: data.accentColor || "#f48120" }]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            {data.from.logoUrl ? (
              <Image src={data.from.logoUrl} style={styles.logo} />
            ) : null}
          </View>

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice number</Text>
              <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date of issue</Text>
              <Text style={styles.metaValue}>{formatDate(data.dateOfIssue)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date due</Text>
              <Text style={styles.metaValue}>{formatDate(data.dateDue)}</Text>
            </View>
          </View>
        </View>

        {/* From / Bill To */}
        <View style={styles.partiesSection}>
          {/* From */}
          <View style={styles.partyColumn}>
            <Text style={styles.partyName}>{data.from.companyName}</Text>
            {data.from.address ? (
              <Text style={styles.partyText}>{data.from.address}</Text>
            ) : null}
            <Text style={styles.partyText}>
              {[data.from.city, data.from.state, data.from.postalCode]
                .filter(Boolean)
                .join(", ")}
            </Text>
            {data.from.country ? (
              <Text style={styles.partyText}>{data.from.country}</Text>
            ) : null}
            {data.from.email ? (
              <Text style={styles.partyText}>{data.from.email}</Text>
            ) : null}
          </View>

          {/* Bill To */}
          <View style={styles.partyColumn}>
            <Text style={styles.partyTitle}>Bill to</Text>
            <Text style={styles.partyName}>{data.billTo.name}</Text>
            {data.billTo.address ? (
              <Text style={styles.partyText}>{data.billTo.address}</Text>
            ) : null}
            <Text style={styles.partyText}>
              {[data.billTo.city, data.billTo.stateRegion, data.billTo.postalCode]
                .filter(Boolean)
                .join(", ")}
            </Text>
            {data.billTo.country ? (
              <Text style={styles.partyText}>{data.billTo.country}</Text>
            ) : null}
            {data.billTo.email ? (
              <Text style={styles.partyText}>{data.billTo.email}</Text>
            ) : null}
          </View>
        </View>

        {/* Amount due */}
        <View style={styles.amountDueSection}>
          <Text style={styles.amountDueText}>
            {formatCurrency(total, data.currency)} {data.currency} due{" "}
            {formatDate(data.dateDue)}
          </Text>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>
              Unit price
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {/* Item rows */}
          {data.items.map((item) => (
            <View key={item.id} wrap={false}>
              <View style={styles.tableRow}>
                <View style={styles.colDescription}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  {item.period ? (
                    <Text style={styles.itemPeriod}>{item.period}</Text>
                  ) : null}
                </View>
                <Text style={[styles.itemNumber, styles.colQty]}>{item.qty}</Text>
                <Text style={[styles.itemNumber, styles.colUnitPrice]}>
                  {formatCurrency(item.unitPrice, data.currency)}
                </Text>
                <Text style={[styles.itemNumber, styles.colAmount]}>
                  {formatCurrency(item.amount, data.currency)}
                </Text>
              </View>

              {/* Sub-items */}
              {item.subItems.map((sub) => (
                <View key={sub.id} style={styles.subItemRow}>
                  <View style={styles.colDescription}>
                    <Text style={styles.subItemLabel}>{sub.label}</Text>
                  </View>
                  <Text style={[styles.subItemNumber, styles.colQty]}>
                    {sub.qty}
                  </Text>
                  <Text style={[styles.subItemNumber, styles.colUnitPrice]}>
                    {formatCurrency(sub.unitPrice, data.currency)}
                  </Text>
                  <Text style={[styles.subItemNumber, styles.colAmount]}>
                    {formatCurrency(sub.amount, data.currency)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer totals */}
        <View style={styles.footer}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(subtotal, data.currency)}
              </Text>
            </View>
            {data.taxRate > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({data.taxRate}%)</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(tax, data.currency)}
                </Text>
              </View>
            ) : null}
            {data.adjustments.map((adj) => {
              const amount = calcAdjustmentAmount(adj, subtotal)
              return (
                <View key={adj.id} style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    {adj.type === "deduct" ? "−" : "+"} {adj.label || "Adjustment"}
                    {adj.mode === "percentage" ? ` (${adj.value}%)` : ""}
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(amount, data.currency)}
                  </Text>
                </View>
              )
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(total, data.currency)}
              </Text>
            </View>
            <View style={styles.totalDueRow}>
              <Text style={styles.totalDueLabel}>Amount due</Text>
              <Text style={styles.totalDueValue}>
                {formatCurrency(total, data.currency)} {data.currency}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {data.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
