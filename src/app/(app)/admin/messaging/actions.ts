'use server'

import { db } from '@/lib/db'
import { parentMessages, children, childSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { sendEmail, buildParentMessageEmail } from '@/lib/email'

export async function sendParentMessage(data: {
  subject: string
  body: string
  filterType: 'all' | 'morning' | 'afternoon' | 'full_day' | 'single_child'
  childId?: string
}) {
  const session = await auth()
  const senderName = session?.user?.name ?? 'Staff'

  const activeChildren = await db
    .select({ id: children.id, parentEmail: children.parentEmail, firstName: children.firstName, lastName: children.lastName })
    .from(children)
    .where(eq(children.archived, false))

  let eligible = activeChildren.filter(c => c.parentEmail)

  if (data.filterType === 'single_child' && data.childId) {
    eligible = eligible.filter(c => c.id === data.childId)
  } else if (data.filterType !== 'all') {
    const sessionsWithType = await db
      .select({ childId: childSessions.childId })
      .from(childSessions)
      .where(eq(childSessions.sessionType, data.filterType as 'morning' | 'afternoon' | 'full_day'))
    const childIdsInSession = new Set(sessionsWithType.map(s => s.childId))
    eligible = eligible.filter(c => childIdsInSession.has(c.id))
  }

  const emails = [...new Set(eligible.map(c => c.parentEmail!))]

  const html = buildParentMessageEmail(data.subject, data.body)
  let status = 'sent'
  try {
    if (emails.length > 0) await sendEmail(emails, data.subject, html)
  } catch {
    status = 'failed'
  }

  const filterLabel = data.filterType === 'single_child' && data.childId
    ? `single:${data.childId}`
    : data.filterType

  await db.insert(parentMessages).values({
    subject: data.subject,
    body: data.body,
    recipientCount: emails.length,
    sentByName: senderName,
    filterType: filterLabel,
    status,
  })

  revalidatePath('/admin/messaging')
  return { count: emails.length, emails }
}
