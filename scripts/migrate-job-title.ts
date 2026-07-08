import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

const JOB_TITLES: Record<string, string> = {
  Sally: 'Managing Director / Owner',
  Louise: 'Managing Director / Owner',
  Sam: 'Deputy Manager / SENDCO',
  Sky: 'Practitioner',
  Sadie: 'Practitioner',
  Kiana: 'Practitioner',
  Annie: 'Practitioner',
  Dana: 'Practitioner',
}

async function main() {
  console.log('Adding job_title to users...')
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT`
  console.log('✓ job_title added')

  for (const [name, title] of Object.entries(JOB_TITLES)) {
    const result = await sql`UPDATE users SET job_title = ${title} WHERE name = ${name} AND job_title IS NULL`
    console.log(`  ${name} -> ${title}`)
  }
  console.log('✓ Seeded known job titles')
}

main().catch(console.error)
