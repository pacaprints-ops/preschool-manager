import { db } from '@/lib/db'
import { invoices, children, terms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import InvoicingClient from './InvoicingClient'

export default async function InvoicingPage() {
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

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Invoicing</h1>
      <p className="text-sm text-gray-500 mb-6">Generate and manage term invoices for all active children.</p>
      <InvoicingClient terms={allTerms} invoices={allInvoices} activeChildren={activeChildren} />
    </div>
  )
}
