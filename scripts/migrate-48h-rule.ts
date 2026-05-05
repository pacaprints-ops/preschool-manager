import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding rule_48h to register_entries...')
  await sql`ALTER TABLE register_entries ADD COLUMN IF NOT EXISTS rule_48h BOOLEAN NOT NULL DEFAULT FALSE`
  console.log('✓ rule_48h added')
}

main().catch(console.error)
