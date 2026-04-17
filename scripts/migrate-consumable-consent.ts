import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL_UNPOOLED!)

async function run() {
  console.log('Running consumable consent migration...')
  await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS consumable_consent boolean NOT NULL DEFAULT false`
  console.log('✓ children: added consumable_consent')

  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS consumable_consent boolean NOT NULL DEFAULT false`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS funded_hours_per_week numeric(6,2) NOT NULL DEFAULT 0`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_hours_per_week numeric(6,2) NOT NULL DEFAULT 0`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS adjustment_amount numeric(8,2) NOT NULL DEFAULT 0`
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS adjustment_note text`
  console.log('✓ invoices: added consumable_consent, funded/paid hours per week, adjustment fields')

  console.log('Done.')
}
run().catch(e => { console.error(e); process.exit(1) })
