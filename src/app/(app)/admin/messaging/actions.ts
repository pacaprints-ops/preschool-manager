'use server'

import { db } from '@/lib/db'
import { parentMessages, children, childSessions, users, messageTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { sendEmail, buildParentMessageEmail } from '@/lib/email'

export async function sendParentMessage(data: {
  subject: string
  body: string
  filterType: 'all' | 'morning' | 'afternoon' | 'full_day' | 'single_child' | `day:${string}`
  childId?: string
  sentByUserId: string
  attachment?: { filename: string; contentBase64: string }
}) {
  const [sender] = await db.select().from(users).where(eq(users.id, data.sentByUserId)).limit(1)
  const senderName = sender?.name ?? 'Staff'

  const activeChildren = await db
    .select({ id: children.id, parentEmail: children.parentEmail, firstName: children.firstName, lastName: children.lastName })
    .from(children)
    .where(eq(children.archived, false))

  let eligible = activeChildren.filter(c => c.parentEmail)

  if (data.filterType === 'single_child' && data.childId) {
    eligible = eligible.filter(c => c.id === data.childId)
  } else if (data.filterType.startsWith('day:')) {
    const day = data.filterType.replace('day:', '') as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
    const sessionsOnDay = await db
      .select({ childId: childSessions.childId })
      .from(childSessions)
      .where(eq(childSessions.day, day))
    const childIdsOnDay = new Set(sessionsOnDay.map(s => s.childId))
    eligible = eligible.filter(c => childIdsOnDay.has(c.id))
  } else if (data.filterType !== 'all') {
    const sessionsWithType = await db
      .select({ childId: childSessions.childId })
      .from(childSessions)
      .where(eq(childSessions.sessionType, data.filterType as 'morning' | 'afternoon' | 'full_day'))
    const childIdsInSession = new Set(sessionsWithType.map(s => s.childId))
    eligible = eligible.filter(c => childIdsInSession.has(c.id))
  }

  const emails = [...new Set(eligible.map(c => c.parentEmail!))]

  const html = buildParentMessageEmail(data.subject, data.body, sender ? { name: sender.name, jobTitle: sender.jobTitle } : undefined)
  let status = 'sent'
  try {
    if (emails.length > 0) await sendEmail(emails, data.subject, html, data.attachment)
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

export async function addTemplate(name: string, subject: string, body: string) {
  const [template] = await db.insert(messageTemplates).values({ name, subject, body }).returning()
  revalidatePath('/admin/messaging')
  return template
}

export async function deleteTemplate(id: string) {
  await db.delete(messageTemplates).where(eq(messageTemplates.id, id))
  revalidatePath('/admin/messaging')
}
