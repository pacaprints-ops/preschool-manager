import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { terms } from '../src/lib/db/schema'

// Derived from BCP Council's published 2026-27 term/half-term boundaries
// (https://www.bcpcouncil.gov.uk/schools-and-learning/school-term-and-holiday-dates),
// split into the same Term-1/Term-2-either-side-of-half-term pattern already
// used for 2025-26. NOT yet confirmed against the pre-school's own calendar —
// check before relying on these for real invoicing.
function calcWeeks(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000))
}

const NEW_TERMS = [
  { name: 'Autumn 1', startDate: '2026-09-01', endDate: '2026-10-23' },
  { name: 'Autumn 2', startDate: '2026-11-02', endDate: '2026-12-18' },
  { name: 'Spring 1', startDate: '2027-01-04', endDate: '2027-02-12' },
  { name: 'Spring 2', startDate: '2027-02-22', endDate: '2027-03-25' },
  { name: 'Summer 1', startDate: '2027-04-12', endDate: '2027-05-28' },
  { name: 'Summer 2', startDate: '2027-06-07', endDate: '2027-07-21' },
]

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)
const db = drizzle(sql)

async function main() {
  for (const t of NEW_TERMS) {
    const weekCount = calcWeeks(t.startDate, t.endDate)
    await db.insert(terms).values({
      name: t.name,
      academicYear: '2026-27',
      startDate: t.startDate,
      endDate: t.endDate,
      weekCount,
    })
    console.log(`✓ ${t.name} 2026-27: ${t.startDate} .. ${t.endDate} (${weekCount}wk)`)
  }
}

main()
