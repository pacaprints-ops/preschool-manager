'use server'

import { db } from '@/lib/db'
import { invoices, children, childSessions, sessionConfig, terms, lateFeeInvoices, invoiceReminders, extraSessions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { countBankHolidaysInTerm } from '@/lib/bankHolidays'
import { sendEmail, buildInvoiceEmail, buildLateFeeEmail } from '@/lib/email'

function ageAtDate(dob: string, refDate: string): number {
  const d = new Date(dob)
  const r = new Date(refDate)
  let age = r.getFullYear() - d.getFullYear()
  const m = r.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && r.getDate() < d.getDate())) age--
  return age
}

export async function generateInvoices(termId: string, selectedChildIds?: string[]) {
  const term = await db.select().from(terms).where(eq(terms.id, termId)).limit(1)
  if (!term[0]) throw new Error('Term not found')

  const configs = await db.select().from(sessionConfig)
  const sessionMap = Object.fromEntries(configs.map(s => [s.type, s]))

  let query = db
    .select({ child: children, session: childSessions })
    .from(childSessions)
    .innerJoin(children, eq(childSessions.childId, children.id))
    .where(eq(children.archived, false))

  const activeChildren = await query

  // Group sessions by child
  const childMap: Record<string, { child: typeof children.$inferSelect; sessions: typeof childSessions.$inferSelect[] }> = {}
  for (const { child, session } of activeChildren) {
    if (!childMap[child.id]) childMap[child.id] = { child, sessions: [] }
    childMap[child.id].sessions.push(session)
  }

  // Filter to selected children if provided
  const toInvoice = selectedChildIds?.length
    ? Object.values(childMap).filter(({ child }) => selectedChildIds.includes(child.id))
    : Object.values(childMap)

  // Bank holidays: pre-school closed, no consumable fee charged those days.
  // Same for every child in this term, so compute once outside the loop.
  const bankHolidayCount = await countBankHolidaysInTerm(term[0].startDate, term[0].endDate)

  let created = 0
  for (const { child, sessions: childSess } of toInvoice) {
    const existing = await db.select().from(invoices).where(
      and(eq(invoices.childId, child.id), eq(invoices.termId, termId))
    ).limit(1)
    if (existing[0]) continue

    const weeks = term[0].weekCount
    const age = ageAtDate(child.dateOfBirth, term[0].startDate)
    const is2yo = age <= 2

    const fundedSess = childSess.filter(s => s.isFunded)
    const paidSess = childSess.filter(s => !s.isFunded)
    const allSess = childSess

    // Paid session costs (age-based hourly rate)
    let paidCostPerWeek = 0
    let paidHoursPerWeek = 0
    for (const s of paidSess) {
      const conf = sessionMap[s.sessionType]
      if (conf) {
        const rate = is2yo ? parseFloat(conf.hourlyRate2yo) : parseFloat(conf.hourlyRate34yo)
        paidCostPerWeek += rate * parseFloat(conf.hours)
        paidHoursPerWeek += parseFloat(conf.hours)
      }
    }

    // Funded session info (informational — £0 charge)
    let fundedValuePerWeek = 0
    let fundedHoursPerWeek = 0
    for (const s of fundedSess) {
      const conf = sessionMap[s.sessionType]
      if (conf) {
        const rate = is2yo ? parseFloat(conf.hourlyRate2yo) : parseFloat(conf.hourlyRate34yo)
        fundedValuePerWeek += rate * parseFloat(conf.hours)
        fundedHoursPerWeek += parseFloat(conf.hours)
      }
    }

    // Consumable: £3.50 per session for ALL sessions (funded + paid), only if consent given
    const totalSessionsPerWeek = allSess.length
    const totalSessionsForTerm = totalSessionsPerWeek * weeks
    const contribution = configs[0] ? parseFloat(configs[0].contribution) : 3.50
    const contributionTotal = child.consumableConsent ? contribution * totalSessionsForTerm : 0

    const paidSessionsTotal = paidSess.length * weeks
    const fundedSessionsTotal = fundedSess.length * weeks
    const sessionCost = paidCostPerWeek * weeks
    const fundedValue = fundedValuePerWeek * weeks
    const fundedHoursTotal = fundedHoursPerWeek * weeks

    const bankHolidayDeduction = child.consumableConsent ? bankHolidayCount * contribution : 0

    // Deposit credit: £50 returned on first ever invoice if deposit was paid
    const priorInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.childId, child.id)).limit(1)
    const isFirstInvoice = priorInvoices.length === 0
    const depositCredit = (child.depositPaid && isFirstInvoice) ? -50 : 0

    const amountDue = Math.max(0, sessionCost + contributionTotal - bankHolidayDeduction + depositCredit)

    await db.insert(invoices).values({
      childId: child.id,
      termId,
      paidSessions: paidSessionsTotal,
      fundedSessions: fundedSessionsTotal,
      fundedHoursPerWeek: fundedHoursPerWeek.toFixed(2),
      paidHoursPerWeek: paidHoursPerWeek.toFixed(2),
      fundedHoursTotal: fundedHoursTotal.toFixed(2),
      sessionCost: sessionCost.toFixed(2),
      consumableConsent: child.consumableConsent,
      contributionTotal: contributionTotal.toFixed(2),
      fundedValue: fundedValue.toFixed(2),
      adjustmentAmount: depositCredit !== 0 ? depositCredit.toFixed(2) : '0',
      adjustmentNote: depositCredit !== 0 ? 'Term deposit deducted' : null,
      bankHolidayCount,
      amountDue: amountDue.toFixed(2),
      status: 'draft',
      parentEmail: child.parentEmail ?? null,
    })
    created++
  }

  revalidatePath('/admin/invoicing')
  return created
}

