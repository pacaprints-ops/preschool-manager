import { db } from '@/lib/db'
import { users, staffSickness, staffTraining } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const allStaff = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, workingDays: users.workingDays })
    .from(users)
    .orderBy(users.name)

  const [sickness, training] = await Promise.all([
    db.select().from(staffSickness).orderBy(staffSickness.startDate),
    db.select().from(staffTraining).orderBy(staffTraining.expiryDate),
  ])

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Staff</h1>
      <p className="text-sm text-gray-500 mb-6">Manage rota, sickness, and training records for all staff.</p>
      <StaffClient staff={allStaff} sickness={sickness} training={training} />
    </div>
  )
}