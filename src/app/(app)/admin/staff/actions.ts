'use server'

import { db } from '@/lib/db'
import { staffSickness, staffHours, staffTraining } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function addSickness(userId: string, data: { startDate: string; endDate?: string; reason?: string; notes?: string }) {
  await db.insert(staffSickness).values({ userId, ...data, endDate: data.endDate || null, reason: data.reason || null, notes: data.notes || null })
  revalidatePath('/admin/staff')
}

export async function deleteSickness(id: string) {
  await db.delete(staffSickness).where(eq(staffSickness.id, id))
  revalidatePath('/admin/staff')
}

export async function addHours(userId: string, data: { date: string; hoursWorked: string; notes?: string }) {
  await db.insert(staffHours).values({ userId, date: data.date, hoursWorked: data.hoursWorked, notes: data.notes || null })
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
