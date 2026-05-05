import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Creating staff_daily_attendance table...')
  await sql`
    CREATE TABLE IF NOT EXISTS staff_daily_attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      user_id UUID REFERENCES users(id),
      staff_name TEXT NOT NULL,
      signed_in_at TIMESTAMP,
      signed_out_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ staff_daily_attendance created')

  console.log('Creating building_visitors table...')
  await sql`
    CREATE TABLE IF NOT EXISTS building_visitors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      name TEXT NOT NULL,
      organisation TEXT,
      signed_in_at TIMESTAMP,
      signed_out_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ building_visitors created')
}

main().catch(console.error)
