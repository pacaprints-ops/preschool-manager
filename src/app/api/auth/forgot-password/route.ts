import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes, createHash } from 'crypto'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  // Always respond identically — don't reveal whether the account exists
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ ok: true })
  }

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)

  if (user) {
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.update(users)
      .set({ resetToken: tokenHash, resetTokenExpiry: expiry })
      .where(eq(users.id, user.id))

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const resetUrl = `${process.env.NEXTAUTH_URL ?? baseUrl}/reset-password?token=${rawToken}`

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#020e2f;padding:20px 28px">
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold">Winton Pre-School</p>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#020e2f">Reset your password</h1>
      <p style="color:#374151;font-size:14px;margin:0 0 20px">
        You requested a password reset for your Winton Pre-School account.<br>
        Click the button below to set a new password. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;margin-bottom:20px">
        Reset password
      </a>
      <p style="color:#9ca3af;font-size:13px;margin:0">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb">
      <p style="margin:0;color:#9ca3af;font-size:12px">Winton Pre-School · Little Explorers</p>
    </div>
  </div>
</body>
</html>`

    try {
      await sendEmail(email, 'Winton Pre-School — Reset your password', html)
    } catch {
      // Silently swallow — don't reveal send failure to caller
    }
  }

  return NextResponse.json({ ok: true })
}
