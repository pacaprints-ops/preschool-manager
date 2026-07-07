import { db } from '@/lib/db'
import { children, schoolTeddyLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TeddyClient from './TeddyClient'

export default async function TeddyPage() {
  const [activeChildren, allEntries] = await Promise.all([
    db.select({ id: children.id, firstName: children.firstName, lastName: children.lastName })
      .from(children)
      .where(eq(children.archived, false))
      .orderBy(children.firstName),
    db.select().from(schoolTeddyLog).orderBy(schoolTeddyLog.takenDate),
  ])

  return (
    <TeddyClient
      activeChildren={activeChildren}
      allEntries={allEntries.map(e => ({
        id: e.id,
        childId: e.childId,
        takenDate: e.takenDate,
        returnedDate: e.returnedDate ?? null,
        notes: e.notes ?? null,
      }))}
    />
  )
}
