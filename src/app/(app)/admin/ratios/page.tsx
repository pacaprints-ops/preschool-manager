import { db } from '@/lib/db'
import { children, childSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABELS: Record<string, string> = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' }
const SESSION_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', full_day: 'Full Day' }

// UK ratios: 1:8 for 3-4yr olds, 1:4 for 2yr olds
function calcRatio(count2yr: number, count34yr: number) {
  const staffFor2yr = Math.ceil(count2yr / 4)
  const staffFor34yr = Math.ceil(count34yr / 8)
  return staffFor2yr + staffFor34yr
}

function getAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob + 'T12:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default async function RatiosPage() {
  const activeChildren = await db
    .select({ child: children, session: childSessions })
    .from(childSessions)
    .innerJoin(children, eq(childSessions.childId, children.id))
    .where(eq(children.archived, false))

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Ratios Overview</h1>
      <p className="text-sm text-gray-500 mb-2">Expected staff:child ratios based on enrolled sessions. 1:4 for 2-year-olds · 1:8 for 3–4-year-olds.</p>
      <p className="text-xs text-gray-400 mb-6">Ages are calculated from children&apos;s dates of birth and update automatically.</p>

      <div className="space-y-3">
        {DAYS.map(day => {
          const daySessions = activeChildren.filter(r => r.session.day === day)
          if (daySessions.length === 0) {
            return (
              <div key={day} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-gray-700">{DAY_LABELS[day]}</h2>
                  <span className="text-sm text-gray-400">No children enrolled</span>
                </div>
              </div>
            )
          }

          const sessionTypes = [...new Set(daySessions.map(r => r.session.sessionType))]

          return (
            <div key={day} className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-medium text-gray-800 mb-3">{DAY_LABELS[day]}</h2>
              <div className="grid grid-cols-3 gap-3">
                {sessionTypes.map(st => {
                  const sessionChildren = daySessions.filter(r => r.session.sessionType === st)
                  const count2yr = sessionChildren.filter(r => getAge(r.child.dateOfBirth) === 2).length
                  const count34yr = sessionChildren.filter(r => getAge(r.child.dateOfBirth) >= 3).length
                  const totalChildren = sessionChildren.length
                  const staffNeeded = calcRatio(count2yr, count34yr)

                  return (
                    <div key={st} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">{SESSION_LABELS[st]}</div>
                      <div className="text-2xl font-bold text-gray-900">{totalChildren}</div>
                      <div className="text-xs text-gray-500">children</div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className={`text-sm font-semibold ${staffNeeded >= 3 ? 'text-orange-600' : 'text-green-700'}`}>
                          {staffNeeded} staff needed
                        </div>
                        {count2yr > 0 && <div className="text-xs text-gray-400">{count2yr} × 2yr old</div>}
                        {count34yr > 0 && <div className="text-xs text-gray-400">{count34yr} × 3-4yr old</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
