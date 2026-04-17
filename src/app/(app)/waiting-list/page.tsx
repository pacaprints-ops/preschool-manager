import { db } from '@/lib/db'
import { waitingList } from '@/lib/db/schema'
import { ne } from 'drizzle-orm'
import WaitingListClient from './WaitingListClient'

export default async function WaitingListPage() {
  const entries = await db
    .select()
    .from(waitingList)
    .where(ne(waitingList.status, 'accepted'))
    .orderBy(waitingList.addedAt)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Waiting List</h1>
          <p className="text-sm text-gray-500 mt-0.5">{entries.length} on the list</p>
        </div>
      </div>
      <WaitingListClient entries={entries} />
    </div>
  )
}
