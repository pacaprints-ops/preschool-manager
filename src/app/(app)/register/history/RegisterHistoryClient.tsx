'use client'

import { useRouter } from 'next/navigation'

type Row = {
  id: string
  childId: string
  firstName: string
  lastName: string
  sessionType: string
  status: 'present' | 'absent'
  absenceReason: string | null
  parentContacted: boolean | null
  signedInAt: string | null
  signedOutAt: string | null
  droppedBy: string | null
  rule48h: boolean
}

const SESSION_LABEL: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  full_day: 'Full Day',
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function RegisterHistoryClient({ date, rows }: { date: string; rows: Row[] }) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const sessions = [...new Set(rows.map(r => r.sessionType))].sort((a, b) => {
    const order = { morning: 0, full_day: 1, afternoon: 2 }
    return (order[a as keyof typeof order] ?? 9) - (order[b as keyof typeof order] ?? 9)
  })

  const present = rows.filter(r => r.status === 'present')
  const absent = rows.filter(r => r.status === 'absent')

  function handlePrint() {
    const sessionBlocks = sessions.map(session => {
      const sRows = rows.filter(r => r.sessionType === session)
      const sPresent = sRows.filter(r => r.status === 'present')
      const sAbsent = sRows.filter(r => r.status === 'absent')

      const presentRows = sPresent.map(r => `
        <tr>
          <td style="border:1px solid #ccc;padding:7px 10px;">${r.lastName}, ${r.firstName}</td>
          <td style="border:1px solid #ccc;padding:7px 10px;color:#166534;font-weight:600;">Present</td>
          <td style="border:1px solid #ccc;padding:7px 10px;">${fmtTime(r.signedInAt)}</td>
          <td style="border:1px solid #ccc;padding:7px 10px;">${fmtTime(r.signedOutAt)}</td>
          <td style="border:1px solid #ccc;padding:7px 10px;">${r.droppedBy ?? ''}</td>
          <td style="border:1px solid #ccc;padding:7px 10px;"></td>
        </tr>`).join('')

      const absentRows = sAbsent.map(r => `
        <tr>
          <td style="border:1px solid #ccc;padding:7px 10px;">${r.lastName}, ${r.firstName}</td>
          <td style="border:1px solid #ccc;padding:7px 10px;color:#991b1b;font-weight:600;">Absent</td>
          <td style="border:1px solid #ccc;padding:7px 10px;"></td>
          <td style="border:1px solid #ccc;padding:7px 10px;"></td>
          <td style="border:1px solid #ccc;padding:7px 10px;"></td>
          <td style="border:1px solid #ccc;padding:7px 10px;">${r.absenceReason ?? ''}${r.parentContacted ? ' ✓ parent contacted' : ''}</td>
        </tr>`).join('')

      return `
        <h2 style="margin:20px 0 8px;font-size:15px;border-bottom:2px solid #020e2f;padding-bottom:4px;">
          ${SESSION_LABEL[session] ?? session} — ${sPresent.length} present, ${sAbsent.length} absent
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #ccc;padding:7px 10px;text-align:left;width:22%;">Child</th>
              <th style="border:1px solid #ccc;padding:7px 10px;text-align:left;width:12%;">Status</th>
              <th style="border:1px solid #ccc;padding:7px 10px;text-align:left;width:10%;">In</th>
              <th style="border:1px solid #ccc;padding:7px 10px;text-align:left;width:10%;">Out</th>
              <th style="border:1px solid #ccc;padding:7px 10px;text-align:left;width:18%;">Dropped by</th>
              <th style="border:1px solid #ccc;padding:7px 10px;text-align:left;">Absence reason</th>
            </tr>
          </thead>
          <tbody>${presentRows}${absentRows}</tbody>
        </table>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Attendance Register — ${fmtDate(date)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #555; margin-bottom: 16px; }
        #print-btn { float: right; padding: 8px 18px; background: #020e2f; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
        @media print { #print-btn { display: none; } body { margin: 12px; } }
      </style>
    </head><body>
      <button id="print-btn" onclick="window.print()">Print / Save as PDF</button>
      <h1>Winton Pre-School — Attendance Register</h1>
      <div class="subtitle">${fmtDate(date)} &nbsp;·&nbsp; ${present.length} present &nbsp;·&nbsp; ${absent.length} absent &nbsp;·&nbsp; ${rows.length} total</div>
      ${sessionBlocks}
    </body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Attendance History</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and print the register for any past date</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => router.push(`/register/history?date=${e.target.value}`)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          {rows.length > 0 && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#020e2f] text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
            >
              Print / PDF
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600 font-medium">{fmtDate(date)}</div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          No register entries recorded for this date.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{present.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Present</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{absent.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Absent</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{rows.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Total</div>
            </div>
          </div>

          {/* Per-session tables */}
          {sessions.map(session => {
            const sRows = rows.filter(r => r.sessionType === session)
            const sPresent = sRows.filter(r => r.status === 'present')
            const sAbsent = sRows.filter(r => r.status === 'absent')

            return (
              <div key={session} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-[#020e2f]">
                  <span className="text-sm font-semibold text-white">{SESSION_LABEL[session] ?? session}</span>
                  <span className="text-xs text-blue-200">
                    {sPresent.length} present · {sAbsent.length} absent
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {sRows.map(row => (
                    <div key={row.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <a href={`/children/${row.childId}`} className="text-sm font-medium text-gray-900 hover:underline">
                          {row.firstName} {row.lastName}
                        </a>
                        {row.status === 'absent' && row.absenceReason && (
                          <div className="text-xs text-gray-500 mt-0.5">{row.absenceReason}</div>
                        )}
                        {row.droppedBy && (
                          <div className="text-xs text-gray-400 mt-0.5">Dropped by: {row.droppedBy}</div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {row.status === 'present' ? (
                          <>
                            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                              Present
                            </span>
                            {(row.signedInAt || row.signedOutAt) && (
                              <div className="text-xs text-gray-400 mt-1">
                                {fmtTime(row.signedInAt)} → {fmtTime(row.signedOutAt)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              Absent
                            </span>
                            {row.parentContacted && (
                              <div className="text-xs text-gray-400 mt-1">Parent contacted</div>
                            )}
                            {row.rule48h && (
                              <div className="text-xs text-amber-600 mt-0.5">48h rule</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
