import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding completed to register_notes...')
  await sql`ALTER TABLE register_notes ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE`
  console.log('✓ completed added')

  console.log('Adding completed_by_name to register_notes...')
  await sql`ALTER TABLE register_notes ADD COLUMN IF NOT EXISTS completed_by_name TEXT`
  console.log('✓ completed_by_name added')
}

main().catch(console.error)
