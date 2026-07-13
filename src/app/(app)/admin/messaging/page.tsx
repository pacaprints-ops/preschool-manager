import { db } from '@/lib/db'
import { parentMessages, children, users, messageTemplates } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MessagingClient from './MessagingClient'

export default async function MessagingPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/')

  const allMessages = await db
    .select()
    .from(parentMessages)
    .orderBy(desc(parentMessages.sentAt))

  const activeChildren = await db
    .select({ id: children.id, firstName: children.firstName, lastName: children.lastName, parentEmail: children.parentEmail })
    .from(children)
    .where(eq(children.archived, false))

  const parentCount = activeChildren.filter(c => c.parentEmail).length

  const allStaffRaw = await db
    .select({ id: users.id, name: users.name, jobTitle: users.jobTitle })
    .from(users)
    .orderBy(users.name)
  const seenNames = new Set<string>()
  const staff = allStaffRaw.filter(s => {
    if (seenNames.has(s.name)) return false
    seenNames.add(s.name)
    return true
  })

  const templates = await db.select().from(messageTemplates).orderBy(messageTemplates.name)

  const serialised = allMessages.map(m => ({
    id: m.id,
    subject: m.subject,
    body: m.body,
    recipientCount: m.recipientCount,
    sentByName: m.sentByName,
    sentAt: m.sentAt.toISOString(),
    filterType: m.filterType,
  }))

  const childList = activeChildren.map(c => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    hasEmail: !!c.parentEmail,
  }))

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Parent Messaging</h1>
      <p className="text-sm text-gray-500 mb-6">
        Send messages to parents. Each parent receives a separate email — no one can see other addresses.
      </p>
      <MessagingClient messages={serialised} parentCount={parentCount} childList={childList} staff={staff} templates={templates} />
    </div>
  )
}
