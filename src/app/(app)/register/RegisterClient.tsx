'use client'

import { useState } from 'react'
import { markAttendance, saveRegisterNote, signOutChild, saveDroppedBy, apply48HourRule, setNoteCompleted as saveNoteCompleted } from './actions'

type RegisterRow = {
  childId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  needs1to1: boolean
  sessionType: 'morning' | 'afternoon' | 'full_day'
  hasAllergies: boolean
  allergies: string | null
  medicalNotes: string | null
  sessionNote: { note: string; completed: boolean; completedByName: string | null } | null
  hasUnsignedAccident: boolean
  existing: {
    id: string
    status: 'present' | 'absent'
    absenceReason: string | null
    parentContacted: boolean | null
    parentContactedDate: string | null
    signedInAt: string | null
    signedOutAt: string | null
    droppedBy: string | null
    rule48h: boolean
  } | null
}

const SESSION_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  full_day: 'Full Day',
}

function getAgeYears(dob: string): number {
  const birth = new Date(dob + 'T12:00:00')
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function calcStaff(subset: RegisterRow[]): { staff: number; count2yr: number; count34yr: number; count1to1: number } {
  const count1to1 = subset.filter(r => r.needs1to1).length
  const general = subset.filter(r => !r.needs1to1)
  const count2yr = general.filter(r => getAgeYears(r.dateOfBirth) === 2).length
  const count34yr = general.filter(r => getAgeYears(r.dateOfBirth) >= 3).length
  const staff = Math.ceil(count2yr / 4) + Math.ceil(count34yr / 8) + count1to1
  return { staff, count2yr, count34yr, count1to1 }
}

function RatioWidget({ rows, statuses }: {
  rows: RegisterRow[]
  statuses: Record<string, 'present' | 'absent' | null>
}) {
  const sessionTypes = [...new Set(rows.map(r => r.sessionType))] as ('morning' | 'afternoon' | 'full_day')[]

  return (
    <div className="mb-4 bg-white rounded-xl border border-gray-200 px-3 py-2.5 print:hidden">
      <div className={`grid gap-4 ${sessionTypes.length === 1 ? 'grid-cols-1' : sessionTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {sessionTypes.map(st => {
          const sessionRows = rows.filter(r => r.sessionType === st)
          const exp = calcStaff(sessionRows)
          const presentRows = sessionRows.filter(r => statuses[`${r.childId}-${r.sessionType}`] === 'present')
          const live = calcStaff(presentRows)
          const show1to1 = exp.count1to1 > 0 || live.count1to1 > 0

          return (
            <div key={st}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{SESSION_LABELS[st]}</div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-normal text-gray-400 pb-0.5 w-full" />
                    <th className="text-right font-medium text-gray-400 pb-0.5 pr-3 whitespace-nowrap">Exp</th>
                    <th className="text-right font-medium text-[#020e2f] pb-0.5 whitespace-nowrap">Live</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-0.5">2yr <span className="text-gray-300">1:4</span></td>
                    <td className="text-right text-gray-500 pr-3 py-0.5">{exp.count2yr}</td>
                    <td className="text-right font-semibold text-gray-800 py-0.5">{live.count2yr}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">3–4yr <span className="text-gray-300">1:8</span></td>
                    <td className="text-right text-gray-500 pr-3 py-0.5">{exp.count34yr}</td>
                    <td className="text-right font-semibold text-gray-800 py-0.5">{live.count34yr}</td>
                  </tr>
                  {show1to1 && (
                    <tr>
                      <td className="text-purple-500 py-0.5">1-2-1</td>
                      <td className="text-right text-gray-500 pr-3 py-0.5">{exp.count1to1}</td>
                      <td className="text-right font-semibold text-purple-600 py-0.5">{live.count1to1}</td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-100">
                    <td className="text-gray-700 font-semibold pt-1">Staff</td>
                    <td className="text-right text-gray-500 font-semibold pr-3 pt-1">{exp.staff}</td>
                    <td className="text-right font-bold text-[#020e2f] pt-1">{live.staff}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
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
  userName,
  initialNotes,
}: {
  rows: RegisterRow[]
  todayStr: string
  dayName: string
  presentCount: number
  totalCount: number
  userId: string
  userName: string
  initialNotes: Record<string, { note: string; completed: boolean; completedByName: string | null }>
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
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.sessionNote?.note ?? '']))
  )
  const [noteCompleted, setNoteCompleted] = useState<Record<string, boolean>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.sessionNote?.completed ?? false]))
  )
  const [noteCompletedBy, setNoteCompletedBy] = useState<Record<string, string | null>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.sessionNote?.completedByName ?? null]))
  )
  const [showNote, setShowNote] = useState<Record<string, boolean>>({})
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({})
  const [signedInTimes, setSignedInTimes] = useState<Record<string, string | null>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.existing?.signedInAt ?? null]))
  )
  const [signedOutTimes, setSignedOutTimes] = useState<Record<string, string | null>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.existing?.signedOutAt ?? null]))
  )
  const [droppedByValues, setDroppedByValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.existing?.droppedBy ?? '']))
  )
  const [is48h, setIs48h] = useState<Record<string, boolean>>({})
  const [savingAbsence, setSavingAbsence] = useState<Record<string, boolean>>({})
  const [signingOut, setSigningOut] = useState<Record<string, boolean>>({})
  const [endSessionWarning, setEndSessionWarning] = useState(0)

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

  function localTimeNow() {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  function formatSignOutTime(isoOrLocal: string) {
    // Handle both stored ISO strings and local "HH:MM" strings
    if (isoOrLocal.length <= 5) return isoOrLocal
    const d = new Date(isoOrLocal)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  function minutesLateFromTime(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number)
    return Math.max(0, h * 60 + m - 15 * 60)
  }

  async function handleSignOut(childId: string, sessionType: 'morning' | 'afternoon' | 'full_day') {
    const key = `${childId}-${sessionType}`
    const timeStr = localTimeNow()
    setSigningOut(s => ({ ...s, [key]: true }))
    setSignedOutTimes(t => ({ ...t, [key]: timeStr }))
    await signOutChild(childId, sessionType, todayStr, timeStr)
    setSigningOut(s => ({ ...s, [key]: false }))
  }

  function handleEndSession() {
    const remaining = rows.filter(
      r => statuses[`${r.childId}-${r.sessionType}`] === 'present' && !signedOutTimes[`${r.childId}-${r.sessionType}`]
    )
    if (remaining.length > 0) {
      setEndSessionWarning(remaining.length)
      return
    }
    setEndSessionWarning(0)
  }

  async function handleMark(childId: string, sessionType: string, status: 'present' | 'absent') {
    const key = `${childId}-${sessionType}`
    setLoading(l => ({ ...l, [key]: true }))
    const newStatus = statuses[key] === status ? null : status
    setStatuses(s => ({ ...s, [key]: newStatus }))
    if (status === 'present' && newStatus === 'present' && !signedInTimes[key]) {
      setSignedInTimes(t => ({ ...t, [key]: localTimeNow() }))
    }
    if (status === 'absent') {
      setExpandedAbsence(e => ({ ...e, [key]: newStatus === 'absent' }))
    } else {
      setExpandedAbsence(e => ({ ...e, [key]: false }))
    }
    await save(childId, sessionType, { status: newStatus })
    setLoading(l => ({ ...l, [key]: false }))
  }

  async function handleSaveAbsence(childId: string, sessionType: 'morning' | 'afternoon' | 'full_day') {
    const key = `${childId}-${sessionType}`
    setSavingAbsence(s => ({ ...s, [key]: true }))
    await save(childId, sessionType)
    if (is48h[key]) {
      await apply48HourRule(childId, todayStr)
      setIs48h(v => ({ ...v, [key]: false }))
    }
    setExpandedAbsence(e => ({ ...e, [key]: false }))
    setSavingAbsence(s => ({ ...s, [key]: false }))
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
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Register</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {DAY_LABELS[dayName] ?? dayName} — {new Date(todayStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 items-start">
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
          <button
            onClick={handleEndSession}
            title="End the session — all children must be individually signed out first"
            className="px-3 py-2 bg-gray-700 text-white text-xs font-medium rounded-lg hover:bg-gray-800 print:hidden"
          >
            End session
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-[#020e2f] text-white text-xs font-medium rounded-lg hover:bg-[#010922] print:hidden"
            title="Print fire register"
          >
            🔥 Fire
          </button>
        </div>
      </div>

      {endSessionWarning > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-800 print:hidden">
          <strong>{endSessionWarning} {endSessionWarning === 1 ? 'child is' : 'children are'} still signed in</strong> — please sign {endSessionWarning === 1 ? 'them' : 'each of them'} out individually so the correct time and any late fees are recorded.
        </div>
      )}

      {/* Ratio widget */}
      <RatioWidget rows={rows} statuses={statuses} />

      <div className="space-y-2">
        {rows.map(row => {
          const key = `${row.childId}-${row.sessionType}`
          const status = statuses[key]
          const isLoading = loading[key]
          const showAbsence = expandedAbsence[key] || status === 'absent'
          const contacted = parentContacted[key]
          const hasNote = !!(notes[key]?.trim())
          const noteOpen = showNote[key] || false
          const signedIn = signedInTimes[key]
          const signedInDisplay = signedIn ? formatSignOutTime(signedIn) : null
          const signedOut = signedOutTimes[key]
          const signedOutDisplay = signedOut ? formatSignOutTime(signedOut) : null
          const lateMinutes = signedOutDisplay ? minutesLateFromTime(signedOutDisplay) : 0

          return (
            <div
              key={key}
              className={`bg-white rounded-xl border transition-colors ${
                status === 'present' ? 'border-green-300 bg-green-50' :
                status === 'absent' ? 'border-red-300 bg-red-50' :
                row.hasAllergies ? 'border-l-4 border-amber-400 border-gray-200' :
                'border-gray-200'
              }`}
            >
              {/* ── Main row ── */}
              <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">

                {/* Name + session + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{row.firstName} {row.lastName}</span>
                    {row.hasAllergies && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">⚠ Allergy</span>
                    )}
                    {row.hasUnsignedAccident && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">✎ Unsigned</span>
                    )}
                    {row.existing?.rule48h && status === 'absent' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">48hr</span>
                    )}
                    {hasNote && !noteOpen && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium truncate max-w-[160px] ${
                        noteCompleted[key]
                          ? 'bg-green-100 text-green-700'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {noteCompleted[key] ? '✓' : '📋'} {notes[key]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{SESSION_LABELS[row.sessionType]}</div>
                </div>

                {/* Sign-in time — present only */}
                {status === 'present' && signedInDisplay && (
                  <span className="text-xs text-gray-500 whitespace-nowrap font-medium">{signedInDisplay}</span>
                )}

                {/* Dropped by — inline when present */}
                {status === 'present' && (
                  <input
                    type="text"
                    value={droppedByValues[key] ?? ''}
                    onChange={e => setDroppedByValues(v => ({ ...v, [key]: e.target.value }))}
                    onBlur={() => saveDroppedBy(row.childId, row.sessionType, todayStr, droppedByValues[key] ?? '')}
                    placeholder="Who dropped off?"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-green-300 w-32 min-w-0"
                  />
                )}

                {/* Note button */}
                <button
                  onClick={() => setShowNote(s => ({ ...s, [key]: !noteOpen }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    noteOpen
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : hasNote
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-gray-300 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  Note
                </button>

                {/* Present button — hidden when absent */}
                {status !== 'absent' && (
                  <button
                    onClick={() => handleMark(row.childId, row.sessionType, 'present')}
                    disabled={isLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      status === 'present'
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-green-400 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    Present
                  </button>
                )}

                {/* Absent button — hidden when present */}
                {status !== 'present' && (
                  <button
                    onClick={() => handleMark(row.childId, row.sessionType, 'absent')}
                    disabled={isLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      status === 'absent'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-red-300 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    Absent
                  </button>
                )}

                {/* Sign out — present only, after the buttons */}
                {status === 'present' && (
                  signedOutDisplay ? (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span className="text-xs text-gray-500">Out: <span className="font-medium text-gray-700">{signedOutDisplay}</span></span>
                      {lateMinutes > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 font-medium px-1.5 py-0.5 rounded-full">
                          +{lateMinutes}min £{lateMinutes.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSignOut(row.childId, row.sessionType)}
                      disabled={signingOut[key]}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {signingOut[key] ? '…' : 'Sign out'}
                    </button>
                  )
                )}
              </div>

              {/* ── Note box ── */}
              {noteOpen && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 mt-2.5">
                    Session note <span className="font-normal text-gray-400">(e.g. Nan collecting, leaving early at 2pm)</span>
                  </label>
                  <textarea
                    value={notes[key] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [key]: e.target.value }))}
                    rows={2}
                    placeholder="Add a note for this session..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                  {hasNote && (
                    <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noteCompleted[key] ?? false}
                        onChange={async e => {
                          const checked = e.target.checked
                          const byName = checked ? userName : null
                          setNoteCompleted(c => ({ ...c, [key]: checked }))
                          setNoteCompletedBy(b => ({ ...b, [key]: byName }))
                          await saveNoteCompleted(row.childId, row.sessionType, todayStr, checked, byName)
                        }}
                        className="rounded"
                      />
                      Completed
                      {noteCompleted[key] && noteCompletedBy[key] && (
                        <span className="text-xs text-gray-400 font-normal">by {noteCompletedBy[key]}</span>
                      )}
                    </label>
                  )}
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
                        onClick={() => { setNotes(n => ({ ...n, [key]: '' })); handleSaveNote(row.childId, row.sessionType) }}
                        className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => { setShowNote(s => ({ ...s, [key]: false })); setNotes(n => ({ ...n, [key]: row.sessionNote?.note ?? '' })) }}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Absence section ── */}
              {showAbsence && (
                <div className="px-3 pb-3 space-y-2.5 border-t border-red-200 pt-3">
                  <input
                    type="text"
                    value={absenceReasons[key] ?? ''}
                    onChange={e => setAbsenceReasons(r => ({ ...r, [key]: e.target.value }))}
                    placeholder="Reason for absence (e.g. Unwell, family holiday...)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contacted ?? false}
                        onChange={e => {
                          const checked = e.target.checked
                          setParentContacted(p => ({ ...p, [key]: checked }))
                          if (!checked) setParentContactedDates(d => ({ ...d, [key]: todayStr }))
                        }}
                        className="rounded"
                      />
                      Parent contacted
                    </label>
                    {contacted && (
                      <input
                        type="date"
                        value={parentContactedDates[key] ?? todayStr}
                        onChange={e => setParentContactedDates(pd => ({ ...pd, [key]: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                      />
                    )}
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={is48h[key] ?? false}
                        onChange={e => setIs48h(v => ({ ...v, [key]: e.target.checked }))}
                        className="rounded"
                      />
                      48-hour rule
                    </label>
                  </div>
                  <button
                    onClick={() => handleSaveAbsence(row.childId, row.sessionType)}
                    disabled={savingAbsence[key]}
                    className="px-3 py-1.5 bg-[#020e2f] text-white text-xs rounded-lg hover:bg-[#010922] disabled:opacity-50"
                  >
                    {savingAbsence[key] ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
