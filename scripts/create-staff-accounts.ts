import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users } from '../src/lib/db/schema'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)
const db = drizzle(sql)

const TEMP_PASSWORD = 'winton123'

const accounts = [
  { name: 'Sally', email: 'sallyannabmth@yahoo.co.uk', role: 'admin' as const },
  { name: 'Louise', email: 'lou2986@yahoo.co.uk', role: 'admin' as const },
  { name: 'Sam', email: 'samanthajcooper@hotmail.co.uk', role: 'staff' as const },
  { name: 'Kiana', email: 'kianapersaud@hotmail.co.uk', role: 'staff' as const },
  { name: 'Dana', email: 'hayes_dana1@yahoo.co.uk', role: 'staff' as const },
  { name: 'Annie', email: 'annie.marie94@hotmail.co.uk', role: 'staff' as const },
  { name: 'Sadie', email: 'sadiexjayne@gmail.com', role: 'staff' as const },
  { name: 'Sky', email: 'sky.stratton@btinternet.com', role: 'staff' as const },
]

async function run() {
  console.log('Creating staff accounts...\n')
  const hash = await bcrypt.hash(TEMP_PASSWORD, 12)

  for (const account of accounts) {
    await db.insert(users).values({
      name: account.name,
      email: account.email,
      passwordHash: hash,
      role: account.role,
    }).onConflictDoNothing()
    console.log(`✓ ${account.role === 'admin' ? 'Admin' : 'Staff'}: ${account.name} — ${account.email}`)
  }

  console.log(`\n✅ Done. Temporary password for all accounts: ${TEMP_PASSWORD}`)
}

run().catch(console.error)
