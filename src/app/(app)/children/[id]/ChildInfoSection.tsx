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
  isFunded: boolean
  fundedHours: string | null
  hasAllergies: boolean
  allergies: string | null
  medicalNotes: string | null
  collectionPassword: string | null
  photoConsent: boolean
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400'

export default function ChildInfoSection({
  child, staff,
}: {
  child: Child
  staff: { id: string; name: string }[]
}) {
  const [editing, setEditing] = useState(false)
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
      isFunded: data.isFunded,
      fundedHours: data.fundedHours ?? '',
      hasAllergies: data.hasAllergies,
      allergies: data.allergies ?? '',
      medicalNotes: data.medicalNotes ?? '',
      collectionPassword: data.collectionPassword ?? '',
      photoConsent: data.photoConsent,
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
          <button onClick={() => setEditing(true)} className="text-xs text-amber-600 hover:text-amber-700">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600 disabled:opacity-50">
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
            <dd className="text-gray-900 font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-sm inline-block mt-0.5">
              {data.collectionPassword || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Funded hours</dt>
            <dd className="text-gray-900">{data.isFunded ? `${data.fundedHours ?? '?'}h/week` : 'Not funded'}</dd>
          </div>
          <div><dt className="text-gray-500">Allergies</dt><dd className="text-gray-900">{data.hasAllergies ? (data.allergies || 'Yes (no detail)') : 'None'}</dd></div>
          <div><dt className="text-gray-500">Medical notes</dt><dd className="text-gray-900">{data.medicalNotes || '—'}</dd></div>
          <div><dt className="text-gray-500">Photo consent</dt><dd className="text-gray-900">{data.photoConsent ? 'Yes' : 'No'}</dd></div>
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
            <input type="checkbox" id="isFunded" checked={data.isFunded} onChange={e => setData(d => ({ ...d, isFunded: e.target.checked }))} className="rounded" />
            <label htmlFor="isFunded" className="text-sm text-gray-700">Receiving funded hours</label>
            {data.isFunded && (
              <select value={data.fundedHours ?? '15'} onChange={e => setData(d => ({ ...d, fundedHours: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white ml-2">
                <option value="15">15 hours</option>
                <option value="30">30 hours</option>
              </select>
            )}
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
        </div>
      )}
    </div>
  )
}
