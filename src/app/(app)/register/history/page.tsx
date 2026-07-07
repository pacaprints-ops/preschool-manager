import { db } from '@/lib/db'
import { registerEntries, children } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { format, subDays } from 'date-fns'
import RegisterHistoryClient from './RegisterHistoryClient'

export default async function RegisterHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const selectedDate = date ?? yesterday

  const entries = await db
    .select({ entry: registerEntries, child: children })
    .from(registerEntries)
    .innerJoin(children, eq(registerEntries.childId, children.id))
    .where(eq(registerEntries.date, selectedDate))
    .orderBy(children.lastName, children.firstName)

  const rows = entries.map(({ entry, child }) => ({
    id: entry.id,
    childId: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    sessionType: entry.sessionType,
    status: entry.status,
    absenceReason: entry.absenceReason,
    parentContacted: entry.parentContacted,
    signedInAt: entry.signedInAt ? entry.signedInAt.toISOString() : null,
    signedOutAt: entry.signedOutAt ? entry.signedOutAt.toISOString() : null,
    droppedBy: entry.droppedBy,
    rule48h: entry.rule48h,
  }))

  return (
    <div className="max-w-3xl">
      <RegisterHistoryClient date={selectedDate} rows={rows} />
    </div>
  )
}
