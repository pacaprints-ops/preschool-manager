'use client'

import { useState } from 'react'
import { updateChildSessions } from '../actions'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const SESSIONS = ['morning', 'afternoon', 'full_day'] as const
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SESSION_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', full_day: 'Full Day' }

type Session = { id: string; day: typeof DAYS[number]; sessionType: typeof SESSIONS[number] }

export default function SessionsSection({ childId, sessions }: { childId: string; sessions: Session[] }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(
    new Set(sessions.map(s => `${s.day}-${s.sessionType}`))
  )

  function toggle(day: string, session: string) {
    const key = `${day}-${session}`
    setSelected(s => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    const parsed = Array.from(selected).map(key => {
      const [day, ...rest] = key.split('-')
      return { day, sessionType: rest.join('-') }
    })
    await updateChildSessions(childId, parsed)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Sessions</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-xs text-amber-600 hover:text-amber-700">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setSelected(new Set(sessions.map(s => `${s.day}-${s.sessionType}`))); setEditing(false) }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        )}
      </div>

      {!editing ? (
        sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No sessions set.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sessions.map(s => (
              <span key={s.id} className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full">
                {DAY_LABELS[s.day]} — {SESSION_LABELS[s.sessionType]}
              </span>
            ))}
          </div>
        )
      ) : (
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-24"></th>
              {SESSIONS.map(s => <th key={s} className="px-3 py-1 text-gray-600 font-medium">{SESSION_LABELS[s]}</th>)}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="py-1 pr-3 text-gray-700 font-medium">{DAY_LABELS[day]}</td>
                {SESSIONS.map(session => {
                  const key = `${day}-${session}`
                  return (
                    <td key={session} className="px-3 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggle(day, session)}
                        className="rounded w-4 h-4 accent-amber-500"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
