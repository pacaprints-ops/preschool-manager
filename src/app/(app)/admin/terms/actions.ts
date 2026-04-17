'use server'

import { db } from '@/lib/db'
import { terms, sessionConfig } from '@/lib/db/schema'
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

export async function deleteTerm(id: string) {
  await db.delete(terms).where(eq(terms.id, id))
  revalidatePath('/admin/terms')
}

export async function updateSessionPrice(id: string, price: string, contribution: string) {
  await db.update(sessionConfig).set({ price, contribution }).where(eq(sessionConfig.id, id))
  revalidatePath('/admin/terms')
}
