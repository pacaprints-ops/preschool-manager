'use server'

import { db } from '@/lib/db'
import { staffSickness, staffHours, staffTraining, staffMonthlyTimesheets, users } from '@/lib/db/schema'

import { eq, and, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updateWorkingDays(userId: string, days: string) {
  await db.update(users).set({ workingDays: days }).where(eq(users.id, userId))
  revalidatePath('/admin/staff')
}

export async function addSickness(userId: string, data: { startDate: string; endDate?: string; reason?: string; notes?: string }) {
  await db.insert(staffSickness).values({ userId, ...data, endDate: data.endDate || null, reason: data.reason || null, notes: data.notes || null })
  revalidatePath('/admin/staff')
}

export async function deleteSickness(id: string) {
  await db.delete(staffSickness).where(eq(staffSickness.id, id))
  revalidatePath('/admin/staff')
}

export async function addTimesheetEntry(userId: string, data: { date: string; timeIn: string; timeOut: string; hoursWorked: string; notes?: string }) {
  await db.insert(staffHours).values({
    userId,
    date: data.date,
    timeIn: data.timeIn || null,
    timeOut: data.timeOut || null,
    hoursWorked: data.hoursWorked,
    notes: data.notes || null,
  })
  revalidatePath('/admin/staff')
}

export async function deleteTimesheetEntry(id: string) {
  await db.delete(staffHours).where(eq(staffHours.id, id))
  revalidatePath('/admin/staff')
}

export async function saveMonthlyTimesheetData(
  userId: string,
  year: number,
  month: number,
  dailyEntries: { date: string; timeIn: string | null; timeOut: string | null; hoursWorked: string }[],
  summary: { additionalHours: string; additionalHoursNotes: string; totalKeyChildren: string; totalExtraHours: string; totalPay: string; notes: string },
) {
  const monthPad = String(month).padStart(2, '0')
  const monthStart = `${year}-${monthPad}-01`
  const monthEnd = `${year}-${monthPad}-31`

  // Replace all daily entries for this user+month
  await db.delete(staffHours).where(and(
    eq(staffHours.userId, userId),
    gte(staffHours.date, monthStart),
    lte(staffHours.date, monthEnd),
  ))
  if (dailyEntries.length > 0) {
    await db.insert(staffHours).values(dailyEntries.map(e => ({
      userId,
      date: e.date,
      timeIn: e.timeIn,
      timeOut: e.timeOut,
      hoursWorked: e.hoursWorked,
    })))
  }

  // Upsert monthly summary
  await db.insert(staffMonthlyTimesheets).values({
    userId,
    year,
    month,
    additionalHours: summary.additionalHours || null,
    additionalHoursNotes: summary.additionalHoursNotes || null,
    totalKeyChildren: summary.totalKeyChildren ? parseInt(summary.totalKeyChildren) : null,
    totalExtraHours: summary.totalExtraHours || null,
    totalPay: summary.totalPay || null,
    notes: summary.notes || null,
  }).onConflictDoUpdate({
    target: [staffMonthlyTimesheets.userId, staffMonthlyTimesheets.year, staffMonthlyTimesheets.month],
    set: {
      additionalHours: summary.additionalHours || null,
      additionalHoursNotes: summary.additionalHoursNotes || null,
      totalKeyChildren: summary.totalKeyChildren ? parseInt(summary.totalKeyChildren) : null,
      totalExtraHours: summary.totalExtraHours || null,
      totalPay: summary.totalPay || null,
      notes: summary.notes || null,
    },
  })

  revalidatePath('/admin/staff')
}

export async function addTraining(userId: string, data: { trainingName: string; completedDate: string; expiryDate?: string; notes?: string }) {
  await db.insert(staffTraining).values({ userId, ...data, expiryDate: data.expiryDate || null, notes: data.notes || null })
  revalidatePath('/admin/staff')
}

export async function deleteTraining(id: string) {
  await db.delete(staffTraining).where(eq(staffTraining.id, id))
  revalidatePath('/admin/staff')
}

export async function updateDBS(userId: string, data: { dbsCertNumber: string; dbsIssueDate: string; dbsOnUpdateService: boolean }) {
  await db.update(users).set({
    dbsCertNumber: data.dbsCertNumber || null,
    dbsIssueDate: data.dbsIssueDate || null,
    dbsOnUpdateService: data.dbsOnUpdateService,
  }).where(eq(users.id, userId))
  revalidatePath('/admin/staff')
}
