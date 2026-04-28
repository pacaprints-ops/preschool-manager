import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Creating register_notes table...')
  await sql`
    CREATE TABLE IF NOT EXISTS register_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id UUID NOT NULL REFERENCES children(id),
      date DATE NOT NULL,
      session_type session_type NOT NULL,
      note TEXT NOT NULL,
      added_by_id UUID REFERENCES users(id),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS register_notes_unique
    ON register_notes (child_id, date, session_type)
  `
  console.log('✓ register_notes table created')
}

main().catch(console.error)
