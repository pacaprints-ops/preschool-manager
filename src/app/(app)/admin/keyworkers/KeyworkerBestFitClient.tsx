'use client'

import { useState } from 'react'

const SHORT_TO_FULL: Record<string, string> = {
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
}

const DAY_LABEL: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
}

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

type StaffMember = {
  id: string
  name: string
  workingDays: string // comma-separated short days e.g. "mon,tue,wed"
  currentChildCount: number
}

type UnassignedChild = {
  id: string
  name: string
  daysNeeded: string[] // full day names e.g. ['monday', 'wednesday']
  type: 'current' | 'new_starter'
}

type Props = {
  staff: StaffMember[]
  unassigned: UnassignedChild[]
}

type RankedStaff = StaffMember & {
  workingDaysFull: string[]
  matchCount: number
}

export default function KeyworkerBestFitClient({ staff, unassigned }: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  const selectedChild = unassigned.find(c => c.id === selectedChildId) ?? null

  const ranked: RankedStaff[] = staff
    .map(s => {
      const workingDaysFull = s.workingDays
        ? s.workingDays.split(',').map(d => SHORT_TO_FULL[d.trim()]).filter(Boolean)
        : []
      const matchCount = selectedChild
        ? selectedChild.daysNeeded.filter(d => workingDaysFull.includes(d)).length
        : 0
      return { ...s, workingDaysFull, matchCount }
    })
    .sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
      return a.currentChildCount - b.currentChildCount
    })

  const hasSelection = selectedChild !== null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-4">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="text-sm font-semibold text-gray-800">Best-fit Key Worker</div>
        <div className="text-xs text-gray-500 mt-0.5">
          Select an unassigned child to see which staff match their days
        </div>
      </div>

      <div className="px-4 py-3">
        <select
          value={selectedChildId}
          onChange={e => setSelectedChildId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          <option value="">Select a child…</option>
          {unassigned.map(child => (
            <option key={child.id} value={child.id}>
              {child.name}
              {child.type === 'new_starter' ? ' (new starter)' : ''}
            </option>
          ))}
        </select>
      </div>

      {!hasSelection ? (
        <div className="px-4 pb-4 text-xs text-gray-400 italic">
          Select a child to find the best-fit key worker.
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {selectedChild.daysNeeded.length > 0 && (
            <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Needs:</span>
              {ALL_DAYS.filter(d => selectedChild.daysNeeded.includes(d)).map(d => (
                <span
                  key={d}
                  className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
                >
                  {DAY_LABEL[d]}
                </span>
              ))}
            </div>
          )}

          {ranked.map((s, i) => {
            const isGreyed = s.matchCount === 0
            return (
              <div
                key={s.id}
                className={`px-4 py-2.5 flex items-center gap-3 ${isGreyed ? 'opacity-40' : ''}`}
              >
                {/* Rank */}
                <span className="text-xs font-bold text-gray-400 w-5 shrink-0 text-center">
                  {isGreyed ? '—' : i + 1}
                </span>

                {/* Name + days */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 leading-tight">{s.name}</div>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {ALL_DAYS.map(d => {
                      const works = s.workingDaysFull.includes(d)
                      const matches = works && selectedChild.daysNeeded.includes(d)
                      if (!works) return null
                      return (
                        <span
                          key={d}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            matches
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {DAY_LABEL[d]}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      s.matchCount === selectedChild.daysNeeded.length && s.matchCount > 0
                        ? 'bg-green-600 text-white'
                        : s.matchCount > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {s.matchCount}/{selectedChild.daysNeeded.length}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {s.currentChildCount} child{s.currentChildCount !== 1 ? 'ren' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
