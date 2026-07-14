import { db } from '@/lib/db'
import { invoices, children, terms } from '@/lib/db/schema'
import { eq, inArray, asc } from 'drizzle-orm'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document } from '@react-pdf/renderer'
import { InvoicePage, type InvoicePDFData } from '@/components/InvoicePDF'
import React from 'react'

function ageAtDate(dob: string, refDate: string): number {
  const d = new Date(dob)
  const r = new Date(refDate)
  let age = r.getFullYear() - d.getFullYear()
  const m = r.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && r.getDate() < d.getDate())) age--
  return age
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get('termId')
  const academicYear = searchParams.get('academicYear')

  if (!termId && !academicYear) {
    return new Response('Provide termId or academicYear', { status: 400 })
  }

  const scopedTerms = termId
    ? await db.select().from(terms).where(eq(terms.id, termId))
    : await db.select().from(terms).where(eq(terms.academicYear, academicYear!)).orderBy(asc(terms.startDate))

  if (scopedTerms.length === 0) {
    return new Response('No matching term(s) found', { status: 404 })
  }

  const termIds = scopedTerms.map(t => t.id)
  const termById = new Map(scopedTerms.map(t => [t.id, t]))

  const rows = await db
    .select({ invoice: invoices, child: children })
    .from(invoices)
    .innerJoin(children, eq(invoices.childId, children.id))
    .where(inArray(invoices.termId, termIds))

  if (rows.length === 0) {
    return new Response('No invoices found for this scope', { status: 404 })
  }

  // Sort by term order (as configured above), then child surname
  rows.sort((a, b) => {
    const ta = termIds.indexOf(a.invoice.termId)
    const tb = termIds.indexOf(b.invoice.termId)
    if (ta !== tb) return ta - tb
    return a.child.lastName.localeCompare(b.child.lastName)
  })

  const pages: InvoicePDFData[] = rows.map(({ invoice, child }) => {
    const term = termById.get(invoice.termId)!
    const age = ageAtDate(child.dateOfBirth, term.startDate)
    const ageGroup = age <= 2 ? '2 year old' : '3-4 year old'
    return {
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
      totalSessionsForTerm: invoice.paidSessions + invoice.fundedSessions,
      adjustmentAmount: parseFloat(invoice.adjustmentAmount),
      adjustmentNote: invoice.adjustmentNote,
      bankHolidayCount: invoice.bankHolidayCount ?? 0,
      amountDue: parseFloat(invoice.amountDue),
    }
  })

  const doc = React.createElement(
    Document,
    null,
    pages.map((data, i) => React.createElement(InvoicePage, { key: i, data }))
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any)

  const label = termId ? `${scopedTerms[0].name}-${scopedTerms[0].academicYear}` : `${academicYear}-All-Terms`
  const filename = `Invoices-${label}.pdf`
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_.]/g, '')

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
