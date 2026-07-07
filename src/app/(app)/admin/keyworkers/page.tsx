import { db } from '@/lib/db'
import { users, children, childSessions, enrolments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import KeyworkerBestFitClient from './KeyworkerBestFitClient'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABEL: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SHORT_TO_FULL: Record<string, string> = { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday' }

const INTAKE_YEAR = 2027

function getAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob + 'T12:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

export default async function KeyworkersPage() {
  const [allStaffRaw, activeChildren, allSessions, allEnrolments] = await Promise.all([
    db.select().from(users).orderBy(users.name),
    db.select().from(children).where(eq(children.archived, false)),
    db.select().from(childSessions),
    db.select().from(enrolments).where(eq(enrolments.intakeYear, INTAKE_YEAR)).orderBy(enrolments.addedAt),
  ])
  const seenNames = new Set<string>()
  const allStaff = allStaffRaw.filter(s => {
    if (seenNames.has(s.name)) return false
    seenNames.add(s.name)
    return true
  })

  // ── Current year ─────────────────────────────────────────────────────────────

  const childDays = new Map<string, Set<string>>()
  for (const s of allSessions) {
    if (!childDays.has(s.childId)) childDays.set(s.childId, new Set())
    childDays.get(s.childId)!.add(s.day)
  }

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
  for (const [, list] of byKeyworker) list.sort((a, b) => a.lastName.localeCompare(b.lastName))
  unassigned.sort((a, b) => a.lastName.localeCompare(b.lastName))

  const totalAssigned = activeChildren.length - unassigned.length

  // ── September 2027 ────────────────────────────────────────────────────────────

  const enrolmentsParsed = allEnrolments.map(e => ({
    ...e,
    daysSessions: e.daysSessions ? (JSON.parse(e.daysSessions) as Record<string, string>) : {} as Record<string, string>,
  }))

  // Children returning for Sep INTAKE_YEAR: born on or after 1 Sep (INTAKE_YEAR - 4)
  // (children born before that date will have turned 4 and leave for school by Sep INTAKE_YEAR)
  const returnCutoff = new Date(`${INTAKE_YEAR - 4}-09-01T00:00:00`)
  const returningChildren = activeChildren
    .filter(c => new Date(c.dateOfBirth + 'T12:00:00') >= returnCutoff)
    .sort((a, b) => a.lastName.localeCompare(b.lastName))

  const returningByKw = new Map<string, typeof activeChildren>()
  const returningUnassigned: typeof activeChildren = []
  for (const child of returningChildren) {
    if (child.keyWorkerId) {
      const list = returningByKw.get(child.keyWorkerId) ?? []
      list.push(child)
      returningByKw.set(child.keyWorkerId, list)
    } else {
      returningUnassigned.push(child)
    }
  }

  // New starters grouped by confirmedKeyworkerId
  const byConfirmedKw = new Map<string, typeof enrolmentsParsed>()
  const unconfirmed: typeof enrolmentsParsed = []
  for (const e of enrolmentsParsed) {
    if (e.confirmedKeyworkerId) {
      const list = byConfirmedKw.get(e.confirmedKeyworkerId) ?? []
      list.push(e)
      byConfirmedKw.set(e.confirmedKeyworkerId, list)
    } else {
      unconfirmed.push(e)
    }
  }

  // Staff with anything in Sep 2027 (returning OR new starters)
  const staffWith2027 = allStaff.filter(s => returningByKw.has(s.id) || byConfirmedKw.has(s.id))
  const total2027Children = returningChildren.length + enrolmentsParsed.length

  return (
    <div className="max-w-5xl space-y-10">

      {/* ── Current year ─────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800">Key Workers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Current year · {allStaff.length} staff · {totalAssigned} of {activeChildren.length} children assigned
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
                <div className="bg-green-50 border-b border-green-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{staff.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 capitalize">{staff.role}</div>
                  </div>
                  <span className="text-xs font-bold bg-white border border-green-200 text-green-700 rounded-full px-2.5 py-1 leading-none">
                    {staffChildren.length}
                  </span>
                </div>

                <div className="px-4 pt-3 pb-2.5 border-b border-gray-100 flex gap-1.5 flex-wrap">
                  {DAYS.map(day => (
                    <span
                      key={day}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        workingDays.includes(day)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {DAY_LABEL[day]}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-gray-50">
                  {staffChildren.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-gray-400 italic">No children assigned</p>
                  ) : (
                    staffChildren.map(child => {
                      const days = childDays.get(child.id) ?? new Set()
                      return (
                        <div key={child.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
                          <div>
                            <a href={`/children/${child.id}`} className="text-sm font-medium text-gray-800 hover:text-green-700 hover:underline leading-tight">
                              {child.firstName} {child.lastName}
                            </a>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Age {getAge(child.dateOfBirth)}
                              {child.needs1to1 && (
                                <span className="ml-1.5 text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase">1-to-1</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end mt-0.5">
                            {DAYS.filter(d => days.has(d)).map(d => (
                              <span key={d} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {DAY_LABEL[d]}
                              </span>
                            ))}
                            {days.size === 0 && <span className="text-xs text-gray-300">No sessions</span>}
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

        {unassigned.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden mt-4">
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-amber-800">Unassigned Children</div>
                <div className="text-xs text-amber-600 mt-0.5">These children don&apos;t have a key worker yet</div>
              </div>
              <span className="text-xs font-bold bg-white border border-amber-200 text-amber-700 rounded-full px-2.5 py-1 leading-none">
                {unassigned.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {unassigned.map(child => {
                const days = childDays.get(child.id) ?? new Set()
                return (
                  <div key={child.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <a href={`/children/${child.id}`} className="text-sm font-medium text-gray-800 hover:text-green-700 hover:underline">
                        {child.firstName} {child.lastName}
                      </a>
                      <div className="text-xs text-gray-400 mt-0.5">Age {getAge(child.dateOfBirth)}</div>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {DAYS.filter(d => days.has(d)).map(d => (
                        <span key={d} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
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

        <KeyworkerBestFitClient
          staff={allStaff.map(s => ({
            id: s.id,
            name: s.name,
            workingDays: s.workingDays,
            currentChildCount: byKeyworker.get(s.id)?.length ?? 0,
          }))}
          unassigned={[
            ...unassigned.map(child => ({
              id: child.id,
              name: `${child.firstName} ${child.lastName}`,
              daysNeeded: Array.from(childDays.get(child.id) ?? []),
              type: 'current' as const,
            })),
            ...enrolmentsParsed
              .filter(e => !e.confirmedKeyworkerId)
              .map(e => ({
                id: e.id,
                name: `${e.childFirstName} ${e.childLastName}`,
                daysNeeded: Object.keys(e.daysSessions),
                type: 'new_starter' as const,
              })),
          ]}
        />
      </div>

      {/* ── September 2027 intake ─────────────────────────────────────────────── */}
      <div>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-800">September {INTAKE_YEAR} Planning</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {returningChildren.length} returning · {enrolmentsParsed.length} new starters · {total2027Children} total
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Returning children keep their current key worker. New starter assignments apply when children are added in September.
          </p>
        </div>

        {total2027Children === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
            No children yet for September {INTAKE_YEAR}. Add new starters on the{' '}
            <a href="/enrolments" className="text-green-700 hover:underline">Enrolments page</a>.
          </div>
        ) : (
          <div className="space-y-4">
            {staffWith2027.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {staffWith2027.map(staff => {
                  const returning = returningByKw.get(staff.id) ?? []
                  const starters = byConfirmedKw.get(staff.id) ?? []
                  const workingDays = staff.workingDays
                    ? staff.workingDays.split(',').map(d => SHORT_TO_FULL[d.trim()]).filter(Boolean)
                    : []
                  const totalCount = returning.length + starters.length

                  return (
                    <div key={staff.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{staff.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Sept {INTAKE_YEAR} · {returning.length} returning{starters.length > 0 ? ` · ${starters.length} new` : ''}
                          </div>
                        </div>
                        <span className="text-xs font-bold bg-white border border-blue-200 text-blue-700 rounded-full px-2.5 py-1 leading-none">
                          {totalCount}
                        </span>
                      </div>

                      <div className="px-4 pt-3 pb-2.5 border-b border-gray-100 flex gap-1.5 flex-wrap">
                        {DAYS.map(day => (
                          <span
                            key={day}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              workingDays.includes(day)
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {DAY_LABEL[day]}
                          </span>
                        ))}
                      </div>

                      <div className="divide-y divide-gray-50">
                        {/* Returning children */}
                        {returning.map(child => {
                          const days = childDays.get(child.id) ?? new Set()
                          return (
                            <div key={child.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-medium text-gray-800 leading-tight">
                                  <a href={`/children/${child.id}`} className="hover:text-green-700 hover:underline">
                                    {child.firstName} {child.lastName}
                                  </a>
                                  <span className="ml-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-wide">Returning</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">Age {getAge(child.dateOfBirth)} now</div>
                              </div>
                              <div className="flex gap-1 flex-wrap justify-end mt-0.5">
                                {DAYS.filter(d => days.has(d)).map(d => (
                                  <span key={d} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                    {DAY_LABEL[d]}
                                  </span>
                                ))}
                                {days.size === 0 && <span className="text-xs text-gray-300">No sessions</span>}
                              </div>
                            </div>
                          )
                        })}

                        {/* New starters */}
                        {starters.map(e => {
                          const days = Object.keys(e.daysSessions)
                          return (
                            <div key={e.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-medium text-gray-800 leading-tight">
                                  {e.promotedChildId
                                    ? <a href={`/children/${e.promotedChildId}`} className="hover:text-green-700 hover:underline">{e.childFirstName} {e.childLastName}</a>
                                    : <>{e.childFirstName} {e.childLastName}</>
                                  }
                                  {e.promotedChildId
                                    ? <span className="ml-1.5 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Started</span>
                                    : <span className="ml-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wide">New</span>
                                  }
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">{e.parentCarerName}</div>
                              </div>
                              <div className="flex gap-1 flex-wrap justify-end mt-0.5">
                                {days.map(d => (
                                  <span key={d} className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                    {DAY_LABEL[d as keyof typeof DAY_LABEL] ?? d}
                                  </span>
                                ))}
                                {days.length === 0 && <span className="text-xs text-gray-300">TBC</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Unassigned: returning children without keyworker + new starters without confirmed keyworker */}
            {(returningUnassigned.length > 0 || unconfirmed.length > 0) && (
              <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-amber-800">No Key Worker Assigned</div>
                    <div className="text-xs text-amber-600 mt-0.5">
                      Assign returning children on their{' '}
                      <a href="/children" className="underline hover:text-amber-800">profile</a> · new starters on the{' '}
                      <a href="/enrolments" className="underline hover:text-amber-800">Enrolments page</a>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white border border-amber-200 text-amber-700 rounded-full px-2.5 py-1 leading-none">
                    {returningUnassigned.length + unconfirmed.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {returningUnassigned.map(child => {
                    const days = childDays.get(child.id) ?? new Set()
                    return (
                      <div key={child.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            <a href={`/children/${child.id}`} className="hover:text-green-700 hover:underline">
                              {child.firstName} {child.lastName}
                            </a>
                            <span className="ml-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-wide">Returning</span>
                          </div>
                          <div className="text-xs text-gray-400">Age {getAge(child.dateOfBirth)}</div>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {DAYS.filter(d => days.has(d)).map(d => (
                            <span key={d} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {DAY_LABEL[d]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {unconfirmed.map(e => {
                    const days = Object.keys(e.daysSessions)
                    return (
                      <div key={e.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {e.childFirstName} {e.childLastName}
                            <span className="ml-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wide">New</span>
                          </div>
                          <div className="text-xs text-gray-400">{e.parentCarerName}</div>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {days.map(d => (
                            <span key={d} className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                              {DAY_LABEL[d as keyof typeof DAY_LABEL] ?? d}
                            </span>
                          ))}
                          {days.length === 0 && <span className="text-xs text-gray-300">TBC</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
