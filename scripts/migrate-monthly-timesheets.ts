import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Creating staff_monthly_timesheets table...')
  await sql`
    CREATE TABLE IF NOT EXISTS staff_monthly_timesheets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      additional_hours NUMERIC(6,2),
      additional_hours_notes TEXT,
      total_key_children INTEGER,
      total_extra_hours NUMERIC(6,2),
      total_pay NUMERIC(10,2),
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, year, month)
    )
  `
  console.log('✓ Done')
}

main().catch(console.error)
