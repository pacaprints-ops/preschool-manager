'use client'

import { useState } from 'react'

type Entry = {
  date: string
  sessionType: string | null
  status: 'present' | 'absent' | null
  absenceReason: string | null
  signedInAt: string | null
  signedOutAt: string | null
  droppedBy: string | null
  rule48h: boolean | null
}

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function sessionLabel(type: string | null) {
  if (type === 'morning') return 'AM'
  if (type === 'afternoon') return 'PM'
  if (type === 'full_day') return 'Full'
  return type ?? '—'
}

export default function AttendanceLogSection({ entries }: { entries: Entry[] }) {
  const [open, setOpen] = useState(false)

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Attendance Log</h2>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-xs text-[#020e2f] font-medium hover:underline"
        >
          {open ? '▾ Hide' : `▸ Show (${entries.length} records)`}
        </button>
      </div>

      {open && (
        <div className="mt-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-400">No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-2 pr-3 font-medium">Date</th>
                    <th className="pb-2 pr-3 font-medium">Session</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">In</th>
                    <th className="pb-2 pr-3 font-medium">Out</th>
                    <th className="pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map((e, i) => (
                    <tr key={i} className="text-gray-700">
                      <td className="py-1.5 pr-3 whitespace-nowrap">{fmtDate(e.date)}</td>
                      <td className="py-1.5 pr-3">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {sessionLabel(e.sessionType)}
                        </span>
                      </td>
                      <td className="py-1.5 pr-3">
                        {e.status === 'present' ? (
                          <span className="text-green-600 font-medium">Present</span>
                        ) : e.status === 'absent' ? (
                          <span className="text-red-500 font-medium">Absent</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{fmtTime(e.signedInAt)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{fmtTime(e.signedOutAt)}</td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {e.absenceReason && (
                            <span className="text-gray-500">{e.absenceReason}</span>
                          )}
                          {e.droppedBy && (
                            <span className="text-gray-400">Drop: {e.droppedBy}</span>
                          )}
                          {e.rule48h && (
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">48hr</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
