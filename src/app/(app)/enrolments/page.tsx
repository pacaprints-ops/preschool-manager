import { db } from '@/lib/db'
import { children, childSessions, enrolments, users } from '@/lib/db/schema'
import { eq, and, isNotNull, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import EnrolmentsClient from './EnrolmentsClient'

const INTAKE_YEAR = 2027
// Children born after this date will NOT be starting school in September 2027
const SCHOOL_AGE_CUTOFF = '2023-08-31'

export default async function EnrolmentsPage() {
  const [session, allActive, allSessions, newStartersRaw, allStaff, keyChildrenCounts] = await Promise.all([
    auth(),
    db.select().from(children).where(eq(children.archived, false)),
    db.select().from(childSessions),
    db.select().from(enrolments).where(eq(enrolments.intakeYear, INTAKE_YEAR)).orderBy(enrolments.addedAt),
    db.select({ id: users.id, name: users.name, workingDays: users.workingDays }).from(users).orderBy(users.name),
    db.select({ keyWorkerId: children.keyWorkerId, count: sql<number>`cast(count(*) as int)` })
      .from(children)
      .where(and(eq(children.archived, false), isNotNull(children.keyWorkerId)))
      .groupBy(children.keyWorkerId),
  ])

  const isAdmin = session?.user?.role === 'admin'

  const returningChildren = allActive
    .filter(c => c.dateOfBirth > SCHOOL_AGE_CUTOFF)
    .map(c => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      dateOfBirth: c.dateOfBirth,
      needs1to1: c.needs1to1 ?? false,
      sessions: allSessions
        .filter(s => s.childId === c.id)
        .map(s => ({ day: s.day, sessionType: s.sessionType })),
    }))
    .sort((a, b) => a.dateOfBirth.localeCompare(b.dateOfBirth))

  const newStarters = newStartersRaw.map(e => ({
    id: e.id,
    firstName: e.childFirstName,
    lastName: e.childLastName,
    dateOfBirth: e.dateOfBirth ?? null,
    parentCarerName: e.parentCarerName,
    contactPhone: e.contactPhone ?? null,
    contactEmail: e.contactEmail ?? null,
    daysSessions: e.daysSessions
      ? (JSON.parse(e.daysSessions) as Record<string, string>)
      : {},
    notes: e.notes ?? null,
    welcomeFeePaid: e.welcomeFeePaid ?? false,
    depositPaid: e.depositPaid ?? false,
    confirmedKeyworkerId: e.confirmedKeyworkerId ?? null,
    promotedChildId: e.promotedChildId ?? null,
  }))

  const seenNames = new Set<string>()
  const staffData = allStaff
    .filter(s => {
      if (seenNames.has(s.name)) return false
      seenNames.add(s.name)
      return true
    })
    .map(s => {
      const kc = keyChildrenCounts.find(k => k.keyWorkerId === s.id)
      return { id: s.id, name: s.name, workingDays: s.workingDays, keyChildrenCount: kc?.count ?? 0 }
    })

  return (
    <EnrolmentsClient
      returningChildren={returningChildren}
      newStarters={newStarters}
      intakeYear={INTAKE_YEAR}
      isAdmin={isAdmin}
      staffData={staffData}
    />
  )
}
