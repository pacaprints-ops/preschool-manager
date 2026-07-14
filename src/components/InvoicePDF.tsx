import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const AMBER = '#020e2f'
const DARK = '#111827'
const GREY = '#6b7280'
const LIGHT = '#f9fafb'
const GREEN = '#15803d'

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: DARK, backgroundColor: '#ffffff' },

  // Header
  headerRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: AMBER, paddingBottom: 12, marginBottom: 16 },
  headerLeft: { flex: 1 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  schoolName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: AMBER, textAlign: 'center' },
  schoolSub: { fontSize: 9, color: GREY, textAlign: 'center', marginTop: 2 },
  headerText: { fontSize: 9, color: GREY, marginBottom: 2 },
  headerBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 },

  // Title section
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  invoiceTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: DARK },
  invoiceMeta: { fontSize: 9, color: GREY },

  // Child name
  childName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: AMBER, marginBottom: 16, marginTop: 4 },

  // Table
  table: { marginBottom: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: AMBER, paddingHorizontal: 10, paddingVertical: 6 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', color: '#ffffff', fontSize: 9 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableRowAlt: { backgroundColor: LIGHT },
  tableRowTotal: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#eff6ff', borderTopWidth: 2, borderTopColor: AMBER },
  col1: { flex: 1 },
  col2: { width: 80, textAlign: 'right' },
  cellText: { fontSize: 10 },
  cellBold: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  cellGrey: { fontSize: 9, color: GREY },
  cellGreen: { fontSize: 10, color: GREEN },
  cellAmber: { fontSize: 10, color: AMBER, fontFamily: 'Helvetica-Bold' },

  // Adjustment
  adjustRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },

  // Divider
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 14 },

  // Consumable note
  noteBox: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, padding: 10, marginBottom: 14 },
  noteText: { fontSize: 9, color: '#1e3a8a' },

  // Payment
  paymentTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: DARK },
  paymentRow: { flexDirection: 'row', marginBottom: 3 },
  paymentLabel: { fontSize: 9, color: GREY, width: 90 },
  paymentValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK },
  refNote: { fontSize: 9, color: AMBER, fontFamily: 'Helvetica-Bold', marginTop: 4 },

  // Footer
  footer: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  footerText: { fontSize: 9, color: GREY, textAlign: 'center' },
})

export type InvoicePDFData = {
  childFirstName: string
  childLastName: string
  termName: string
  termStartDate: string
  termEndDate: string
  weekCount: number
  ageGroup: string         // e.g. "3-4 year old"
  fundedHoursPerWeek: number
  paidHoursPerWeek: number
  sessionCost: number
  consumableConsent: boolean
  contributionTotal: number
  totalSessionsForTerm: number
  adjustmentAmount: number
  adjustmentNote: string | null
  bankHolidayCount: number
  amountDue: number
}

function fmt(n: number) {
  return `£${n.toFixed(2)}`
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB')
}

