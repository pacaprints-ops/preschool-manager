// England bank holidays 2025–2027
// Source: GOV.UK bank holidays
const BANK_HOLIDAYS = [
  // 2025
  '2025-01-01', // New Year's Day
  '2025-04-18', // Good Friday
  '2025-04-21', // Easter Monday
  '2025-05-05', // Early May bank holiday
  '2025-05-26', // Spring bank holiday
  '2025-08-25', // Summer bank holiday
  '2025-12-25', // Christmas Day
  '2025-12-26', // Boxing Day
  // 2026
  '2026-01-01', // New Year's Day
  '2026-04-03', // Good Friday
  '2026-04-06', // Easter Monday
  '2026-05-04', // Early May bank holiday
  '2026-05-25', // Spring bank holiday
  '2026-08-31', // Summer bank holiday
  '2026-12-25', // Christmas Day
  '2026-12-28', // Boxing Day (substitute)
  // 2027
  '2027-01-01', // New Year's Day
  '2027-03-26', // Good Friday
  '2027-03-29', // Easter Monday
  '2027-05-03', // Early May bank holiday
  '2027-05-31', // Spring bank holiday
  '2027-08-30', // Summer bank holiday
  '2027-12-27', // Christmas Day (substitute)
  '2027-12-28', // Boxing Day (substitute)
]

const holidaySet = new Set(BANK_HOLIDAYS)

/**
 * Count England bank holidays that fall on a weekday within [startDate, endDate] inclusive.
 * Dates should be YYYY-MM-DD strings.
 */
export function countBankHolidaysInTerm(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const dayOfWeek = cur.getDay() // 0=Sun, 6=Sat
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const dateStr = cur.toISOString().slice(0, 10)
      if (holidaySet.has(dateStr)) count++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count
}
