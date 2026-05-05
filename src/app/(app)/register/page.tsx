import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  children, childSessions, registerEntries, registerNotes, accidentForms,
  staffDailyAttendance, buildingVisitors, users,
} from '@/lib/db/schema'
import { eq, and, inArray, isNull, asc } from 'drizzle-orm'
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
    .orderBy(asc(children.dateOfBirth))

  const [
    existingEntries,
    todayNotes,
    staffAttendanceToday,
    visitorsToday,
    allStaff,
  ] = await Promise.all([
    db.select().from(registerEntries).where(eq(registerEntries.date, todayStr)),
    db.select().from(registerNotes).where(eq(registerNotes.date, todayStr)),
    db.select().from(staffDailyAttendance).where(eq(staffDailyAttendance.date, todayStr)).orderBy(staffDailyAttendance.createdAt),
    db.select().from(buildingVisitors).where(eq(buildingVisitors.date, todayStr)).orderBy(buildingVisitors.signedInAt),
    db.select({ id: users.id, name: users.name, workingDays: users.workingDays }).from(users).orderBy(users.name),
  ])

  // Unsigned accident forms for today's children
  const todayChildIds = [...new Set(attendingToday.map(r => r.child.id))]
  const unsignedAccidents = todayChildIds.length > 0
    ? await db.select({ childId: accidentForms.childId })
        .from(accidentForms)
        .where(and(
          inArray(accidentForms.childId, todayChildIds),
          isNull(accidentForms.parentSignature),
        ))
    : []
  const unsignedChildIds = new Set(unsignedAccidents.map(f => f.childId))

  const entryMap = Object.fromEntries(
    existingEntries.map(e => [`${e.childId}-${e.sessionType}`, e])
  )

  const noteMap = Object.fromEntries(
    todayNotes.map(n => [`${n.childId}-${n.sessionType}`, {
      note: n.note,
      completed: n.completed,
      completedByName: n.completedByName,
    }])
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
        signedInAt: entry.signedInAt ? entry.signedInAt.toISOString() : null,
        signedOutAt: entry.signedOutAt ? entry.signedOutAt.toISOString() : null,
        droppedBy: entry.droppedBy ?? null,
        rule48h: entry.rule48h,
      } : null,
      sessionNote: noteMap[`${child.id}-${s.sessionType}`] ?? null,
      hasUnsignedAccident: unsignedChildIds.has(child.id),
    }
  })

  const presentCount = existingEntries.filter(e => e.status === 'present').length

  const staffRows = staffAttendanceToday.map(s => ({
    id: s.id,
    staffName: s.staffName,
    signedInAt: s.signedInAt ? s.signedInAt.toISOString() : null,
    signedOutAt: s.signedOutAt ? s.signedOutAt.toISOString() : null,
  }))

  const visitorRows = visitorsToday.map(v => ({
    id: v.id,
    name: v.name,
    organisation: v.organisation,
    signedInAt: v.signedInAt ? v.signedInAt.toISOString() : null,
    signedOutAt: v.signedOutAt ? v.signedOutAt.toISOString() : null,
  }))

  return (
    <RegisterClient
      rows={registerRows}
      todayStr={todayStr}
      dayName={dayName}
      presentCount={presentCount}
      totalCount={registerRows.length}
      userId={session?.user?.id ?? ''}
      userName={session?.user?.name ?? session?.user?.email ?? ''}
      initialNotes={noteMap}
      staffAttendance={staffRows}
      visitors={visitorRows}
      allStaff={allStaff}
      needsStaffSignIn={staffAttendanceToday.length === 0}
    />
  )
}
