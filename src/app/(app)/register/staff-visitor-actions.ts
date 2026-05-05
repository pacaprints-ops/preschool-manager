'use server'

import { db } from '@/lib/db'
import { staffDailyAttendance, buildingVisitors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type StaffSignInEntry = {
  userId: string
  staffName: string
  signedInAt: string   // "HH:MM"
  signedOutAt?: string // "HH:MM" optional
}

export async function signInStaffForDay(date: string, entries: StaffSignInEntry[]) {
  await db.delete(staffDailyAttendance).where(eq(staffDailyAttendance.date, date))
  if (entries.length > 0) {
    await db.insert(staffDailyAttendance).values(
      entries.map(e => ({
        date,
        userId: e.userId || null,
        staffName: e.staffName,
        signedInAt: e.signedInAt ? new Date(`${date}T${e.signedInAt}:00`) : null,
        signedOutAt: e.signedOutAt ? new Date(`${date}T${e.signedOutAt}:00`) : null,
      }))
    )
  }
  revalidatePath('/register')
}

export async function updateStaffSignOut(id: string, date: string, timeLocal: string) {
  await db
    .update(staffDailyAttendance)
    .set({ signedOutAt: new Date(`${date}T${timeLocal}:00`) })
    .where(eq(staffDailyAttendance.id, id))
  revalidatePath('/register')
}

export async function addVisitor(date: string, name: string, organisation: string, signedInAt: string) {
  await db.insert(buildingVisitors).values({
    date,
    name: name.trim(),
    organisation: organisation.trim() || null,
    signedInAt: new Date(`${date}T${signedInAt}:00`),
  })
  revalidatePath('/register')
}

export async function signOutVisitor(id: string, date: string, timeLocal: string) {
  await db
    .update(buildingVisitors)
    .set({ signedOutAt: new Date(`${date}T${timeLocal}:00`) })
    .where(eq(buildingVisitors.id, id))
  revalidatePath('/register')
}
