'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChild, updateChildSessions, addEmergencyContact } from '../actions'
import Link from 'next/link'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const SESSIONS = ['morning', 'afternoon', 'full_day'] as const
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SESSION_LABELS: Record<string, string> = { morning: 'AM', afternoon: 'PM', full_day: 'All Day' }
const FUNDING_TYPES = ['paid', 'universal15', 'extended30', 'two_year', 'senif'] as const
const FUNDING_LABELS: Record<string, string> = {
  paid: 'Paid', universal15: 'Universal 15h', extended30: 'Extended 30h', two_year: '2-Year', senif: 'SENIF',
}

type EmergencyContactDraft = {
  name: string
  relationship: string
  phone: string
  email: string
  isAuthorisedCollector: boolean
}

function blankContact(): EmergencyContactDraft {
  return { name: '', relationship: '', phone: '', email: '', isAuthorisedCollector: false }
}

export default function NewChildForm({ staff }: { staff: { id: string; name: string }[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasAllergies, setHasAllergies] = useState(false)
  const [consumableConsent, setConsumableConsent] = useState(false)
  const [needs1to1, setNeeds1to1] = useState(false)
  const [sessions, setSessions] = useState<Record<string, string>>({})
  const [depositPaid, setDepositPaid] = useState(false)
  const [twoYearFunding, setTwoYearFunding] = useState(false)
  const [extendedHours, setExtendedHours] = useState(false)
  const [eypp, setEypp] = useState(false)
  const [sen, setSen] = useState(false)
  const [daf, setDaf] = useState(false)
  const [dep, setDep] = useState(false)

  const [contacts, setContacts] = useState<EmergencyContactDraft[]>([])
  const [addingContact, setAddingContact] = useState(false)
  const [contactForm, setContactForm] = useState<EmergencyContactDraft>(blankContact())

  function handleAddContact() {
    if (!contactForm.name || !contactForm.relationship || !contactForm.phone) return
    setContacts(c => [...c, contactForm])
    setContactForm(blankContact())
    setAddingContact(false)
  }

  function removeContact(index: number) {
    setContacts(c => c.filter((_, i) => i !== index))
  }

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
      hasAllergies,
      allergies: hasAllergies ? form.get('allergies') as string : undefined,
      medicalNotes: form.get('medicalNotes') as string,
      collectionPassword: form.get('collectionPassword') as string,
      photoConsent: form.get('photoConsent') === 'on',
      consumableConsent,
      needs1to1,
      parentName: form.get('parentName') as string,
      parentEmail: form.get('parentEmail') as string,
      parentPhone: form.get('parentPhone') as string,
      depositPaid,
      twoYearFunding,
      extendedHours,
      eypp,
      sen,
      senTier: sen ? form.get('senTier') as string : undefined,
      daf,
      dep,
    })

    if (Object.keys(sessions).length > 0) {
      const parsed = Object.entries(sessions).map(([key, fundingType]) => {
        const [day, ...rest] = key.split('-')
        return { day, sessionType: rest.join('-'), fundingType }
      })
      await updateChildSessions(result.id, parsed)
    }

    for (const contact of contacts) {
      await addEmergencyContact(result.id, {
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        email: contact.email || undefined,
        isAuthorisedCollector: contact.isAuthorisedCollector,
      })
    }

    router.push(`/children/${result.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
          <input name="firstName" required className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
          <input name="lastName" required className={inp} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth *</label>
          <input name="dateOfBirth" type="date" required className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Key worker</label>
          <select name="keyWorkerId" className={inp}>
            <option value="">— Not assigned —</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input name="address" className={inp} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Collection password</label>
        <input name="collectionPassword" className={inp} placeholder="Word set by parent for collection verification" />
      </div>

      {/* Sessions */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sessions attending</label>
        <p className="text-xs text-gray-500 mb-3">Tick a session then choose how it's funded. Splitting a session into part-funded/part-paid time ranges can be done afterward on the child's profile.</p>
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
                <td className="py-2 pr-3 text-gray-700 font-medium">{DAY_LABELS[day]}</td>
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

      {/* Parent / Billing Contact */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Parent / Billing Contact</h2>
          <p className="text-xs text-gray-400 mt-0.5">Invoice emails are sent to this address</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="parentName" className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="parentPhone" type="tel" className={inp} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (for invoices)</label>
          <input name="parentEmail" type="email" className={inp} />
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Emergency Contacts</h2>
          <button type="button" onClick={() => setAddingContact(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">
            {addingContact ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {contacts.length === 0 && !addingContact && (
          <p className="text-sm text-gray-400">No contacts added yet.</p>
        )}

        {contacts.length > 0 && (
          <div className="space-y-2">
            {contacts.map((c, i) => (
              <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {c.name}
                    {c.isAuthorisedCollector && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Authorised collector</span>
                    )}
                  </div>
                  <div className="text-gray-500">{c.relationship} · {c.phone}</div>
                  {c.email && <div className="text-gray-500">{c.email}</div>}
                </div>
                <button type="button" onClick={() => removeContact(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
            ))}
          </div>
        )}

        {addingContact && (
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name *</label>
                <input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Relationship *</label>
                <input value={contactForm.relationship} onChange={e => setContactForm(f => ({ ...f, relationship: e.target.value }))} placeholder="e.g. Mother, Grandparent" className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone *</label>
                <input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="contactCollector" checked={contactForm.isAuthorisedCollector} onChange={e => setContactForm(f => ({ ...f, isAuthorisedCollector: e.target.checked }))} className="rounded" />
              <label htmlFor="contactCollector" className="text-sm text-gray-700">Authorised to collect child</label>
            </div>
            <button type="button" onClick={handleAddContact} className="px-4 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm rounded-lg">
              Add contact
            </button>
          </div>
        )}
      </div>

      {/* Allergies + medical */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="hasAllergies" checked={hasAllergies} onChange={e => setHasAllergies(e.target.checked)} className="rounded" />
          <label htmlFor="hasAllergies" className="text-sm font-medium text-gray-700">Has allergies</label>
        </div>
        {hasAllergies && (
          <div className="ml-6">
            <label className="block text-sm text-gray-600 mb-1">Allergy details</label>
            <textarea name="allergies" rows={2} className={inp} />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medical notes</label>
          <textarea name="medicalNotes" rows={2} className={inp} placeholder="Any conditions, additional medical information..." />
        </div>
      </div>

      {/* Consents */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Consents</h2>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="photoConsent" name="photoConsent" className="rounded" />
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
            <label htmlFor="consumableConsent" className="text-sm font-medium text-gray-700">
              Voluntary consumable fee agreement
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Parent/guardian agrees to the £3.50 per session consumable charge for each day attending.
            </p>
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
            <label htmlFor="needs1to1" className="text-sm font-medium text-gray-700">
              Requires 1-2-1 keyworker
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              This child has a dedicated keyworker who cannot be counted in the general staff ratio.
            </p>
          </div>
        </div>
      </div>

      {/* Funding */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Funding &amp; Fees</h2>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="depositPaid" checked={depositPaid} onChange={e => setDepositPaid(e.target.checked)} className="rounded" />
          <label htmlFor="depositPaid" className="text-sm font-medium text-gray-700">Deposit paid (£50 — deducted from first invoice)</label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={twoYearFunding} onChange={e => setTwoYearFunding(e.target.checked)} className="rounded" />
            2-year funding
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={extendedHours} onChange={e => setExtendedHours(e.target.checked)} className="rounded" />
            Extended hours (30h)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={eypp} onChange={e => setEypp(e.target.checked)} className="rounded" />
            EYPP
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={dep} onChange={e => setDep(e.target.checked)} className="rounded" />
            DEP (deprivation supplement)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={daf} onChange={e => setDaf(e.target.checked)} className="rounded" />
            DAF (Disability Access Fund)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={sen} onChange={e => setSen(e.target.checked)} className="rounded" />
            SEN Inclusion Fund
          </label>
        </div>

        {sen && (
          <div className="ml-6">
            <label className="block text-sm text-gray-600 mb-1">SEN tier</label>
            <select name="senTier" className={`${inp} w-40`}>
              <option value="">— Select —</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'
