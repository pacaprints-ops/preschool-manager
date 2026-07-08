import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding picked_up_by to register_entries...')
  await sql`ALTER TABLE register_entries ADD COLUMN IF NOT EXISTS picked_up_by TEXT`
  console.log('✓ picked_up_by added')
}

main().catch(console.error)
