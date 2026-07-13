import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Creating extra_sessions table...')
  await sql`
    CREATE TABLE IF NOT EXISTS extra_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES children(id),
      date DATE NOT NULL,
      session_type session_type NOT NULL,
      is_funded BOOLEAN NOT NULL DEFAULT false,
      amount NUMERIC(8,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ extra_sessions table created')
}

main().catch(console.error)
