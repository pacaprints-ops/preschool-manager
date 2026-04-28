'use client'

import { useState } from 'react'
import { markAttendance, saveRegisterNote } from './actions'

type RegisterRow = {
  childId: string
  firstName: string
  lastName: string
  sessionType: 'morning' | 'afternoon' | 'full_day'
  hasAllergies: boolean
  allergies: string | null
  sessionNote: string | null
  existing: {
    id: string
    status: 'present' | 'absent'
    absenceReason: string | null
    parentContacted: boolean | null
    parentContactedDate: string | null
  } | null
}

const SESSION_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  full_day: 'Full Day',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
}

export default function RegisterClient({
  rows,
  todayStr,
  dayName,
  presentCount: initialPresentCount,
  totalCount,
  userId,
  initialNotes,
}: {
  rows: RegisterRow[]
  todayStr: string
  dayName: string
  presentCount: number
  totalCount: number
  userId: string
  initialNotes: Record<string, string>
}) {
  const [statuses, setStatuses] = useState<Record<string, 'present' | 'absent' | null>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.existing?.status ?? null]))
  )
  const [absenceReasons, setAbsenceReasons] = useState<Record<string, string>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.existing?.absenceReason ?? '']))
  )
  const [parentContacted, setParentContacted] = useState<Record<string, boolean>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.existing?.parentContacted ?? false]))
  )
  const [parentContactedDates, setParentContactedDates] = useState<Record<string, string>>(
    Object.fromEntries(rows.map(r => [
      `${r.childId}-${r.sessionType}`,
      r.existing?.parentContactedDate ?? todayStr,
    ]))
  )
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [expandedAbsence, setExpandedAbsence] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.sessionNote ?? '']))
  )
  const [showNote, setShowNote] = useState<Record<string, boolean>>({})
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({})

  const presentCount = Object.values(statuses).filter(s => s === 'present').length

  async function save(childId: string, sessionType: string, overrides?: { status?: 'present' | 'absent' | null; absenceReason?: string; parentContacted?: boolean; parentContactedDate?: string }) {
    const key = `${childId}-${sessionType}`
    await markAttendance({
      childId,
      sessionType: sessionType as 'morning' | 'afternoon' | 'full_day',
      date: todayStr,
      status: overrides?.status !== undefined ? overrides.status : (statuses[key] ?? null),
      absenceReason: overrides?.absenceReason !== undefined ? overrides.absenceReason : (absenceReasons[key] || null),
      parentContacted: overrides?.parentContacted !== undefined ? overrides.parentContacted : (parentContacted[key] || false),
      parentContactedDate: overrides?.parentContactedDate !== undefined ? overrides.parentContactedDate : (parentContactedDates[key] || todayStr),
      userId,
    })
  }

  async function handleSaveNote(childId: string, sessionType: 'morning' | 'afternoon' | 'full_day') {
    const key = `${childId}-${sessionType}`
    setSavingNote(s => ({ ...s, [key]: true }))
    await saveRegisterNote(childId, sessionType, todayStr, notes[key] ?? '', userId)
    setSavingNote(s => ({ ...s, [key]: false }))
    setShowNote(s => ({ ...s, [key]: false }))
  }

  async function handleMark(childId: string, sessionType: string, status: 'present' | 'absent') {
    const key = `${childId}-${sessionType}`
    setLoading(l => ({ ...l, [key]: true }))
    const newStatus = statuses[key] === status ? null : status
    setStatuses(s => ({ ...s, [key]: newStatus }))
    if (status === 'absent') {
      setExpandedAbsence(e => ({ ...e, [key]: newStatus === 'absent' }))
    } else {
      setExpandedAbsence(e => ({ ...e, [key]: false }))
    }
    await save(childId, sessionType, { status: newStatus })
    setLoading(l => ({ ...l, [key]: false }))
  }

  if (rows.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Register</h1>
        <p className="text-sm text-gray-500 mb-6">{DAY_LABELS[dayName] ?? dayName} — {todayStr}</p>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          No children are scheduled for today.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Register</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {DAY_LABELS[dayName] ?? dayName} — {new Date(todayStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 sm:px-4 py-2 text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-700">{presentCount}</div>
            <div className="text-xs text-green-600">Present</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 sm:px-4 py-2 text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {Object.values(statuses).filter(s => s === 'absent').length}
            </div>
            <div className="text-xs text-red-500">Absent</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-600">{totalCount}</div>
            <div className="text-xs text-gray-500">Expected</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map(row => {
          const key = `${row.childId}-${row.sessionType}`
          const status = statuses[key]
          const isLoading = loading[key]
          const showAbsence = expandedAbsence[key] || status === 'absent'
          const contacted = parentContacted[key]
          const hasNote = !!(notes[key]?.trim())
          const noteOpen = showNote[key] || false

          return (
            <div
              key={key}
              className={`bg-white rounded-xl border transition-colors ${
                status === 'present' ? 'border-green-300 bg-green-50' :
                status === 'absent' ? 'border-red-300 bg-red-50' :
                'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {row.firstName} {row.lastName}
                    </span>
                    {row.hasAllergies && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        ⚠ Allergy
                      </span>
                    )}
                    {/* Note indicator — shown inline when note exists and box is closed */}
                    {hasNote && !noteOpen && (
                      <span className="text-xs text-[#020e2f] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[180px]">
                        📋 {notes[key]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{SESSION_LABELS[row.sessionType]}</div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Note toggle button */}
                  <button
                    onClick={() => setShowNote(s => ({ ...s, [key]: !noteOpen }))}
                    title={hasNote ? 'View/edit note' : 'Add note'}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      hasNote
                        ? 'bg-[#020e2f] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {hasNote ? '📋 Note' : '+ Note'}
                  </button>

                  <button
                    onClick={() => handleMark(row.childId, row.sessionType, 'present')}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === 'present'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleMark(row.childId, row.sessionType, 'absent')}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === 'absent'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>

              {/* Note box */}
              {noteOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 mt-3">
                    Session note <span className="text-gray-400 font-normal">(e.g. Nan collecting, leaving early at 2pm)</span>
                  </label>
                  <textarea
                    value={notes[key] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [key]: e.target.value }))}
                    rows={2}
                    placeholder="Add a note for this session..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveNote(row.childId, row.sessionType)}
                      disabled={savingNote[key]}
                      className="px-3 py-1.5 bg-[#020e2f] text-white text-xs rounded-lg hover:bg-[#010922] disabled:opacity-50"
                    >
                      {savingNote[key] ? 'Saving…' : 'Save note'}
                    </button>
                    {hasNote && (
                      <button
                        onClick={() => {
                          setNotes(n => ({ ...n, [key]: '' }))
                          handleSaveNote(row.childId, row.sessionType)
                        }}
                        className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowNote(s => ({ ...s, [key]: false }))
                        // Reset unsaved changes
                        setNotes(n => ({ ...n, [key]: row.sessionNote ?? '' }))
                      }}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showAbsence && (
                <div className="px-4 pb-4 space-y-3 border-t border-red-200 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reason for absence</label>
                    <input
                      type="text"
                      value={absenceReasons[key] ?? ''}
                      onChange={e => setAbsenceReasons(r => ({ ...r, [key]: e.target.value }))}
                      onBlur={() => save(row.childId, row.sessionType)}
                      placeholder="e.g. Unwell, family holiday..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>

                  <div className="flex items-start gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contacted ?? false}
                        onChange={e => {
                          const checked = e.target.checked
                          setParentContacted(p => ({ ...p, [key]: checked }))
                          // If unchecked, reset date to today
                          if (!checked) setParentContactedDates(d => ({ ...d, [key]: todayStr }))
                          setTimeout(() => save(row.childId, row.sessionType, { parentContacted: checked }), 0)
                        }}
                        className="rounded"
                      />
                      Parent contacted
                    </label>

                    {contacted && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Date contacted:</label>
                        <input
                          type="date"
                          value={parentContactedDates[key] ?? todayStr}
                          onChange={e => {
                            const d = e.target.value
                            setParentContactedDates(pd => ({ ...pd, [key]: d }))
                            save(row.childId, row.sessionType, { parentContactedDate: d })
                          }}
                          className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
