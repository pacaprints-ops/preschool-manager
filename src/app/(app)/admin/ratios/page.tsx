import { db } from '@/lib/db'
import { children, childSessions, terms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import TermlyRegisterClient from './TermlyRegisterClient'

export default async function TermlyRegisterPage() {
  const [session, allChildren, allSessions, allTerms] = await Promise.all([
    auth(),
    db.select().from(children).where(eq(children.archived, false)),
    db.select().from(childSessions),
    db.select().from(terms).orderBy(terms.startDate),
  ])

  const isAdmin = session?.user?.role === 'admin'

  const childList = allChildren.map(child => ({
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    dateOfBirth: child.dateOfBirth,
    dep: child.dep ?? false,
    eypp: child.eypp ?? false,
    sen: child.sen ?? false,
    needs1to1: child.needs1to1 ?? false,
    sessions: allSessions
      .filter(s => s.childId === child.id)
      .map(s => ({ day: s.day, sessionType: s.sessionType })),
  }))

  return <TermlyRegisterClient childrenData={childList} terms={allTerms} isAdmin={isAdmin} />
}
