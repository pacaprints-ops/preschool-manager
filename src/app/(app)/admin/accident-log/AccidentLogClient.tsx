'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Accident = {
  id: string
  childId: string
  childName: string
  incidentDate: Date | string
  incidentType: string
  incidentLocation: string | null
  injury: string
}

type Term = {
  id: string
  name: string
  startDate: string
  endDate: string
  academicYear: string
}

type Scope = { type: 'all' } | { type: 'year'; academicYear: string } | { type: 'term'; termId: string }

function toDateStr(d: Date | string): string {
  return (typeof d === 'string' ? d : d.toISOString()).slice(0, 10)
}

function normaliseLocation(loc: string | null): string {
  if (!loc || !loc.trim()) return ''
  return loc.trim().toLowerCase().replace(/\s+/g, ' ')
}

export default function AccidentLogClient({ accidents, terms }: { accidents: Accident[]; terms: Term[] }) {
  const academicYears = useMemo(
    () => [...new Set(terms.map(t => t.academicYear))].sort(),
    [terms]
  )

  const todayStr = new Date().toISOString().slice(0, 10)
  const currentTerm = terms.find(t => t.startDate <= todayStr && t.endDate >= todayStr)
  const defaultScope: Scope = currentTerm ? { type: 'term', termId: currentTerm.id } : { type: 'all' }

  const [scope, setScope] = useState<Scope>(defaultScope)

  const scopeValue =
    scope.type === 'all' ? 'all' : scope.type === 'year' ? `year:${scope.academicYear}` : `term:${scope.termId}`

  function handleScopeChange(value: string) {
    if (value === 'all') setScope({ type: 'all' })
    else if (value.startsWith('year:')) setScope({ type: 'year', academicYear: value.slice(5) })
    else setScope({ type: 'term', termId: value.slice(5) })
  }

  const filtered = useMemo(() => {
    if (scope.type === 'all') return accidents
    if (scope.type === 'term') {
      const term = terms.find(t => t.id === scope.termId)
      if (!term) return accidents
      return accidents.filter(a => {
        const d = toDateStr(a.incidentDate)
        return d >= term.startDate && d <= term.endDate
      })
    }
    // year
    const yearTerms = terms.filter(t => t.academicYear === scope.academicYear)
    if (yearTerms.length === 0) return []
    const start = yearTerms.reduce((min, t) => (t.startDate < min ? t.startDate : min), yearTerms[0].startDate)
    const end = yearTerms.reduce((max, t) => (t.endDate > max ? t.endDate : max), yearTerms[0].endDate)
    return accidents.filter(a => {
      const d = toDateStr(a.incidentDate)
      return d >= start && d <= end
    })
  }, [accidents, terms, scope])

  const inSetting = filtered.filter(a => a.incidentType !== 'out_of_setting')
  const outOfSetting = filtered.filter(a => a.incidentType === 'out_of_setting')

  const locationBreakdown = useMemo(() => {
    const groups = new Map<string, { label: string; count: number; labelCounts: Map<string, number> }>()
    for (const a of inSetting) {
      const key = normaliseLocation(a.incidentLocation)
      const displayRaw = key === '' ? 'Not recorded' : a.incidentLocation!.trim()
      let g = groups.get(key)
      if (!g) {
        g = { label: displayRaw, count: 0, labelCounts: new Map() }
        groups.set(key, g)
      }
      g.count++
      g.labelCounts.set(displayRaw, (g.labelCounts.get(displayRaw) ?? 0) + 1)
    }
    return [...groups.values()]
      .map(g => {
        // use the most common original casing/wording as the display label
        const bestLabel = [...g.labelCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
        return { label: bestLabel, count: g.count }
      })
      .sort((a, b) => b.count - a.count)
  }, [inSetting])

  const maxLocationCount = locationBreakdown.length > 0 ? locationBreakdown[0].count : 0

  const sortedList = [...filtered].sort((a, b) => toDateStr(b.incidentDate).localeCompare(toDateStr(a.incidentDate)))

  function severityStyle(count: number) {
    if (count >= 5) return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', text: 'Review this' }
    if (count >= 3) return { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', text: 'Keep an eye' }
    return { bar: 'bg-gray-300', badge: '', text: '' }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Accident Log</h1>
      <p className="text-sm text-gray-500 mb-6">
        Termly and yearly accident totals, with a location breakdown so recurring spots stand out.
      </p>

      {/* Scope selector */}
      <div className="mb-6">
        <label className="block text-xs text-gray-500 mb-1">Showing</label>
        <select
          value={scopeValue}
          onChange={e => handleScopeChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
        >
          <option value="all">All time</option>
          {academicYears.map(year => (
            <optgroup key={year} label={`Academic year ${year}`}>
              <option value={`year:${year}`}>Whole year — {year}</option>
              {terms
                .filter(t => t.academicYear === year)
                .map(t => (
                  <option key={t.id} value={`term:${t.id}`}>{t.name}</option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{filtered.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total accidents</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{inSetting.length}</div>
          <div className="text-xs text-gray-500 mt-1">In setting</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{outOfSetting.length}</div>
          <div className="text-xs text-gray-500 mt-1">Out of setting</div>
        </div>
      </div>

      {/* Location breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">In-setting accidents by location</h2>
        <p className="text-xs text-gray-400 mb-3">
          Grouped by what staff typed in the accident form&apos;s location field. Repeated locations stand out below.
        </p>

        {locationBreakdown.length === 0 && (
          <p className="text-sm text-gray-400">No in-setting accidents in this period.</p>
        )}

        <div className="space-y-2">
          {locationBreakdown.map(row => {
            const sev = severityStyle(row.count)
            const pct = maxLocationCount > 0 ? Math.max((row.count / maxLocationCount) * 100, 6) : 0
            return (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-sm text-gray-700 truncate" title={row.label}>{row.label}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-3 rounded-full ${sev.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="w-8 shrink-0 text-sm text-gray-700 text-right">{row.count}</div>
                {sev.text && (
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${sev.badge}`}>{sev.text}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Raw list */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Accidents in this period
          {filtered.length > 0 && <span className="ml-1.5 font-normal text-gray-400">({filtered.length})</span>}
        </h2>

        {sortedList.length === 0 && <p className="text-sm text-gray-400">No accidents recorded in this period.</p>}

        <div className="space-y-1.5">
          {sortedList.map(a => (
            <Link
              key={a.id}
              href={`/children/${a.childId}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-sm"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-400 text-xs w-20 shrink-0">
                  {new Date(toDateStr(a.incidentDate)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <span className="font-medium text-gray-800">{a.childName}</span>
                <span className="text-gray-500 text-xs">{a.injury}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${a.incidentType === 'out_of_setting' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                  {a.incidentType === 'out_of_setting' ? 'Out of setting' : (a.incidentLocation?.trim() || 'Location not recorded')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
