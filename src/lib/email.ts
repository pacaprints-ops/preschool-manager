import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = 'Winton Pre-School <noreply@wintonpreschool.org.uk>'

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  attachment?: { filename: string; contentBase64: string },
) {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    attachments: attachment ? [{ filename: attachment.filename, content: attachment.contentBase64 }] : undefined,
  })
  if (error) throw new Error(error.message)
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#020e2f;padding:20px 28px">
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold">Winton Pre-School</p>
    </div>
    <div style="padding:28px">
      ${content}
    </div>
    <div style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb">
      <p style="margin:0;color:#9ca3af;font-size:12px">Winton Pre-School · If you have any questions please call or speak to a member of staff.</p>
    </div>
  </div>
</body>
</html>`
}

// ─── Invoice email ─────────────────────────────────────────────────────────────

type InvoiceEmailData = {
  childName: string
  termName: string
  paidSessions: number
  fundedSessions: number
  sessionCost: string
  contributionTotal: string
  bankHolidayCount: number
  adjustmentAmount: string
  adjustmentNote: string | null
  amountDue: string
  parentEmail: string
}

export function buildInvoiceEmail(data: InvoiceEmailData): string {
  const contribution = parseFloat(data.contributionTotal)
  const sessionCost = parseFloat(data.sessionCost)
  const adjustment = parseFloat(data.adjustmentAmount)
  const bankHolidayDeduction = data.bankHolidayCount > 0 ? data.bankHolidayCount * 3.50 : 0

  const rows: string[] = []

  if (data.paidSessions > 0) {
    rows.push(`<tr>
      <td style="padding:8px 0;color:#374151;border-bottom:1px solid #f3f4f6">Session fees (${data.paidSessions} sessions)</td>
      <td style="padding:8px 0;text-align:right;color:#374151;border-bottom:1px solid #f3f4f6">£${sessionCost.toFixed(2)}</td>
    </tr>`)
  }

  if (data.fundedSessions > 0) {
    rows.push(`<tr>
      <td style="padding:8px 0;color:#374151;border-bottom:1px solid #f3f4f6">Funded sessions (${data.fundedSessions} sessions)</td>
      <td style="padding:8px 0;text-align:right;color:#16a34a;border-bottom:1px solid #f3f4f6">FREE</td>
    </tr>`)
  }

  if (contribution > 0) {
    rows.push(`<tr>
      <td style="padding:8px 0;color:#374151;border-bottom:1px solid #f3f4f6">Consumable contribution</td>
      <td style="padding:8px 0;text-align:right;color:#374151;border-bottom:1px solid #f3f4f6">£${contribution.toFixed(2)}</td>
    </tr>`)
  }

  if (bankHolidayDeduction > 0) {
    rows.push(`<tr>
      <td style="padding:8px 0;color:#374151;border-bottom:1px solid #f3f4f6">Bank holiday deduction (${data.bankHolidayCount} days)</td>
      <td style="padding:8px 0;text-align:right;color:#374151;border-bottom:1px solid #f3f4f6">−£${bankHolidayDeduction.toFixed(2)}</td>
    </tr>`)
  }

  if (adjustment !== 0) {
    rows.push(`<tr>
      <td style="padding:8px 0;color:#374151;border-bottom:1px solid #f3f4f6">${data.adjustmentNote ?? 'Adjustment'}</td>
      <td style="padding:8px 0;text-align:right;color:#374151;border-bottom:1px solid #f3f4f6">${adjustment < 0 ? '−' : ''}£${Math.abs(adjustment).toFixed(2)}</td>
    </tr>`)
  }

  const content = `
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280">${data.termName}</p>
    <h1 style="margin:0 0 24px;font-size:22px;color:#020e2f">Invoice for ${data.childName}</h1>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      ${rows.join('')}
      <tr>
        <td style="padding:12px 0 4px;font-weight:bold;font-size:16px;color:#020e2f">Total due</td>
        <td style="padding:12px 0 4px;text-align:right;font-weight:bold;font-size:20px;color:#020e2f">£${parseFloat(data.amountDue).toFixed(2)}</td>
      </tr>
    </table>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-weight:bold;color:#15803d;font-size:14px">Payment by BACS</p>
      <p style="margin:0;color:#166534;font-size:13px">
        Account name: Winton Pre-School<br>
        Sort code: 30-96-26<br>
        Account number: 62413268<br>
        Reference: <strong>${data.childName.replace(' ', '')}</strong>
      </p>
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0">Please pay within 14 days of receiving this invoice. If you have any questions, please speak to a member of staff.</p>
  `
  return layout(content)
}

// ─── Late fee email ────────────────────────────────────────────────────────────

type LateFeeEmailData = {
  childName: string
  date: string
  minutesLate: number
  totalAmount: string
}

export function buildLateFeeEmail(data: LateFeeEmailData): string {
  const formattedDate = new Date(data.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#020e2f">Late collection fee</h1>
    <p style="color:#374151;font-size:14px;margin:0 0 20px">
      This is to let you know that <strong>${data.childName}</strong> was collected after 3:00pm on <strong>${formattedDate}</strong>.
    </p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 4px;color:#9a3412;font-size:13px">${data.minutesLate} minute${data.minutesLate !== 1 ? 's' : ''} late · £1.00 per minute</p>
      <p style="margin:0;font-weight:bold;font-size:18px;color:#9a3412">Total: £${parseFloat(data.totalAmount).toFixed(2)}</p>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-weight:bold;color:#15803d;font-size:14px">Payment by BACS</p>
      <p style="margin:0;color:#166534;font-size:13px">
        Account name: Winton Pre-School<br>
        Sort code: 30-96-26<br>
        Account number: 62413268<br>
        Reference: <strong>LateFee${data.childName.replace(' ', '')}</strong>
      </p>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0">Please speak to a member of staff if you have any questions.</p>
  `
  return layout(content)
}

// ─── Parent message email ──────────────────────────────────────────────────────

export function buildParentMessageEmail(
  subject: string,
  body: string,
  sender?: { name: string; jobTitle: string | null },
): string {
  const paragraphs = body
    .split('\n')
    .filter(l => l.trim())
    .map(l => `<p style="color:#374151;font-size:14px;margin:0 0 12px">${l}</p>`)
    .join('')

  const signature = sender ? `
    <p style="color:#374151;font-size:14px;margin:24px 0 0;padding-top:16px;border-top:1px solid #f3f4f6">
      Kind regards,<br>
      <strong>${sender.name}</strong>${sender.jobTitle ? `<br>${sender.jobTitle}` : ''}<br>
      Winton Pre-School Little Explorers<br>
      07305 240440
    </p>
  ` : ''

  return layout(`
    <h1 style="margin:0 0 20px;font-size:20px;color:#020e2f">${subject}</h1>
    ${paragraphs}
    ${signature}
  `)
}
