'use server'

import { db } from '@/lib/db'
import { registerEntries, registerNotes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type MarkAttendanceInput = {
  childId: string
  sessionType: 'morning' | 'afternoon' | 'full_day'
  date: string
  status: 'present' | 'absent' | null
  absenceReason: string | null
  parentContacted: boolean
  parentContactedDate?: string
  userId: string
}

export async function markAttendance(input: MarkAttendanceInput) {
  const { childId, sessionType, date, status, absenceReason, parentContacted, parentContactedDate, userId } = input

  if (status === null) {
    await db
      .delete(registerEntries)
      .where(
        and(
          eq(registerEntries.childId, childId),
          eq(registerEntries.sessionType, sessionType),
          eq(registerEntries.date, date)
        )
      )
    revalidatePath('/register')
    return
  }

  const parentContactedAt = status === 'absent' && parentContacted
    ? (parentContactedDate ? new Date(parentContactedDate + 'T12:00:00') : new Date())
    : null

  const existing = await db
    .select()
    .from(registerEntries)
    .where(
      and(
        eq(registerEntries.childId, childId),
        eq(registerEntries.sessionType, sessionType),
        eq(registerEntries.date, date)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(registerEntries)
      .set({
        status,
        absenceReason: status === 'absent' ? absenceReason : null,
        parentContacted: status === 'absent' ? parentContacted : null,
        parentContactedAt,
        markedById: userId || null,
      })
      .where(eq(registerEntries.id, existing[0].id))
  } else {
    await db.insert(registerEntries).values({
      childId,
      sessionType,
      date,
      status,
      absenceReason: status === 'absent' ? absenceReason : null,
      parentContacted: status === 'absent' ? parentContacted : null,
      parentContactedAt,
      markedById: userId || null,
    })
  }

  revalidatePath('/register')
}

export async function saveRegisterNote(
  childId: string,
  sessionType: 'morning' | 'afternoon' | 'full_day',
  date: string,
  note: string,
  userId: string,
) {
  const existing = await db
    .select()
    .from(registerNotes)
    .where(
      and(
        eq(registerNotes.childId, childId),
        eq(registerNotes.sessionType, sessionType),
        eq(registerNotes.date, date),
      )
    )
    .limit(1)

  if (note.trim() === '') {
    if (existing[0]) {
      await db.delete(registerNotes).where(eq(registerNotes.id, existing[0].id))
    }
  } else if (existing[0]) {
    await db
      .update(registerNotes)
      .set({ note: note.trim(), addedById: userId || null, updatedAt: new Date() })
      .where(eq(registerNotes.id, existing[0].id))
  } else {
    await db.insert(registerNotes).values({
      childId,
      sessionType,
      date,
      note: note.trim(),
      addedById: userId || null,
    })
  }

  revalidatePath('/register')
}
