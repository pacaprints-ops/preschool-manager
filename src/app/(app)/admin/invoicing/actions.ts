'use server'

import { db } from '@/lib/db'
import { invoices, children, childSessions, sessionConfig, terms } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function generateInvoices(termId: string) {
  const term = await db.select().from(terms).where(eq(terms.id, termId)).limit(1)
  if (!term[0]) throw new Error('Term not found')

  const configs = await db.select().from(sessionConfig)
  const sessionMap = Object.fromEntries(configs.map(s => [s.type, s]))

  const activeChildren = await db
    .select({ child: children, session: childSessions })
    .from(childSessions)
    .innerJoin(children, eq(childSessions.childId, children.id))
    .where(eq(children.archived, false))

  // Group sessions by child
  const childMap: Record<string, { child: typeof children.$inferSelect; sessions: typeof childSessions.$inferSelect[] }> = {}
  for (const { child, session } of activeChildren) {
    if (!childMap[child.id]) childMap[child.id] = { child, sessions: [] }
    childMap[child.id].sessions.push(session)
  }

  let created = 0
  for (const { child, sessions: childSess } of Object.values(childMap)) {
    const existing = await db.select().from(invoices).where(
      and(eq(invoices.childId, child.id), eq(invoices.termId, termId))
    ).limit(1)
    if (existing[0]) continue

    const weeks = term[0].weekCount

    // Split into funded and paid sessions
    const fundedSess = childSess.filter(s => s.isFunded)
    const paidSess = childSess.filter(s => !s.isFunded)

    // Paid session totals
    let paidCostPerWeek = 0
    let paidContribPerWeek = 0
    for (const s of paidSess) {
      const conf = sessionMap[s.sessionType]
      if (conf) {
        paidCostPerWeek += parseFloat(conf.price)
        paidContribPerWeek += parseFloat(conf.contribution)
      }
    }

    // Funded session totals (informational — shown on invoice but £0 charge)
    let fundedValuePerWeek = 0
    let fundedHoursPerWeek = 0
    for (const s of fundedSess) {
      const conf = sessionMap[s.sessionType]
      if (conf) {
        fundedValuePerWeek += parseFloat(conf.price)
        fundedHoursPerWeek += parseFloat(conf.hours)
      }
    }

    const paidSessionsTotal = paidSess.length * weeks
    const fundedSessionsTotal = fundedSess.length * weeks
    const sessionCost = paidCostPerWeek * weeks
    const contributionTotal = paidContribPerWeek * weeks
    const fundedValue = fundedValuePerWeek * weeks
    const fundedHoursTotal = fundedHoursPerWeek * weeks
    const amountDue = sessionCost + contributionTotal

    await db.insert(invoices).values({
      childId: child.id,
      termId,
      paidSessions: paidSessionsTotal,
      fundedSessions: fundedSessionsTotal,
      fundedHoursTotal: fundedHoursTotal.toFixed(2),
      sessionCost: sessionCost.toFixed(2),
      contributionTotal: contributionTotal.toFixed(2),
      fundedValue: fundedValue.toFixed(2),
      amountDue: amountDue.toFixed(2),
      status: 'draft',
      parentEmail: null,
    })
    created++
  }

  revalidatePath('/admin/invoicing')
  return created
}

export async function markInvoicePaid(id: string) {
  await db.update(invoices).set({ status: 'paid', paidAt: new Date() }).where(eq(invoices.id, id))
  revalidatePath('/admin/invoicing')
}

export async function markInvoiceUnpaid(id: string) {
  await db.update(invoices).set({ status: 'sent', paidAt: null }).where(eq(invoices.id, id))
  revalidatePath('/admin/invoicing')
}

export async function updateParentEmail(id: string, email: string) {
  await db.update(invoices).set({ parentEmail: email }).where(eq(invoices.id, id))
  revalidatePath('/admin/invoicing')
}

export async function deleteInvoice(id: string) {
  await db.delete(invoices).where(eq(invoices.id, id))
  revalidatePath('/admin/invoicing')
}
