import { db } from '@/lib/db'
import { invoices, children, terms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/InvoicePDF'
import React from 'react'

function ageAtDate(dob: string, refDate: string): number {
  const d = new Date(dob)
  const r = new Date(refDate)
  let age = r.getFullYear() - d.getFullYear()
  const m = r.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && r.getDate() < d.getDate())) age--
  return age
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const rows = await db
    .select({ invoice: invoices, child: children, term: terms })
    .from(invoices)
    .innerJoin(children, eq(invoices.childId, children.id))
    .innerJoin(terms, eq(invoices.termId, terms.id))
    .where(eq(invoices.id, id))
    .limit(1)

  if (!rows[0]) {
    return new Response('Invoice not found', { status: 404 })
  }

  const { invoice, child, term } = rows[0]

  const age = ageAtDate(child.dateOfBirth, term.startDate)
  const ageGroup = age <= 2 ? '2 year old' : '3-4 year old'
  const totalSessionsForTerm = invoice.paidSessions + invoice.fundedSessions

  const data = {
    childFirstName: child.firstName,
    childLastName: child.lastName,
    termName: term.name,
    termStartDate: term.startDate,
    termEndDate: term.endDate,
    weekCount: term.weekCount,
    ageGroup,
    fundedHoursPerWeek: parseFloat(invoice.fundedHoursPerWeek),
    paidHoursPerWeek: parseFloat(invoice.paidHoursPerWeek),
    sessionCost: parseFloat(invoice.sessionCost),
    consumableConsent: invoice.consumableConsent,
    contributionTotal: parseFloat(invoice.contributionTotal),
    totalSessionsForTerm,
    adjustmentAmount: parseFloat(invoice.adjustmentAmount),
    adjustmentNote: invoice.adjustmentNote,
    bankHolidayCount: invoice.bankHolidayCount ?? 0,
    amountDue: parseFloat(invoice.amountDue),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(InvoicePDF, { data }) as any)

  const filename = `${child.lastName}-${child.firstName}-${term.name}.pdf`
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_.]/g, '')

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
