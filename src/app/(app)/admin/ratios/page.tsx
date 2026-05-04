import { db } from '@/lib/db'
import { children, childSessions, terms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_SHORT: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const DAY_LABELS: Record<string, string> = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' }
const SESSION_LABELS: Record<string, string> = { morning: 'AM', afternoon: 'PM', full_day: 'FD' }

function getAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob + 'T12:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function calcDay(rows: { child: { dateOfBirth: string; needs1to1: boolean }; session: { sessionType: string } }[]) {
  const count1to1 = rows.filter(r => r.child.needs1to1).length
  const general = rows.filter(r => !r.child.needs1to1)
  const count2yr = general.filter(r => getAge(r.child.dateOfBirth) === 2).length
  const count34yr = general.filter(r => getAge(r.child.dateOfBirth) >= 3).length
  const staff = Math.ceil(count2yr / 4) + Math.ceil(count34yr / 8) + count1to1
  return { total: rows.length, staff, count2yr, count34yr, count1to1 }
}

export default async function RatiosPage() {
  const [activeChildren, allTerms] = await Promise.all([
    db.select({ child: children, session: childSessions })
      .from(childSessions)
      .innerJoin(children, eq(childSessions.childId, children.id))
      .where(eq(children.archived, false)),
    db.select().from(terms).orderBy(terms.startDate),
  ])

  const todayStr = new Date().toISOString().slice(0, 10)
  const currentTerm = allTerms.find(t => t.startDate <= todayStr && t.endDate >= todayStr)
  const currentYear = currentTerm?.academicYear
  const yearTerms = currentYear ? allTerms.filter(t => t.academicYear === currentYear) : []

  // Per-day stats
  const dayData = DAYS.map(day => {
    const rows = activeChildren.filter(r => r.session.day === day)
    const sessionTypes = [...new Set(rows.map(r => r.session.sessionType))] as ('morning' | 'afternoon' | 'full_day')[]
    const overall = calcDay(rows)
    const sessions = sessionTypes.map(st => {
      const sub = rows.filter(r => r.session.sessionType === st)
      return { st, ...calcDay(sub) }
    })
    return { day, rows, overall, sessions }
  })

  // Totals: sum of children per day
  const totalPerDay = dayData.map(d => d.overall.total)
  const weeklyTotal = totalPerDay.reduce((a, b) => a + b, 0)

  // Unique children enrolled (regardless of how many days they attend)
  const uniqueChildCount = new Set(activeChildren.map(r => r.child.id)).size

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Ratios Overview</h1>
      <p className="text-sm text-gray-500 mb-6">1:4 for 2-year-olds · 1:8 for 3–4-year-olds · 1:1 for each 1-2-1 child</p>

      {/* 5 day widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {dayData.map(({ day, rows, overall, sessions }) => (
          <div key={day} className={`bg-white rounded-xl border p-3 ${rows.length === 0 ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}>
            <div className="font-semibold text-gray-800 text-sm mb-2">{DAY_LABELS[day]}</div>

            {rows.length === 0 ? (
              <p className="text-xs text-gray-400">No children</p>
            ) : (
              <>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-[#020e2f]">{overall.total}</span>
                  <span className="text-xs text-gray-500">children</span>
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {overall.staff} staff needed
                </div>

                {/* Session breakdown */}
                <div className="space-y-1 border-t border-gray-100 pt-2">
                  {sessions.map(s => (
                    <div key={s.st} className="flex justify-between text-xs text-gray-600">
                      <span className="font-medium text-gray-500">{SESSION_LABELS[s.st]}</span>
                      <span>{s.total} ch · {s.staff} staff</span>
                    </div>
                  ))}
                </div>

                {/* Age breakdown */}
                <div className="border-t border-gray-100 pt-2 mt-2 space-y-0.5">
                  {overall.count2yr > 0 && <div className="text-xs text-gray-400">{overall.count2yr} × 2yr</div>}
                  {overall.count34yr > 0 && <div className="text-xs text-gray-400">{overall.count34yr} × 3-4yr</div>}
                  {overall.count1to1 > 0 && <div className="text-xs text-purple-600 font-medium">{overall.count1to1} × 1-2-1</div>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-36"></th>
                {DAYS.map(day => (
                  <th key={day} className="text-center px-3 py-3 font-medium text-gray-600">{DAY_SHORT[day]}</th>
                ))}
                <th className="text-center px-3 py-3 font-medium text-gray-600 border-l border-gray-200">Week</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="font-medium">
                <td className="px-4 py-2.5 text-gray-700">Total children</td>
                {dayData.map(d => (
                  <td key={d.day} className="text-center px-3 py-2.5 text-gray-900 font-bold">{d.overall.total || '—'}</td>
                ))}
                <td className="text-center px-3 py-2.5 text-[#020e2f] font-bold border-l border-gray-200">{weeklyTotal}</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Staff needed</td>
                {dayData.map(d => (
                  <td key={d.day} className="text-center px-3 py-2.5 text-gray-700">{d.overall.staff || '—'}</td>
                ))}
                <td className="text-center px-3 py-2.5 text-gray-500 border-l border-gray-200">—</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-500">2yr olds</td>
                {dayData.map(d => (
                  <td key={d.day} className="text-center px-3 py-2.5 text-gray-500">{d.overall.count2yr || '—'}</td>
                ))}
                <td className="text-center px-3 py-2.5 text-gray-400 border-l border-gray-200">
                  {dayData.reduce((s, d) => s + d.overall.count2yr, 0) || '—'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-500">3–4yr olds</td>
                {dayData.map(d => (
                  <td key={d.day} className="text-center px-3 py-2.5 text-gray-500">{d.overall.count34yr || '—'}</td>
                ))}
                <td className="text-center px-3 py-2.5 text-gray-400 border-l border-gray-200">
                  {dayData.reduce((s, d) => s + d.overall.count34yr, 0) || '—'}
                </td>
              </tr>
              {dayData.some(d => d.overall.count1to1 > 0) && (
                <tr>
                  <td className="px-4 py-2.5 text-purple-600 font-medium">1-2-1</td>
                  {dayData.map(d => (
                    <td key={d.day} className="text-center px-3 py-2.5 text-purple-600">
                      {d.overall.count1to1 || '—'}
                    </td>
                  ))}
                  <td className="text-center px-3 py-2.5 text-purple-600 border-l border-gray-200">
                    {dayData.reduce((s, d) => s + d.overall.count1to1, 0)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Term & year totals */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Attendance totals</h3>
          <p className="text-xs text-gray-400 mt-0.5">Based on current enrolment × term weeks</p>
        </div>
        <div className="divide-y divide-gray-100">
          {currentTerm ? (
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">Current term — {currentTerm.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{currentTerm.weekCount} weeks</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#020e2f]">{uniqueChildCount}</div>
                <div className="text-xs text-gray-400">children enrolled</div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400">No active term — set term dates in Term Config.</div>
          )}
          {yearTerms.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">School year {currentYear}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {yearTerms.length} terms · {yearTerms.reduce((s, t) => s + t.weekCount, 0)} weeks total
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-700">{uniqueChildCount}</div>
                <div className="text-xs text-gray-400">children enrolled</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
