'use server'

import { db } from '@/lib/db'
import { schoolTeddyLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function giveTeddy(childId: string, takenDate: string, notes?: string) {
  await db.insert(schoolTeddyLog).values({
    childId,
    takenDate,
    notes: notes || null,
  })
  revalidatePath('/admin/teddy')
}

export async function returnTeddy(logId: string, returnedDate: string) {
  await db.update(schoolTeddyLog).set({ returnedDate }).where(eq(schoolTeddyLog.id, logId))
  revalidatePath('/admin/teddy')
}

export async function deleteTeddyEntry(logId: string) {
  await db.delete(schoolTeddyLog).where(eq(schoolTeddyLog.id, logId))
  revalidatePath('/admin/teddy')
}
