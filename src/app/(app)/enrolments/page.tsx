import { db } from '@/lib/db'
import { children, childSessions, enrolments, users, policies } from '@/lib/db/schema'
import { eq, and, isNotNull, inArray, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import EnrolmentsClient from './EnrolmentsClient'

// Reception intake cutoff: children born on/before 31 Aug in (intakeYear - 4) are
// old enough to start school that September, so they're not part of the pre-school
// roster for that intake year.
function schoolCutoff(intakeYear: number): string {
  return `${intakeYear - 4}-08-31`
}

// Always the next 3 Septembers from today. The window rolls itself forward —
// once 1 September passes, that year drops off and a new one appears at the end.
function nextThreeSeptembers(): number[] {
  const now = new Date()
  const nearest = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear() // Sept = month index 8
  return [nearest, nearest + 1, nearest + 2]
}

export default async function EnrolmentsPage() {
  const years = nextThreeSeptembers()

  const [session, allActive, allSessions, allEnrolments, allStaff, keyChildrenCounts, allPolicies] = await Promise.all([
    auth(),
    db.select().from(children).where(eq(children.archived, false)),
    db.select().from(childSessions),
    db.select().from(enrolments).where(inArray(enrolments.intakeYear, years)).orderBy(enrolments.addedAt),
    db.select({ id: users.id, name: users.name, workingDays: users.workingDays }).from(users).orderBy(users.name),
    db.select({ keyWorkerId: children.keyWorkerId, count: sql<number>`cast(count(*) as int)` })
      .from(children)
      .where(and(eq(children.archived, false), isNotNull(children.keyWorkerId)))
      .groupBy(children.keyWorkerId),
    db.select({ id: policies.id, name: policies.name, content: policies.content })
      .from(policies)
      .where(eq(policies.active, true))
      .orderBy(policies.sortOrder),
  ])

  const isAdmin = session?.user?.role === 'admin'

  const cohorts = years.map((year, i) => {
    const cutoff = schoolCutoff(year)

    const returningChildren = allActive
      .filter(c => c.dateOfBirth > cutoff)
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

    const newStarters = allEnrolments
      .filter(e => e.intakeYear === year)
      .map(e => ({
        id: e.id,
        firstName: e.childFirstName,
        lastName: e.childLastName,
        dateOfBirth: e.dateOfBirth ?? null,
        startDate: e.startDate ?? null,
        parentCarerName: e.parentCarerName,
        contactPhone: e.contactPhone ?? null,
        contactEmail: e.contactEmail ?? null,
        daysSessions: e.daysSessions ? (JSON.parse(e.daysSessions) as Record<string, string>) : {},
        notes: e.notes ?? null,
        welcomeFeePaid: e.welcomeFeePaid ?? false,
        depositPaid: e.depositPaid ?? false,
        welcomePackGivenAt: e.welcomePackGivenAt ?? null,
        tshirtGivenAt: e.tshirtGivenAt ?? null,
        settlingSession1: e.settlingSession1 ?? null,
        settlingSession2: e.settlingSession2 ?? null,
        settlingSession3: e.settlingSession3 ?? null,
        confirmedKeyworkerId: e.confirmedKeyworkerId ?? null,
        promotedChildId: e.promotedChildId ?? null,
      }))

    // Only the nearest (current) September surfaces a leavers list — the other
    // two are too far out for "archive these now" to make sense.
    const leavingChildren = i === 0
      ? allActive
          .filter(c => c.dateOfBirth <= cutoff)
          .map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, dateOfBirth: c.dateOfBirth }))
          .sort((a, b) => a.dateOfBirth.localeCompare(b.dateOfBirth))
      : null

    return { intakeYear: year, returningChildren, newStarters, leavingChildren }
  })

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
      cohorts={cohorts}
      isAdmin={isAdmin}
      staffData={staffData}
      policies={allPolicies}
    />
  )
}
