import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding signed_out_at to register_entries...')
  await sql`ALTER TABLE register_entries ADD COLUMN IF NOT EXISTS signed_out_at TIMESTAMP`
  console.log('✓ signed_out_at added')

  console.log('Creating late_fee_invoices table...')
  await sql`
    CREATE TABLE IF NOT EXISTS late_fee_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES children(id),
      date DATE NOT NULL,
      signed_out_at TIMESTAMP NOT NULL,
      minutes_late INTEGER NOT NULL,
      rate_per_minute NUMERIC(6,2) NOT NULL DEFAULT 1.00,
      total_amount NUMERIC(8,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      paid_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ late_fee_invoices table created')
}

main().catch(console.error)
