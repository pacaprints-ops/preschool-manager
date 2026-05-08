'use client'

import { useState } from 'react'

type TermInfo = {
  id: string
  name: string
  startDate: string
  endDate: string
  academicYear: string
}

type AttendanceEntry = {
  date: string
  status: 'present' | 'absent'
  absenceReason: string | null
  signedOutAt: string | null
}

const SCHOOL_DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function isLatePickup(entry: AttendanceEntry): boolean {
  if (!entry.signedOutAt) return false
  const so = new Date(entry.signedOutAt)
  return so.getHours() * 60 + so.getMinutes() > 15 * 60
}

function isHoliday(entry: AttendanceEntry): boolean {
  return entry.status === 'absent' && (entry.absenceReason?.toLowerCase().includes('holiday') ?? false)
}

function circleStyle(
  entry: AttendanceEntry | undefined,
  dStr: string,
  todayStr: string,
): { bg: string; text: string; tooltip: string } {
  if (dStr > todayStr) return { bg: 'bg-gray-100', text: 'text-gray-300', tooltip: '' }
  if (!entry) return { bg: 'bg-gray-100', text: 'text-gray-400', tooltip: 'Not recorded' }
  if (entry.status === 'present') {
    if (isLatePickup(entry)) return { bg: 'bg-blue-500', text: 'text-white', tooltip: 'Late pickup' }
    return { bg: 'bg-green-500', text: 'text-white', tooltip: 'Present' }
  }
  if (entry.status === 'absent') {
    if (isHoliday(entry)) return { bg: 'bg-amber-400', text: 'text-white', tooltip: entry.absenceReason ?? 'Holiday' }
    return { bg: 'bg-red-500', text: 'text-white', tooltip: entry.absenceReason ? `Absent: ${entry.absenceReason}` : 'Absent' }
  }
  return { bg: 'bg-gray-100', text: 'text-gray-400', tooltip: '' }
}

function AttendanceCalendar({ term, entries, enrolledDays }: {
  term: TermInfo
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

  const firstMonday = new Date(termStart)
  const dow = firstMonday.getDay()
  firstMonday.setDate(firstMonday.getDate() - (dow === 0 ? 6 : dow - 1))

  const weeks: Date[][] = []
  const cur = new Date(firstMonday)
  while (dateStr(cur) <= termEndStr) {
    const week: Date[] = []
    for (let d = 0; d < 5; d++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    cur.setDate(cur.getDate() + 2)
    const hasEnrolledTermDay = week.some((day, di) => {
      const ds = dateStr(day)
      return ds >= termStartStr && ds <= termEndStr && enrolledSet.has(SCHOOL_DAY_NAMES[di])
    })
    if (hasEnrolledTermDay) weeks.push(week)
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
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

function termStats(term: TermInfo, allEntries: AttendanceEntry[]) {
  const entries = allEntries.filter(e => e.date >= term.startDate && e.date <= term.endDate)
  const absences = entries.filter(e => e.status === 'absent')
  const sick = absences.filter(e => !isHoliday(e))
  const holiday = absences.filter(isHoliday)
  const late = entries.filter(e => e.status === 'present' && isLatePickup(e))
  const pct = entries.length > 0 ? Math.round((absences.length / entries.length) * 100) : null
  return { total: entries.length, absences: absences.length, sick: sick.length, holiday: holiday.length, late: late.length, pct }
}

function badgeClass(pct: number | null) {
  if (pct === null) return 'bg-gray-100 text-gray-500'
  if (pct >= 20) return 'bg-red-100 text-red-700'
  if (pct >= 10) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function currentAcademicYearBounds(): { start: string; end: string } {
  const today = new Date()
  const y = today.getFullYear()
  if (today.getMonth() >= 8) {
    return { start: `${y}-09-01`, end: `${y + 1}-08-31` }
  }
  return { start: `${y - 1}-09-01`, end: `${y}-08-31` }
}

export default function SicknessSection({ allTerms, allEntries, enrolledDays }: {
  allTerms: TermInfo[]
  allEntries: AttendanceEntry[]
  enrolledDays: string[]
}) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // Default to current or most recent past term
  const defaultIdx = (() => {
    const current = allTerms.findIndex(t => t.startDate <= todayStr && t.endDate >= todayStr)
    if (current >= 0) return current
    // Otherwise pick the most recent past term
    const past = allTerms.filter(t => t.endDate < todayStr)
    return past.length > 0 ? allTerms.indexOf(past[past.length - 1]) : 0
  })()

  const [selectedIdx, setSelectedIdx] = useState(defaultIdx < 0 ? 0 : defaultIdx)
  const [showLog, setShowLog] = useState(false)

  if (allTerms.length === 0 || allEntries.length === 0) return null

  const selectedTerm = allTerms[selectedIdx]
  const stats = termStats(selectedTerm, allEntries)

  // Year stat — always current academic year
  const { start: yearStart, end: yearEnd } = currentAcademicYearBounds()
  const yearEntries = allEntries.filter(e => e.date >= yearStart && e.date <= yearEnd)
  const yearAbsences = yearEntries.filter(e => e.status === 'absent').length
  const yearPct = yearEntries.length > 0 ? Math.round((yearAbsences / yearEntries.length) * 100) : null

  if (stats.total === 0 && yearEntries.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Attendance</h2>
        <button
          onClick={() => setShowLog(v => !v)}
          className="text-xs text-[#020e2f] font-medium hover:underline"
        >
          {showLog ? 'Hide log' : 'Attendance log'}
        </button>
      </div>

      {/* Stat boxes */}
      <div className="flex gap-3">
        {/* Selected term — with navigation */}
        <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <button
              onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
              disabled={selectedIdx === 0}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-20 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-sm leading-none"
              title="Previous term"
            >‹</button>
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{selectedTerm.name}</span>
            <button
              onClick={() => setSelectedIdx(i => Math.min(allTerms.length - 1, i + 1))}
              disabled={selectedIdx === allTerms.length - 1}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-20 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-sm leading-none"
              title="Next term"
            >›</button>
          </div>
          <div className={`text-2xl font-bold rounded-lg px-2 py-1 inline-block ${badgeClass(stats.pct)}`}>
            {stats.pct !== null ? `${stats.pct}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Absence rate</div>
          <div className="text-xs text-gray-400">{stats.absences} of {stats.total} sessions</div>
        </div>

        {/* Current academic year */}
        <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs font-semibold text-gray-600 mb-1.5">This year</div>
          <div className={`text-2xl font-bold rounded-lg px-2 py-1 inline-block ${badgeClass(yearPct)}`}>
            {yearPct !== null ? `${yearPct}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Absence rate</div>
          <div className="text-xs text-gray-400">{yearAbsences} of {yearEntries.length} sessions</div>
        </div>
      </div>

      {/* Term breakdown pills */}
      {stats.total > 0 && (
        <div className="flex gap-2 mt-2.5 flex-wrap">
          {stats.sick > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              {stats.sick} sick
            </span>
          )}
          {stats.holiday > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              {stats.holiday} holiday
            </span>
          )}
          {stats.late > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
              {stats.late} late pickup
            </span>
          )}
          {stats.absences === 0 && stats.late === 0 && (
            <span className="text-xs text-gray-400 italic">Perfect attendance this term</span>
          )}
        </div>
      )}

      {/* Attendance calendar */}
      {showLog && (
        <AttendanceCalendar
          term={selectedTerm}
          entries={allEntries.filter(e => e.date >= selectedTerm.startDate && e.date <= selectedTerm.endDate)}
          enrolledDays={enrolledDays}
        />
      )}
    </div>
  )
}
