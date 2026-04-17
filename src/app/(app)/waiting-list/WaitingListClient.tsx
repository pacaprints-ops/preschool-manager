'use client'

import { useState } from 'react'
import { addToWaitingList, updateWaitlistStatus, removeFromWaitingList, promoteFromWaitingList } from './actions'

type Entry = {
  id: string
  childFirstName: string
  childLastName: string
  dateOfBirth: string | null
  parentName: string
  parentPhone: string
  parentEmail: string | null
  daysNeeded: string | null
  sessionsNeeded: string | null
  notes: string | null
  status: 'waiting' | 'offered' | 'accepted'
  addedAt: Date
}

const STATUS_COLOURS: Record<string, string> = {
  waiting: 'bg-gray-100 text-gray-600',
  offered: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function WaitingListClient({ entries }: { entries: Entry[] }) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promoting, setPromoting] = useState<string | null>(null)
  const [form, setForm] = useState({
    childFirstName: '', childLastName: '', dateOfBirth: '',
    parentName: '', parentPhone: '', parentEmail: '',
    daysNeeded: '', sessionsNeeded: '', notes: '',
  })

  async function handleAdd() {
    if (!form.childFirstName || !form.childLastName || !form.parentName || !form.parentPhone) return
    setSaving(true)
    await addToWaitingList(form)
    setForm({ childFirstName: '', childLastName: '', dateOfBirth: '', parentName: '', parentPhone: '', parentEmail: '', daysNeeded: '', sessionsNeeded: '', notes: '' })
    setSaving(false)
    setAdding(false)
  }

  async function handlePromote(entry: Entry) {
    if (!confirm(`Move ${entry.childFirstName} ${entry.childLastName} to active children? You'll be taken to their profile to complete their details.`)) return
    setPromoting(entry.id)
    await promoteFromWaitingList(entry.id, {
      firstName: entry.childFirstName,
      lastName: entry.childLastName,
      dateOfBirth: entry.dateOfBirth ?? undefined,
    })
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setAdding(a => !a)}
        className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-900 text-white rounded-lg transition-colors"
      >
        {adding ? 'Cancel' : '+ Add to waiting list'}
      </button>

      {adding && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Add child to waiting list</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Child first name *</label>
              <input value={form.childFirstName} onChange={e => setForm(f => ({ ...f, childFirstName: e.target.value }))} className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Child last name *</label>
              <input value={form.childLastName} onChange={e => setForm(f => ({ ...f, childLastName: e.target.value }))} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date of birth</label>
              <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Parent / guardian name *</label>
              <input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone *</label>
              <input value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Days needed</label>
              <input value={form.daysNeeded} onChange={e => setForm(f => ({ ...f, daysNeeded: e.target.value }))} placeholder="e.g. Mon, Tue, Wed" className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Sessions needed</label>
              <input value={form.sessionsNeeded} onChange={e => setForm(f => ({ ...f, sessionsNeeded: e.target.value }))} placeholder="e.g. Morning only" className={input} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={input} />
          </div>
          <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">
            {saving ? 'Saving…' : 'Add to list'}
          </button>
        </div>
      )}

      {entries.length === 0 && !adding && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          No children on the waiting list.
        </div>
      )}

      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{entry.childFirstName} {entry.childLastName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOURS[entry.status]}`}>
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </span>
                </div>
                {entry.dateOfBirth && (
                  <div className="text-xs text-gray-500 mt-0.5">DOB: {new Date(entry.dateOfBirth + 'T12:00:00').toLocaleDateString('en-GB')}</div>
                )}
              </div>
              <div className="text-xs text-gray-400">Added {new Date(entry.addedAt).toLocaleDateString('en-GB')}</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div><span className="text-gray-500">Parent:</span> {entry.parentName}</div>
              <div><span className="text-gray-500">Phone:</span> {entry.parentPhone}</div>
              {entry.parentEmail && <div><span className="text-gray-500">Email:</span> {entry.parentEmail}</div>}
              {entry.daysNeeded && <div><span className="text-gray-500">Days:</span> {entry.daysNeeded}</div>}
              {entry.sessionsNeeded && <div><span className="text-gray-500">Sessions:</span> {entry.sessionsNeeded}</div>}
              {entry.notes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> {entry.notes}</div>}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <select
                value={entry.status}
                onChange={async e => {
                  await updateWaitlistStatus(entry.id, e.target.value as 'waiting' | 'offered' | 'accepted')
                }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white"
              >
                <option value="waiting">Waiting</option>
                <option value="offered">Offered place</option>
              </select>
              <button
                onClick={() => handlePromote(entry)}
                disabled={promoting === entry.id}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {promoting === entry.id ? 'Moving…' : 'Enrol →'}
              </button>
              <button onClick={() => removeFromWaitingList(entry.id)} className="px-3 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
