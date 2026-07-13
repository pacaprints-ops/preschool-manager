import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding funding_type to child_sessions...')
  await sql`ALTER TABLE child_sessions ADD COLUMN IF NOT EXISTS funding_type TEXT NOT NULL DEFAULT 'paid'`
  // Best-effort backfill: the old boolean only recorded funded-vs-not, not which
  // entitlement — default any previously-funded session to Universal 15h, the
  // most common category. Review and adjust individual sessions if needed.
  await sql`UPDATE child_sessions SET funding_type = 'universal15' WHERE is_funded = true`
  await sql`UPDATE child_sessions SET funding_type = 'paid' WHERE is_funded = false`
  await sql`ALTER TABLE child_sessions DROP COLUMN IF EXISTS is_funded`
  console.log('✓ funding_type added and backfilled from is_funded')

  console.log('Creating session_segments table...')
  await sql`
    CREATE TABLE IF NOT EXISTS session_segments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_session_id UUID NOT NULL REFERENCES child_sessions(id) ON DELETE CASCADE,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      funding_type TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ session_segments table created')
}

main().catch(console.error)
