import { db } from '@/lib/db'
import { users, staffSickness, staffTraining, staffHours } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const allStaff = await db.select().from(users).orderBy(users.name)

  const [sickness, training, hours] = await Promise.all([
    db.select().from(staffSickness).orderBy(staffSickness.startDate),
    db.select().from(staffTraining).orderBy(staffTraining.expiryDate),
    db.select().from(staffHours).orderBy(staffHours.date),
  ])

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Staff</h1>
      <p className="text-sm text-gray-500 mb-6">Manage hours, sickness, and training records for all staff.</p>
      <StaffClient staff={allStaff} sickness={sickness} training={training} hours={hours} />
    </div>
  )
}
