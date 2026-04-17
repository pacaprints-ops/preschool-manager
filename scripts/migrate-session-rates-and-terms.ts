import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL_UNPOOLED!)

async function run() {
  console.log('Updating session config and seeding 2025-26 terms...')

  // ─── Session config: replace price with age-based hourly rates ──────────────
  await sql`ALTER TABLE session_config ADD COLUMN IF NOT EXISTS hourly_rate_2yo numeric(6,2)`
  await sql`ALTER TABLE session_config ADD COLUMN IF NOT EXISTS hourly_rate_34yo numeric(6,2)`
  await sql`UPDATE session_config SET hourly_rate_2yo = 9.00, hourly_rate_34yo = 8.25`
  await sql`ALTER TABLE session_config ALTER COLUMN hourly_rate_2yo SET NOT NULL`
  await sql`ALTER TABLE session_config ALTER COLUMN hourly_rate_34yo SET NOT NULL`
  await sql`ALTER TABLE session_config DROP COLUMN IF EXISTS price`
  console.log('✓ Session config: added hourly_rate_2yo / hourly_rate_34yo, removed price')

  // Update session times and contributions with real values
  await sql`
    UPDATE session_config SET
      start_time = '09:00', end_time = '15:00', hours = 6, contribution = 3.50
    WHERE type = 'full_day'
  `
  await sql`
    UPDATE session_config SET
      start_time = '09:00', end_time = '12:00', hours = 3, contribution = 3.50
    WHERE type = 'morning'
  `
  await sql`
    UPDATE session_config SET
      start_time = '12:00', end_time = '15:00', hours = 3, contribution = 3.50
    WHERE type = 'afternoon'
  `
  console.log('✓ Session config: updated times and contribution to £3.50')

  // ─── Seed 2025-26 half-terms ────────────────────────────────────────────────
  // BCP Council term dates: https://www.bcpcouncil.gov.uk/schools-and-learning/school-term-and-holiday-dates
  const terms = [
    { name: 'Autumn 1', academicYear: '2025-26', startDate: '2025-09-03', endDate: '2025-10-24', weekCount: 8 },
    { name: 'Autumn 2', academicYear: '2025-26', startDate: '2025-11-03', endDate: '2025-12-19', weekCount: 7 },
    { name: 'Spring 1', academicYear: '2025-26', startDate: '2026-01-05', endDate: '2026-02-13', weekCount: 6 },
    { name: 'Spring 2', academicYear: '2025-26', startDate: '2026-02-23', endDate: '2026-03-27', weekCount: 5 },
    { name: 'Summer 1', academicYear: '2025-26', startDate: '2026-04-13', endDate: '2026-05-22', weekCount: 6 },
    { name: 'Summer 2', academicYear: '2025-26', startDate: '2026-06-01', endDate: '2026-07-22', weekCount: 7 },
  ]

  for (const t of terms) {
    await sql`
      INSERT INTO terms (id, name, academic_year, start_date, end_date, week_count, created_at)
      VALUES (gen_random_uuid(), ${t.name}, ${t.academicYear}, ${t.startDate}, ${t.endDate}, ${t.weekCount}, now())
      ON CONFLICT DO NOTHING
    `
    console.log(`✓ Term: ${t.name} ${t.academicYear} (${t.weekCount} weeks)`)
  }

  console.log('\nDone.')
}

run().catch(e => { console.error(e); process.exit(1) })
