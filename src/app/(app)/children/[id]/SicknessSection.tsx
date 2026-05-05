'use client'

import { useState } from 'react'

type AttendanceEntry = {
  date: string
  status: 'present' | 'absent'
  absenceReason: string | null
  signedOutAt: string | null
}

const SCHOOL_DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function dateStr(d: Date) {
  // Safe local date string — dates are created at T12:00:00 local so UTC slice is fine
  return d.toISOString().slice(0, 10)
}

function circleStyle(
  entry: AttendanceEntry | undefined,
  dStr: string,
  todayStr: string,
): { bg: string; text: string; tooltip: string } {
  if (dStr > todayStr) {
    return { bg: 'bg-gray-100', text: 'text-gray-300', tooltip: '' }
  }
  if (!entry) {
    return { bg: 'bg-gray-100', text: 'text-gray-400', tooltip: 'Not recorded' }
  }
  if (entry.status === 'present') {
    if (entry.signedOutAt) {
      const so = new Date(entry.signedOutAt)
      if (so.getHours() * 60 + so.getMinutes() > 15 * 60) {
        return { bg: 'bg-blue-500', text: 'text-white', tooltip: 'Late pickup' }
      }
    }
    return { bg: 'bg-green-500', text: 'text-white', tooltip: 'Present' }
  }
  if (entry.status === 'absent') {
    const reason = entry.absenceReason?.toLowerCase() ?? ''
    if (reason.includes('holiday')) {
      return { bg: 'bg-amber-400', text: 'text-white', tooltip: entry.absenceReason ?? 'Holiday' }
    }
    return { bg: 'bg-red-500', text: 'text-white', tooltip: entry.absenceReason ? `Absent: ${entry.absenceReason}` : 'Absent' }
  }
  return { bg: 'bg-gray-100', text: 'text-gray-400', tooltip: '' }
}

function AttendanceCalendar({ term, entries, enrolledDays }: {
  term: { name: string; startDate: string; endDate: string }
  entries: AttendanceEntry[]
  enrolledDays: string[]
}) {
  const entryMap = Object.fromEntries(entries.map(e => [e.date, e]))
  const enrolledSet = new Set(enrolledDays)
  const todayStr = new Date().toISOString().slice(0, 10)

  const termStart = new Date(term.startDate + 'T12:00:00')
  const termEnd = new Date(term.endDate + 'T12:00:00')
  const termStartStr = dateStr(termStart)
  const termEndStr = dateStr(termEnd)

  // Find the Monday of the week containing termStart
  const firstMonday = new Date(termStart)
  const dow = firstMonday.getDay()
  firstMonday.setDate(firstMonday.getDate() - (dow === 0 ? 6 : dow - 1))

  // Build week rows
  const weeks: Date[][] = []
  const cur = new Date(firstMonday)
  while (dateStr(cur) <= termEndStr) {
    const week: Date[] = []
    for (let d = 0; d < 5; d++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    cur.setDate(cur.getDate() + 2) // skip Sat/Sun
    // Only include this week if it has at least one enrolled term day
    const hasEnrolledTermDay = week.some((day, di) => {
      const ds = dateStr(day)
      return ds >= termStartStr && ds <= termEndStr && enrolledSet.has(SCHOOL_DAY_NAMES[di])
    })
    if (hasEnrolledTermDay) weeks.push(week)
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {[
          { bg: 'bg-green-500', label: 'Present' },
          { bg: 'bg-red-500', label: 'Absent' },
          { bg: 'bg-amber-400', label: 'Holiday' },
          { bg: 'bg-blue-500', label: 'Late pickup' },
        ].map(({ bg, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${bg} inline-block`} />
            {label}
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-5 gap-1 mb-1 px-0.5">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className={`text-center text-xs font-medium ${enrolledSet.has(SCHOOL_DAY_NAMES[i]) ? 'text-gray-500' : 'text-gray-200'}`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-5 gap-1">
            {week.map((day, di) => {
              const ds = dateStr(day)
              const dayName = SCHOOL_DAY_NAMES[di]
              const isEnrolled = enrolledSet.has(dayName)
              const isInTerm = ds >= termStartStr && ds <= termEndStr

              if (!isInTerm || !isEnrolled) return <div key={di} />

              const entry = entryMap[ds]
              const { bg, text, tooltip } = circleStyle(entry, ds, todayStr)

              return (
                <div key={di} className="flex justify-center" title={tooltip || undefined}>
                  <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
                    <span className={`text-xs font-semibold ${text}`}>{day.getDate()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SicknessSection({
  termPercent, yearPercent, termName,
  termAbsences, termTotal, yearAbsences, yearTotal,
  term, termEntries, enrolledDays,
}: {
  termPercent: number | null
  yearPercent: number | null
  termName?: string
  termAbsences: number
  termTotal: number
  yearAbsences: number
  yearTotal: number
  term: { name: string; startDate: string; endDate: string } | null
  termEntries: AttendanceEntry[]
  enrolledDays: string[]
}) {
  const [showLog, setShowLog] = useState(false)

  if (termTotal === 0 && yearTotal === 0) return null

  function badge(pct: number | null) {
    if (pct === null) return 'bg-gray-100 text-gray-500'
    if (pct >= 20) return 'bg-red-100 text-red-700'
    if (pct >= 10) return 'bg-blue-100 text-blue-800'
    return 'bg-green-100 text-green-700'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Attendance</h2>
        {term && (
          <button
            onClick={() => setShowLog(v => !v)}
            className="text-xs text-[#020e2f] font-medium hover:underline"
          >
            {showLog ? 'Hide log' : 'Attendance log'}
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 text-center p-3 rounded-lg bg-gray-50">
          <div className={`text-2xl font-bold rounded-lg px-2 py-1 inline-block ${badge(termPercent)}`}>
            {termPercent !== null ? `${termPercent}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {termName ?? 'This term'} absence
          </div>
          <div className="text-xs text-gray-400">{termAbsences} of {termTotal} sessions</div>
        </div>
        <div className="flex-1 text-center p-3 rounded-lg bg-gray-50">
          <div className={`text-2xl font-bold rounded-lg px-2 py-1 inline-block ${badge(yearPercent)}`}>
            {yearPercent !== null ? `${yearPercent}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">This year absence</div>
          <div className="text-xs text-gray-400">{yearAbsences} of {yearTotal} sessions</div>
        </div>
      </div>

      {showLog && term && (
        <AttendanceCalendar
          term={term}
          entries={termEntries}
          enrolledDays={enrolledDays}
        />
      )}
    </div>
  )
}