export async function updateAdjustment(id: string, adjustmentAmount: string, adjustmentNote: string) {
  const inv = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1)
  if (!inv[0]) return
  const contribution = 3.50
  const bankHolidayDeduction = inv[0].consumableConsent ? (inv[0].bankHolidayCount ?? 0) * contribution : 0
  const base = parseFloat(inv[0].sessionCost) + parseFloat(inv[0].contributionTotal) - bankHolidayDeduction
  const adj = parseFloat(adjustmentAmount) || 0
  const amountDue = Math.max(0, base + adj).toFixed(2)
  await db.update(invoices).set({ adjustmentAmount: adj.toFixed(2), adjustmentNote: adjustmentNote || null, amountDue }).where(eq(invoices.id, id))
  revalidatePath('/admin/invoicing')
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

export async function markLateFeePaid(id: string) {
  await db.update(lateFeeInvoices).set({ status: 'paid', paidAt: new Date() }).where(eq(lateFeeInvoices.id, id))
  revalidatePath('/admin/invoicing')
}

export async function markLateFeeUnpaid(id: string) {
  await db.update(lateFeeInvoices).set({ status: 'unpaid', paidAt: null }).where(eq(lateFeeInvoices.id, id))
  revalidatePath('/admin/invoicing')
}

export async function deleteLateFee(id: string) {
  await db.delete(lateFeeInvoices).where(eq(lateFeeInvoices.id, id))
  revalidatePath('/admin/invoicing')
}

export async function waiveLateFee(id: string, reason?: string) {
  await db.update(lateFeeInvoices)
    .set({ status: 'waived', notes: reason || null })
    .where(eq(lateFeeInvoices.id, id))
  revalidatePath('/admin/invoicing')
}

export async function markExtraSessionPaid(id: string) {
  await db.update(extraSessions).set({ status: 'paid' }).where(eq(extraSessions.id, id))
  revalidatePath('/admin/invoicing')
}

export async function markExtraSessionUnpaid(id: string) {
  await db.update(extraSessions).set({ status: 'unpaid' }).where(eq(extraSessions.id, id))
  revalidatePath('/admin/invoicing')
}

