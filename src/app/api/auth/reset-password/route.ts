import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, tokenHash))
    .limit(1)

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'This reset link has expired or is invalid.' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(users.id, user.id))

  return NextResponse.json({ ok: true })
}
