import { db } from '@/lib/db'
import { users, staffSickness, staffTraining, staffDailyAttendance, staffHours, staffMonthlyTimesheets } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const allStaff = await db
    .select({
      id: users.id, name: users.name, email: users.email, role: users.role,
      workingDays: users.workingDays,
      dbsCertNumber: users.dbsCertNumber, dbsIssueDate: users.dbsIssueDate, dbsOnUpdateService: users.dbsOnUpdateService,
      hasAllergies: users.hasAllergies, allergies: users.allergies, medicalNotes: users.medicalNotes,
      emergencyContactName: users.emergencyContactName,
      emergencyContactRelationship: users.emergencyContactRelationship,
      emergencyContactPhone: users.emergencyContactPhone,
      emergencyContactPhone2: users.emergencyContactPhone2,
    })
    .from(users)
    .orderBy(users.name)

  const [sickness, training, hoursLog, timesheets, monthlyTimesheets] = await Promise.all([
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
    db.select().from(staffMonthlyTimesheets).orderBy(asc(staffMonthlyTimesheets.year), asc(staffMonthlyTimesheets.month)),
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
        monthlyData={monthlyTimesheets}
      />
    </div>
  )
}