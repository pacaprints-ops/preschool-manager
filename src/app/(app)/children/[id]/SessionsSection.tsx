'use client'

import { useState } from 'react'
import { updateChildSessions, setSessionSegments } from '../actions'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const SESSIONS = ['morning', 'afternoon', 'full_day'] as const
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SESSION_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', full_day: 'Full Day' }
const FUNDING_TYPES = ['paid', 'universal15', 'extended30', 'two_year', 'senif'] as const
const FUNDING_LABELS: Record<string, string> = {
  paid: 'Paid', universal15: 'Universal 15h', extended30: 'Extended 30h', two_year: '2-Year', senif: 'SENIF',
}
const FUNDING_BADGE_CLASS: Record<string, string> = {
  paid: 'bg-blue-100 text-blue-950',
  universal15: 'bg-green-100 text-green-800',
  extended30: 'bg-emerald-100 text-emerald-800',
  two_year: 'bg-teal-100 text-teal-800',
  senif: 'bg-purple-100 text-purple-800',
}

type Session = { id: string; day: typeof DAYS[number]; sessionType: typeof SESSIONS[number]; fundingType: string }
type Segment = { id: string; childSessionId: string; startTime: string; endTime: string; fundingType: string }
type SessionConf = { type: string; startTime: string; endTime: string }

function initState(sessions: Session[]): Record<string, string> {
  return Object.fromEntries(sessions.map(s => [`${s.day}-${s.sessionType}`, s.fundingType]))
}

function fundingLabel(ft: string) {
  return FUNDING_LABELS[ft] ?? ft
}

