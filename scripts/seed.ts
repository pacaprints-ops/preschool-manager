import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, sessionConfig } from '../src/lib/db/schema'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)
const db = drizzle(sql)

async function seed() {
  console.log('Seeding database...')

  // ─── Admin users ────────────────────────────────────────────────────────────
  const tempPassword = 'WintonPS2024!'

  const adminUsers = [
    { name: 'Sally', email: 'sally@wintonpreschool.org.uk' },
    { name: 'Louise', email: 'louise@wintonpreschool.org.uk' },
  ]

  for (const admin of adminUsers) {
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    await db.insert(users).values({
      name: admin.name,
      email: admin.email,
      passwordHash,
      role: 'admin',
    }).onConflictDoNothing()
    console.log(`✓ Created admin: ${admin.name} (${admin.email})`)
  }

  // ─── Staff users ─────────────────────────────────────────────────────────────
  const staffUsers = [
    { name: 'Sam', email: 'sam@wintonpreschool.org.uk' },
    { name: 'Sky', email: 'sky@wintonpreschool.org.uk' },
    { name: 'Sadie', email: 'sadie@wintonpreschool.org.uk' },
    { name: 'Kiana', email: 'kiana@wintonpreschool.org.uk' },
    { name: 'Annie', email: 'annie@wintonpreschool.org.uk' },
    { name: 'Dana', email: 'dana@wintonpreschool.org.uk' },
  ]

  for (const staff of staffUsers) {
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    await db.insert(users).values({
      name: staff.name,
      email: staff.email,
      passwordHash,
      role: 'staff',
    }).onConflictDoNothing()
    console.log(`✓ Created staff: ${staff.name} (${staff.email})`)
  }

  // ─── Session config (placeholder prices) ─────────────────────────────────────
  const sessions = [
    { type: 'morning' as const, label: 'Morning', startTime: '09:00', endTime: '12:00', hours: '3.00', price: '5.00', contribution: '3.50' },
    { type: 'afternoon' as const, label: 'Afternoon', startTime: '12:00', endTime: '15:00', hours: '3.00', price: '5.00', contribution: '3.50' },
    { type: 'full_day' as const, label: 'Full Day', startTime: '09:00', endTime: '15:00', hours: '6.00', price: '5.00', contribution: '3.50' },
  ]

  for (const session of sessions) {
    await db.insert(sessionConfig).values(session).onConflictDoNothing()
    console.log(`✓ Created session config: ${session.label}`)
  }

  console.log('\n✅ Seed complete!')
  console.log(`\nAll accounts created with temporary password: ${tempPassword}`)
  console.log('Make sure Sally and Louise change their passwords after first login.')
}

seed().catch(console.error)
