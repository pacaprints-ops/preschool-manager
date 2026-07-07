import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)

async function run() {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP`
  console.log('✅ Added reset_token and reset_token_expiry to users table')
}

run().catch(console.error)
