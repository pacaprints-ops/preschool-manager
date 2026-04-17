import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL_UNPOOLED!)

async function migrate() {
  console.log('Running funded-sessions migration...')

  // 1. Remove funded columns from children
  await sql`ALTER TABLE children DROP COLUMN IF EXISTS is_funded`
  await sql`ALTER TABLE children DROP COLUMN IF EXISTS funded_hours`
  console.log('✓ Removed isFunded/fundedHours from children')

  // 2. Add isFunded to child_sessions
  await sql`ALTER TABLE child_sessions ADD COLUMN IF NOT EXISTS is_funded boolean NOT NULL DEFAULT false`
  console.log('✓ Added is_funded to child_sessions')

  // 3. Update invoices table
  await sql`ALTER TABLE invoices DROP COLUMN IF EXISTS total_sessions`
  await sql`ALTER TABLE invoices DROP COLUMN IF EXISTS funded_deduction`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_sessions integer NOT NULL DEFAULT 0`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS funded_sessions integer NOT NULL DEFAULT 0`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS funded_hours_total numeric(8,2) NOT NULL DEFAULT 0`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS funded_value numeric(8,2) NOT NULL DEFAULT 0`
  console.log('✓ Updated invoices table')

  console.log('Migration complete.')
}

migrate().catch(e => { console.error(e); process.exit(1) })
