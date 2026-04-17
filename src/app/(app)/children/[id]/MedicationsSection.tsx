'use client'

import { useState } from 'react'
import { addMedication, deleteMedication } from '../actions'

type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  adminConsent: boolean
  notes: string | null
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function MedicationsSection({ childId, medications }: { childId: string; medications: Medication[] }) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '', adminConsent: false, notes: '' })

  async function handleAdd() {
    if (!form.name || !form.dosage || !form.frequency) return
    setSaving(true)
    await addMedication(childId, form)
    setForm({ name: '', dosage: '', frequency: '', adminConsent: false, notes: '' })
    setSaving(false)
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Medications</h2>
        <button onClick={() => setAdding(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {medications.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No medications recorded.</p>
      )}

      <div className="space-y-3">
        {medications.map(m => (
          <div key={m.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{m.name}
                {m.adminConsent && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Staff may administer</span>
                )}
              </div>
              <div className="text-gray-500">{m.dosage} · {m.frequency}</div>
              {m.notes && <div className="text-gray-400 text-xs mt-0.5">{m.notes}</div>}
            </div>
            <button onClick={() => deleteMedication(m.id, childId)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Medication name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dosage *</label>
              <input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 5ml" className={input} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Frequency *</label>
            <input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} placeholder="e.g. Once daily, as needed" className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={input} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="adminConsent" checked={form.adminConsent} onChange={e => setForm(f => ({ ...f, adminConsent: e.target.checked }))} className="rounded" />
            <label htmlFor="adminConsent" className="text-sm text-gray-700">Parent consent for staff to administer</label>
          </div>
          <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">
            {saving ? 'Saving…' : 'Add medication'}
          </button>
        </div>
      )}
    </div>
  )
}
