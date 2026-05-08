import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding time_in and time_out columns to staff_hours...')
  await sql`ALTER TABLE staff_hours ADD COLUMN IF NOT EXISTS time_in TEXT`
  await sql`ALTER TABLE staff_hours ADD COLUMN IF NOT EXISTS time_out TEXT`
  console.log('✓ Done')
}

main().catch(console.error)
