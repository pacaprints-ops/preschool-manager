import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Creating child_holidays table...')
  await sql`
    CREATE TABLE IF NOT EXISTS child_holidays (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES children(id),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      notes TEXT,
      days_used INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ Done')
}

main().catch(console.error)
