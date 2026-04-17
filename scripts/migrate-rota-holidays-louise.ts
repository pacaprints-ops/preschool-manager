import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function run() {
  // 1. Add working_days column to users
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS working_days TEXT NOT NULL DEFAULT 'mon,tue,wed,thu,fri'`
  console.log('✓ Added working_days to users')

  // 2. Add bank_holiday_count column to invoices
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bank_holiday_count INTEGER NOT NULL DEFAULT 0`
  console.log('✓ Added bank_holiday_count to invoices')

  // 3. Set Louise and Sally to admin role
  await sql`UPDATE users SET role = 'admin' WHERE LOWER(name) LIKE '%louise%' OR LOWER(name) LIKE '%sally%'`
  const updated = await sql`SELECT name, role FROM users WHERE LOWER(name) LIKE '%louise%' OR LOWER(name) LIKE '%sally%'`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log('✓ Set admin role for:', (updated as any[]).map((u: { name: string; role: string }) => `${u.name} (${u.role})`).join(', '))

  // 4. Set working days for known staff (by name)
  await sql`UPDATE users SET working_days = 'tue,wed,thu,fri' WHERE LOWER(name) LIKE '%louise%'`
  await sql`UPDATE users SET working_days = 'mon,wed,thu,fri' WHERE LOWER(name) LIKE '%sam%'`
  await sql`UPDATE users SET working_days = 'mon,tue,wed,fri' WHERE LOWER(name) LIKE '%annie%'`
  console.log('✓ Set working days for Louise, Sam, Annie')

  // 5. Create Louise's login if it doesn't exist
  const existing = await sql`SELECT id FROM users WHERE LOWER(name) LIKE '%louise%' LIMIT 1`
  if (existing.length === 0) {
    const hash = await bcrypt.hash('WintonLouise2025!', 10)
    await sql`
      INSERT INTO users (email, password_hash, name, role, working_days)
      VALUES ('louise@wintonpreschool.org.uk', ${hash}, 'Louise', 'admin', 'tue,wed,thu,fri')
      ON CONFLICT (email) DO NOTHING
    `
    console.log('✓ Created Louise login: louise@wintonpreschool.org.uk / WintonLouise2025!')
  } else {
    // Update password for existing Louise account
    const hash = await bcrypt.hash('WintonLouise2025!', 10)
    await sql`UPDATE users SET password_hash = ${hash}, role = 'admin' WHERE LOWER(name) LIKE '%louise%'`
    console.log('✓ Updated Louise login password to: WintonLouise2025!')
  }

  console.log('\nDone.')
}

run().catch(console.error)
