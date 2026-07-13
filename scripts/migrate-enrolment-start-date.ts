import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding start_date to enrolments...')
  await sql`ALTER TABLE enrolments ADD COLUMN IF NOT EXISTS start_date DATE`
  console.log('✓ start_date added')
}

main().catch(console.error)
