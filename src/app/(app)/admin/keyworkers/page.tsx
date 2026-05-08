import { db } from '@/lib/db'
import { users, children, childSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABEL: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SHORT_TO_FULL: Record<string, string> = { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday' }

function getAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob + 'T12:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

export default async function KeyworkersPage() {
  const [allStaff, activeChildren, allSessions] = await Promise.all([
    db.select().from(users).orderBy(users.name),
    db.select().from(children).where(eq(children.archived, false)),
    db.select().from(childSessions),
  ])

  // Build child session day map: childId → Set of days attending
  const childDays = new Map<string, Set<string>>()
  for (const s of allSessions) {
    if (!childDays.has(s.childId)) childDays.set(s.childId, new Set())
    childDays.get(s.childId)!.add(s.day)
  }

  // Group children by keyWorkerId
  const byKeyworker = new Map<string, typeof activeChildren>()
  const unassigned: typeof activeChildren = []

  for (const child of activeChildren) {
    if (child.keyWorkerId) {
      const list = byKeyworker.get(child.keyWorkerId) ?? []
      list.push(child)
      byKeyworker.set(child.keyWorkerId, list)
    } else {
      unassigned.push(child)
    }
  }

  // Sort children within each group by last name
  for (const [, list] of byKeyworker) {
    list.sort((a, b) => a.lastName.localeCompare(b.lastName))
  }
  unassigned.sort((a, b) => a.lastName.localeCompare(b.lastName))

  const totalAssigned = activeChildren.length - unassigned.length

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Key Workers</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {allStaff.length} staff · {totalAssigned} of {activeChildren.length} children assigned
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {allStaff.map(staff => {
          const staffChildren = byKeyworker.get(staff.id) ?? []
          const workingDays = staff.workingDays
            ? staff.workingDays.split(',').map(d => SHORT_TO_FULL[d.trim()]).filter(Boolean)
            : []

          return (
            <div key={staff.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Card header */}
              <div className="bg-[#020e2f] px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{staff.name}</div>
                  <div className="text-xs text-blue-200 mt-0.5 capitalize">{staff.role}</div>
                </div>
                <span className="text-xs font-bold bg-white/20 text-white rounded-full px-2.5 py-1 leading-none">
                  {staffChildren.length}
                </span>
              </div>

              {/* Working days */}
              <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex gap-1 flex-wrap">
                {DAYS.map(day => (
                  <span
                    key={day}
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      workingDays.includes(day)
                        ? 'bg-[#020e2f] text-white'
                        : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {DAY_LABEL[day]}
                  </span>
                ))}
              </div>

              {/* Children list */}
              <div className="divide-y divide-gray-50">
                {staffChildren.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-gray-400 italic">No children assigned</p>
                ) : (
                  staffChildren.map(child => {
                    const days = childDays.get(child.id) ?? new Set()
                    return (
                      <div key={child.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-800 leading-tight">
                            {child.firstName} {child.lastName}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Age {getAge(child.dateOfBirth)}
                            {child.needs1to1 && (
                              <span className="ml-1.5 text-[9px] font-bold bg-purple-100 text-purple-700 px-1 py-0.5 rounded uppercase">1-2-1</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-0.5 flex-wrap justify-end mt-0.5">
                          {DAYS.filter(d => days.has(d)).map(d => (
                            <span key={d} className="text-[9px] font-semibold bg-blue-50 text-blue-700 px-1 py-0.5 rounded">
                              {DAY_LABEL[d]}
                            </span>
                          ))}
                          {days.size === 0 && <span className="text-[10px] text-gray-300">No sessions</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unassigned children */}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-800">Unassigned Children</div>
              <div className="text-xs text-amber-600 mt-0.5">These children don't have a key worker yet</div>
            </div>
            <span className="text-xs font-bold bg-amber-200 text-amber-800 rounded-full px-2.5 py-1 leading-none">
              {unassigned.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {unassigned.map(child => {
              const days = childDays.get(child.id) ?? new Set()
              return (
                <div key={child.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <a href={`/children/${child.id}`} className="text-sm font-medium text-[#020e2f] hover:underline">
                      {child.firstName} {child.lastName}
                    </a>
                    <div className="text-xs text-gray-400 mt-0.5">Age {getAge(child.dateOfBirth)}</div>
                  </div>
                  <div className="flex gap-0.5 flex-wrap justify-end">
                    {DAYS.filter(d => days.has(d)).map(d => (
                      <span key={d} className="text-[9px] font-semibold bg-blue-50 text-blue-700 px-1 py-0.5 rounded">
                        {DAY_LABEL[d]}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