// A single invoice's page content, reusable standalone (one PDF per invoice)
// or stacked inside one <Document> for bulk term/year downloads.
export function InvoicePage({ data }: { data: InvoicePDFData }) {
  const rows = [
    {
      label: `${data.fundedHoursPerWeek}h Early Education Funding per week`,
      sub: data.fundedHoursPerWeek > 0 ? `${data.fundedHoursPerWeek}h × ${data.weekCount} weeks — covered by government funding` : undefined,
      amount: 0,
      green: true,
    },
    ...(data.paidHoursPerWeek > 0 ? [{
      label: `${data.paidHoursPerWeek}h additional (paid) per week`,
      sub: `${data.ageGroup} rate · ${data.paidHoursPerWeek}h × ${data.weekCount} weeks`,
      amount: data.sessionCost,
      green: false,
    }] : []),
    ...(data.consumableConsent ? [{
      label: `Voluntary consumable fee`,
      sub: `£3.50 × ${data.totalSessionsForTerm} sessions (${data.totalSessionsForTerm / data.weekCount} sessions/week × ${data.weekCount} weeks)`,
      amount: data.contributionTotal,
      green: false,
    }] : []),
    ...(data.consumableConsent && data.bankHolidayCount > 0 ? [{
      label: `Bank holiday closure deduction`,
      sub: `Pre-school closed on ${data.bankHolidayCount} bank holiday${data.bankHolidayCount === 1 ? '' : 's'} this term — consumable fee not charged`,
      amount: -(data.bankHolidayCount * 3.50),
      green: false,
      italic: false,
    }] : []),
    ...(data.adjustmentAmount !== 0 ? [{
      label: data.adjustmentNote ?? 'Adjustment',
      sub: undefined,
      amount: data.adjustmentAmount,
      green: false,
      italic: true,
    }] : []),
  ]

  return (
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.headerBold}>St Bernadette's Church Hall</Text>
            <Text style={s.headerText}>46 Draycott Road, Ensbury Park</Text>
            <Text style={s.headerText}>Bournemouth, BH10 5AR</Text>
          </View>
          <View style={s.headerCenter}>
            <Text style={s.schoolName}>Winton Pre-School</Text>
            <Text style={s.schoolName}>Little Explorers</Text>
            <Text style={s.schoolSub}>Member of the Early Years Alliance</Text>
            <Text style={s.schoolSub}>Alliance No: 00216170</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerText}>Tel: 07305240440</Text>
            <Text style={s.headerText}>info@wintonpreschool.org.uk</Text>
            <Text style={s.headerText}>Ofsted URN: 2753785</Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.titleRow}>
          <Text style={s.invoiceTitle}>{data.termName} Invoice</Text>
          <Text style={s.invoiceMeta}>
            {fmtDate(data.termStartDate)} – {fmtDate(data.termEndDate)} = {data.weekCount} weeks
          </Text>
        </View>

        {/* Child name */}
        <Text style={s.childName}>{data.childFirstName.toUpperCase()} {data.childLastName.toUpperCase()}</Text>

        {/* Invoice table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.col1]}>Item</Text>
            <Text style={[s.tableHeaderText, s.col2]}>Cost</Text>
          </View>
          {rows.map((row, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <View style={s.col1}>
                <Text style={s.cellText}>{row.label}</Text>
                {row.sub && <Text style={s.cellGrey}>{row.sub}</Text>}
              </View>
              <View style={s.col2}>
                <Text style={row.amount < 0 ? { ...s.cellBold, color: '#dc2626' } : row.green ? s.cellGreen : s.cellBold}>
                  {row.amount < 0 ? `-${fmt(Math.abs(row.amount))}` : fmt(row.amount)}
                </Text>
              </View>
            </View>
          ))}
          <View style={s.tableRowTotal}>
            <View style={s.col1}>
              <Text style={s.cellBold}>TOTAL BILL FOR {data.termName.toUpperCase()}</Text>
            </View>
            <View style={s.col2}>
              <Text style={s.cellAmber}>{fmt(data.amountDue)}</Text>
            </View>
          </View>
        </View>

        {/* Consumable note */}
        {data.consumableConsent && (
          <View style={s.noteBox}>
            <Text style={s.noteText}>
              Thank you for opting in and signing our consumable agreement, we really do value your support.{'\n'}
              For a full breakdown list of consumables, please refer to our fees and funding policy.
            </Text>
          </View>
        )}

        <View style={s.divider} />

        {/* Payment details */}
        <Text style={s.paymentTitle}>To pay by BACS:</Text>
        <View style={s.paymentRow}>
          <Text style={s.paymentLabel}>Bank:</Text>
          <Text style={s.paymentValue}>Lloyds Bank</Text>
        </View>
        <View style={s.paymentRow}>
          <Text style={s.paymentLabel}>Account name:</Text>
          <Text style={s.paymentValue}>Winton Pre-School Little Explorers Ltd</Text>
        </View>
        <View style={s.paymentRow}>
          <Text style={s.paymentLabel}>Account no:</Text>
          <Text style={s.paymentValue}>10655162</Text>
        </View>
        <View style={s.paymentRow}>
          <Text style={s.paymentLabel}>Sort code:</Text>
          <Text style={s.paymentValue}>30-99-50</Text>
        </View>
        <Text style={s.refNote}>Please use your child's name as the payment reference.</Text>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Please ensure fees are paid at the beginning of each half term. Thank you.
          </Text>
        </View>

      </Page>
  )
}

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  return (
    <Document>
      <InvoicePage data={data} />
    </Document>
  )
}
