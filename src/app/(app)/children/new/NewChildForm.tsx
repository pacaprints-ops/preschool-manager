'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChild } from '../actions'
import Link from 'next/link'

export default function NewChildForm({ staff }: { staff: { id: string; name: string }[] }) {
  const [loading, setLoading] = useState(false)
  const [hasAllergies, setHasAllergies] = useState(false)
  const [isFunded, setIsFunded] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    await createChild({
      firstName: form.get('firstName') as string,
      lastName: form.get('lastName') as string,
      dateOfBirth: form.get('dateOfBirth') as string,
      address: form.get('address') as string,
      keyWorkerId: form.get('keyWorkerId') as string,
      isFunded,
      fundedHours: isFunded ? form.get('fundedHours') as string : undefined,
      hasAllergies,
      allergies: hasAllergies ? form.get('allergies') as string : undefined,
      medicalNotes: form.get('medicalNotes') as string,
      collectionPassword: form.get('collectionPassword') as string,
      photoConsent: form.get('photoConsent') === 'on',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
          <input name="firstName" required className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
          <input name="lastName" required className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth *</label>
          <input name="dateOfBirth" type="date" required className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Key worker</label>
          <select name="keyWorkerId" className={input}>
            <option value="">— Not assigned —</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input name="address" className={input} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Collection password</label>
        <input name="collectionPassword" className={input} placeholder="Word set by parent for collection verification" />
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isFunded" checked={isFunded} onChange={e => setIsFunded(e.target.checked)} className="rounded" />
          <label htmlFor="isFunded" className="text-sm font-medium text-gray-700">Receiving funded hours</label>
        </div>
        {isFunded && (
          <div className="ml-6">
            <label className="block text-sm text-gray-600 mb-1">Hours per week</label>
            <select name="fundedHours" className={`${input} w-40`}>
              <option value="15">15 hours</option>
              <option value="30">30 hours</option>
            </select>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="hasAllergies" checked={hasAllergies} onChange={e => setHasAllergies(e.target.checked)} className="rounded" />
          <label htmlFor="hasAllergies" className="text-sm font-medium text-gray-700">Has allergies</label>
        </div>
        {hasAllergies && (
          <div className="ml-6">
            <label className="block text-sm text-gray-600 mb-1">Allergy details</label>
            <textarea name="allergies" rows={2} className={input} />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Medical notes</label>
        <textarea name="medicalNotes" rows={2} className={input} placeholder="Any conditions, additional medical information..." />
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="photoConsent" name="photoConsent" className="rounded" />
        <label htmlFor="photoConsent" className="text-sm font-medium text-gray-700">Photo / media consent given</label>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save child'}
        </button>
        <Link href="/children" className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  )
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400'
