import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding needs_1to1 to children...')
  await sql`ALTER TABLE children ADD COLUMN IF NOT EXISTS needs_1to1 BOOLEAN NOT NULL DEFAULT false`
  console.log('✓ needs_1to1 added')
}

main().catch(console.error)
