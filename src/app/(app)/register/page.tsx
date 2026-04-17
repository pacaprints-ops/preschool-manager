import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { children, childSessions, registerEntries } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { format } from 'date-fns'
import RegisterClient from './RegisterClient'

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default async function RegisterPage() {
  const session = await auth()
  const today = new Date()
  const dayName = DAYS[today.getDay()] as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  const todayStr = format(today, 'yyyy-MM-dd')

  // Get all active children attending today
  const attendingToday = await db
    .select({
      child: children,
      session: childSessions,
    })
    .from(childSessions)
    .innerJoin(children, eq(childSessions.childId, children.id))
    .where(
      and(
        eq(childSessions.day, dayName),
        eq(children.archived, false)
      )
    )
    .orderBy(children.firstName)

  // Get existing register entries for today
  const existingEntries = await db
    .select()
    .from(registerEntries)
    .where(eq(registerEntries.date, todayStr))

  const entryMap = Object.fromEntries(
    existingEntries.map(e => [`${e.childId}-${e.sessionType}`, e])
  )

  const registerRows = attendingToday.map(({ child, session: s }) => ({
    childId: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    sessionType: s.sessionType,
    hasAllergies: child.hasAllergies,
    allergies: child.allergies,
    existing: entryMap[`${child.id}-${s.sessionType}`] ?? null,
  }))

  const presentCount = existingEntries.filter(e => e.status === 'present').length

  return (
    <RegisterClient
      rows={registerRows}
      todayStr={todayStr}
      dayName={dayName}
      presentCount={presentCount}
      totalCount={registerRows.length}
      userId={session?.user?.id ?? ''}
    />
  )
}
