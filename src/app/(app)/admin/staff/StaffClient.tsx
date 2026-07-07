'use client'

import { useState, useEffect } from 'react'
import {
  addSickness, deleteSickness, addTraining, deleteTraining,
  updateWorkingDays, updateDBS, saveMonthlyTimesheetData, updatePersonalDetails,
  adminResetPassword,
} from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string; name: string; email: string; role: string
  workingDays: string; dbsCertNumber: string | null
  dbsIssueDate: string | null; dbsOnUpdateService: boolean
  hasAllergies: boolean; allergies: string | null; medicalNotes: string | null
  emergencyContactName: string | null; emergencyContactRelationship: string | null
  emergencyContactPhone: string | null; emergencyContactPhone2: string | null
}
type Sickness = { id: string; userId: string; startDate: string; endDate: string | null; reason: string | null; notes: string | null }
type Training = { id: string; userId: string; trainingName: string; completedDate: string; expiryDate: string | null; notes: string | null }
type HoursLogEntry = { id: string; userId: string | null; date: string; signedInAt: string | null; signedOutAt: string | null }
type TimesheetEntry = { id: string; userId: string; date: string; timeIn: string | null; timeOut: string | null; hoursWorked: string; type: string; notes: string | null }
type MonthlyTimesheet = {
  id: string; userId: string; year: number; month: number
  additionalHours: string | null; additionalHoursNotes: string | null
  totalKeyChildren: number | null; totalExtraHours: string | null
  totalPay: string | null; notes: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
const DAY_LABEL: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' }
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtUTCTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function calcHoursFromTimes(timeIn: string | null, timeOut: string | null): number | null {
  if (!timeIn || !timeOut) return null
  const [ih, im] = timeIn.split(':').map(Number)
  const [oh, om] = timeOut.split(':').map(Number)
  const mins = (oh * 60 + om) - (ih * 60 + im)
  return mins > 0 ? Math.round(mins / 60 * 100) / 100 : null
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeeksInMonth(year: number, month: number): Date[][] {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)
  const monthEndStr = dateStr(monthEnd)

  const firstMonday = new Date(monthStart)
  const dow = firstMonday.getDay()
  firstMonday.setDate(firstMonday.getDate() - (dow === 0 ? 6 : dow - 1))

  const weeks: Date[][] = []
  const cur = new Date(firstMonday)

  while (true) {
    const week: Date[] = []
    for (let i = 0; i < 5; i++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    cur.setDate(cur.getDate() + 2)
    const inMonth = week.some(d => d.getMonth() === month - 1 && d.getFullYear() === year)
    if (inMonth) weeks.push(week)
    if (dateStr(week[4]) >= monthEndStr) break
  }
  return weeks
}

const SSP_WEEKLY_RATE = 116.75 // £/week statutory rate 2024/25

function getSickPeriodInfo(sortedDates: string[]): { totalDays: number; waitingDays: number; paidDays: number } {
  if (sortedDates.length === 0) return { totalDays: 0, waitingDays: 0, paidDays: 0 }
  const periods: string[][] = []
  let cur = [sortedDates[0]]
  for (let i = 1; i < sortedDates.length; i++) {
    const gap = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / 86400000
    if (gap <= 3) cur.push(sortedDates[i])
    else { periods.push([...cur]); cur = [sortedDates[i]] }
  }
  periods.push(cur)
  let waiting = 0, paid = 0
  for (const p of periods) { waiting += Math.min(3, p.length); paid += Math.max(0, p.length - 3) }
  return { totalDays: sortedDates.length, waitingDays: waiting, paidDays: paid }
}

function daySuffix(d: number): string {
  if (d > 3 && d < 21) return 'th'
  switch (d % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th' }
}

function generateTimesheetHTML(
  member: StaffMember,
  year: number,
  month: number,
  timesheets: TimesheetEntry[],
  monthlyData: MonthlyTimesheet | undefined,
): string {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const weeks = getWeeksInMonth(year, month)
  const hoursMap: Record<string, number> = {}
  const typeMap: Record<string, string> = {}
  for (const t of timesheets) {
    if (t.date.startsWith(monthStr)) {
      hoursMap[t.date] = parseFloat(t.hoursWorked) || 0
      typeMap[t.date] = t.type || 'work'
    }
  }

  const weekTotals = weeks.map(week =>
    week.reduce((sum, day) => {
      if (day.getMonth() !== month - 1 || day.getFullYear() !== year) return sum
      const ds = dateStr(day)
      if ((typeMap[ds] || 'work') !== 'work') return sum
      return sum + (hoursMap[ds] ?? 0)
    }, 0)
  )
  const regularTotal = weekTotals.reduce((a, b) => a + b, 0)
  const addHrs = parseFloat(monthlyData?.additionalHours ?? '0') || 0
  const extraHrs = parseFloat(monthlyData?.totalExtraHours ?? '0') || 0
  const totalMonthly = regularTotal + addHrs + extraHrs

  // Leave calculations
  const holidayDates = Object.keys(typeMap).filter(d => typeMap[d] === 'holiday').sort()
  const holidayHours = holidayDates.reduce((sum, d) => sum + (hoursMap[d] ?? 0), 0)
  const sickDates = Object.keys(typeMap).filter(d => typeMap[d] === 'sick').sort()
  const sickInfo = getSickPeriodInfo(sickDates)
  const workingDaysPerWeek = member.workingDays.split(',').filter(Boolean).length
  const sspDailyRate = workingDaysPerWeek > 0 ? SSP_WEEKLY_RATE / workingDaysPerWeek : 0
  const sspAmount = sickInfo.paidDays * sspDailyRate
  const holidayAccrual = regularTotal * 0.1207

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const rowsHTML = weeks.map((week, wi) => {
    const cells = week.map((day, di) => {
      const inMonth = day.getMonth() === month - 1 && day.getFullYear() === year
      if (!inMonth) {
        return `<td style="border:1px solid #bbb;padding:6px;min-width:80px;height:60px;background:#f5f5f5;"></td>`
      }
      const ds = dateStr(day)
      const hrs = hoursMap[ds] ?? 0
      const t = typeMap[ds] || 'work'
      const bg = t === 'holiday' ? '#f0fdf4' : t === 'sick' ? '#fffbeb' : 'transparent'
      const badge = t === 'holiday' ? `<div style="font-size:9px;font-weight:700;color:#15803d;margin-top:2px;">HOLIDAY</div>`
        : t === 'sick' ? `<div style="font-size:9px;font-weight:700;color:#b45309;margin-top:2px;">SICK</div>` : ''
      return `
        <td style="border:1px solid #bbb;padding:6px 8px;vertical-align:top;min-width:80px;height:60px;text-align:center;background:${bg};">
          <div style="font-size:11px;color:#555;margin-bottom:4px;">${dayNames[di].slice(0, 3)} ${day.getDate()}<sup style="font-size:9px;">${daySuffix(day.getDate())}</sup></div>
          <div style="font-size:14px;font-weight:600;">${hrs > 0 ? hrs.toFixed(2) : (t !== 'work' ? '' : '')}</div>
          ${badge}
        </td>`
    }).join('')
    const wt = weekTotals[wi]
    return `<tr>${cells}
        <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-weight:700;background:#f5f5f5;vertical-align:middle;">
          ${wt > 0 ? wt.toFixed(2) : ''}
        </td>
      </tr>`
  }).join('')

  const summaryRows = [
    ['Worked Hours', regularTotal.toFixed(2)],
    ['Additional Hours' + (monthlyData?.additionalHoursNotes ? ` (${monthlyData.additionalHoursNotes})` : ''), addHrs > 0 ? addHrs.toFixed(2) : ''],
    ['Total Monthly Hours', `<strong>${totalMonthly.toFixed(2)}</strong>`],
    ['Total Key Children', monthlyData?.totalKeyChildren != null ? String(monthlyData.totalKeyChildren) : ''],
    ['Total Extra Hours', extraHrs > 0 ? extraHrs.toFixed(2) : ''],
  ].map(([label, val]) => `
    <tr>
      <td style="border:1px solid #bbb;padding:7px 10px;font-weight:600;width:220px;">${label}</td>
      <td style="border:1px solid #bbb;padding:7px 10px;width:120px;text-align:right;">${val}</td>
      <td style="border:1px solid #bbb;padding:7px 10px;" colspan="2"></td>
    </tr>`).join('')

  const leaveRows = (holidayDates.length > 0 || sickDates.length > 0) ? `
    <tr><td colspan="4" style="padding:10px 10px 4px;font-weight:700;font-size:12px;border-top:2px solid #333;">LEAVE THIS MONTH</td></tr>
    ${holidayDates.length > 0 ? `
    <tr>
      <td style="border:1px solid #bbb;padding:7px 10px;background:#f0fdf4;">Holiday taken</td>
      <td style="border:1px solid #bbb;padding:7px 10px;text-align:right;background:#f0fdf4;">${holidayDates.length} day${holidayDates.length !== 1 ? 's' : ''}${holidayHours > 0 ? ` (${holidayHours.toFixed(2)}h)` : ''}</td>
      <td style="border:1px solid #bbb;padding:7px 10px;" colspan="2"></td>
    </tr>
    <tr>
      <td style="border:1px solid #bbb;padding:7px 10px;background:#f0fdf4;">Holiday pay accrued (12.07%)</td>
      <td style="border:1px solid #bbb;padding:7px 10px;text-align:right;background:#f0fdf4;">${holidayAccrual.toFixed(2)}h</td>
      <td style="border:1px solid #bbb;padding:7px 10px;" colspan="2"></td>
    </tr>` : ''}
    ${sickDates.length > 0 ? `
    <tr>
      <td style="border:1px solid #bbb;padding:7px 10px;background:#fffbeb;">Sick days</td>
      <td style="border:1px solid #bbb;padding:7px 10px;text-align:right;background:#fffbeb;">${sickInfo.totalDays} day${sickInfo.totalDays !== 1 ? 's' : ''} (${sickInfo.waitingDays} waiting, ${sickInfo.paidDays} SSP)</td>
      <td style="border:1px solid #bbb;padding:7px 10px;" colspan="2"></td>
    </tr>
    ${sickInfo.paidDays > 0 ? `
    <tr>
      <td style="border:1px solid #bbb;padding:7px 10px;font-weight:600;background:#fffbeb;">SSP (£${SSP_WEEKLY_RATE}/wk ÷ ${workingDaysPerWeek} days × ${sickInfo.paidDays})</td>
      <td style="border:1px solid #bbb;padding:7px 10px;font-weight:600;text-align:right;background:#fffbeb;">£${sspAmount.toFixed(2)}</td>
      <td style="border:1px solid #bbb;padding:7px 10px;" colspan="2"></td>
    </tr>` : `
    <tr>
      <td style="border:1px solid #bbb;padding:7px 10px;color:#888;background:#fffbeb;">SSP</td>
      <td style="border:1px solid #bbb;padding:7px 10px;color:#888;text-align:right;background:#fffbeb;">Not applicable (under 4 days)</td>
      <td style="border:1px solid #bbb;padding:7px 10px;" colspan="2"></td>
    </tr>`}` : ''}` : ''

  const payRow = `
    <tr>
      <td style="border:2px solid #333;padding:9px 10px;font-weight:800;font-size:14px;">TOTAL PAY</td>
      <td style="border:2px solid #333;padding:9px 10px;font-weight:800;font-size:14px;text-align:right;">${monthlyData?.totalPay ? `£${parseFloat(monthlyData.totalPay).toFixed(2)}` : ''}</td>
      <td style="border:2px solid #333;padding:9px 10px;" colspan="2"></td>
    </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Wages Sheet – ${member.name} – ${monthLabel}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; margin: 24px; color: #000; }
    h1 { text-align: center; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 14px; }
    .header { display: flex; gap: 48px; margin-bottom: 18px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    th { border: 1px solid #bbb; padding: 8px; text-align: center; font-weight: 700; background: #ececec; font-size: 12px; }
    #print-btn { float: right; padding: 8px 18px; background: #1e3a8a; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: Arial, sans-serif; margin-bottom: 12px; }
    @media print { #print-btn { display: none; } body { margin: 12px; } }
  </style>
</head>
<body>
  <button id="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <h1>Winton Pre-School Little Explorers Wages Sheet</h1>
  <div class="header">
    <div>Name: &nbsp;<strong>${member.name}</strong></div>
    <div>Month: <strong>${monthLabel}</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th>
        <th style="white-space:nowrap;">Total Wkly<br>Hours</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
  </table>
  <table>
    <tbody>
      ${summaryRows}
      ${leaveRows}
      ${payRow}
    </tbody>
  </table>
</body>
</html>`
}

// ─── Timesheet Panel ──────────────────────────────────────────────────────────

function TimesheetPanel({ member, timesheets, hoursLog, monthlyData }: {
  member: StaffMember
  timesheets: TimesheetEntry[]
  hoursLog: HoursLogEntry[]
  monthlyData: MonthlyTimesheet[]
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dailyHours, setDailyHours] = useState<Record<string, string>>({})
  const [dailyTypes, setDailyTypes] = useState<Record<string, 'work' | 'holiday' | 'sick'>>({})
  const [summary, setSummary] = useState({
    additionalHours: '', additionalHoursNotes: '',
    totalKeyChildren: '', totalExtraHours: '', totalPay: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const workingDaySet = new Set(member.workingDays.split(',').filter(Boolean))

  // Sync when month/year or data changes
  useEffect(() => {
    const newHours: Record<string, string> = {}
    const newTypes: Record<string, 'work' | 'holiday' | 'sick'> = {}
    for (const t of timesheets) {
      if (t.date.startsWith(monthStr)) {
        newHours[t.date] = t.hoursWorked
        if (t.type && t.type !== 'work') newTypes[t.date] = t.type as 'work' | 'holiday' | 'sick'
      }
    }
    setDailyHours(newHours)
    setDailyTypes(newTypes)

    const md = monthlyData.find(m => m.year === year && m.month === month)
    setSummary({
      additionalHours: md?.additionalHours ?? '',
      additionalHoursNotes: md?.additionalHoursNotes ?? '',
      totalKeyChildren: md?.totalKeyChildren?.toString() ?? '',
      totalExtraHours: md?.totalExtraHours ?? '',
      totalPay: md?.totalPay ?? '',
      notes: md?.notes ?? '',
    })
    setSaved(false)
  }, [year, month, timesheets, monthlyData])

  const logByDate = Object.fromEntries(hoursLog.map(h => [h.date, h]))

  function logHrsForDate(ds: string): number | null {
    const log = logByDate[ds]
    if (!log) return null
    return calcHoursFromTimes(fmtUTCTime(log.signedInAt), fmtUTCTime(log.signedOutAt))
  }

  const weeks = getWeeksInMonth(year, month)

  const weekTotals = weeks.map(week =>
    week.reduce((sum, day, di) => {
      if (day.getMonth() !== month - 1 || day.getFullYear() !== year) return sum
      const ds = dateStr(day)
      const dayAbbr = ALL_DAYS[di]
      if (!workingDaySet.has(dayAbbr)) return sum
      if ((dailyTypes[ds] || 'work') !== 'work') return sum
      return sum + (parseFloat(dailyHours[ds] || '0') || 0)
    }, 0)
  )

  const regularTotal = weekTotals.reduce((a, b) => a + b, 0)

  // Leave calculations
  const holidayDatesMonth = Object.entries(dailyTypes)
    .filter(([d, t]) => d.startsWith(monthStr) && t === 'holiday').map(([d]) => d).sort()
  const holidayHoursMonth = holidayDatesMonth.reduce((sum, d) => sum + (parseFloat(dailyHours[d] || '0') || 0), 0)
  const sickDatesMonth = Object.entries(dailyTypes)
    .filter(([d, t]) => d.startsWith(monthStr) && t === 'sick').map(([d]) => d).sort()
  const sickInfo = getSickPeriodInfo(sickDatesMonth)
  const workingDaysPerWeek = member.workingDays.split(',').filter(Boolean).length
  const sspDailyRate = workingDaysPerWeek > 0 ? SSP_WEEKLY_RATE / workingDaysPerWeek : 0
  const sspAmount = sickInfo.paidDays * sspDailyRate
  const holidayAccrualHours = regularTotal * 0.1207

  const addHrs = parseFloat(summary.additionalHours || '0') || 0
  const extraHrs = parseFloat(summary.totalExtraHours || '0') || 0
  const totalMonthly = regularTotal + addHrs + extraHrs

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  async function handleSave() {
    setSaving(true)
    // Include work days with hours AND any holiday/sick days (even with 0 hours)
    const allDates = new Set<string>([
      ...Object.entries(dailyHours).filter(([d, h]) => d.startsWith(monthStr) && parseFloat(h) > 0).map(([d]) => d),
      ...Object.entries(dailyTypes).filter(([d, t]) => d.startsWith(monthStr) && t !== 'work').map(([d]) => d),
    ])
    const entries = Array.from(allDates).sort().map(date => {
      const log = logByDate[date]
      const h = dailyHours[date] || '0'
      return {
        date,
        timeIn: fmtUTCTime(log?.signedInAt ?? null),
        timeOut: fmtUTCTime(log?.signedOutAt ?? null),
        hoursWorked: parseFloat(h) > 0 ? parseFloat(h).toFixed(2) : '0',
        type: dailyTypes[date] || 'work',
      }
    })
    await saveMonthlyTimesheetData(member.id, year, month, entries, summary)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  function openPDF(y: number, m: number) {
    const md = monthlyData.find(x => x.year === y && x.month === m)
    const html = generateTimesheetHTML(member, y, m, timesheets, md)
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const savedMonths = monthlyData.slice().sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  )

  return (
    <div>
      {/* Saved timesheets list */}
      {savedMonths.length > 0 && (
        <div className="mb-5 border border-gray-200 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Saved Timesheets</h4>
          <div className="flex flex-wrap gap-2">
            {savedMonths.map(m => {
              const label = new Date(m.year, m.month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
              const isCurrent = m.year === year && m.month === month
              return (
                <div key={m.id} className={`flex items-center rounded-lg border overflow-hidden text-sm ${isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <button
                    onClick={() => { setYear(m.year); setMonth(m.month) }}
                    className={`px-3 py-1.5 font-medium ${isCurrent ? 'text-blue-800' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    {label}
                  </button>
                  <button
                    onClick={() => openPDF(m.year, m.month)}
                    className="px-2.5 py-1.5 border-l border-gray-200 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    title="Open PDF in new tab"
                  >
                    PDF ↗
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-xl px-3 py-2">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-bold text-gray-600 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">← Prev</button>
        <span className="text-sm font-bold text-gray-800">{monthLabel}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-bold text-gray-600 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">Next →</button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto -mx-4 px-4 mb-5">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {DAY_FULL.map(d => (
                <th key={d} className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-500 text-center">{d}</th>
              ))}
              <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-500 text-center whitespace-nowrap">Wkly Total</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  const inMonth = day.getMonth() === month - 1 && day.getFullYear() === year
                  const ds = dateStr(day)
                  const dayAbbr = ALL_DAYS[di]
                  const isWorkingDay = workingDaySet.has(dayAbbr)
                  const logHrs = inMonth ? logHrsForDate(ds) : null
                  const sheetHrs = parseFloat(dailyHours[ds] || '0') || 0
                  const hasDiscrepancy = logHrs !== null && sheetHrs > 0 && Math.abs(logHrs - sheetHrs) > 0.26

                  const entryType = (dailyTypes[ds] || 'work') as 'work' | 'holiday' | 'sick'
                  const cellBg = !inMonth
                    ? 'bg-gray-50'
                    : !isWorkingDay
                      ? 'bg-gray-50'
                      : entryType === 'holiday'
                        ? 'bg-green-50'
                        : entryType === 'sick'
                          ? 'bg-amber-50'
                          : hasDiscrepancy
                            ? 'bg-amber-50'
                            : ''

                  return (
                    <td key={di} className={`border border-gray-200 p-2 align-top ${cellBg}`} style={{ minWidth: '86px', width: '86px' }}>
                      {inMonth ? (
                        <div className="min-h-[64px]">
                          <div className="text-xs text-gray-400 text-right leading-none mb-1.5">{day.getDate()}</div>
                          {isWorkingDay ? (
                            <>
                              {entryType !== 'sick' ? (
                                <input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  max="12"
                                  value={dailyHours[ds] ?? ''}
                                  onChange={e => setDailyHours(prev => ({ ...prev, [ds]: e.target.value }))}
                                  className="w-full text-sm text-center border border-gray-200 bg-white rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  placeholder="—"
                                />
                              ) : (
                                <div className="text-xs font-bold text-amber-600 text-center py-1.5">SICK</div>
                              )}
                              {logHrs !== null && entryType === 'work' && (
                                <div className={`text-xs text-center mt-0.5 ${hasDiscrepancy ? 'text-amber-600 font-semibold' : 'text-gray-300'}`}>
                                  {hasDiscrepancy ? `⚠ ${logHrs.toFixed(2)}h` : `${logHrs.toFixed(2)}h`}
                                </div>
                              )}
                              <select
                                value={entryType}
                                onChange={e => setDailyTypes(prev => {
                                  const next = { ...prev }
                                  const val = e.target.value as 'work' | 'holiday' | 'sick'
                                  if (val === 'work') delete next[ds]
                                  else next[ds] = val
                                  return next
                                })}
                                className="w-full mt-1.5 text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              >
                                <option value="work">Work</option>
                                <option value="holiday">Holiday</option>
                                <option value="sick">Sick</option>
                              </select>
                            </>
                          ) : (
                            <div className="text-xs text-gray-300 text-center mt-2">—</div>
                          )}
                        </div>
                      ) : (
                        <div className="min-h-[64px]">
                          <div className="text-xs text-gray-200 text-right leading-none">{day.getDate()}</div>
                        </div>
                      )}
                    </td>
                  )
                })}
                <td className="border border-gray-200 px-3 text-sm font-bold text-gray-700 text-right align-middle whitespace-nowrap bg-gray-50">
                  {weekTotals[wi] > 0 ? `${weekTotals[wi].toFixed(2)}h` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-1.5">Small number below a cell = hours from sign-in log. ⚠ = differs by more than 15 min.</p>
      </div>

      {/* Additional hours */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Additional Hours</h4>
        <div className="flex gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hours</label>
            <input
              type="number" step="0.25" min="0"
              value={summary.additionalHours}
              onChange={e => setSummary(s => ({ ...s, additionalHours: e.target.value }))}
              className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Notes (e.g. INSET day, meeting)</label>
            <input
              value={summary.additionalHoursNotes}
              onChange={e => setSummary(s => ({ ...s, additionalHoursNotes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {/* Summary totals */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Monthly Summary</h4>
        <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Total Key Children</label>
            <input
              type="number" min="0"
              value={summary.totalKeyChildren}
              onChange={e => setSummary(s => ({ ...s, totalKeyChildren: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Total Extra Hours</label>
            <input
              type="number" step="0.25" min="0"
              value={summary.totalExtraHours}
              onChange={e => setSummary(s => ({ ...s, totalExtraHours: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Total Pay (£)</label>
            <input
              type="number" step="0.01" min="0"
              value={summary.totalPay}
              onChange={e => setSummary(s => ({ ...s, totalPay: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Calculated totals box */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Worked hours</span>
            <span className="font-semibold">{regularTotal.toFixed(2)}h</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Additional hours</span>
            <span className="font-semibold">{addHrs.toFixed(2)}h</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Extra hours</span>
            <span className="font-semibold">{extraHrs.toFixed(2)}h</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-800">
            <span>Total Monthly Hours</span>
            <span>{totalMonthly.toFixed(2)}h</span>
          </div>
          {summary.totalPay && (
            <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold">
              <span className="text-gray-800">Total Pay</span>
              <span className="text-green-700">£{parseFloat(summary.totalPay || '0').toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Leave summary */}
        {(holidayDatesMonth.length > 0 || sickDatesMonth.length > 0) && (
          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">Leave This Month</div>
            <div className="divide-y divide-gray-100">
              {holidayDatesMonth.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-green-50">
                    <span className="text-xs text-green-800 font-medium">Holiday taken</span>
                    <span className="text-xs font-semibold text-green-800">
                      {holidayDatesMonth.length} day{holidayDatesMonth.length !== 1 ? 's' : ''}
                      {holidayHoursMonth > 0 ? ` · ${holidayHoursMonth.toFixed(2)}h` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 bg-green-50">
                    <span className="text-xs text-green-700">Holiday pay accrued this month (12.07%)</span>
                    <span className="text-xs font-semibold text-green-700">{holidayAccrualHours.toFixed(2)}h</span>
                  </div>
                </>
              )}
              {sickDatesMonth.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-amber-50">
                    <span className="text-xs text-amber-800 font-medium">
                      Sick days · {sickInfo.waitingDays} waiting day{sickInfo.waitingDays !== 1 ? 's' : ''} · {sickInfo.paidDays} SSP day{sickInfo.paidDays !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-semibold text-amber-800">{sickInfo.totalDays} day{sickInfo.totalDays !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 bg-amber-50">
                    <span className="text-xs text-amber-700">
                      {sickInfo.paidDays > 0
                        ? `SSP — £${SSP_WEEKLY_RATE}/wk ÷ ${workingDaysPerWeek} days × ${sickInfo.paidDays}`
                        : 'SSP — not applicable (under 4 consecutive days)'}
                    </span>
                    <span className="text-xs font-semibold text-amber-800">
                      {sickInfo.paidDays > 0 ? `£${sspAmount.toFixed(2)}` : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>
            {sickDatesMonth.length > 0 && (
              <p className="px-4 py-1.5 text-[10px] text-gray-400 border-t border-gray-100">
                Linked absences within 8 weeks carry over waiting days — verify manually if applicable.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${saved ? 'bg-green-600' : 'bg-blue-800 hover:bg-blue-900'}`}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save timesheet'}
        </button>
        {monthlyData.some(m => m.year === year && m.month === month) && (
          <button
            onClick={() => openPDF(year, month)}
            className="px-4 py-2.5 text-sm font-semibold text-blue-800 border border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap"
          >
            PDF ↗
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StaffClient({ staff, sickness, training, hoursLog, timesheets, monthlyData, isAdmin = true, currentUserId = '' }: {
  staff: StaffMember[]
  sickness: Sickness[]
  training: Training[]
  hoursLog: HoursLogEntry[]
  timesheets: TimesheetEntry[]
  monthlyData: MonthlyTimesheet[]
  isAdmin?: boolean
  currentUserId?: string
}) {
  const [selectedStaff, setSelectedStaff] = useState<string>(isAdmin ? (staff[0]?.id ?? '') : currentUserId)
  const [activeTab, setActiveTab] = useState<'rota' | 'training' | 'sickness' | 'dbs' | 'hours' | 'timesheet' | 'personal'>('rota')
  const [saving, setSaving] = useState(false)
  const [dbsForm, setDbsForm] = useState<Record<string, { dbsCertNumber: string; dbsIssueDate: string; dbsOnUpdateService: boolean }>>(
    Object.fromEntries(staff.map(s => [s.id, {
      dbsCertNumber: s.dbsCertNumber ?? '',
      dbsIssueDate: s.dbsIssueDate ?? '',
      dbsOnUpdateService: s.dbsOnUpdateService ?? false,
    }]))
  )
  const [savingDbs, setSavingDbs] = useState(false)
  const [addingTraining, setAddingTraining] = useState(false)
  const [addingSickness, setAddingSickness] = useState(false)
  const [trainingForm, setTrainingForm] = useState({ trainingName: '', completedDate: '', expiryDate: '', notes: '' })
  const [sicknessForm, setSicknessForm] = useState({ startDate: '', endDate: '', reason: '', notes: '' })
  const [workingDaysMap, setWorkingDaysMap] = useState<Record<string, string>>(
    Object.fromEntries(staff.map(s => [s.id, s.workingDays]))
  )
  const [personalForm, setPersonalForm] = useState<Record<string, {
    hasAllergies: boolean; allergies: string; medicalNotes: string
    emergencyContactName: string; emergencyContactRelationship: string
    emergencyContactPhone: string; emergencyContactPhone2: string
  }>>(
    Object.fromEntries(staff.map(s => [s.id, {
      hasAllergies: s.hasAllergies,
      allergies: s.allergies ?? '',
      medicalNotes: s.medicalNotes ?? '',
      emergencyContactName: s.emergencyContactName ?? '',
      emergencyContactRelationship: s.emergencyContactRelationship ?? '',
      emergencyContactPhone: s.emergencyContactPhone ?? '',
      emergencyContactPhone2: s.emergencyContactPhone2 ?? '',
    }]))
  )
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetTempPassword, setResetTempPassword] = useState('')
  const [resetResult, setResetResult] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const selectedMember = staff.find(s => s.id === selectedStaff)
  const staffSickness = sickness.filter(s => s.userId === selectedStaff)
  const staffTraining = training.filter(t => t.userId === selectedStaff)
  const staffHoursLog = hoursLog.filter(h => h.userId === selectedStaff)
  const staffTimesheets = timesheets.filter(t => t.userId === selectedStaff)
  const staffMonthlyData = monthlyData.filter(m => m.userId === selectedStaff)

  const expiringTraining = training.filter(t => { const d = daysUntilExpiry(t.expiryDate); return d !== null && d <= 60 && d >= 0 })
  const expiredTraining = training.filter(t => { const d = daysUntilExpiry(t.expiryDate); return d !== null && d < 0 })

  async function handleAddTraining() {
    if (!trainingForm.trainingName || !trainingForm.completedDate) return
    setSaving(true)
    await addTraining(selectedStaff, trainingForm)
    setTrainingForm({ trainingName: '', completedDate: '', expiryDate: '', notes: '' })
    setSaving(false)
    setAddingTraining(false)
  }

  async function handleAddSickness() {
    if (!sicknessForm.startDate) return
    setSaving(true)
    await addSickness(selectedStaff, sicknessForm)
    setSicknessForm({ startDate: '', endDate: '', reason: '', notes: '' })
    setSaving(false)
    setAddingSickness(false)
  }

  async function toggleDay(userId: string, day: string) {
    const current = workingDaysMap[userId] ?? 'mon,tue,wed,thu,fri'
    const days = current.split(',').filter(Boolean)
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    const ordered = ALL_DAYS.filter(d => next.includes(d))
    const str = ordered.join(',')
    setWorkingDaysMap(m => ({ ...m, [userId]: str }))
    await updateWorkingDays(userId, str)
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'rota', label: 'Rota' },
    { key: 'personal', label: 'Personal' },
    { key: 'hours', label: 'Hours log' },
    { key: 'timesheet', label: 'Timesheets' },
    { key: 'training', label: 'Training' },
    { key: 'sickness', label: 'Sickness' },
    { key: 'dbs', label: 'DBS' },
  ]

  return (
    <div className="space-y-4">
      {isAdmin && (expiringTraining.length > 0 || expiredTraining.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2">Training Alerts</h3>
          <div className="space-y-1">
            {expiredTraining.map(t => {
              const member = staff.find(s => s.id === t.userId)
              return <div key={t.id} className="text-sm text-red-700"><strong>{member?.name}</strong> — {t.trainingName} expired {Math.abs(daysUntilExpiry(t.expiryDate) ?? 0)} days ago</div>
            })}
            {expiringTraining.map(t => {
              const member = staff.find(s => s.id === t.userId)
              return <div key={t.id} className="text-sm text-blue-800"><strong>{member?.name}</strong> — {t.trainingName} expires in {daysUntilExpiry(t.expiryDate)} days</div>
            })}
          </div>
        </div>
      )}

      {/* Team rota overview — admin only */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Rota</h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="text-left pr-8 py-1 text-gray-500 font-medium">Name</th>
                  {ALL_DAYS.map(d => <th key={d} className="px-5 py-1 text-center text-gray-500 font-medium">{DAY_LABEL[d]}</th>)}
                </tr>
              </thead>
              <tbody>
                {staff.map(s => {
                  const days = workingDaysMap[s.id]?.split(',').filter(Boolean) ?? []
                  return (
                    <tr key={s.id} className="border-t border-gray-100">
                      <td className="pr-8 py-2 font-medium text-gray-900">{s.name}</td>
                      {ALL_DAYS.map(d => (
                        <td key={d} className="px-5 py-2 text-center text-base">
                          {days.includes(d) ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-person panel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Staff switcher tabs — admin only */}
        {isAdmin && (
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {staff.map(s => (
            <button key={s.id} onClick={() => setSelectedStaff(s.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${selectedStaff === s.id ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {s.name}
              {training.some(t => { if (t.userId !== s.id) return false; const d = daysUntilExpiry(t.expiryDate); return d !== null && d <= 60 }) && <span className="ml-1 text-red-500">•</span>}
            </button>
          ))}
        </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {tabs.map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === key ? 'bg-blue-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {isAdmin && selectedMember && (
              <button
                onClick={() => { setShowResetModal(true); setResetTempPassword(''); setResetResult(null) }}
                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap"
              >
                Reset password
              </button>
            )}
          </div>

          {/* Reset password modal */}
          {showResetModal && selectedMember && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
                <h3 className="font-semibold text-gray-900">Reset password — {selectedMember.name}</h3>
                {resetResult ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-700 font-medium mb-1">Temporary password set:</p>
                      <p className="font-mono text-sm font-bold text-green-900">{resetResult}</p>
                      <p className="text-xs text-green-600 mt-1">Share this with {selectedMember.name} — they can use "Forgot password" to set their own once Resend is active.</p>
                    </div>
                    <button
                      onClick={() => setShowResetModal(false)}
                      className="w-full py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Temporary password</label>
                      <input
                        value={resetTempPassword}
                        onChange={e => setResetTempPassword(e.target.value)}
                        placeholder="e.g. winton123"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                      <p className="text-xs text-gray-400 mt-1">Min 8 characters. Share verbally with the staff member.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowResetModal(false)}
                        className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={resetTempPassword.length < 8 || resetting}
                        onClick={async () => {
                          setResetting(true)
                          await adminResetPassword(selectedMember.id, resetTempPassword)
                          setResetResult(resetTempPassword)
                          setResetting(false)
                        }}
                        className="flex-1 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                      >
                        {resetting ? 'Saving…' : 'Set password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Rota ── */}
          {activeTab === 'rota' && selectedMember && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Days <span className="font-semibold">{selectedMember.name}</span> works. Click to toggle.</p>
              <div className="flex gap-3 flex-wrap">
                {ALL_DAYS.map(day => {
                  const days = workingDaysMap[selectedStaff]?.split(',').filter(Boolean) ?? []
                  const working = days.includes(day)
                  return (
                    <button key={day} onClick={() => toggleDay(selectedStaff, day)}
                      className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl border-2 font-medium transition-colors ${working ? 'bg-blue-800 text-white border-blue-800' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}
                    >
                      <span className="text-sm">{DAY_LABEL[day]}</span>
                      <span className="text-xs opacity-70">{working ? 'Working' : 'Off'}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400">Changes save automatically.</p>
            </div>
          )}

          {/* ── Personal ── */}
          {activeTab === 'personal' && selectedMember && (() => {
            const pf = personalForm[selectedStaff] ?? {
              hasAllergies: false, allergies: '', medicalNotes: '',
              emergencyContactName: '', emergencyContactRelationship: '',
              emergencyContactPhone: '', emergencyContactPhone2: '',
            }
            const set = (patch: Partial<typeof pf>) =>
              setPersonalForm(f => ({ ...f, [selectedStaff]: { ...pf, ...patch } }))
            return (
              <div className="space-y-5">
                {/* Allergy / medical */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Allergy &amp; Medical</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasAllergies"
                      checked={pf.hasAllergies}
                      onChange={e => set({ hasAllergies: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="hasAllergies" className="text-sm text-gray-700 font-medium">Has allergies</label>
                  </div>
                  {pf.hasAllergies && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Allergy details</label>
                      <textarea
                        value={pf.allergies}
                        onChange={e => set({ allergies: e.target.value })}
                        rows={2}
                        className={inp + ' resize-none'}
                        placeholder="e.g. Peanut allergy — carries EpiPen"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Medical notes</label>
                    <textarea
                      value={pf.medicalNotes}
                      onChange={e => set({ medicalNotes: e.target.value })}
                      rows={2}
                      className={inp + ' resize-none'}
                      placeholder="Any medical conditions, medication, etc."
                    />
                  </div>
                </div>

                {/* Emergency contact */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Name</label>
                      <input
                        value={pf.emergencyContactName}
                        onChange={e => set({ emergencyContactName: e.target.value })}
                        placeholder="Full name"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Relationship</label>
                      <input
                        value={pf.emergencyContactRelationship}
                        onChange={e => set({ emergencyContactRelationship: e.target.value })}
                        placeholder="e.g. Spouse, Parent"
                        className={inp}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Phone (primary)</label>
                      <input
                        type="tel"
                        value={pf.emergencyContactPhone}
                        onChange={e => set({ emergencyContactPhone: e.target.value })}
                        placeholder="07xxx xxxxxx"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Phone (secondary)</label>
                      <input
                        type="tel"
                        value={pf.emergencyContactPhone2}
                        onChange={e => set({ emergencyContactPhone2: e.target.value })}
                        placeholder="Optional"
                        className={inp}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    setSavingPersonal(true)
                    await updatePersonalDetails(selectedStaff, pf)
                    setSavingPersonal(false)
                  }}
                  disabled={savingPersonal}
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                >
                  {savingPersonal ? 'Saving…' : 'Save'}
                </button>

                {/* Summary display if data already saved */}
                {(selectedMember.hasAllergies || selectedMember.emergencyContactName) && (
                  <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Saved record</p>
                    {selectedMember.hasAllergies && (
                      <div className="flex items-start gap-2">
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">Allergy</span>
                        <span className="text-gray-700">{selectedMember.allergies ?? 'Details not recorded'}</span>
                      </div>
                    )}
                    {selectedMember.medicalNotes && (
                      <div className="text-gray-600">{selectedMember.medicalNotes}</div>
                    )}
                    {selectedMember.emergencyContactName && (
                      <div className="pt-1 border-t border-gray-100">
                        <span className="font-medium text-gray-800">{selectedMember.emergencyContactName}</span>
                        {selectedMember.emergencyContactRelationship && <span className="text-gray-500 ml-1">({selectedMember.emergencyContactRelationship})</span>}
                        <div className="text-gray-600 mt-0.5">
                          {selectedMember.emergencyContactPhone}
                          {selectedMember.emergencyContactPhone2 && <span className="ml-3 text-gray-400">{selectedMember.emergencyContactPhone2}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Hours log ── */}
          {activeTab === 'hours' && selectedMember && (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Sign-in/out times recorded on the daily register for <span className="font-semibold">{selectedMember.name}</span>.
              </p>
              {staffHoursLog.length === 0 ? (
                <p className="text-sm text-gray-400">No sign-in records yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-2 pr-6 font-medium">Date</th>
                        <th className="pb-2 pr-6 font-medium">In</th>
                        <th className="pb-2 pr-6 font-medium">Out</th>
                        <th className="pb-2 font-medium">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staffHoursLog.slice().reverse().map(h => {
                        const inTime = fmtUTCTime(h.signedInAt)
                        const outTime = fmtUTCTime(h.signedOutAt)
                        const hrs = calcHoursFromTimes(inTime, outTime)
                        return (
                          <tr key={h.id}>
                            <td className="py-2 pr-6 text-gray-700">{fmtDate(h.date)}</td>
                            <td className="py-2 pr-6 text-gray-700 font-mono">{inTime ?? '—'}</td>
                            <td className="py-2 pr-6 font-mono">
                              {outTime
                                ? <span className="text-gray-700">{outTime}</span>
                                : <span className="text-amber-500">Not signed out</span>
                              }
                            </td>
                            <td className="py-2 text-gray-700">{hrs !== null ? `${hrs.toFixed(2)}h` : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Timesheets ── */}
          {activeTab === 'timesheet' && selectedMember && (
            <TimesheetPanel
              member={selectedMember}
              timesheets={staffTimesheets}
              hoursLog={staffHoursLog}
              monthlyData={staffMonthlyData}
            />
          )}

          {/* ── Training ── */}
          {activeTab === 'training' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{staffTraining.length} records</span>
                <button onClick={() => setAddingTraining(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">{addingTraining ? 'Cancel' : '+ Add training'}</button>
              </div>
              {staffTraining.map(t => {
                const days = daysUntilExpiry(t.expiryDate)
                const isExpired = days !== null && days < 0
                const isExpiring = days !== null && days <= 60 && days >= 0
                return (
                  <div key={t.id} className={`flex items-start justify-between p-3 rounded-lg text-sm ${isExpired ? 'bg-red-50 border border-red-200' : isExpiring ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <div>
                      <div className="font-medium text-gray-900">{t.trainingName}</div>
                      <div className="text-gray-500">Completed: {new Date(t.completedDate + 'T12:00:00').toLocaleDateString('en-GB')}</div>
                      {t.expiryDate && (
                        <div className={isExpired ? 'text-red-600 font-medium' : isExpiring ? 'text-blue-800' : 'text-gray-500'}>
                          Expires: {new Date(t.expiryDate + 'T12:00:00').toLocaleDateString('en-GB')}
                          {isExpired && ' — EXPIRED'}{isExpiring && ` — ${days} days left`}
                        </div>
                      )}
                    </div>
                    <button onClick={() => deleteTraining(t.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </div>
                )
              })}
              {staffTraining.length === 0 && !addingTraining && <p className="text-sm text-gray-400">No training records.</p>}
              {addingTraining && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Training name *</label><input value={trainingForm.trainingName} onChange={e => setTrainingForm(f => ({ ...f, trainingName: e.target.value }))} placeholder="e.g. First Aid" className={inp} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Completed date *</label><input type="date" value={trainingForm.completedDate} onChange={e => setTrainingForm(f => ({ ...f, completedDate: e.target.value }))} className={inp} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Expiry date</label><input type="date" value={trainingForm.expiryDate} onChange={e => setTrainingForm(f => ({ ...f, expiryDate: e.target.value }))} className={inp} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Notes</label><input value={trainingForm.notes} onChange={e => setTrainingForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
                  </div>
                  <button onClick={handleAddTraining} disabled={saving} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>
          )}

          {/* ── DBS ── */}
          {activeTab === 'dbs' && selectedMember && (() => {
            const form = dbsForm[selectedStaff] ?? { dbsCertNumber: '', dbsIssueDate: '', dbsOnUpdateService: false }
            const dbsDaysLeft = form.dbsIssueDate
              ? Math.floor((new Date(form.dbsIssueDate).getTime() + 3 * 365.25 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
              : null
            return (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">DBS certificate details for <span className="font-semibold">{selectedMember.name}</span>.</p>
                {form.dbsIssueDate && dbsDaysLeft !== null && (
                  <div className={`rounded-lg px-3 py-2 text-sm ${dbsDaysLeft < 0 ? 'bg-red-50 border border-red-200 text-red-700' : dbsDaysLeft <= 90 ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                    {dbsDaysLeft < 0
                      ? `DBS renewal overdue — issued ${Math.abs(dbsDaysLeft)} days past 3 years`
                      : dbsDaysLeft <= 90
                        ? `DBS due for renewal in ${dbsDaysLeft} days`
                        : `DBS valid — ${dbsDaysLeft} days remaining`}
                    {form.dbsOnUpdateService && <span className="ml-2 font-medium">(On Update Service)</span>}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Certificate number</label>
                    <input value={form.dbsCertNumber} onChange={e => setDbsForm(f => ({ ...f, [selectedStaff]: { ...form, dbsCertNumber: e.target.value } }))} placeholder="e.g. 001234567890" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Issue date</label>
                    <input type="date" value={form.dbsIssueDate} onChange={e => setDbsForm(f => ({ ...f, [selectedStaff]: { ...form, dbsIssueDate: e.target.value } }))} className={inp} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="dbsUpdate" checked={form.dbsOnUpdateService} onChange={e => setDbsForm(f => ({ ...f, [selectedStaff]: { ...form, dbsOnUpdateService: e.target.checked } }))} className="rounded" />
                    <label htmlFor="dbsUpdate" className="text-sm text-gray-700">Enrolled on DBS Update Service</label>
                  </div>
                  <button
                    onClick={async () => {
                      setSavingDbs(true)
                      await updateDBS(selectedStaff, {
                        dbsCertNumber: form.dbsCertNumber,
                        dbsIssueDate: form.dbsIssueDate,
                        dbsOnUpdateService: form.dbsOnUpdateService,
                      })
                      setSavingDbs(false)
                    }}
                    disabled={savingDbs}
                    className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    {savingDbs ? 'Saving…' : 'Save DBS record'}
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ── Sickness ── */}
          {activeTab === 'sickness' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{staffSickness.length} records</span>
                <button onClick={() => setAddingSickness(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">{addingSickness ? 'Cancel' : '+ Log sickness'}</button>
              </div>
              {staffSickness.map(s => (
                <div key={s.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <div className="text-gray-900">{new Date(s.startDate + 'T12:00:00').toLocaleDateString('en-GB')} – {s.endDate ? new Date(s.endDate + 'T12:00:00').toLocaleDateString('en-GB') : 'ongoing'}</div>
                    {s.reason && <div className="text-gray-600">{s.reason}</div>}
                    {s.notes && <div className="text-gray-400 text-xs">{s.notes}</div>}
                  </div>
                  <button onClick={() => deleteSickness(s.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              ))}
              {staffSickness.length === 0 && !addingSickness && <p className="text-sm text-gray-400">No sickness records.</p>}
              {addingSickness && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Start date *</label><input type="date" value={sicknessForm.startDate} onChange={e => setSicknessForm(f => ({ ...f, startDate: e.target.value }))} className={inp} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">End date</label><input type="date" value={sicknessForm.endDate} onChange={e => setSicknessForm(f => ({ ...f, endDate: e.target.value }))} className={inp} /></div>
                  </div>
                  <div><label className="block text-xs text-gray-600 mb-1">Reason</label><input value={sicknessForm.reason} onChange={e => setSicknessForm(f => ({ ...f, reason: e.target.value }))} className={inp} /></div>
                  <button onClick={handleAddSickness} disabled={saving} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
