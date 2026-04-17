'use server'

import { db } from '@/lib/db'
import { invoices, children, childSessions, sessionConfig, terms } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function generateInvoices(termId: string) {
  const term = await db.select().from(terms).where(eq(terms.id, termId)).limit(1)
  if (!term[0]) throw new Error('Term not found')

  const sessions = await db.select().from(sessionConfig)
  const sessionMap = Object.fromEntries(sessions.map(s => [s.type, s]))

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

    const totalSessions = childSess.length * term[0].weekCount
    let sessionCostPerWeek = 0
    let contributionPerWeek = 0

    for (const s of childSess) {
      const config = sessionMap[s.sessionType]
      if (config) {
        sessionCostPerWeek += parseFloat(config.price)
        contributionPerWeek += parseFloat(config.contribution)
      }
    }

    const sessionCost = sessionCostPerWeek * term[0].weekCount
    const contributionTotal = contributionPerWeek * term[0].weekCount

    // Funded hours deduction
    let fundedDeduction = 0
    if (child.isFunded && child.fundedHours) {
      const fundedHrsPerWeek = parseFloat(child.fundedHours)
      const totalFundedHrs = fundedHrsPerWeek * term[0].weekCount
      // Deduct at £5/hr (placeholder rate — to confirm)
      fundedDeduction = Math.min(totalFundedHrs * 5, sessionCost)
    }

    const amountDue = Math.max(0, sessionCost + contributionTotal - fundedDeduction)

    await db.insert(invoices).values({
      childId: child.id,
      termId,
      totalSessions,
      sessionCost: sessionCost.toFixed(2),
      contributionTotal: contributionTotal.toFixed(2),
      fundedDeduction: fundedDeduction.toFixed(2),
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
