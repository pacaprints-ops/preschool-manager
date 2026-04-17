import { db } from '@/lib/db'
import { children, childSessions, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import ChildrenClient from './ChildrenClient'

export default async function ChildrenPage() {
  const activeChildren = await db
    .select({ child: children, keyWorker: users })
    .from(children)
    .leftJoin(users, eq(children.keyWorkerId, users.id))
    .where(eq(children.archived, false))
    .orderBy(children.firstName)

  const sessions = await db.select().from(childSessions)
  const sessionMap: Record<string, typeof sessions> = {}
  for (const s of sessions) {
    if (!sessionMap[s.childId]) sessionMap[s.childId] = []
    sessionMap[s.childId].push(s)
  }

  const allKeyWorkers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .orderBy(users.name)

  const childRows = activeChildren.map(({ child, keyWorker }) => ({
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    dateOfBirth: child.dateOfBirth,
    hasAllergies: child.hasAllergies,
    keyWorkerName: keyWorker?.name ?? null,
    sessions: (sessionMap[child.id] ?? []).map(s => ({
      day: s.day,
      sessionType: s.sessionType,
      isFunded: s.isFunded,
    })),
  }))

  return <ChildrenClient children={childRows} keyWorkers={allKeyWorkers} />
}
