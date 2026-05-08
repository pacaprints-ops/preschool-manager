import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding allergy and emergency contact columns to users...')
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_allergies BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_notes TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone2 TEXT`
  console.log('✓ Done')
}

main().catch(console.error)
