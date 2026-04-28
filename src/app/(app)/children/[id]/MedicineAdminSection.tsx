'use client'

import { useState } from 'react'
import { addMedicineAdmin, deleteMedicineAdmin } from '../actions'

type Admin = {
  id: string
  medicationName: string
  dose: string
  givenAt: Date
  givenByName: string | null
  witnessedByName: string | null
  parentInformed: boolean
  notes: string | null
}

type StaffMember = { id: string; name: string }

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function MedicineAdminSection({
  childId,
  administrations,
  staff,
}: {
  childId: string
  administrations: Admin[]
  staff: StaffMember[]
}) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    medicationName: '',
    dose: '',
    givenAt: new Date().toISOString().slice(0, 16),
    givenById: '',
    witnessedById: '',
    parentInformed: false,
    notes: '',
  })

  const givenByName = staff.find(s => s.id === form.givenById)?.name ?? ''
  const witnessedByName = staff.find(s => s.id === form.witnessedById)?.name ?? ''

  async function handleAdd() {
    if (!form.medicationName || !form.dose || !form.givenAt || !form.givenById || !form.witnessedById) return
    setSaving(true)
    await addMedicineAdmin(childId, {
      ...form,
      givenByName,
      witnessedByName,
    })
    setForm({
      medicationName: '',
      dose: '',
      givenAt: new Date().toISOString().slice(0, 16),
      givenById: '',
      witnessedById: '',
      parentInformed: false,
      notes: '',
    })
    setSaving(false)
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Medicine Administration Log</h2>
          <p className="text-xs text-gray-400 mt-0.5">Record every time medicine is given — required by Ofsted</p>
        </div>
        <button onClick={() => setAdding(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">
          {adding ? 'Cancel' : '+ Log administration'}
        </button>
      </div>

      {administrations.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No medicine administrations recorded.</p>
      )}

      <div className="space-y-3">
        {administrations.map(a => (
          <div key={a.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {a.medicationName} — {a.dose}
                </div>
                <div className="text-gray-500 mt-0.5">
                  {new Date(a.givenAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.parentInformed && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Parent informed</span>
                )}
                <button onClick={() => deleteMedicineAdmin(a.id, childId)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
            </div>
            <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
              <div>Given by: <span className="text-gray-700 font-medium">{a.givenByName ?? '—'}</span></div>
              <div>Witnessed by: <span className="text-gray-700 font-medium">{a.witnessedByName ?? '—'}</span></div>
              {a.notes && <div className="text-gray-400 italic">{a.notes}</div>}
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Medication name *</label>
              <input value={form.medicationName} onChange={e => setForm(f => ({ ...f, medicationName: e.target.value }))} placeholder="e.g. Calpol" className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dose given *</label>
              <input value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} placeholder="e.g. 5ml" className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Date & time given *</label>
            <input type="datetime-local" value={form.givenAt} onChange={e => setForm(f => ({ ...f, givenAt: e.target.value }))} className={inp} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Given by *</label>
              <select value={form.givenById} onChange={e => setForm(f => ({ ...f, givenById: e.target.value }))} className={inp}>
                <option value="">— Select staff member —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Witnessed by *</label>
              <select value={form.witnessedById} onChange={e => setForm(f => ({ ...f, witnessedById: e.target.value }))} className={inp}>
                <option value="">— Select staff member —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes" className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="parentInformed" checked={form.parentInformed} onChange={e => setForm(f => ({ ...f, parentInformed: e.target.checked }))} className="rounded" />
            <label htmlFor="parentInformed" className="text-sm text-gray-700">Parent / guardian informed</label>
          </div>
          <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">
            {saving ? 'Saving…' : 'Save record'}
          </button>
        </div>
      )}
    </div>
  )
}
