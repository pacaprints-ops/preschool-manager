'use server'

import { db } from '@/lib/db'
import { terms, sessionConfig, bankHolidays } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function addTerm(data: {
  name: string
  academicYear: string
  startDate: string
  endDate: string
  weekCount: number
}) {
  await db.insert(terms).values(data)
  revalidatePath('/admin/terms')
}

export async function updateTerm(id: string, data: {
  name: string
  academicYear: string
  startDate: string
  endDate: string
  weekCount: number
}) {
  await db.update(terms).set(data).where(eq(terms.id, id))
  revalidatePath('/admin/terms')
}

export async function deleteTerm(id: string) {
  await db.delete(terms).where(eq(terms.id, id))
  revalidatePath('/admin/terms')
}

export async function addBankHoliday(date: string, name: string) {
  await db.insert(bankHolidays).values({ date, name }).onConflictDoNothing()
  revalidatePath('/admin/terms')
}

export async function deleteBankHoliday(id: string) {
  await db.delete(bankHolidays).where(eq(bankHolidays.id, id))
  revalidatePath('/admin/terms')
}

export async function updateSessionRates(id: string, hourlyRate2yo: string, hourlyRate34yo: string, contribution: string) {
  await db.update(sessionConfig).set({ hourlyRate2yo, hourlyRate34yo, contribution }).where(eq(sessionConfig.id, id))
  revalidatePath('/admin/terms')
}
