'use server'

import { db } from '@/lib/db'
import { waitingList } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { promoteFromWaitingList } from '../children/actions'

export async function addToWaitingList(data: {
  childFirstName: string
  childLastName: string
  dateOfBirth?: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  daysNeeded?: string
  sessionsNeeded?: string
  notes?: string
}) {
  await db.insert(waitingList).values({
    childFirstName: data.childFirstName,
    childLastName: data.childLastName,
    dateOfBirth: data.dateOfBirth || null,
    parentName: data.parentName,
    parentPhone: data.parentPhone,
    parentEmail: data.parentEmail || null,
    daysNeeded: data.daysNeeded || null,
    sessionsNeeded: data.sessionsNeeded || null,
    notes: data.notes || null,
  })
  revalidatePath('/waiting-list')
}

export async function updateWaitlistStatus(id: string, status: 'waiting' | 'offered' | 'accepted') {
  await db.update(waitingList).set({ status }).where(eq(waitingList.id, id))
  revalidatePath('/waiting-list')
}

export async function removeFromWaitingList(id: string) {
  await db.delete(waitingList).where(eq(waitingList.id, id))
  revalidatePath('/waiting-list')
}

export { promoteFromWaitingList }
