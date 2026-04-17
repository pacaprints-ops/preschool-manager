'use server'

import { db } from '@/lib/db'
import { registerEntries } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type MarkAttendanceInput = {
  childId: string
  sessionType: 'morning' | 'afternoon' | 'full_day'
  date: string
  status: 'present' | 'absent' | null
  absenceReason: string | null
  parentContacted: boolean
  userId: string
}

export async function markAttendance(input: MarkAttendanceInput) {
  const { childId, sessionType, date, status, absenceReason, parentContacted, userId } = input

  // Remove entry if status is toggled off
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

  // Upsert the register entry
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
        parentContactedAt: status === 'absent' && parentContacted ? new Date() : null,
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
      parentContactedAt: status === 'absent' && parentContacted ? new Date() : null,
      markedById: userId || null,
    })
  }

  revalidatePath('/register')
}
