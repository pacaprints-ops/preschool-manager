'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { promoteEnrolmentToChild } from '../../actions'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const SESSIONS = ['morning', 'afternoon', 'full_day'] as const
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SESSION_LABELS: Record<string, string> = { morning: 'AM', afternoon: 'PM', full_day: 'All Day' }
const FUNDING_TYPES = ['paid', 'universal15', 'extended30', 'two_year', 'senif'] as const
const FUNDING_LABELS: Record<string, string> = {
  paid: 'Paid', universal15: 'Universal 15h', extended30: 'Extended 30h', two_year: '2-Year', senif: 'SENIF',
}

type DefaultValues = {
  firstName: string
  lastName: string
  dateOfBirth: string
  keyWorkerId: string
  address: string
  collectionPassword: string
  hasMedicalConditions: boolean
  medicalConditionsDetails: string
  contactName: string
  contactRelationship: string
  contactPhone: string
  contactEmail: string
  daysSessions: Record<string, string>
  depositPaid: boolean
  additionalContacts: { name: string; relationship: string; phone: string; email: string; isAuthorisedCollector: boolean }[]
  medicationFormData: string
}

function buildInitialSessions(daysSessions: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [day, sessionType] of Object.entries(daysSessions)) {
    result[`${day}-${sessionType}`] = 'paid'
  }
  return result
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'
const inpFilled = 'w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function PromoteForm({
  enrolmentId,
  defaultValues,
  allStaff,
}: {
  enrolmentId: string
  defaultValues: DefaultValues
  allStaff: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [firstName, setFirstName] = useState(defaultValues.firstName)
  const [lastName, setLastName] = useState(defaultValues.lastName)
  const [dateOfBirth, setDateOfBirth] = useState(defaultValues.dateOfBirth)
  const [keyWorkerId, setKeyWorkerId] = useState(defaultValues.keyWorkerId)
  const [address, setAddress] = useState(defaultValues.address)
  const [collectionPassword, setCollectionPassword] = useState(defaultValues.collectionPassword)
  const [hasAllergies, setHasAllergies] = useState(defaultValues.hasMedicalConditions)
  const [allergies, setAllergies] = useState(defaultValues.medicalConditionsDetails)
  const [medicalNotes, setMedicalNotes] = useState(defaultValues.medicalConditionsDetails)
  const [photoConsent, setPhotoConsent] = useState(false)
  const [consumableConsent, setConsumableConsent] = useState(false)
  const [needs1to1, setNeeds1to1] = useState(false)
  const [contactName, setContactName] = useState(defaultValues.contactName)
  const [contactRelationship, setContactRelationship] = useState(defaultValues.contactRelationship || 'Parent/Carer')
  const [contactPhone, setContactPhone] = useState(defaultValues.contactPhone)
  const [contactEmail, setContactEmail] = useState(defaultValues.contactEmail)
  const [sessions, setSessions] = useState<Record<string, string>>(
    buildInitialSessions(defaultValues.daysSessions)
  )

  function toggle(day: string, session: string) {
    const key = `${day}-${session}`
    setSessions(s => {
      const next = { ...s }
      if (key in next) delete next[key]
      else next[key] = 'paid'
      return next
    })
  }

  function setFundingType(key: string, fundingType: string) {
    setSessions(s => ({ ...s, [key]: fundingType }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName || !lastName || !dateOfBirth) return
    setLoading(true)

    const parsedSessions = Object.entries(sessions).map(([key, fundingType]) => {
      const [day, ...rest] = key.split('-')
      return { day, sessionType: rest.join('-'), fundingType }
    })

    const childId = await promoteEnrolmentToChild(enrolmentId, defaultValues.depositPaid, {
      firstName,
      lastName,
      dateOfBirth,
      address: address || undefined,
      keyWorkerId: keyWorkerId || undefined,
      hasAllergies,
      allergies: hasAllergies ? allergies : undefined,
      medicalNotes: medicalNotes || undefined,
      collectionPassword: collectionPassword || undefined,
      photoConsent,
      consumableConsent,
      needs1to1,
      sessions: parsedSessions,
      contactName,
      contactRelationship,
      contactPhone,
      contactEmail: contactEmail || undefined,
      additionalContacts: defaultValues.additionalContacts,
      medicationFormData: defaultValues.medicationFormData || undefined,
    })

    router.push(`/children/${childId}`)
  }

  const fromEnrolment = <span className="ml-1.5 text-[9px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wide">From enrolment</span>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Name & DOB */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-gray-700">Child details</h2>
          {fromEnrolment}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">First name *</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} required className={inpFilled} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last name *</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} required className={inpFilled} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date of birth *</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required className={dateOfBirth ? inpFilled : inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Key worker
              {defaultValues.keyWorkerId && fromEnrolment}
            </label>
            <select value={keyWorkerId} onChange={e => setKeyWorkerId(e.target.value)} className={keyWorkerId ? inpFilled : inp}>
              <option value="">— Not assigned —</option>
              {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)} className={inp} placeholder="Home address" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Collection password</label>
          <input value={collectionPassword} onChange={e => setCollectionPassword(e.target.value)} className={inp} placeholder="Word set by parent for collection verification" />
        </div>
        {defaultValues.depositPaid && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
            <span>✓</span>
            <span>Deposit £50 paid — will be credited on first invoice</span>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Sessions attending</h2>
          {Object.keys(defaultValues.daysSessions).length > 0 && fromEnrolment}
        </div>
        <p className="text-xs text-gray-500 mb-3">Pre-filled from enrolment. Toggle a session to change it, choose how each is funded from the dropdown.</p>
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-16"></th>
              {SESSIONS.map(s => (
                <th key={s} className="px-4 py-1 text-gray-600 font-medium text-center text-xs">{SESSION_LABELS[s]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="py-2 pr-3 text-gray-700 font-medium text-sm">{DAY_LABELS[day]}</td>
                {SESSIONS.map(session => {
                  const key = `${day}-${session}`
                  const status = sessions[key]
                  return (
                    <td key={session} className="px-4 py-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          checked={key in sessions}
                          onChange={() => toggle(day, session)}
                          className="rounded w-4 h-4 accent-blue-800"
                        />
                        {status && (
                          <select
                            value={status}
                            onChange={e => setFundingType(key, e.target.value)}
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium border-0 ${
                              status === 'paid'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {FUNDING_TYPES.map(ft => (
                              <option key={ft} value={ft}>{FUNDING_LABELS[ft]}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Emergency contact */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-gray-700">Primary emergency contact</h2>
          {fromEnrolment}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} className={contactName ? inpFilled : inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Relationship</label>
            <input value={contactRelationship} onChange={e => setContactRelationship(e.target.value)} className={inp} placeholder="e.g. Mother, Father" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={contactPhone ? inpFilled : inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={contactEmail ? inpFilled : inp} />
          </div>
        </div>
        <p className="text-xs text-gray-400">Marked as authorised collector by default. You can add more contacts from the child profile after saving.</p>
        {defaultValues.additionalContacts.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-1.5">Also added from the enrolment, on saving:</p>
            <div className="flex flex-wrap gap-1.5">
              {defaultValues.additionalContacts.map((c, i) => (
                <span key={i} className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2.5 py-1">
                  {c.name} ({c.relationship})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Medical */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Medical &amp; additional needs</h2>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="hasAllergies" checked={hasAllergies} onChange={e => setHasAllergies(e.target.checked)} className="rounded" />
          <label htmlFor="hasAllergies" className="text-sm font-medium text-gray-700">Has allergies</label>
        </div>
        {hasAllergies && (
          <div className="ml-6">
            <label className="block text-xs text-gray-600 mb-1">Allergy details</label>
            <textarea value={allergies} onChange={e => setAllergies(e.target.value)} rows={2} className={inp} />
          </div>
        )}
        {defaultValues.medicationFormData && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <span>✓</span>
            <span>A Prescribed Medicine form was completed at enrolment — will be added to Medications on saving.</span>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Medical notes</label>
          <textarea value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} rows={2} className={inp} placeholder="Any conditions, additional medical information..." />
        </div>
      </div>

      {/* Consents */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Consents</h2>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="photoConsent" checked={photoConsent} onChange={e => setPhotoConsent(e.target.checked)} className="rounded" />
          <label htmlFor="photoConsent" className="text-sm font-medium text-gray-700">Photo / media consent given</label>
        </div>
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            id="consumableConsent"
            checked={consumableConsent}
            onChange={e => setConsumableConsent(e.target.checked)}
            className="rounded mt-0.5"
          />
          <div>
            <label htmlFor="consumableConsent" className="text-sm font-medium text-gray-700">Voluntary consumable fee agreement</label>
            <p className="text-xs text-gray-500 mt-0.5">Parent/guardian agrees to the £3.50 per session consumable charge.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <input
            type="checkbox"
            id="needs1to1"
            checked={needs1to1}
            onChange={e => setNeeds1to1(e.target.checked)}
            className="rounded mt-0.5"
          />
          <div>
            <label htmlFor="needs1to1" className="text-sm font-medium text-gray-700">Requires 1-2-1 keyworker</label>
            <p className="text-xs text-gray-500 mt-0.5">Dedicated keyworker, not counted in general ratio.</p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !firstName || !lastName || !dateOfBirth}
          className="px-6 py-2.5 bg-[#020e2f] hover:bg-[#010922] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating profile…' : 'Create child profile'}
        </button>
        <a href="/enrolments" className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  )
}
