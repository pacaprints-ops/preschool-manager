import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { terms } from '../src/lib/db/schema'

// Derived from BCP Council's published 2027-28 term/half-term boundaries
// (https://www.bcpcouncil.gov.uk/schools-and-learning/school-term-and-holiday-dates),
// split the same way as 2025-26 and 2026-27. NOT yet confirmed against the
// pre-school's own calendar — check before relying on these for real invoicing.
function calcWeeks(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000))
}

const NEW_TERMS = [
  { name: 'Autumn 1', startDate: '2027-09-01', endDate: '2027-10-22' },
  { name: 'Autumn 2', startDate: '2027-11-01', endDate: '2027-12-17' },
  { name: 'Spring 1', startDate: '2028-01-04', endDate: '2028-02-11' },
  { name: 'Spring 2', startDate: '2028-02-21', endDate: '2028-03-31' },
  { name: 'Summer 1', startDate: '2028-04-18', endDate: '2028-05-26' },
  { name: 'Summer 2', startDate: '2028-06-05', endDate: '2028-07-21' },
]

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)
const db = drizzle(sql)

async function main() {
  for (const t of NEW_TERMS) {
    const weekCount = calcWeeks(t.startDate, t.endDate)
    await db.insert(terms).values({
      name: t.name,
      academicYear: '2027-28',
      startDate: t.startDate,
      endDate: t.endDate,
      weekCount,
    })
    console.log(`✓ ${t.name} 2027-28: ${t.startDate} .. ${t.endDate} (${weekCount}wk)`)
  }
}

main()
