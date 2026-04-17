'use client'

import { useState } from 'react'
import { updateChildSessions } from '../actions'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const SESSIONS = ['morning', 'afternoon', 'full_day'] as const
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SESSION_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', full_day: 'Full Day' }

type SessionStatus = 'paid' | 'funded'
type Session = { id: string; day: typeof DAYS[number]; sessionType: typeof SESSIONS[number]; isFunded: boolean }

function initState(sessions: Session[]): Record<string, SessionStatus> {
  return Object.fromEntries(
    sessions.map(s => [`${s.day}-${s.sessionType}`, s.isFunded ? 'funded' : 'paid'])
  )
}

export default function SessionsSection({ childId, sessions }: { childId: string; sessions: Session[] }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Record<string, SessionStatus>>(() => initState(sessions))

  function toggle(day: string, session: string) {
    const key = `${day}-${session}`
    setSelected(s => {
      const next = { ...s }
      if (key in next) {
        delete next[key]
      } else {
        next[key] = 'paid'
      }
      return next
    })
  }

  function toggleFunded(key: string) {
    setSelected(s => ({ ...s, [key]: s[key] === 'funded' ? 'paid' : 'funded' }))
  }

  async function handleSave() {
    setSaving(true)
    const parsed = Object.entries(selected).map(([key, status]) => {
      const [day, ...rest] = key.split('-')
      return { day, sessionType: rest.join('-'), isFunded: status === 'funded' }
    })
    await updateChildSessions(childId, parsed)
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setSelected(initState(sessions))
    setEditing(false)
  }

  // Summary counts
  const fundedCount = sessions.filter(s => s.isFunded).length
  const paidCount = sessions.filter(s => !s.isFunded).length

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
          <div className="flex flex-wrap gap-2">
            {sessions.map(s => (
              <span
                key={s.id}
                className={`text-sm px-3 py-1 rounded-full ${s.isFunded ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-950'}`}
              >
                {DAY_LABELS[s.day]} {SESSION_LABELS[s.sessionType]}
                <span className={`ml-1.5 text-xs font-medium ${s.isFunded ? 'text-green-600' : 'text-blue-800'}`}>
                  {s.isFunded ? 'Funded' : 'Paid'}
                </span>
              </span>
            ))}
          </div>
        )
      ) : (
        <div>
          <p className="text-xs text-gray-500 mb-3">Tick to add a session, then click the badge to toggle Funded / Paid.</p>
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
                            <button
                              type="button"
                              onClick={() => toggleFunded(key)}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                                status === 'funded'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                              }`}
                            >
                              {status === 'funded' ? 'Funded' : 'Paid'}
                            </button>
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