export async function waiveExtraSession(id: string, reason?: string) {
  await db.update(extraSessions).set({ status: 'waived', notes: reason || null }).where(eq(extraSessions.id, id))
  revalidatePath('/admin/invoicing')
}

export async function deleteExtraSession(id: string) {
  await db.delete(extraSessions).where(eq(extraSessions.id, id))
  revalidatePath('/admin/invoicing')
  revalidatePath('/register')
}

export async function sendInvoiceEmail(id: string, type: 'initial' | 'reminder' = 'initial') {
  const rows = await db
    .select({ invoice: invoices, child: children, term: terms })
    .from(invoices)
    .innerJoin(children, eq(invoices.childId, children.id))
    .innerJoin(terms, eq(invoices.termId, terms.id))
    .where(eq(invoices.id, id))
    .limit(1)

  if (!rows[0]) throw new Error('Invoice not found')
  const { invoice: inv, child, term } = rows[0]
  const email = inv.parentEmail
  if (!email) throw new Error('No parent email on invoice')

  const html = buildInvoiceEmail({
    childName: `${child.firstName} ${child.lastName}`,
    termName: term.name,
    paidSessions: inv.paidSessions,
    fundedSessions: inv.fundedSessions,
    sessionCost: inv.sessionCost,
    contributionTotal: inv.contributionTotal,
    bankHolidayCount: inv.bankHolidayCount,
    adjustmentAmount: inv.adjustmentAmount,
    adjustmentNote: inv.adjustmentNote,
    amountDue: inv.amountDue,
    parentEmail: email,
  })

  await sendEmail(email, `Winton Pre-School — Invoice for ${term.name}`, html)

  await db.update(invoices).set({ status: 'sent', sentAt: new Date() }).where(eq(invoices.id, id))
  await db.insert(invoiceReminders).values({ invoiceId: id, email, type })

  revalidatePath('/admin/invoicing')
}

export async function sendOverdueReminders(termId: string): Promise<number> {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

  // Fetch all 'sent' invoices for this term that have a parentEmail
  const sentInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.termId, termId), eq(invoices.status, 'sent')))

  const eligible = sentInvoices.filter(inv => inv.parentEmail)

  let count = 0
  const now = new Date()

  for (const inv of eligible) {
    // Find most recent reminder sentAt for this invoice
    const latestReminders = await db
      .select({ sentAt: invoiceReminders.sentAt })
      .from(invoiceReminders)
      .where(eq(invoiceReminders.invoiceId, inv.id))
      .orderBy(desc(invoiceReminders.sentAt))
      .limit(1)

    const latestReminderAt = latestReminders[0]?.sentAt ?? null

    // Most recent contact = max of sentAt and latestReminderAt
    const candidates: Date[] = []
    if (inv.sentAt) candidates.push(inv.sentAt)
    if (latestReminderAt) candidates.push(latestReminderAt)

    // If never contacted, or last contact was 7+ days ago, send a reminder
    if (
      candidates.length === 0 ||
      Math.max(...candidates.map(d => d.getTime())) <= now.getTime() - SEVEN_DAYS_MS
    ) {
      await sendInvoiceEmail(inv.id, 'reminder')
      count++
    }
  }

  return count
}

export async function sendLateFeeEmail(id: string) {
  const rows = await db
    .select({ fee: lateFeeInvoices, child: children })
    .from(lateFeeInvoices)
    .innerJoin(children, eq(lateFeeInvoices.childId, children.id))
    .where(eq(lateFeeInvoices.id, id))
    .limit(1)

  if (!rows[0]) throw new Error('Late fee not found')
  const { fee, child } = rows[0]
  const email = child.parentEmail
  if (!email) throw new Error('No parent email for this child')

  const html = buildLateFeeEmail({
    childName: `${child.firstName} ${child.lastName}`,
    date: fee.date,
    minutesLate: fee.minutesLate,
    totalAmount: fee.totalAmount,
  })

  await sendEmail(email, `Winton Pre-School — Late collection fee`, html)
  revalidatePath('/admin/invoicing')
}
