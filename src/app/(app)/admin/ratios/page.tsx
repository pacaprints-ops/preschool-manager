import { db } from '@/lib/db'
import { children, childSessions, terms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_SHORT: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const DAY_LABELS: Record<string, string> = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' }

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

  const weeklyTotal = dayData.reduce((a, d) => a + d.overall.total, 0)
  const uniqueChildCount = new Set(activeChildren.map(r => r.child.id)).size
  const has1to1 = dayData.some(d => d.overall.count1to1 > 0)

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Ratios Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">1:4 for 2-year-olds · 1:8 for 3–4-year-olds · dedicated staff for each 1-2-1 child</p>
      </div>

      {/* Day widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {dayData.map(({ day, rows, overall, sessions }) => (
          <div key={day} className={`rounded-xl border overflow-hidden ${rows.length === 0 ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'}`}>

            {/* Header */}
            <div className={`px-3 py-2 border-b ${rows.length === 0 ? 'border-gray-100' : 'border-gray-100 bg-gray-50'}`}>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{DAY_LABELS[day]}</span>
            </div>

            {rows.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-gray-400">No children enrolled</p>
              </div>
            ) : (
              <div className="p-3">
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#020e2f] rounded-lg p-2.5 text-center">
                    <div className="text-2xl font-bold text-white leading-none">{overall.total}</div>
                    <div className="text-xs text-blue-200 mt-0.5">children</div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-lg p-2.5 text-center">
                    <div className="text-2xl font-bold text-gray-800 leading-none">{overall.staff}</div>
                    <div className="text-xs text-gray-500 mt-0.5">staff</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Weekly summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide w-36"></th>
                {DAYS.map(day => (
                  <th key={day} className="text-center px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {DAY_SHORT[day]}
                  </th>
                ))}
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide border-l border-gray-100">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700">Children</td>
                {dayData.map(d => (
                  <td key={d.day} className="text-center px-3 py-3">
                    <span className={`text-base font-bold ${d.overall.total > 0 ? 'text-[#020e2f]' : 'text-gray-300'}`}>
                      {d.overall.total || '—'}
                    </span>
                  </td>
                ))}
                <td className="text-center px-4 py-3 border-l border-gray-100">
                  <span className="text-base font-bold text-[#020e2f]">{weeklyTotal}</span>
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">Staff needed</td>
                {dayData.map(d => (
                  <td key={d.day} className="text-center px-3 py-3 text-sm font-medium text-gray-700">
                    {d.overall.staff || <span className="text-gray-300">—</span>}
                  </td>
                ))}
                <td className="text-center px-4 py-3 border-l border-gray-100 text-gray-400 text-sm">—</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-4 py-2.5 text-xs text-blue-600 font-medium">2yr olds</td>
                {dayData.map(d => (
                  <td key={d.day} className="text-center px-3 py-2.5 text-xs text-blue-600">
                    {d.overall.count2yr || <span className="text-gray-300">—</span>}
                  </td>
                ))}
                <td className="text-center px-4 py-2.5 border-l border-gray-100 text-xs text-blue-600">
                  {dayData.reduce((s, d) => s + d.overall.count2yr, 0) || '—'}
                </td>
              </tr>
              <tr className={has1to1 ? 'border-b border-gray-50' : ''}>
                <td className="px-4 py-2.5 text-xs text-gray-500 font-medium">3–4yr olds</td>
                {dayData.map(d => (
                  <td key={d.day} className="text-center px-3 py-2.5 text-xs text-gray-500">
                    {d.overall.count34yr || <span className="text-gray-300">—</span>}
                  </td>
                ))}
                <td className="text-center px-4 py-2.5 border-l border-gray-100 text-xs text-gray-500">
                  {dayData.reduce((s, d) => s + d.overall.count34yr, 0) || '—'}
                </td>
              </tr>
              {has1to1 && (
                <tr>
                  <td className="px-4 py-2.5 text-xs text-purple-600 font-medium">1-2-1</td>
                  {dayData.map(d => (
                    <td key={d.day} className="text-center px-3 py-2.5 text-xs text-purple-600">
                      {d.overall.count1to1 || <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="text-center px-4 py-2.5 border-l border-gray-100 text-xs text-purple-600">
                    {dayData.reduce((s, d) => s + d.overall.count1to1, 0)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrolment totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentTerm ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#020e2f] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{uniqueChildCount}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Children this term</div>
              <div className="text-xs text-gray-400 mt-0.5">{currentTerm.name} · {currentTerm.weekCount} weeks</div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-400">
            No active term — add dates in Term Config.
          </div>
        )}
        {yearTerms.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-gray-800 font-bold text-lg">{uniqueChildCount}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Children this year</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {currentYear} · {yearTerms.length} terms · {yearTerms.reduce((s, t) => s + t.weekCount, 0)} weeks
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-400">
            No terms configured for this year.
          </div>
        )}
      </div>
    </div>
  )
}
