import { db } from '@/lib/db'
import { terms, sessionConfig, bankHolidays } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import TermsClient from './TermsClient'

export default async function TermsPage() {
  const allTerms = await db.select().from(terms).orderBy(terms.startDate)
  const sessions = await db.select().from(sessionConfig)
  const allBankHolidays = await db.select().from(bankHolidays).orderBy(asc(bankHolidays.date))

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Term Dates & Session Config</h1>
      <p className="text-sm text-gray-500 mb-6">Set the academic year terms. These drive the register, sickness %, and invoice calculations.</p>
      <TermsClient terms={allTerms} sessions={sessions} bankHolidays={allBankHolidays} />
    </div>
  )
}
