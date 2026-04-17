'use client'

import { useState } from 'react'
import { addAccidentForm } from '../actions'

type Accident = {
  form: {
    id: string
    incidentDate: Date
    description: string
    injury: string
    actionTaken: string
    parentNotified: boolean
  }
  reporterName: string | null
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400'

export default function AccidentsSection({ childId, accidents, userId }: { childId: string; accidents: Accident[]; userId: string }) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    incidentDate: new Date().toISOString().slice(0, 16),
    description: '',
    injury: '',
    actionTaken: '',
    parentNotified: false,
  })

  async function handleAdd() {
    if (!form.description || !form.injury || !form.actionTaken) return
    setSaving(true)
    await addAccidentForm(childId, userId, form)
    setForm({ incidentDate: new Date().toISOString().slice(0, 16), description: '', injury: '', actionTaken: '', parentNotified: false })
    setSaving(false)
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Accident Forms</h2>
        <button onClick={() => setAdding(a => !a)} className="text-xs text-amber-600 hover:text-amber-700">
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {accidents.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No accident forms recorded.</p>
      )}

      <div className="space-y-3">
        {accidents.map(({ form: a, reporterName }) => (
          <div key={a.id} className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
            <div className="flex items-start justify-between">
              <div className="font-medium text-gray-900">
                {new Date(a.incidentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              {a.parentNotified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Parent notified</span>
              )}
            </div>
            <div className="mt-2 space-y-1 text-gray-700">
              <p><span className="font-medium">What happened:</span> {a.description}</p>
              <p><span className="font-medium">Injury:</span> {a.injury}</p>
              <p><span className="font-medium">Action taken:</span> {a.actionTaken}</p>
            </div>
            <div className="text-xs text-gray-400 mt-1">Reported by {reporterName ?? 'Unknown'}</div>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Date & time of incident</label>
            <input type="datetime-local" value={form.incidentDate} onChange={e => setForm(f => ({ ...f, incidentDate: e.target.value }))} className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">What happened *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Injury / nature of incident *</label>
            <input value={form.injury} onChange={e => setForm(f => ({ ...f, injury: e.target.value }))} className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Action taken *</label>
            <textarea value={form.actionTaken} onChange={e => setForm(f => ({ ...f, actionTaken: e.target.value }))} rows={2} className={input} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="parentNotified" checked={form.parentNotified} onChange={e => setForm(f => ({ ...f, parentNotified: e.target.checked }))} className="rounded" />
            <label htmlFor="parentNotified" className="text-sm text-gray-700">Parent / guardian notified</label>
          </div>
          <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg disabled:opacity-50">
            {saving ? 'Saving…' : 'Save accident form'}
          </button>
        </div>
      )}
    </div>
  )
}