export default function SessionsSection({ childId, sessions, segments, sessionConfigs }: {
  childId: string
  sessions: Session[]
  segments: Segment[]
  sessionConfigs: SessionConf[]
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Record<string, string>>(() => initState(sessions))
  const [splittingId, setSplittingId] = useState<string | null>(null)

  function toggle(day: string, session: string) {
    const key = `${day}-${session}`
    setSelected(s => {
      const next = { ...s }
      if (key in next) delete next[key]
      else next[key] = 'paid'
      return next
    })
  }

  function setFundingType(key: string, fundingType: string) {
    setSelected(s => ({ ...s, [key]: fundingType }))
  }

  async function handleSave() {
    setSaving(true)
    const parsed = Object.entries(selected).map(([key, fundingType]) => {
      const [day, ...rest] = key.split('-')
      return { day, sessionType: rest.join('-'), fundingType }
    })
    await updateChildSessions(childId, parsed)
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setSelected(initState(sessions))
    setEditing(false)
  }

  const segmentsBySession = segments.reduce<Record<string, Segment[]>>((acc, seg) => {
    if (!acc[seg.childSessionId]) acc[seg.childSessionId] = []
    acc[seg.childSessionId].push(seg)
    return acc
  }, {})

  // Summary counts (a split session counts by its segments, not the row)
  const summaryUnits: { fundingType: string }[] = sessions.flatMap(s =>
    segmentsBySession[s.id]?.length
      ? segmentsBySession[s.id].map(seg => ({ fundingType: seg.fundingType }))
      : [{ fundingType: s.fundingType }]
  )
  const fundedCount = summaryUnits.filter(u => u.fundingType !== 'paid').length
  const paidCount = summaryUnits.filter(u => u.fundingType === 'paid').length

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Sessions</h2>
          {sessions.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {fundedCount > 0 && <span className="text-green-700">{fundedCount} funded</span>}
              {fundedCount > 0 && paidCount > 0 && <span className="text-gray-400"> · </span>}
              {paidCount > 0 && <span className="text-blue-900">{paidCount} paid</span>}
              {sessions.length > 0 && <span className="text-gray-400"> per week</span>}
            </p>
          )}
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-xs text-blue-800 hover:text-blue-900">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-900 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={handleCancel} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        )}
      </div>

      {!editing ? (
        sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No sessions set.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => {
              const conf = sessionConfigs.find(c => c.type === s.sessionType)
              const segs = segmentsBySession[s.id] ?? []
              const isSplitting = splittingId === s.id
              return (
                <div key={s.id} className="border border-gray-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{DAY_LABELS[s.day]} {SESSION_LABELS[s.sessionType]}</span>
                      {segs.length === 0 ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FUNDING_BADGE_CLASS[s.fundingType] ?? 'bg-gray-100 text-gray-700'}`}>
                          {fundingLabel(s.fundingType)}
                        </span>
                      ) : (
                        segs
                          .slice()
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(seg => (
                            <span key={seg.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${FUNDING_BADGE_CLASS[seg.fundingType] ?? 'bg-gray-100 text-gray-700'}`}>
                              {seg.startTime}–{seg.endTime} {fundingLabel(seg.fundingType)}
                            </span>
                          ))
                      )}
                    </div>
                    <button
                      onClick={() => setSplittingId(isSplitting ? null : s.id)}
                      className="text-xs text-purple-700 hover:underline shrink-0"
                    >
                      {segs.length > 0 ? 'Edit split' : 'Split session'}
                    </button>
                  </div>
                  {isSplitting && conf && (
                    <SegmentEditor
                      childSessionId={s.id}
                      childId={childId}
                      sessionStart={conf.startTime}
                      sessionEnd={conf.endTime}
                      existing={segs}
                      onDone={() => setSplittingId(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div>
          <p className="text-xs text-gray-500 mb-3">Tick to add a session, then choose how it's funded. To part-fund/part-pay one session across different times of day, save here first, then use "Split session" below.</p>
          <table className="text-sm border-collapse">
            <thead>
              <tr>
                <th className="w-16"></th>
                {SESSIONS.map(s => (
                  <th key={s} className="px-4 py-1 text-gray-600 font-medium text-center">{SESSION_LABELS[s]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td className="py-2 pr-3 text-gray-700 font-medium">{DAY_LABELS[day]}</td>
                  {SESSIONS.map(session => {
                    const key = `${day}-${session}`
                    const status = selected[key]
                    return (
                      <td key={session} className="px-4 py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={key in selected}
                            onChange={() => toggle(day, session)}
                            className="rounded w-4 h-4 accent-blue-800"
                          />
                          {status && (
                            <select
                              value={status}
                              onChange={e => setFundingType(key, e.target.value)}
                              className={`text-xs px-1.5 py-0.5 rounded-full font-medium border-0 ${
                                status === 'paid' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {FUNDING_TYPES.map(ft => (
                                <option key={ft} value={ft}>{FUNDING_LABELS[ft]}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SegmentEditor({ childSessionId, childId, sessionStart, sessionEnd, existing, onDone }: {
  childSessionId: string
  childId: string
  sessionStart: string
  sessionEnd: string
  existing: Segment[]
  onDone: () => void
}) {
  const [rows, setRows] = useState<{ startTime: string; endTime: string; fundingType: string }[]>(
    existing.length > 0
      ? existing.slice().sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => ({ startTime: s.startTime, endTime: s.endTime, fundingType: s.fundingType }))
      : [{ startTime: sessionStart, endTime: sessionEnd, fundingType: 'paid' }]
  )
  const [saving, setSaving] = useState(false)

  function updateRow(i: number, patch: Partial<{ startTime: string; endTime: string; fundingType: string }>) {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  function addRow() {
    setRows(rs => [...rs, { startTime: sessionStart, endTime: sessionEnd, fundingType: 'paid' }])
  }

  function removeRow(i: number) {
    setRows(rs => rs.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    setSaving(true)
    await setSessionSegments(childSessionId, childId, rows)
    setSaving(false)
    onDone()
  }

  async function handleRemoveSplit() {
    setSaving(true)
    await setSessionSegments(childSessionId, childId, [])
    setSaving(false)
    onDone()
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-2">
      <p className="text-xs text-gray-500">Session runs {sessionStart}–{sessionEnd}. Split into time ranges with different funding.</p>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="time"
            value={row.startTime}
            onChange={e => updateRow(i, { startTime: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
          />
          <span className="text-gray-400 text-xs">–</span>
          <input
            type="time"
            value={row.endTime}
            onChange={e => updateRow(i, { endTime: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
          />
          <select
            value={row.fundingType}
            onChange={e => updateRow(i, { fundingType: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white flex-1"
          >
            {FUNDING_TYPES.map(ft => (
              <option key={ft} value={ft}>{FUNDING_LABELS[ft]}</option>
            ))}
          </select>
          {rows.length > 1 && (
            <button onClick={() => removeRow(i)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Remove</button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={addRow} className="text-xs text-blue-700 hover:underline">+ Add time range</button>
        <button onClick={handleSave} disabled={saving} className="text-xs bg-purple-700 text-white px-3 py-1 rounded-lg hover:bg-purple-800 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save split'}
        </button>
        {existing.length > 0 && (
          <button onClick={handleRemoveSplit} disabled={saving} className="text-xs text-gray-500 hover:text-gray-700">Remove split</button>
        )}
        <button onClick={onDone} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    </div>
  )
}
