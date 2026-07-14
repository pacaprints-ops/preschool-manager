import { db } from '@/lib/db'
import { users, children, childSessions, enrolments } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import KeyworkerBestFitClient from './KeyworkerBestFitClient'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABEL: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SHORT_TO_FULL: Record<string, string> = { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday' }

const ACCENTS = [
  { border: 'border-blue-400', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', dot: 'bg-blue-500', header: 'bg-blue-50 border-blue-100' },
  { border: 'border-purple-400', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', dot: 'bg-purple-500', header: 'bg-purple-50 border-purple-100' },
  { border: 'border-teal-400', badgeBg: 'bg-teal-100', badgeText: 'text-teal-700', dot: 'bg-teal-500', header: 'bg-teal-50 border-teal-100' },
]

// Reception intake cutoff — same rule as the Enrolments page: children born
// on/before 31 Aug in (intakeYear - 4) are old enough to start school that
// September, so they won't be part of the pre-school roster for that year.
function schoolCutoff(intakeYear: number): string {
  return `${intakeYear - 4}-08-31`
}

// Always the next 3 Septembers from today — rolls forward automatically,
// no manual reset needed when one school year ends and the next begins.
function nextThreeSeptembers(): number[] {
  const now = new Date()
  const nearest = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear() // Sept = month index 8
  return [nearest, nearest + 1, nearest + 2]
}

type ChildRow = { id: string; firstName: string; lastName: string; needs1to1?: boolean }

export default async function KeyworkersPage() {
  const years = nextThreeSeptembers()

  const [allStaffRaw, activeChildren, allSessions, allEnrolmentsRaw] = await Promise.all([
    db.select().from(users).orderBy(users.name),
    db.select().from(children).where(eq(children.archived, false)),
    db.select().from(childSessions),
    db.select().from(enrolments).where(inArray(enrolments.intakeYear, years)).orderBy(enrolments.addedAt),
  ])
  const seenNames = new Set<string>()
  const allStaff = allStaffRaw.filter(s => {
    if (seenNames.has(s.name)) return false
    seenNames.add(s.name)
    return true
  })

  const childDays = new Map<string, Set<string>>()
  for (const s of allSessions) {
    if (!childDays.has(s.childId)) childDays.set(s.childId, new Set())
    childDays.get(s.childId)!.add(s.day)
  }

  // ── Current / now — the real, live roster ──────────────────────────────────

  const byKeyworker = new Map<string, ChildRow[]>()
  const unassigned: ChildRow[] = []
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

  // ── Rolling 3-year projections ──────────────────────────────────────────────

  const yearCohorts = years.map(year => {
    const cutoff = schoolCutoff(year)
    const returning = activeChildren
      .filter(c => c.dateOfBirth > cutoff)
      .sort((a, b) => a.lastName.localeCompare(b.lastName))

    const returningByKw = new Map<string, ChildRow[]>()
    const returningUnassigned: ChildRow[] = []
    for (const child of returning) {
      if (child.keyWorkerId) {
        const list = returningByKw.get(child.keyWorkerId) ?? []
        list.push(child)
        returningByKw.set(child.keyWorkerId, list)
      } else {
        returningUnassigned.push(child)
      }
    }

    const enrolmentsParsed = allEnrolmentsRaw
      .filter(e => e.intakeYear === year)
      .map(e => ({
        ...e,
        daysSessions: e.daysSessions ? (JSON.parse(e.daysSessions) as Record<string, string>) : {} as Record<string, string>,
      }))

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

    const staffWithYear = allStaff.filter(s => returningByKw.has(s.id) || byConfirmedKw.has(s.id))
    const totalYearChildren = returning.length + enrolmentsParsed.length

    return { year, returning, returningByKw, returningUnassigned, enrolmentsParsed, byConfirmedKw, unconfirmed, staffWithYear, totalYearChildren }
  })

  return (
    <div className="max-w-5xl space-y-10">

      <div>
        <h1 className="text-xl font-bold text-gray-800">Key Workers</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          The current roster, then the next 3 Septembers — always up to date, no reset needed as each year passes.
        </p>
      </div>

      {/* ── Current / now ────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-800">Current Roster</h2>
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
                        workingDays.includes(day) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {DAY_LABEL[day]}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-gray-50">
                  {staffChildren.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400 italic">No children assigned</p>
                  ) : (
                    staffChildren.map(child => (
                      <ChildLine key={child.id} href={`/children/${child.id}`} name={`${child.firstName} ${child.lastName}`}>
                        {child.needs1to1 && <Badge color="bg-purple-100 text-purple-700">1-to-1</Badge>}
                      </ChildLine>
                    ))
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
              {unassigned.map(child => (
                <ChildLine key={child.id} href={`/children/${child.id}`} name={`${child.firstName} ${child.lastName}`} />
              ))}
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
          unassigned={unassigned.map(child => ({
            id: child.id,
            name: `${child.firstName} ${child.lastName}`,
            daysNeeded: Array.from(childDays.get(child.id) ?? []),
            type: 'current' as const,
          }))}
        />
      </div>

      {/* ── Rolling 3-year projections ───────────────────────────────────────── */}
      {yearCohorts.map((cohort, i) => {
        const accent = ACCENTS[i % ACCENTS.length]
        return (
          <div key={cohort.year} className={`pl-4 border-l-4 ${accent.border}`}>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${accent.dot} shrink-0`} />
                <h2 className="text-lg font-bold text-gray-800">September {cohort.year}</h2>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${accent.badgeBg} ${accent.badgeText}`}>
                  {i === 0 ? 'Nearest' : `+${i} year${i > 1 ? 's' : ''} out`}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {cohort.returning.length} returning · {cohort.enrolmentsParsed.length} new starters · {cohort.totalYearChildren} total
              </p>
              {i === 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Returning children keep their current key worker. New starter assignments apply once they&apos;re added in September.
                </p>
              )}
            </div>

            {cohort.totalYearChildren === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
                No children yet for September {cohort.year}. Add new starters on the{' '}
                <a href="/enrolments" className="text-green-700 hover:underline">Enrolments page</a>.
              </div>
            ) : (
              <div className="space-y-4">
                {cohort.staffWithYear.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cohort.staffWithYear.map(staff => {
                      const returning = cohort.returningByKw.get(staff.id) ?? []
                      const starters = cohort.byConfirmedKw.get(staff.id) ?? []
                      const workingDays = staff.workingDays
                        ? staff.workingDays.split(',').map(d => SHORT_TO_FULL[d.trim()]).filter(Boolean)
                        : []
                      const totalCount = returning.length + starters.length

                      return (
                        <div key={staff.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className={`${accent.header} border-b px-4 py-3 flex items-center justify-between`}>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{staff.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {returning.length} returning{starters.length > 0 ? ` · ${starters.length} new` : ''}
                              </div>
                            </div>
                            <span className={`text-xs font-bold bg-white border ${accent.border} ${accent.badgeText} rounded-full px-2.5 py-1 leading-none`}>
                              {totalCount}
                            </span>
                          </div>

                          <div className="px-4 pt-3 pb-2.5 border-b border-gray-100 flex gap-1.5 flex-wrap">
                            {DAYS.map(day => (
                              <span
                                key={day}
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  workingDays.includes(day) ? `${accent.badgeBg} ${accent.badgeText}` : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {DAY_LABEL[day]}
                              </span>
                            ))}
                          </div>

                          <div className="divide-y divide-gray-50">
                            {returning.map(child => (
                              <ChildLine key={child.id} href={`/children/${child.id}`} name={`${child.firstName} ${child.lastName}`}>
                                <Badge color="bg-gray-100 text-gray-600">Returning</Badge>
                              </ChildLine>
                            ))}
                            {starters.map(e => (
                              <ChildLine
                                key={e.id}
                                href={e.promotedChildId ? `/children/${e.promotedChildId}` : undefined}
                                name={`${e.childFirstName} ${e.childLastName}`}
                              >
                                {e.promotedChildId
                                  ? <Badge color="bg-green-100 text-green-700">Started</Badge>
                                  : <Badge color="bg-amber-100 text-amber-700">New</Badge>
                                }
                              </ChildLine>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {(cohort.returningUnassigned.length > 0 || cohort.unconfirmed.length > 0) && (
                  <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-amber-800">Unassigned Children</div>
                        <div className="text-xs text-amber-600 mt-0.5">
                          Assign returning children on their{' '}
                          <a href="/children" className="underline hover:text-amber-800">profile</a> · new starters on the{' '}
                          <a href="/enrolments" className="underline hover:text-amber-800">Enrolments page</a>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-white border border-amber-200 text-amber-700 rounded-full px-2.5 py-1 leading-none">
                        {cohort.returningUnassigned.length + cohort.unconfirmed.length}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {cohort.returningUnassigned.map(child => (
                        <ChildLine key={child.id} href={`/children/${child.id}`} name={`${child.firstName} ${child.lastName}`}>
                          <Badge color="bg-gray-100 text-gray-600">Returning</Badge>
                        </ChildLine>
                      ))}
                      {cohort.unconfirmed.map(e => (
                        <ChildLine key={e.id} name={`${e.childFirstName} ${e.childLastName}`}>
                          <Badge color="bg-amber-100 text-amber-700">New</Badge>
                        </ChildLine>
                      ))}
                    </div>
                  </div>
                )}

                <KeyworkerBestFitClient
                  staff={cohort.staffWithYear.concat(allStaff.filter(s => !cohort.staffWithYear.includes(s))).map(s => ({
                    id: s.id,
                    name: s.name,
                    workingDays: s.workingDays,
                    currentChildCount: (cohort.returningByKw.get(s.id)?.length ?? 0) + (cohort.byConfirmedKw.get(s.id)?.length ?? 0),
                  }))}
                  unassigned={[
                    ...cohort.returningUnassigned.map(child => ({
                      id: child.id,
                      name: `${child.firstName} ${child.lastName}`,
                      daysNeeded: Array.from(childDays.get(child.id) ?? []),
                      type: 'current' as const,
                    })),
                    ...cohort.unconfirmed.map(e => ({
                      id: e.id,
                      name: `${e.childFirstName} ${e.childLastName}`,
                      daysNeeded: Object.keys(e.daysSessions),
                      type: 'new_starter' as const,
                    })),
                  ]}
                />
              </div>
            )}
          </div>
        )
      })}

    </div>
  )
}

// ─── Small shared presentational bits ──────────────────────────────────────────

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${color}`}>
      {children}
    </span>
  )
}

// Compact, name-only row — no DOB or day badges, keeps long lists from taking over the page
function ChildLine({ href, name, children }: { href?: string; name: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-1.5 flex items-center">
      {href ? (
        <a href={href} className="text-xs font-medium text-gray-800 hover:text-green-700 hover:underline truncate">{name}</a>
      ) : (
        <span className="text-xs font-medium text-gray-800 truncate">{name}</span>
      )}
      {children}
    </div>
  )
}
