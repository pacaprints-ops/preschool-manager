import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding signed_in_at to register_entries...')
  await sql`ALTER TABLE register_entries ADD COLUMN IF NOT EXISTS signed_in_at TIMESTAMP`
  console.log('✓ signed_in_at added')

  console.log('Adding dropped_by to register_entries...')
  await sql`ALTER TABLE register_entries ADD COLUMN IF NOT EXISTS dropped_by TEXT`
  console.log('✓ dropped_by added')
}

main().catch(console.error)
