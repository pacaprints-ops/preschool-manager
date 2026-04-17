import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import NewChildForm from './NewChildForm'

export default async function NewChildPage() {
  const staff = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, 'staff'))

  const allStaff = await db.select({ id: users.id, name: users.name }).from(users)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Add New Child</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details below. You can add sessions, contacts and medical info after saving.</p>
      </div>
      <NewChildForm staff={allStaff} />
    </div>
  )
}
