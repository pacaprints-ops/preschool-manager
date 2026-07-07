import { db } from '@/lib/db'
import { invoices, children, terms, lateFeeInvoices, sessionConfig, invoiceReminders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import InvoicingClient from './InvoicingClient'

export default async function InvoicingPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/')
  const allTerms = await db.select().from(terms).orderBy(terms.startDate)

  const allInvoices = await db
    .select({ invoice: invoices, child: children })
    .from(invoices)
    .innerJoin(children, eq(invoices.childId, children.id))
    .orderBy(children.lastName)

  const activeChildren = await db
    .select({ id: children.id, firstName: children.firstName, lastName: children.lastName })
    .from(children)
    .where(eq(children.archived, false))
    .orderBy(children.lastName)

  const allLateFees = await db
    .select({ fee: lateFeeInvoices, child: children })
    .from(lateFeeInvoices)
    .innerJoin(children, eq(lateFeeInvoices.childId, children.id))
    .orderBy(lateFeeInvoices.date)

  const sessionConfigs = await db.select().from(sessionConfig)

  const allReminders = await db
    .select()
    .from(invoiceReminders)
    .orderBy(invoiceReminders.sentAt)

  const serialisedReminders = allReminders.map(r => ({
    id: r.id,
    invoiceId: r.invoiceId,
    sentAt: r.sentAt.toISOString(),
    email: r.email,
    type: r.type,
  }))

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Invoicing</h1>
      <p className="text-sm text-gray-500 mb-6">Generate and manage term invoices for all active children.</p>
      <InvoicingClient
        terms={allTerms}
        invoices={allInvoices}
        activeChildren={activeChildren}
        lateFees={allLateFees}
        sessionConfigs={sessionConfigs}
        reminders={serialisedReminders}
      />
    </div>
  )
}
