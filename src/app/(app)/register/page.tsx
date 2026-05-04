import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { children, childSessions, registerEntries, registerNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { format } from 'date-fns'
import RegisterClient from './RegisterClient'

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default async function RegisterPage() {
  const session = await auth()
  const today = new Date()
  const dayName = DAYS[today.getDay()] as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  const todayStr = format(today, 'yyyy-MM-dd')

  const attendingToday = await db
    .select({ child: children, session: childSessions })
    .from(childSessions)
    .innerJoin(children, eq(childSessions.childId, children.id))
    .where(and(eq(childSessions.day, dayName), eq(children.archived, false)))
    .orderBy(children.firstName)

  const existingEntries = await db
    .select()
    .from(registerEntries)
    .where(eq(registerEntries.date, todayStr))

  const todayNotes = await db
    .select()
    .from(registerNotes)
    .where(eq(registerNotes.date, todayStr))

  const entryMap = Object.fromEntries(
    existingEntries.map(e => [`${e.childId}-${e.sessionType}`, e])
  )

  const noteMap = Object.fromEntries(
    todayNotes.map(n => [`${n.childId}-${n.sessionType}`, n.note])
  )

  const registerRows = attendingToday.map(({ child, session: s }) => {
    const entry = entryMap[`${child.id}-${s.sessionType}`] ?? null
    return {
      childId: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      sessionType: s.sessionType,
      dateOfBirth: child.dateOfBirth,
      needs1to1: child.needs1to1,
      hasAllergies: child.hasAllergies,
      allergies: child.allergies,
      medicalNotes: child.medicalNotes,
      existing: entry ? {
        id: entry.id,
        status: entry.status,
        absenceReason: entry.absenceReason,
        parentContacted: entry.parentContacted,
        parentContactedDate: entry.parentContactedAt
          ? entry.parentContactedAt.toISOString().slice(0, 10)
          : null,
        signedOutAt: entry.signedOutAt ? entry.signedOutAt.toISOString() : null,
      } : null,
      sessionNote: noteMap[`${child.id}-${s.sessionType}`] ?? null,
    }
  })

  const presentCount = existingEntries.filter(e => e.status === 'present').length

  return (
    <RegisterClient
      rows={registerRows}
      todayStr={todayStr}
      dayName={dayName}
      presentCount={presentCount}
      totalCount={registerRows.length}
      userId={session?.user?.id ?? ''}
      initialNotes={noteMap}
    />
  )
}
