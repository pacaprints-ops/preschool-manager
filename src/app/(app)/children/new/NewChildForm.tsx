'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChild, updateChildSessions } from '../actions'
import Link from 'next/link'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const SESSIONS = ['morning', 'afternoon', 'full_day'] as const
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SESSION_LABELS: Record<string, string> = { morning: 'AM', afternoon: 'PM', full_day: 'All Day' }

export default function NewChildForm({ staff }: { staff: { id: string; name: string }[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasAllergies, setHasAllergies] = useState(false)
  const [isFunded, setIsFunded] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())

  function toggleSession(day: string, session: string) {
    const key = `${day}-${session}`
    setSelectedSessions(s => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const result = await createChild({
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

    if (selectedSessions.size > 0) {
      const sessions = Array.from(selectedSessions).map(key => {
        const [day, ...rest] = key.split('-')
        return { day, sessionType: rest.join('-') }
      })
      await updateChildSessions(result.id, sessions)
    }

    router.push(`/children/${result.id}`)
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

      {/* Sessions */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">Sessions attending</label>
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-16"></th>
              {SESSIONS.map(s => (
                <th key={s} className="px-4 py-1 text-gray-600 font-medium text-center">{SESSION_LABELS[s]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="py-1.5 pr-3 text-gray-700 font-medium">{DAY_LABELS[day]}</td>
                {SESSIONS.map(session => {
                  const key = `${day}-${session}`
                  return (
                    <td key={session} className="px-4 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(key)}
                        onChange={() => toggleSession(day, session)}
                        className="rounded w-4 h-4 accent-amber-500"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Funded hours */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isFunded" checked={isFunded} onChange={e => setIsFunded(e.target.checked)} className="rounded" />
          <label htmlFor="isFunded" className="text-sm font-medium text-gray-700">Receiving funded hours</label>
        </div>
        {isFunded && (
          <div className="ml-6">
            <label className="block text-sm text-gray-600 mb-1">Hours per week</label>
            <input type="number" name="fundedHours" min="1" max="30" step="0.5" placeholder="e.g. 15" className={`${input} w-40`} />
          </div>
        )}
      </div>

      {/* Allergies */}
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
