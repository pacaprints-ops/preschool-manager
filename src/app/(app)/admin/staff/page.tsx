import { db } from '@/lib/db'
import { users, staffSickness, staffTraining, staffDailyAttendance, staffHours } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const allStaff = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, workingDays: users.workingDays, dbsCertNumber: users.dbsCertNumber, dbsIssueDate: users.dbsIssueDate, dbsOnUpdateService: users.dbsOnUpdateService })
    .from(users)
    .orderBy(users.name)

  const [sickness, training, hoursLog, timesheets] = await Promise.all([
    db.select().from(staffSickness).orderBy(staffSickness.startDate),
    db.select().from(staffTraining).orderBy(staffTraining.expiryDate),
    db.select({
      id: staffDailyAttendance.id,
      userId: staffDailyAttendance.userId,
      date: staffDailyAttendance.date,
      signedInAt: staffDailyAttendance.signedInAt,
      signedOutAt: staffDailyAttendance.signedOutAt,
    }).from(staffDailyAttendance).orderBy(asc(staffDailyAttendance.date)),
    db.select().from(staffHours).orderBy(asc(staffHours.date)),
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
      <h1 className="text-xl font-bold text-gray-800 mb-1">Staff</h1>
      <p className="text-sm text-gray-500 mb-6">Manage rota, sickness, and training records for all staff.</p>
      <StaffClient
        staff={allStaff}
        sickness={sickness}
        training={training}
        hoursLog={serialisedHoursLog}
        timesheets={timesheets}
      />
    </div>
  )
}