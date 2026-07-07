import { db } from '@/lib/db'
import { users, staffSickness, staffTraining, staffDailyAttendance, staffHours, staffMonthlyTimesheets } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import StaffClient from './StaffClient'

const staffSelect = {
  id: users.id, name: users.name, email: users.email, role: users.role,
  workingDays: users.workingDays,
  dbsCertNumber: users.dbsCertNumber, dbsIssueDate: users.dbsIssueDate, dbsOnUpdateService: users.dbsOnUpdateService,
  hasAllergies: users.hasAllergies, allergies: users.allergies, medicalNotes: users.medicalNotes,
  emergencyContactName: users.emergencyContactName,
  emergencyContactRelationship: users.emergencyContactRelationship,
  emergencyContactPhone: users.emergencyContactPhone,
  emergencyContactPhone2: users.emergencyContactPhone2,
}

export default async function StaffPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'admin'
  const currentUserId = session?.user?.id ?? ''

  const allStaffRaw = isAdmin
    ? await db.select(staffSelect).from(users).orderBy(users.name)
    : await db.select(staffSelect).from(users).where(eq(users.id, currentUserId))
  const seenNames = new Set<string>()
  const allStaff = allStaffRaw.filter(s => {
    if (seenNames.has(s.name)) return false
    seenNames.add(s.name)
    return true
  })

  const [sickness, training, hoursLog, timesheets, monthlyTimesheets] = await Promise.all([
    isAdmin
      ? db.select().from(staffSickness).orderBy(staffSickness.startDate)
      : db.select().from(staffSickness).where(eq(staffSickness.userId, currentUserId)).orderBy(staffSickness.startDate),
    isAdmin
      ? db.select().from(staffTraining).orderBy(staffTraining.expiryDate)
      : db.select().from(staffTraining).where(eq(staffTraining.userId, currentUserId)).orderBy(staffTraining.expiryDate),
    db.select({
      id: staffDailyAttendance.id,
      userId: staffDailyAttendance.userId,
      date: staffDailyAttendance.date,
      signedInAt: staffDailyAttendance.signedInAt,
      signedOutAt: staffDailyAttendance.signedOutAt,
    }).from(staffDailyAttendance)
      .where(isAdmin ? undefined as never : eq(staffDailyAttendance.userId, currentUserId))
      .orderBy(asc(staffDailyAttendance.date)),
    isAdmin
      ? db.select().from(staffHours).orderBy(asc(staffHours.date))
      : db.select().from(staffHours).where(eq(staffHours.userId, currentUserId)).orderBy(asc(staffHours.date)),
    isAdmin
      ? db.select().from(staffMonthlyTimesheets).orderBy(asc(staffMonthlyTimesheets.year), asc(staffMonthlyTimesheets.month))
      : db.select().from(staffMonthlyTimesheets).where(eq(staffMonthlyTimesheets.userId, currentUserId)).orderBy(asc(staffMonthlyTimesheets.year), asc(staffMonthlyTimesheets.month)),
  ])

  const serialisedHoursLog = hoursLog.map(h => ({
    id: h.id,
    userId: h.userId,
    date: h.date,
    signedInAt: h.signedInAt ? h.signedInAt.toISOString() : null,
    signedOutAt: h.signedOutAt ? h.signedOutAt.toISOString() : null,
  }))

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">{isAdmin ? 'Staff' : 'My Record'}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {isAdmin ? 'Manage rota, sickness, and training records for all staff.' : 'Your rota, timesheet, training and personal details.'}
      </p>
      <StaffClient
        staff={allStaff}
        sickness={sickness}
        training={training}
        hoursLog={serialisedHoursLog}
        timesheets={timesheets}
        monthlyData={monthlyTimesheets}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  )
}