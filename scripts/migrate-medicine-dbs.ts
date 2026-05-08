import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding DBS columns to users...')
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dbs_cert_number TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dbs_issue_date DATE`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dbs_on_update_service BOOLEAN NOT NULL DEFAULT false`
  console.log('✓ DBS columns added')

  console.log('Creating medicine_administrations table...')
  await sql`
    CREATE TABLE IF NOT EXISTS medicine_administrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES children(id),
      medication_name TEXT NOT NULL,
      dose TEXT NOT NULL,
      given_at TIMESTAMP NOT NULL,
      given_by_id UUID REFERENCES users(id),
      given_by_name TEXT,
      witnessed_by_id UUID REFERENCES users(id),
      witnessed_by_name TEXT,
      parent_informed BOOLEAN NOT NULL DEFAULT false,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ medicine_administrations table created')
}

main().catch(console.error)
