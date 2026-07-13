'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  markAttendance, saveRegisterNote, signOutChild, saveDroppedBy, savePickedUpBy,
  apply48HourRule, setNoteCompleted as saveNoteCompleted, endSession, addExtraSession,
} from './actions'
import {
  signInStaffForDay, updateStaffSignOut,
  addVisitor as addVisitorAction, signOutVisitor,
} from './staff-visitor-actions'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  onHoliday: boolean
  isExtraSession: boolean
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
    pickedUpBy: string | null
    rule48h: boolean
  } | null
}

type StaffEntry = {
  id: string
  staffName: string
  signedInAt: string | null
  signedOutAt: string | null
}

type VisitorEntry = {
  id: string
  name: string
  organisation: string | null
  signedInAt: string | null
  signedOutAt: string | null
}

type StaffUser = {
  id: string
  name: string
  workingDays: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SESSION_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  full_day: 'Full Day',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday',
}

const DAY_ABBR: Record<string, string> = {
  monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu', friday: 'fri',
}

// True if the child's birthday (month+day) falls within the next 7 days, rolling from today (inclusive)
function birthdayThisWeek(dob: string, todayStr: string): boolean {
  const today = new Date(todayStr + 'T12:00:00')
  const birth = new Date(dob + 'T12:00:00')
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (birth.getMonth() === d.getMonth() && birth.getDate() === d.getDate()) return true
  }
  return false
}

function fmtTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function localTimeNow(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// ─── Add Extra Session Modal ───────────────────────────────────────────────────

function AddExtraSessionModal({ candidates, todayStr, onClose, onAdded }: {
  candidates: { id: string; firstName: string; lastName: string }[]
  todayStr: string
  onClose: () => void
  onAdded: () => void
}) {
  const [search, setSearch] = useState('')
  const [childId, setChildId] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<'morning' | 'afternoon' | 'full_day'>('full_day')
  const [isFunded, setIsFunded] = useState(false)
  const [saving, setSaving] = useState(false)

  const filtered = candidates.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
  )
  const selected = candidates.find(c => c.id === childId)

  async function handleSubmit() {
    if (!childId) return
    setSaving(true)
    await addExtraSession(childId, todayStr, sessionType, isFunded)
    setSaving(false)
    onAdded()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Add extra day</h2>
          <p className="text-sm text-gray-500 mt-0.5">For a child attending today outside their usual schedule</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Child</label>
            {selected ? (
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-900">{selected.firstName} {selected.lastName}</span>
                <button onClick={() => { setChildId(null); setSearch('') }} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
              </div>
            ) : (
              <>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search child name…"
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {search.length > 0 && (
                  <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white mt-1">
                    {filtered.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">No children found</div>
                    ) : filtered.map(c => (
                      <button key={c.id} type="button"
                        onClick={() => { setChildId(c.id); setSearch('') }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 text-gray-900">
                        {c.firstName} {c.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
            <div className="flex gap-2">
              {(['morning', 'afternoon', 'full_day'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSessionType(st)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    sessionType === st ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {SESSION_LABELS[st]}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isFunded} onChange={e => setIsFunded(e.target.checked)} className="rounded" />
            Funded (not charged) — otherwise billed as a one-off paid session
          </label>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!childId || saving}
            className="flex-1 py-2.5 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Adding…' : 'Add to today’s register'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Staff Sign-In Modal ───────────────────────────────────────────────────────

function StaffSignInModal({ allStaff, dayName, todayStr }: {
  allStaff: StaffUser[]
  dayName: string
  todayStr: string
}) {
  const todayAbbr = DAY_ABBR[dayName] ?? ''
  const now = localTimeNow()

  const [entries, setEntries] = useState<Record<string, { checked: boolean; timeIn: string; timeOut: string }>>(
    Object.fromEntries(allStaff.map(s => [s.id, {
      checked: s.workingDays.split(',').includes(todayAbbr),
      timeIn: now,
      timeOut: '',
    }]))
  )
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setSaving(true)
    const toSave = allStaff
      .filter(s => entries[s.id]?.checked)
      .map(s => ({
        userId: s.id,
        staffName: s.name,
        signedInAt: entries[s.id].timeIn,
        signedOutAt: entries[s.id].timeOut || undefined,
      }))
    await signInStaffForDay(todayStr, toSave)
    window.location.reload()
  }

  const dateLabel = new Date(todayStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Staff Sign-In</h2>
          <p className="text-sm text-gray-500 mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {allStaff.map(staff => {
            const e = entries[staff.id]
            return (
              <div key={staff.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <input
                  type="checkbox"
                  checked={e.checked}
                  onChange={ev => setEntries(prev => ({ ...prev, [staff.id]: { ...prev[staff.id], checked: ev.target.checked } }))}
                  className="mt-1 rounded"
                />
                <div className="flex-1">
                  <span className={`text-sm font-medium block mb-2 ${e.checked ? 'text-gray-900' : 'text-gray-400'}`}>
                    {staff.name}
                  </span>
                  {e.checked && (
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 w-5">In</span>
                        <input
                          type="time"
                          value={e.timeIn}
                          onChange={ev => setEntries(prev => ({ ...prev, [staff.id]: { ...prev[staff.id], timeIn: ev.target.value } }))}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 w-24"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 w-5">Out</span>
                        <input
                          type="time"
                          value={e.timeOut}
                          onChange={ev => setEntries(prev => ({ ...prev, [staff.id]: { ...prev[staff.id], timeOut: ev.target.value } }))}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400 w-24"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-2.5 bg-[#020e2f] text-white text-sm font-semibold rounded-xl hover:bg-[#010922] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Signing in…' : 'Sign In & Open Register'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Staff Section ────────────────────────────────────────────────────────────

function StaffSection({ staff, todayStr, onSignOut, onEdit }: {
  staff: StaffEntry[]
  todayStr: string
  onSignOut: (id: string, time: string) => void
  onEdit: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTime, setEditTime] = useState('')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Staff</h2>
        <button onClick={onEdit} className="text-xs text-[#020e2f] hover:underline print:hidden">
          Edit sign-in
        </button>
      </div>
      <div className="space-y-2">
        {staff.map(s => {
          const isOut = !!s.signedOutAt
          return (
            <div key={s.id} className={`flex items-center gap-2 ${isOut ? 'opacity-60' : ''}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOut ? 'bg-gray-300' : 'bg-green-500'}`} />
              <span className="flex-1 text-sm font-medium text-gray-800">{s.staffName}</span>
              <span className="text-xs text-gray-500">{fmtTime(s.signedInAt)}</span>
              {isOut ? (
                <>
                  <span className="text-xs text-gray-400 whitespace-nowrap">→ {fmtTime(s.signedOutAt)}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">OUT</span>
                </>
              ) : (
                <>
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">IN</span>
                  {editingId === s.id ? (
                    <div className="flex items-center gap-1 print:hidden">
                      <input
                        type="time"
                        value={editTime}
                        onChange={e => setEditTime(e.target.value)}
                        className="border border-gray-300 rounded-lg px-1.5 py-0.5 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                      <button
                        onClick={() => { onSignOut(s.id, editTime); setEditingId(null) }}
                        className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded-lg"
                      >Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(s.id); setEditTime(localTimeNow()) }}
                      className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-lg hover:bg-gray-50 print:hidden"
                    >Sign out</button>
                  )}
                </>
              )}
            </div>
          )
        })}
        {staff.length === 0 && (
          <p className="text-xs text-gray-400">No staff signed in.</p>
        )}
      </div>
    </div>
  )
}

// ─── Visitors Section ─────────────────────────────────────────────────────────

function VisitorsSection({ visitors, todayStr, onAdd, onSignOut }: {
  visitors: VisitorEntry[]
  todayStr: string
  onAdd: (name: string, org: string, time: string) => Promise<void>
  onSignOut: (id: string, time: string) => void
}) {
  const [name, setName] = useState('')
  const [org, setOrg] = useState('')
  const [time, setTime] = useState(localTimeNow)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTime, setEditTime] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setAdding(true)
    await onAdd(name.trim(), org.trim(), time)
    setName('')
    setOrg('')
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Visitors</h2>
      {visitors.length > 0 && (
        <div className="space-y-2 mb-4">
          {visitors.map(v => {
            const isOut = !!v.signedOutAt
            return (
              <div key={v.id} className={`flex items-center gap-2 ${isOut ? 'opacity-60' : ''}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOut ? 'bg-gray-300' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{v.name}</span>
                  {v.organisation && <span className="text-xs text-gray-400 ml-1.5">({v.organisation})</span>}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{fmtTime(v.signedInAt)}</span>
                {isOut ? (
                  <>
                    <span className="text-xs text-gray-400 whitespace-nowrap">→ {fmtTime(v.signedOutAt)}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">OUT</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">IN</span>
                    {editingId === v.id ? (
                      <div className="flex items-center gap-1 print:hidden">
                        <input
                          type="time"
                          value={editTime}
                          onChange={e => setEditTime(e.target.value)}
                          className="border border-gray-300 rounded-lg px-1.5 py-0.5 text-xs w-24 focus:outline-none"
                        />
                        <button
                          onClick={() => { onSignOut(v.id, editTime); setEditingId(null) }}
                          className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded-lg"
                        >Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(v.id); setEditTime(localTimeNow()) }}
                        className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-lg hover:bg-gray-50 print:hidden"
                      >Sign out</button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className={`flex gap-2 flex-wrap print:hidden ${visitors.length > 0 ? 'border-t border-gray-100 pt-3' : ''}`}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Visitor name"
          className="flex-1 min-w-[130px] border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <input
          type="text"
          value={org}
          onChange={e => setOrg(e.target.value)}
          placeholder="Organisation (optional)"
          className="flex-1 min-w-[130px] border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 w-28"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !name.trim()}
          className="px-3 py-1.5 bg-[#020e2f] text-white text-sm rounded-lg hover:bg-[#010922] disabled:opacity-50 whitespace-nowrap"
        >
          {adding ? '…' : 'Add visitor'}
        </button>
      </div>
    </div>
  )
}

// ─── Fire Register Modal ───────────────────────────────────────────────────────

function FireRegisterModal({ rows, staff, visitors, todayStr, dayName, statuses, signedOutTimes, onClose }: {
  rows: RegisterRow[]
  staff: StaffEntry[]
  visitors: VisitorEntry[]
  todayStr: string
  dayName: string
  statuses: Record<string, 'present' | 'absent' | null>
  signedOutTimes: Record<string, string | null>
  onClose: () => void
}) {
  const dateLabel = new Date(todayStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const generatedAt = localTimeNow()

  const childrenIn = rows.filter(r => {
    const key = `${r.childId}-${r.sessionType}`
    return statuses[key] === 'present' && !signedOutTimes[key]
  }).length
  const staffIn = staff.filter(s => !s.signedOutAt).length
  const visitorsIn = visitors.filter(v => !v.signedOutAt).length
  const total = childrenIn + staffIn + visitorsIn

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-4">
        <div className="bg-red-600 text-white rounded-t-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">🔥 Fire Register</h2>
              <p className="text-red-200 text-sm mt-0.5">{dateLabel}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{total}</div>
              <div className="text-red-200 text-xs">in building</div>
            </div>
          </div>
          <p className="text-red-300 text-xs mt-2">Generated at {generatedAt}</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Children */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Children</h3>
              <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{childrenIn} in building</span>
            </div>
            <div className="divide-y divide-gray-50">
              {rows.map(r => {
                const key = `${r.childId}-${r.sessionType}`
                const status = statuses[key]
                const signedOut = signedOutTimes[key]
                const isIn = status === 'present' && !signedOut
                const isSignedOut = status === 'present' && !!signedOut
                const isAbsent = status === 'absent'
                return (
                  <div key={key} className={`flex items-center gap-2 py-1.5 ${!isIn ? 'opacity-40' : ''}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isIn ? 'bg-green-500' : isSignedOut ? 'bg-gray-400' : isAbsent ? 'bg-red-400' : 'bg-gray-200'}`} />
                    <span className="flex-1 text-sm font-medium text-gray-900">{r.firstName} {r.lastName}</span>
                    <span className="text-xs text-gray-400">{SESSION_LABELS[r.sessionType]}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      isIn ? 'bg-green-100 text-green-700' :
                      isSignedOut ? 'bg-gray-100 text-gray-500' :
                      isAbsent ? 'bg-red-100 text-red-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {isIn ? 'IN' : isSignedOut ? 'OUT' : isAbsent ? 'ABSENT' : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Staff */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Staff</h3>
              <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{staffIn} in building</span>
            </div>
            {staff.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No staff signed in today.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {staff.map(s => {
                  const isOut = !!s.signedOutAt
                  return (
                    <div key={s.id} className={`flex items-center gap-2 py-1.5 ${isOut ? 'opacity-40' : ''}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOut ? 'bg-gray-300' : 'bg-green-500'}`} />
                      <span className="flex-1 text-sm font-medium text-gray-900">{s.staffName}</span>
                      <span className="text-xs text-gray-400">
                        {fmtTime(s.signedInAt)}{s.signedOutAt ? ` → ${fmtTime(s.signedOutAt)}` : ''}
                      </span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isOut ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                        {isOut ? 'OUT' : 'IN'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Visitors */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Visitors</h3>
              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{visitorsIn} in building</span>
            </div>
            {visitors.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No visitors today.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {visitors.map(v => {
                  const isOut = !!v.signedOutAt
                  return (
                    <div key={v.id} className={`flex items-center gap-2 py-1.5 ${isOut ? 'opacity-40' : ''}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOut ? 'bg-gray-300' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">{v.name}</span>
                        {v.organisation && <span className="text-xs text-gray-400 ml-1.5">({v.organisation})</span>}
                      </div>
                      <span className="text-xs text-gray-400">
                        {fmtTime(v.signedInAt)}{v.signedOutAt ? ` → ${fmtTime(v.signedOutAt)}` : ''}
                      </span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isOut ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                        {isOut ? 'OUT' : 'IN'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RegisterClient({
  rows,
  todayStr,
  dayName,
  presentCount: initialPresentCount,
  userId,
  userName,
  initialNotes,
  staffAttendance,
  visitors,
  allStaff,
  needsStaffSignIn,
  upcomingBirthdays,
  allChildren,
}: {
  rows: RegisterRow[]
  todayStr: string
  dayName: string
  presentCount: number
  userId: string
  userName: string
  initialNotes: Record<string, { note: string; completed: boolean; completedByName: string | null }>
  staffAttendance: StaffEntry[]
  visitors: VisitorEntry[]
  allStaff: StaffUser[]
  needsStaffSignIn: boolean
  upcomingBirthdays: { firstName: string; lastName: string }[]
  allChildren: { id: string; firstName: string; lastName: string }[]
}) {
  const router = useRouter()

  // Children register state
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
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.existing?.parentContactedDate ?? todayStr]))
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
  const [droppedBySaved, setDroppedBySaved] = useState<Record<string, boolean>>({})
  const [justMarkedKey, setJustMarkedKey] = useState<string | null>(null)
  const droppedByRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [pickedUpByValues, setPickedUpByValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map(r => [`${r.childId}-${r.sessionType}`, r.existing?.pickedUpBy ?? '']))
  )
  const [pickedUpBySaved, setPickedUpBySaved] = useState<Record<string, boolean>>({})
  const [justSignedOutKey, setJustSignedOutKey] = useState<string | null>(null)
  const pickedUpByRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [is48h, setIs48h] = useState<Record<string, boolean>>({})
  const [savingAbsence, setSavingAbsence] = useState<Record<string, boolean>>({})
  const [signingOut, setSigningOut] = useState<Record<string, boolean>>({})
  const [endSessionWarning, setEndSessionWarning] = useState(0)
  const [endSessionDone, setEndSessionDone] = useState(false)
  const [endingSession, setEndingSession] = useState(false)

  // Staff + visitor state
  const [showStaffModal, setShowStaffModal] = useState(needsStaffSignIn)
  const [staffLocal, setStaffLocal] = useState<StaffEntry[]>(staffAttendance)
  const [visitorsLocal, setVisitorsLocal] = useState<VisitorEntry[]>(visitors)
  const [showFireRegister, setShowFireRegister] = useState(false)
  const [showAddExtra, setShowAddExtra] = useState(false)

  const staffKey = staffAttendance.map(s => s.id).join(',')
  const visitorsKey = visitors.map(v => `${v.id}:${v.signedOutAt}`).join(',')
  useEffect(() => { setStaffLocal(staffAttendance) }, [staffKey])
  useEffect(() => { setVisitorsLocal(visitors) }, [visitorsKey])

  const presentCount = Object.values(statuses).filter(s => s === 'present').length
  const holidayCount = rows.filter(r => r.onHoliday).length

  async function save(childId: string, sessionType: string, overrides?: {
    status?: 'present' | 'absent' | null
    absenceReason?: string
    parentContacted?: boolean
    parentContactedDate?: string
  }) {
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

  function formatSignOutTime(isoOrLocal: string) {
    if (isoOrLocal.length <= 5) return isoOrLocal
    const d = new Date(isoOrLocal)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
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
    setJustSignedOutKey(key)
    await signOutChild(childId, sessionType, todayStr, timeStr)
    setSigningOut(s => ({ ...s, [key]: false }))
  }

  // When a child is freshly signed out, jump straight into the
  // "who picked up" field so staff don't need an extra click
  useEffect(() => {
    if (justSignedOutKey) {
      pickedUpByRefs.current[justSignedOutKey]?.focus()
      setJustSignedOutKey(null)
    }
  }, [justSignedOutKey])

  async function handleSavePickedUpBy(childId: string, sessionType: 'morning' | 'afternoon' | 'full_day', key: string) {
    await savePickedUpBy(childId, sessionType, todayStr, pickedUpByValues[key] ?? '')
    setPickedUpBySaved(v => ({ ...v, [key]: true }))
    setTimeout(() => setPickedUpBySaved(v => ({ ...v, [key]: false })), 1500)
  }

  async function handleEndSession() {
    // Children already signed out at/before 3pm → normalise to exactly 3pm.
    // Genuine late pickups (signed out after 3pm) must keep their real time and late fee.
    const toUpdate = rows.filter(r => {
      const key = `${r.childId}-${r.sessionType}`
      if (statuses[key] !== 'present' || !signedOutTimes[key]) return false
      const isLate = minutesLateFromTime(formatSignOutTime(signedOutTimes[key]!)) > 0
      return !isLate
    })
    const stillPresent = rows.filter(r => {
      const key = `${r.childId}-${r.sessionType}`
      return statuses[key] === 'present' && !signedOutTimes[key]
    })

    if (toUpdate.length > 0) {
      setSignedOutTimes(t => {
        const updated = { ...t }
        for (const r of toUpdate) updated[`${r.childId}-${r.sessionType}`] = '15:00'
        return updated
      })
      setEndingSession(true)
      await endSession(todayStr, toUpdate.map(r => ({
        childId: r.childId,
        sessionType: r.sessionType as 'morning' | 'afternoon' | 'full_day',
      })))
      setEndingSession(false)
    }

    if (stillPresent.length > 0) {
      setEndSessionWarning(stillPresent.length)
      setEndSessionDone(false)
    } else {
      setEndSessionWarning(0)
      setEndSessionDone(true)
    }
  }

  async function handleMark(childId: string, sessionType: string, status: 'present' | 'absent') {
    const key = `${childId}-${sessionType}`
    setLoading(l => ({ ...l, [key]: true }))
    const newStatus = statuses[key] === status ? null : status
    setStatuses(s => ({ ...s, [key]: newStatus }))
    if (status === 'present' && newStatus === 'present' && !signedInTimes[key]) {
      setSignedInTimes(t => ({ ...t, [key]: localTimeNow() }))
      setJustMarkedKey(key)
    }
    if (status === 'absent') {
      setExpandedAbsence(e => ({ ...e, [key]: newStatus === 'absent' }))
    } else {
      setExpandedAbsence(e => ({ ...e, [key]: false }))
    }
    await save(childId, sessionType, { status: newStatus })
    setLoading(l => ({ ...l, [key]: false }))
  }

  // When a child is freshly marked present, jump straight into the
  // "who dropped off" field so staff don't need an extra click
  useEffect(() => {
    if (justMarkedKey) {
      droppedByRefs.current[justMarkedKey]?.focus()
      setJustMarkedKey(null)
    }
  }, [justMarkedKey])

  async function handleSaveDroppedBy(childId: string, sessionType: 'morning' | 'afternoon' | 'full_day', key: string) {
    await saveDroppedBy(childId, sessionType, todayStr, droppedByValues[key] ?? '')
    setDroppedBySaved(v => ({ ...v, [key]: true }))
    setTimeout(() => setDroppedBySaved(v => ({ ...v, [key]: false })), 1500)
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

  async function handleStaffSignOut(id: string, time: string) {
    setStaffLocal(s => s.map(st => st.id === id ? { ...st, signedOutAt: `${todayStr}T${time}:00` } : st))
    await updateStaffSignOut(id, todayStr, time)
  }

  async function handleAddVisitor(name: string, org: string, time: string) {
    const tempId = `temp-${Date.now()}`
    setVisitorsLocal(v => [...v, { id: tempId, name, organisation: org || null, signedInAt: `${todayStr}T${time}:00`, signedOutAt: null }])
    await addVisitorAction(todayStr, name, org, time)
    router.refresh()
  }

  async function handleVisitorSignOut(id: string, time: string) {
    setVisitorsLocal(v => v.map(vis => vis.id === id ? { ...vis, signedOutAt: `${todayStr}T${time}:00` } : vis))
    await signOutVisitor(id, todayStr, time)
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
    <>
      {showStaffModal && (
        <StaffSignInModal allStaff={allStaff} dayName={dayName} todayStr={todayStr} />
      )}

      {showFireRegister && (
        <FireRegisterModal
          rows={rows}
          staff={staffLocal}
          visitors={visitorsLocal}
          todayStr={todayStr}
          dayName={dayName}
          statuses={statuses}
          signedOutTimes={signedOutTimes}
          onClose={() => setShowFireRegister(false)}
        />
      )}

      {showAddExtra && (
        <AddExtraSessionModal
          candidates={allChildren.filter(c => !rows.some(r => r.childId === c.id))}
          todayStr={todayStr}
          onClose={() => setShowAddExtra(false)}
          onAdded={() => { setShowAddExtra(false); router.refresh() }}
        />
      )}

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
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-3 sm:px-4 py-2 text-center">
              <div className="text-xl sm:text-2xl font-bold text-cyan-700">{holidayCount}</div>
              <div className="text-xs text-cyan-600">Holiday</div>
            </div>
            <button
              onClick={() => setShowAddExtra(true)}
              title="Add a child for today who isn't normally scheduled this day"
              className="px-3 py-2 bg-purple-700 text-white text-xs font-medium rounded-lg hover:bg-purple-800 print:hidden"
            >
              + Extra day
            </button>
            <button
              onClick={handleEndSession}
              title="End the session — all children must be individually signed out first"
              className="px-3 py-2 bg-gray-700 text-white text-xs font-medium rounded-lg hover:bg-gray-800 print:hidden"
            >
              End session
            </button>
            <button
              onClick={() => setShowFireRegister(true)}
              className="px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 print:hidden transition-colors"
              title="Fire register — see who is in the building"
            >
              🔥 Fire
            </button>
          </div>
        </div>

        {endSessionWarning > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-center justify-between print:hidden">
            <p className="text-sm text-amber-800">
              <strong>{endSessionWarning} {endSessionWarning === 1 ? 'child has' : 'children have'} not been signed out</strong> — sign {endSessionWarning === 1 ? 'them' : 'each of them'} out when collected.
            </p>
            <button onClick={() => setEndSessionWarning(0)} className="text-xs text-amber-500 hover:text-amber-700 ml-4 shrink-0">Dismiss</button>
          </div>
        )}

        {endSessionDone && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between print:hidden">
            <p className="text-sm text-green-800 font-medium">Session ended — all children signed out at 3:00pm.</p>
            <button onClick={() => setEndSessionDone(false)} className="text-xs text-green-500 hover:text-green-700 ml-4">Dismiss</button>
          </div>
        )}

        {/* Birthday banner — all active children with a birthday in the next 7 days */}
        {upcomingBirthdays.length > 0 && (
          <div className="mb-4 bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 text-sm text-pink-800 print:hidden">
            🎂 <strong>Birthday coming up:</strong>{' '}
            {upcomingBirthdays.map(c => `${c.firstName} ${c.lastName}`).join(', ')}
          </div>
        )}


        {/* Children register */}
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
                      <button
                        onClick={() => setShowNote(s => ({ ...s, [key]: !noteOpen }))}
                        title="Session note"
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                          noteOpen
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : hasNote
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                              : 'border-gray-300 text-gray-400 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        📋 Note
                      </button>
                      {birthdayThisWeek(row.dateOfBirth, todayStr) && (
                        <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-medium">🎂 Birthday</span>
                      )}
                      {row.hasAllergies && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">⚠ Allergy</span>
                      )}
                      {row.onHoliday && (
                        <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full font-medium">🏖 Holiday</span>
                      )}
                      {row.isExtraSession && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium" title="Extra one-off session, not their usual day">🗓 Extra day</span>
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
                    <div className="flex items-center gap-1">
                      <input
                        ref={el => { droppedByRefs.current[key] = el }}
                        type="text"
                        value={droppedByValues[key] ?? ''}
                        onChange={e => setDroppedByValues(v => ({ ...v, [key]: e.target.value }))}
                        onBlur={() => handleSaveDroppedBy(row.childId, row.sessionType, key)}
                        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                        placeholder="Who dropped off?"
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-green-300 w-32 min-w-0"
                      />
                      {droppedBySaved[key] && (
                        <span className="text-green-600 text-xs shrink-0">✓</span>
                      )}
                    </div>
                  )}

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

                  {/* Sign out — present only */}
                  {status === 'present' && (
                    signedOutDisplay ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap flex-wrap">
                        <span className="text-xs text-gray-500">Out: <span className="font-medium text-gray-700">{signedOutDisplay}</span></span>
                        {lateMinutes > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 font-medium px-1.5 py-0.5 rounded-full">
                            +{lateMinutes}min £{lateMinutes.toFixed(2)}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <input
                            ref={el => { pickedUpByRefs.current[key] = el }}
                            type="text"
                            value={pickedUpByValues[key] ?? ''}
                            onChange={e => setPickedUpByValues(v => ({ ...v, [key]: e.target.value }))}
                            onBlur={() => handleSavePickedUpBy(row.childId, row.sessionType, key)}
                            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                            placeholder="Who picked up?"
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-green-300 w-32 min-w-0"
                          />
                          {pickedUpBySaved[key] && (
                            <span className="text-green-600 text-xs shrink-0">✓</span>
                          )}
                        </div>
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

        {/* Staff + Visitors */}
        <div className="space-y-3 mt-4">
          <StaffSection
            staff={staffLocal}
            todayStr={todayStr}
            onSignOut={handleStaffSignOut}
            onEdit={() => setShowStaffModal(true)}
          />
          <VisitorsSection
            visitors={visitorsLocal}
            todayStr={todayStr}
            onAdd={handleAddVisitor}
            onSignOut={handleVisitorSignOut}
          />
        </div>
      </div>
    </>
  )
}
