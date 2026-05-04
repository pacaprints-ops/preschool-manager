'use client'

import { useState } from 'react'
import { updateChild } from '../actions'

type Child = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  address: string | null
  keyWorkerId: string | null
  hasAllergies: boolean
  allergies: string | null
  medicalNotes: string | null
  collectionPassword: string | null
  photoConsent: boolean
  consumableConsent: boolean
  needs1to1: boolean
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function ChildInfoSection({
  child, staff, defaultEditing = false,
}: {
  child: Child
  staff: { id: string; name: string }[]
  defaultEditing?: boolean
}) {
  const [editing, setEditing] = useState(defaultEditing)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(child)

  async function handleSave() {
    setSaving(true)
    await updateChild(child.id, {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      address: data.address ?? '',
      keyWorkerId: data.keyWorkerId ?? '',
      hasAllergies: data.hasAllergies,
      allergies: data.allergies ?? '',
      medicalNotes: data.medicalNotes ?? '',
      collectionPassword: data.collectionPassword ?? '',
      photoConsent: data.photoConsent,
      consumableConsent: data.consumableConsent,
      needs1to1: data.needs1to1,
    })
    setSaving(false)
    setEditing(false)
  }

  const keyWorkerName = staff.find(s => s.id === data.keyWorkerId)?.name ?? '—'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Child Information</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-xs text-blue-800 hover:text-blue-900">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-900 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setData(child); setEditing(false) }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        )}
      </div>

      {!editing ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="text-gray-500">Full name</dt><dd className="font-medium text-gray-900">{data.firstName} {data.lastName}</dd></div>
          <div><dt className="text-gray-500">Date of birth</dt><dd className="text-gray-900">{new Date(data.dateOfBirth + 'T12:00:00').toLocaleDateString('en-GB')}</dd></div>
          <div><dt className="text-gray-500">Address</dt><dd className="text-gray-900">{data.address || '—'}</dd></div>
          <div><dt className="text-gray-500">Key worker</dt><dd className="text-gray-900">{keyWorkerName}</dd></div>
          <div>
            <dt className="text-gray-500">Collection password</dt>
            <dd className="text-gray-900 font-mono bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-sm inline-block mt-0.5">
              {data.collectionPassword || '—'}
            </dd>
          </div>
          <div><dt className="text-gray-500">Allergies</dt><dd className="text-gray-900">{data.hasAllergies ? (data.allergies || 'Yes (no detail)') : 'None'}</dd></div>
          <div><dt className="text-gray-500">Medical notes</dt><dd className="text-gray-900">{data.medicalNotes || '—'}</dd></div>
          <div><dt className="text-gray-500">Photo consent</dt><dd className="text-gray-900">{data.photoConsent ? 'Yes' : 'No'}</dd></div>
          <div>
            <dt className="text-gray-500">Consumable fee consent</dt>
            <dd>
              {data.consumableConsent
                ? <span className="text-green-700 font-medium">Agreed — £3.50/session</span>
                : <span className="text-gray-400">Not agreed</span>}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">1-2-1 keyworker</dt>
            <dd>
              {data.needs1to1
                ? <span className="bg-purple-100 text-purple-800 font-medium text-xs px-2 py-0.5 rounded-full">Required</span>
                : <span className="text-gray-400">Not required</span>}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">First name</label>
              <input value={data.firstName} onChange={e => setData(d => ({ ...d, firstName: e.target.value }))} className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Last name</label>
              <input value={data.lastName} onChange={e => setData(d => ({ ...d, lastName: e.target.value }))} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date of birth</label>
              <input type="date" value={data.dateOfBirth} onChange={e => setData(d => ({ ...d, dateOfBirth: e.target.value }))} className={input} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Key worker</label>
              <select value={data.keyWorkerId ?? ''} onChange={e => setData(d => ({ ...d, keyWorkerId: e.target.value }))} className={input}>
                <option value="">— Not assigned —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Address</label>
            <input value={data.address ?? ''} onChange={e => setData(d => ({ ...d, address: e.target.value }))} className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Collection password</label>
            <input value={data.collectionPassword ?? ''} onChange={e => setData(d => ({ ...d, collectionPassword: e.target.value }))} className={input} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="hasAllergies" checked={data.hasAllergies} onChange={e => setData(d => ({ ...d, hasAllergies: e.target.checked }))} className="rounded" />
            <label htmlFor="hasAllergies" className="text-sm text-gray-700">Has allergies</label>
          </div>
          {data.hasAllergies && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Allergy details</label>
              <textarea value={data.allergies ?? ''} onChange={e => setData(d => ({ ...d, allergies: e.target.value }))} rows={2} className={input} />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Medical notes</label>
            <textarea value={data.medicalNotes ?? ''} onChange={e => setData(d => ({ ...d, medicalNotes: e.target.value }))} rows={2} className={input} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="photoConsent" checked={data.photoConsent} onChange={e => setData(d => ({ ...d, photoConsent: e.target.checked }))} className="rounded" />
            <label htmlFor="photoConsent" className="text-sm text-gray-700">Photo / media consent given</label>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <input type="checkbox" id="consumableConsent" checked={data.consumableConsent} onChange={e => setData(d => ({ ...d, consumableConsent: e.target.checked }))} className="rounded mt-0.5" />
            <div>
              <label htmlFor="consumableConsent" className="text-sm font-medium text-gray-700">Voluntary consumable fee agreement</label>
              <p className="text-xs text-gray-500 mt-0.5">£3.50 per session charged on invoice if agreed</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <input type="checkbox" id="needs1to1" checked={data.needs1to1} onChange={e => setData(d => ({ ...d, needs1to1: e.target.checked }))} className="rounded mt-0.5" />
            <div>
              <label htmlFor="needs1to1" className="text-sm font-medium text-gray-700">Requires 1-2-1 keyworker</label>
              <p className="text-xs text-gray-500 mt-0.5">This child has a dedicated keyworker who cannot be counted in the general staff ratio</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
