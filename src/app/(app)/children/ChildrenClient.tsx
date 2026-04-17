'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type ChildRow = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  hasAllergies: boolean
  keyWorkerName: string | null
  sessions: { day: string; sessionType: string; isFunded: boolean }[]
}

const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
}
const SESSION_SHORT: Record<string, string> = {
  morning: 'AM', afternoon: 'PM', full_day: 'FD',
}
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

export default function ChildrenClient({
  children,
  keyWorkers,
}: {
  children: ChildRow[]
  keyWorkers: { id: string; name: string }[]
}) {
  const [search, setSearch] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [filterKW, setFilterKW] = useState('')

  const filtered = useMemo(() => {
    let list = children
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q)
      )
    }
    if (filterDay) {
      list = list.filter(c => c.sessions.some(s => s.day === filterDay))
    }
    if (filterKW) {
      if (filterKW === '__none__') {
        list = list.filter(c => !c.keyWorkerName)
      } else {
        list = list.filter(c => c.keyWorkerName === filterKW)
      }
    }
    return list
  }, [children, search, filterDay, filterKW])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Children</h1>
          <p className="text-sm text-gray-500 mt-0.5">{children.length} active</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/children/archived"
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Archived
          </Link>
          <Link
            href="/children/new"
            className="px-3 py-2 text-sm bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition-colors"
          >
            + Add
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 w-40 sm:w-48"
        />

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Day:</span>
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setFilterDay(d => d === day ? '' : day)}
              className={`text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
                filterDay === day
                  ? 'bg-blue-800 text-white border-blue-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600'
              }`}
            >
              {DAY_SHORT[day]}
            </button>
          ))}
        </div>

        <select
          value={filterKW}
          onChange={e => setFilterKW(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-white"
        >
          <option value="">All key workers</option>
          <option value="__none__">No key worker</option>
          {keyWorkers.map(kw => (
            <option key={kw.id} value={kw.name}>{kw.name}</option>
          ))}
        </select>

        {(search || filterDay || filterKW) && (
          <button
            onClick={() => { setSearch(''); setFilterDay(''); setFilterKW('') }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          {children.length === 0
            ? <><span>No active children yet. </span><Link href="/children/new" className="text-blue-800 hover:underline">Add the first child.</Link></>
            : 'No children match the current filters.'}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map(child => (
              <div key={child.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900">{child.firstName} {child.lastName}</span>
                      {child.hasAllergies && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full shrink-0">Allergy</span>
                      )}
                    </div>
                    {child.dateOfBirth && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(child.dateOfBirth + 'T12:00:00').toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </div>
                  <Link href={`/children/${child.id}`} className="text-blue-800 font-medium text-sm shrink-0">
                    View →
                  </Link>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {child.sessions.length === 0 ? (
                    <span className="text-xs text-gray-400">No sessions</span>
                  ) : (
                    child.sessions.map((s, i) => (
                      <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        filterDay === s.day ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-950'
                      }`}>
                        {DAY_SHORT[s.day]} {SESSION_SHORT[s.sessionType]}
                      </span>
                    ))
                  )}
                </div>

                {child.keyWorkerName && (
                  <div className="text-xs text-gray-500 mt-1.5">
                    Key worker: <span className="text-gray-700">{child.keyWorkerName}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">DOB</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sessions</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Key Worker</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Funded</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(child => (
                  <tr key={child.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{child.firstName} {child.lastName}</span>
                        {child.hasAllergies && (
                          <span className="inline-flex bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">Allergy</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {child.dateOfBirth
                        ? new Date(child.dateOfBirth + 'T12:00:00').toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {child.sessions.length === 0 ? (
                          <span className="text-gray-400">None set</span>
                        ) : (
                          child.sessions.map((s, i) => (
                            <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                              filterDay === s.day ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-950'
                            }`}>
                              {DAY_SHORT[s.day]} {SESSION_SHORT[s.sessionType]}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{child.keyWorkerName ?? '—'}</td>
                    <td className="px-4 py-3">
                      {child.sessions.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (() => {
                        const f = child.sessions.filter(s => s.isFunded).length
                        const p = child.sessions.filter(s => !s.isFunded).length
                        return (
                          <div className="flex gap-1 flex-wrap">
                            {f > 0 && <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">{f}F</span>}
                            {p > 0 && <span className="bg-blue-100 text-blue-900 text-xs px-1.5 py-0.5 rounded-full">{p}P</span>}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/children/${child.id}`} className="text-blue-800 hover:text-blue-900 font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
