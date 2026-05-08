'use client'

import React, { useState } from 'react'
import { updateChildFundingFlag } from '@/app/(app)/children/actions'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABEL: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SESSION_HOURS: Record<string, number> = { morning: 3, afternoon: 3, full_day: 6 }

type Session = { day: string; sessionType: string }

type Child = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  dep: boolean
  eypp: boolean
  sen: boolean
  needs1to1: boolean
  sessions: Session[]
}

type Term = {
  id: string
  name: string
  startDate: string
  endDate: string
  weekCount: number
}

function ageAt(dob: string, refDate: string): number {
  const d = new Date(dob + 'T12:00:00')
  const r = new Date(refDate + 'T12:00:00')
  let age = r.getFullYear() - d.getFullYear()
  if (r.getMonth() < d.getMonth() || (r.getMonth() === d.getMonth() && r.getDate() < d.getDate())) age--
  return age
}

function fmtDob(dob: string): string {
  return new Date(dob + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDayHours(sessions: Session[]): Record<string, number> {
  const h: Record<string, number> = {}
  for (const s of sessions) {
    h[s.day] = (h[s.day] || 0) + (SESSION_HOURS[s.sessionType] ?? 0)
  }
  return h
}

export default function TermlyRegisterClient({
  childrenData,
  terms,
  isAdmin,
}: {
  childrenData: Child[]
  terms: Term[]
  isAdmin: boolean
}) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const defaultTerm = terms.find(t => t.startDate <= todayStr && t.endDate >= todayStr) ?? terms[terms.length - 1]

  const [selectedTermId, setSelectedTermId] = useState(defaultTerm?.id ?? '')
  const [flags, setFlags] = useState<Record<string, { dep: boolean; eypp: boolean; sen: boolean }>>(() =>
    Object.fromEntries(childrenData.map(c => [c.id, { dep: c.dep, eypp: c.eypp, sen: c.sen }]))
  )

  const selectedTerm = terms.find(t => t.id === selectedTermId)
  const refDate = selectedTerm?.startDate ?? todayStr

  const enriched = childrenData.map(c => {
    const f = flags[c.id] ?? { dep: c.dep, eypp: c.eypp, sen: c.sen }
    const dayHours = getDayHours(c.sessions)
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      dateOfBirth: c.dateOfBirth,
      needs1to1: c.needs1to1,
      dep: f.dep,
      eypp: f.eypp,
      sen: f.sen,
      ageAtTerm: ageAt(c.dateOfBirth, refDate),
      dayHours,
      totalHours: Object.values(dayHours).reduce((a, b) => a + b, 0),
    }
  })

  // Sort age groups oldest first, within each group sort by DOB asc (oldest child first)
  const allAges = [...new Set(enriched.map(c => c.ageAtTerm))].sort((a, b) => a - b)
  const ageGroups = allAges.map(age => ({
    age,
    label: `${age} Year Old${age !== 1 ? 's' : ''}`,
    children: enriched
      .filter(c => c.ageAtTerm === age)
      .sort((a, b) => a.dateOfBirth.localeCompare(b.dateOfBirth)),
  }))

  // Footer stats per day
  const dayStats = DAYS.map(day => {
    const attending = enriched.filter(c => (c.dayHours[day] ?? 0) > 0)
    const gen = attending.filter(c => !c.needs1to1)
    const count2yr = attending.filter(c => c.ageAtTerm === 2).length
    const count2yrGen = gen.filter(c => c.ageAtTerm === 2).length
    const count34yrGen = gen.filter(c => c.ageAtTerm >= 3).length
    const count1to1 = attending.filter(c => c.needs1to1).length
    const staffInRatio = Math.ceil(count2yrGen / 4) + Math.ceil(count34yrGen / 8)
    return { total: attending.length, count2yr, staffInRatio, count1to1, totalStaff: staffInRatio + count1to1 }
  })

  async function toggleFlag(childId: string, field: 'dep' | 'eypp' | 'sen') {
    const current = flags[childId]?.[field] ?? false
    setFlags(prev => ({ ...prev, [childId]: { ...(prev[childId] ?? {}), [field]: !current } }))
    await updateChildFundingFlag(childId, field, !current)
  }

  function handlePrint() {
    const style = document.createElement('style')
    style.id = 'print-landscape'
    style.textContent = '@media print { @page { size: A4 landscape; margin: 8mm; } }'
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.getElementById('print-landscape')?.remove(), 1000)
  }

  let rowNum = 0

  const thBase = 'px-2 py-2 text-center text-xs font-bold border-r border-white/20 last:border-r-0'
  const thLeft = 'px-2 py-2 text-left text-xs font-bold border-r border-white/20'
  const td = 'px-2 py-1.5 text-xs border-r border-gray-100 last:border-r-0'
  const tdCenter = 'px-1 py-1.5 text-xs text-center border-r border-gray-100 last:border-r-0'

  return (
    <div>
      {/* Toolbar */}
      <div className="print:hidden flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Termly Register</h1>
          {selectedTerm
            ? <p className="text-sm text-gray-500 mt-0.5">{selectedTerm.name} · {selectedTerm.weekCount} weeks</p>
            : <p className="text-sm text-gray-400 mt-0.5">No terms configured</p>
          }
        </div>
        <div className="flex items-center gap-2">
          {terms.length > 0 && (
            <select
              value={selectedTermId}
              onChange={e => setSelectedTermId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              {[...terms].reverse().map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#020e2f] text-white text-sm font-medium rounded-lg hover:bg-[#010922]"
          >
            🖨 Print
          </button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:flex justify-between items-baseline mb-3">
        <div className="font-bold text-sm">Winton Pre-School Little Explorers Register</div>
        {selectedTerm && <div className="text-sm font-semibold">TERM {selectedTerm.name}</div>}
      </div>

      {terms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
          No terms configured yet. <a href="/admin/terms" className="text-[#020e2f] underline">Add terms in Term Dates</a> to use the termly register.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 print:rounded-none print:border-none print:overflow-visible">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#020e2f] text-white">
                <th className={`${thLeft} w-8`}>No.</th>
                <th className={`${thLeft} min-w-[80px]`}>First Name</th>
                <th className={`${thLeft} min-w-[90px]`}>Last Name</th>
                <th className={`${thBase} w-[90px]`}>DEP / EYPP / SEN</th>
                <th className={`${thLeft} w-[110px]`}>D.O.B (Age)</th>
                {DAYS.map(day => (
                  <th key={day} className={`${thBase} w-10`}>{DAY_LABEL[day]}</th>
                ))}
                <th className={`${thBase} w-12`}>Total Wk</th>
              </tr>
            </thead>
            <tbody>
              {ageGroups.map(group => (
                <React.Fragment key={group.age}>
                  {/* Age group separator */}
                  <tr className="bg-[#eef2f7]">
                    <td colSpan={11} className="px-3 py-1 text-xs font-bold text-[#020e2f] uppercase tracking-wider border-b border-gray-200">
                      {group.label}
                    </td>
                  </tr>

                  {group.children.map(child => {
                    rowNum++
                    const n = rowNum
                    return (
                      <tr key={child.id} className="border-b border-gray-100 even:bg-gray-50/40 hover:bg-blue-50/30 transition-colors">
                        <td className={`${td} text-center text-gray-400 font-medium`}>{n}</td>
                        <td className={`${td} font-semibold text-gray-900`}>{child.firstName}</td>
                        <td className={`${td} text-gray-800`}>{child.lastName}</td>

                        {/* DEP / EYPP / SEN */}
                        <td className={`${tdCenter}`}>
                          <div className="flex gap-1 justify-center">
                            {(['dep', 'eypp', 'sen'] as const).map(f => (
                              <button
                                key={f}
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => { if (isAdmin) toggleFlag(child.id, f) }}
                                title={f === 'dep' ? 'Deprivation' : f === 'eypp' ? 'Early Years Pupil Premium' : 'Special Educational Needs'}
                                className={`text-[9px] font-bold px-1 py-0.5 rounded transition-colors leading-none ${
                                  child[f]
                                    ? f === 'dep'
                                      ? 'bg-blue-600 text-white'
                                      : f === 'eypp'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-400'
                                } ${isAdmin ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}`}
                              >
                                {f.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* DOB + age */}
                        <td className={`${td} text-gray-700 whitespace-nowrap`}>
                          {fmtDob(child.dateOfBirth)} ({child.ageAtTerm})
                        </td>

                        {/* Day hours */}
                        {DAYS.map(day => (
                          <td key={day} className={`${tdCenter} font-medium`}>
                            {child.dayHours[day]
                              ? <span className="text-gray-800">{child.dayHours[day]}</span>
                              : <span className="text-gray-200">—</span>
                            }
                          </td>
                        ))}

                        {/* Total weekly hours */}
                        <td className={`${tdCenter} font-bold text-gray-800`}>
                          {child.totalHours || <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}

              {enriched.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-sm text-gray-400">No active children enrolled.</td>
                </tr>
              )}

              {/* Spacer */}
              <tr><td colSpan={11} className="py-0.5 bg-gray-200" /></tr>

              {/* Footer rows */}
              {[
                { label: 'Total Children', values: dayStats.map(s => s.total), cls: 'font-bold text-gray-800' },
                { label: '2 Year Olds', values: dayStats.map(s => s.count2yr), cls: 'text-blue-700 font-medium' },
                { label: 'Staff in Ratio', values: dayStats.map(s => s.staffInRatio), cls: 'text-gray-700 font-medium' },
                { label: '1A (1-2-1)', values: dayStats.map(s => s.count1to1), cls: 'text-purple-700 font-medium' },
                { label: 'Total Staff', values: dayStats.map(s => s.totalStaff), cls: 'font-bold text-gray-900' },
              ].map(row => (
                <tr key={row.label} className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-gray-700">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className={`px-1 py-1.5 text-center text-xs border-r border-gray-200 ${row.cls}`}>
                      {v > 0 ? v : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
