import { db } from '@/lib/db'
import { bankHolidays } from '@/lib/db/schema'
import { gte, lte, and } from 'drizzle-orm'

/**
 * Count England bank holidays that fall on a weekday within [startDate, endDate] inclusive.
 * Dates should be YYYY-MM-DD strings. Bank holidays are managed on the Term Dates admin page.
 */
export async function countBankHolidaysInTerm(startDate: string, endDate: string): Promise<number> {
  const rows = await db
    .select({ date: bankHolidays.date })
    .from(bankHolidays)
    .where(and(gte(bankHolidays.date, startDate), lte(bankHolidays.date, endDate)))

  let count = 0
  for (const row of rows) {
    const dayOfWeek = new Date(row.date + 'T12:00:00').getDay() // 0=Sun, 6=Sat
    if (dayOfWeek >= 1 && dayOfWeek <= 5) count++
  }
  return count
}
