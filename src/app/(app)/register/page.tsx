import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  children, childSessions, registerEntries, registerNotes, accidentForms,
  staffDailyAttendance, buildingVisitors, users, childHolidays, extraSessions,
} from '@/lib/db/schema'
import { eq, and, inArray, isNull, lte, gte, desc, asc } from 'drizzle-orm'
import { format } from 'date-fns'
import RegisterClient from './RegisterClient'

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// True if the child's birthday (month+day) falls within the next `days` days, rolling from today (inclusive)
function isBirthdayWithinDays(dob: string, todayStr: string, days: number): boolean {
  const today = new Date(todayStr + 'T12:00:00')
  const birth = new Date(dob + 'T12:00:00')
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (birth.getMonth() === d.getMonth() && birth.getDate() === d.getDate()) return true
  }
  return false
}

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
    .orderBy(desc(children.dateOfBirth), asc(children.firstName), asc(children.lastName))

  // All active children — used for the rolling 7-day birthday flag and the
  // "add extra session" picker (a child not on their recurring schedule today)
  const allActiveChildren = await db
    .select()
    .from(children)
    .where(eq(children.archived, false))

  const upcomingBirthdays = allActiveChildren
    .filter(c => isBirthdayWithinDays(c.dateOfBirth, todayStr, 7))
    .map(c => ({ firstName: c.firstName, lastName: c.lastName }))

  // One-off extra sessions booked for today, outside the recurring weekly schedule
  const extraSessionsToday = await db
    .select()
    .from(extraSessions)
    .where(eq(extraSessions.date, todayStr))

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

  // Extra sessions for a child not already on today's recurring schedule
  // (avoid a duplicate row if staff added an extra session for a day/type they already attend)
  const recurringKeys = new Set(attendingToday.map(r => `${r.child.id}-${r.session.sessionType}`))
  const genuineExtras = extraSessionsToday.filter(es => !recurringKeys.has(`${es.childId}-${es.sessionType}`))
  const childById = new Map(allActiveChildren.map(c => [c.id, c]))

  // Unsigned accident forms for today's children
  const todayChildIds = [...new Set([
    ...attendingToday.map(r => r.child.id),
    ...genuineExtras.map(es => es.childId),
  ])]
  const unsignedAccidents = todayChildIds.length > 0
    ? await db.select({ childId: accidentForms.childId })
        .from(accidentForms)
        .where(and(
          inArray(accidentForms.childId, todayChildIds),
          isNull(accidentForms.parentSignature),
        ))
    : []
  const unsignedChildIds = new Set(unsignedAccidents.map(f => f.childId))

  // Children booked as on holiday today
  const holidaysToday = todayChildIds.length > 0
    ? await db.select({ childId: childHolidays.childId })
        .from(childHolidays)
        .where(and(
          inArray(childHolidays.childId, todayChildIds),
          lte(childHolidays.startDate, todayStr),
          gte(childHolidays.endDate, todayStr),
        ))
    : []
  const onHolidayChildIds = new Set(holidaysToday.map(h => h.childId))

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
      onHoliday: onHolidayChildIds.has(child.id),
      isExtraSession: false,
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
        pickedUpBy: entry.pickedUpBy ?? null,
        rule48h: entry.rule48h,
      } : null,
      sessionNote: noteMap[`${child.id}-${s.sessionType}`] ?? null,
      hasUnsignedAccident: unsignedChildIds.has(child.id),
    }
  })

  const extraRows = genuineExtras.flatMap(es => {
    const child = childById.get(es.childId)
    if (!child) return []
    const entry = entryMap[`${child.id}-${es.sessionType}`] ?? null
    return [{
      childId: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      sessionType: es.sessionType,
      dateOfBirth: child.dateOfBirth,
      needs1to1: child.needs1to1,
      hasAllergies: child.hasAllergies,
      allergies: child.allergies,
      medicalNotes: child.medicalNotes,
      onHoliday: onHolidayChildIds.has(child.id),
      isExtraSession: true,
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
        pickedUpBy: entry.pickedUpBy ?? null,
        rule48h: entry.rule48h,
      } : null,
      sessionNote: noteMap[`${child.id}-${es.sessionType}`] ?? null,
      hasUnsignedAccident: unsignedChildIds.has(child.id),
    }]
  })

  const allRegisterRows = [...registerRows, ...extraRows]

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

  const seenNames = new Set<string>()
  const uniqueStaff = allStaff.filter(s => {
    if (seenNames.has(s.name)) return false
    seenNames.add(s.name)
    return true
  })

  const allChildrenForPicker = allActiveChildren
    .map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName }))
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))

  return (
    <RegisterClient
      rows={allRegisterRows}
      allChildren={allChildrenForPicker}
      todayStr={todayStr}
      dayName={dayName}
      presentCount={presentCount}
      userId={session?.user?.id ?? ''}
      userName={session?.user?.name ?? session?.user?.email ?? ''}
      initialNotes={noteMap}
      staffAttendance={staffRows}
      visitors={visitorRows}
      allStaff={uniqueStaff}
      needsStaffSignIn={staffAttendanceToday.length === 0}
      upcomingBirthdays={upcomingBirthdays}
    />
  )
}
