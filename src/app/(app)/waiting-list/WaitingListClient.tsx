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
  waiting: 'bg-gray-100 text-gray-700',
  offered: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

type FormState = {
  childFirstName: string
  childLastName: string
  dateOfBirth: string
  parentName: string
  parentPhone: string
  parentEmail: string
  daysNeeded: string[]
  sessionsNeeded: string
  notes: string
}

const EMPTY_FORM: FormState = {
  childFirstName: '', childLastName: '', dateOfBirth: '',
  parentName: '', parentPhone: '', parentEmail: '',
  daysNeeded: [], sessionsNeeded: '', notes: '',
}

export default function WaitingListClient({ entries }: { entries: Entry[] }) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promoting, setPromoting] = useState<string | null>(null)
  const [filterDay, setFilterDay] = useState<string>('')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      daysNeeded: f.daysNeeded.includes(day)
        ? f.daysNeeded.filter(d => d !== day)
        : [...f.daysNeeded, day],
    }))
  }

  async function handleAdd() {
    if (!form.childFirstName || !form.childLastName || !form.parentName || !form.parentPhone) return
    setSaving(true)
    await addToWaitingList({
      childFirstName: form.childFirstName,
      childLastName: form.childLastName,
      dateOfBirth: form.dateOfBirth,
      parentName: form.parentName,
      parentPhone: form.parentPhone,
      parentEmail: form.parentEmail,
      daysNeeded: form.daysNeeded.join(',') || '',
      sessionsNeeded: form.sessionsNeeded,
      notes: form.notes,
    })
    setForm(EMPTY_FORM)
    setSaving(false)
    setAdding(false)
  }

  async function handlePromote(entry: Entry) {
    const ok = confirm(`Move ${entry.childFirstName} ${entry.childLastName} to active children? You will be taken to their profile to complete their details.`)
    if (!ok) return
    setPromoting(entry.id)
    await promoteFromWaitingList(entry.id, {
      firstName: entry.childFirstName,
      lastName: entry.childLastName,
      dateOfBirth: entry.dateOfBirth ?? undefined,
    })
  }

  const filtered = filterDay
    ? entries.filter(e => e.daysNeeded?.toLowerCase().includes(filterDay))
    : entries

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setAdding(a => !a)}
          className="px-4 py-2 text-sm bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition-colors"
        >
          {adding ? 'Cancel' : '+ Add to waiting list'}
        </button>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-gray-500 mr-1">Filter:</span>
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setFilterDay(f => f === day ? '' : day)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                filterDay === day
                  ? 'bg-blue-800 text-white border-blue-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600'
              }`}
            >
              {DAY_SHORT[day]}
            </button>
          ))}
          {filterDay && (
            <button onClick={() => setFilterDay('')} className="text-xs text-gray-400 hover:text-gray-600 ml-1">clear</button>
          )}
        </div>
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Add child to waiting list</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Child first name *</label>
              <input value={form.childFirstName} onChange={e => setForm(f => ({ ...f, childFirstName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Child last name *</label>
              <input value={form.childLastName} onChange={e => setForm(f => ({ ...f, childLastName: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date of birth</label>
              <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Parent / guardian name *</label>
              <input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone *</label>
              <input value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-2">Days needed</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.daysNeeded.includes(day) ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {DAY_SHORT[day]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sessions needed</label>
            <input value={form.sessionsNeeded} onChange={e => setForm(f => ({ ...f, sessionsNeeded: e.target.value }))} placeholder="e.g. Morning only, Full day" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls} />
          </div>
          <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Add to list'}
          </button>
        </div>
      )}

      {filtered.length === 0 && !adding && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          {filterDay ? `No children needing ${DAY_SHORT[filterDay]} on the waiting list.` : 'No children on the waiting list.'}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((entry, i) => {
          const entryDays = entry.daysNeeded?.split(',').map(d => d.trim().toLowerCase()).filter(Boolean) ?? []
          return (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-400 font-mono pt-0.5 w-5">#{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{entry.childFirstName} {entry.childLastName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOURS[entry.status]}`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </div>
                    {entry.dateOfBirth && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        DOB: {new Date(entry.dateOfBirth + 'T12:00:00').toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">Added {new Date(entry.addedAt).toLocaleDateString('en-GB')}</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm pl-7">
                <div><span className="text-gray-500">Parent: </span><span className="text-gray-900 font-medium">{entry.parentName}</span></div>
                <div><span className="text-gray-500">Phone: </span><span className="text-gray-900">{entry.parentPhone}</span></div>
                {entry.parentEmail && <div><span className="text-gray-500">Email: </span><span className="text-gray-900">{entry.parentEmail}</span></div>}
                {entry.sessionsNeeded && <div><span className="text-gray-500">Sessions: </span><span className="text-gray-900">{entry.sessionsNeeded}</span></div>}
                {entry.notes && <div className="col-span-2"><span className="text-gray-500">Notes: </span><span className="text-gray-900">{entry.notes}</span></div>}
              </div>

              {entryDays.length > 0 && (
                <div className="mt-2 pl-7 flex items-center gap-1">
                  <span className="text-xs text-gray-500 mr-1">Days:</span>
                  {DAYS.filter(d => entryDays.includes(d)).map(d => (
                    <span key={d} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{DAY_SHORT[d]}</span>
                  ))}
                </div>
              )}

              <div className="mt-3 pl-7 flex items-center gap-2">
                <select
                  value={entry.status}
                  onChange={async e => { await updateWaitlistStatus(entry.id, e.target.value as 'waiting' | 'offered') }}
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
                  {promoting === entry.id ? 'Moving...' : 'Enrol'}
                </button>
                <button onClick={() => removeFromWaitingList(entry.id)} className="px-3 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                  Remove
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
