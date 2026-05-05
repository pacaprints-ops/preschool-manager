'use server'

import { db } from '@/lib/db'
import { registerEntries, registerNotes, lateFeeInvoices, childSessions } from '@/lib/db/schema'
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
    // Only set signedInAt if marking present for the first time (preserve original arrival time)
    const signedInAt = status === 'present' && !existing[0].signedInAt ? new Date() : undefined
    await db
      .update(registerEntries)
      .set({
        status,
        absenceReason: status === 'absent' ? absenceReason : null,
        parentContacted: status === 'absent' ? parentContacted : null,
        parentContactedAt,
        markedById: userId || null,
        ...(signedInAt !== undefined ? { signedInAt } : {}),
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
      signedInAt: status === 'present' ? new Date() : null,
    })
  }

  revalidatePath('/register')
}

export async function saveDroppedBy(
  childId: string,
  sessionType: 'morning' | 'afternoon' | 'full_day',
  date: string,
  droppedBy: string,
) {
  await db
    .update(registerEntries)
    .set({ droppedBy: droppedBy.trim() || null })
    .where(
      and(
        eq(registerEntries.childId, childId),
        eq(registerEntries.sessionType, sessionType),
        eq(registerEntries.date, date),
      )
    )
  revalidatePath('/register')
}

// signOutTimeLocal: "HH:MM" in local time (e.g. "14:20" or "15:05")
export async function signOutChild(
  childId: string,
  sessionType: 'morning' | 'afternoon' | 'full_day',
  date: string,
  signOutTimeLocal: string,
) {
  const signedOutAt = new Date(`${date}T${signOutTimeLocal}:00`)

  await db
    .update(registerEntries)
    .set({ signedOutAt })
    .where(
      and(
        eq(registerEntries.childId, childId),
        eq(registerEntries.sessionType, sessionType),
        eq(registerEntries.date, date),
      )
    )

  // Check for late pickup (after 15:00)
  const [hours, minutes] = signOutTimeLocal.split(':').map(Number)
  const totalMins = hours * 60 + minutes
  const sessionEndMins = 15 * 60
  const minutesLate = totalMins - sessionEndMins

  if (minutesLate > 0) {
    const totalAmount = (minutesLate * 1.00).toFixed(2)
    // Replace any existing late fee for this child on this date
    await db.delete(lateFeeInvoices).where(
      and(eq(lateFeeInvoices.childId, childId), eq(lateFeeInvoices.date, date))
    )
    await db.insert(lateFeeInvoices).values({
      childId,
      date,
      signedOutAt,
      minutesLate,
      ratePerMinute: '1.00',
      totalAmount,
    })
  } else {
    // Remove any previously created late fee (e.g. if re-signed out earlier)
    await db.delete(lateFeeInvoices).where(
      and(eq(lateFeeInvoices.childId, childId), eq(lateFeeInvoices.date, date))
    )
  }

  revalidatePath('/register')
  revalidatePath('/admin/invoicing')
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

export async function setNoteCompleted(
  childId: string,
  sessionType: 'morning' | 'afternoon' | 'full_day',
  date: string,
  completed: boolean,
  completedByName: string | null,
) {
  await db
    .update(registerNotes)
    .set({ completed, completedByName: completed ? completedByName : null, updatedAt: new Date() })
    .where(
      and(
        eq(registerNotes.childId, childId),
        eq(registerNotes.sessionType, sessionType),
        eq(registerNotes.date, date),
      )
    )
  revalidatePath('/register')
}

const SCHOOL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

export async function apply48HourRule(childId: string, absenceDate: string) {
  const next = new Date(absenceDate + 'T12:00:00')
  next.setDate(next.getDate() + 1)
  const nextDateStr = next.toISOString().slice(0, 10)
  const allDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const nextDayName = allDays[next.getDay()]

  if (!SCHOOL_DAYS.includes(nextDayName as typeof SCHOOL_DAYS[number])) return

  const sessions = await db
    .select()
    .from(childSessions)
    .where(and(
      eq(childSessions.childId, childId),
      eq(childSessions.day, nextDayName as typeof SCHOOL_DAYS[number]),
    ))

  for (const session of sessions) {
    const existing = await db
      .select()
      .from(registerEntries)
      .where(and(
        eq(registerEntries.childId, childId),
        eq(registerEntries.sessionType, session.sessionType),
        eq(registerEntries.date, nextDateStr),
      ))
      .limit(1)

    if (existing.length > 0) {
      if (existing[0].status !== 'absent') {
        await db.update(registerEntries)
          .set({ status: 'absent', absenceReason: 'Sick (48hr rule)', rule48h: true })
          .where(eq(registerEntries.id, existing[0].id))
      }
    } else {
      await db.insert(registerEntries).values({
        childId,
        sessionType: session.sessionType,
        date: nextDateStr,
        status: 'absent',
        absenceReason: 'Sick (48hr rule)',
        rule48h: true,
      })
    }
  }

  revalidatePath('/register')
}
