'use client'

import { useState } from 'react'
import { addChildHoliday, deleteChildHoliday } from '../actions'

type Holiday = {
  id: string
  childId: string
  startDate: string
  endDate: string
  notes: string | null
  daysUsed: number
  createdAt: Date
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HolidaySection({
  childId,
  holidays,
}: {
  childId: string
  childName: string
  holidays: Holiday[]
  enrolledDays: string[]
}) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!startDate || !endDate) { setError('Please set both a start and end date.'); return }
    if (endDate < startDate) { setError('End date must be on or after start date.'); return }
    setError('')
    setSaving(true)
    await addChildHoliday(childId, startDate, endDate, notes.trim())
    setStartDate('')
    setEndDate('')
    setNotes('')
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Holidays</h2>

      <div className="space-y-2 mb-4">
        {holidays.length === 0 && <p className="text-sm text-gray-400">No holidays logged yet.</p>}
        {holidays.map(h => (
          <div key={h.id} className="flex items-start justify-between gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {fmtDate(h.startDate)} – {fmtDate(h.endDate)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {h.daysUsed} enrolled {h.daysUsed === 1 ? 'day' : 'days'} absent
                {h.notes ? ` · ${h.notes}` : ''}
              </p>
            </div>
            <button
              onClick={() => deleteChildHoliday(h.id, childId)}
              className="text-xs text-red-400 hover:text-red-600 shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Add holiday form */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !startDate || !endDate}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}
