import { db } from '../src/lib/db'
import { sql } from 'drizzle-orm'

async function migrate() {
  await db.execute(sql`
    ALTER TABLE accident_forms
    ADD COLUMN IF NOT EXISTS body_location TEXT,
    ADD COLUMN IF NOT EXISTS parent_signature TEXT,
    ADD COLUMN IF NOT EXISTS parent_signed_at TIMESTAMP
  `)
  console.log('Done: accident_forms columns added (body_location, parent_signature, parent_signed_at)')
  process.exit(0)
}

migrate().catch(e => { console.error(e); process.exit(1) })
