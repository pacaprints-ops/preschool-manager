'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { enrolments } from '@/lib/db/schema'
import { updateEnrolmentFull, updateEnrolmentFee, updateEnrolmentAdminField, emailEnrolmentInvoice, removeEnrolment } from '../../actions'
import { generateEnrolmentInvoiceHTML } from '../../CohortSection'

type EnrolmentRow = typeof enrolments.$inferSelect

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABEL: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const SESSION_LABEL: Record<string, string> = { morning: 'AM', afternoon: 'PM', full_day: 'Full' }
const FUNDING_OPTIONS = [
  { value: '', label: 'No funding / not applicable' },
  { value: 'universal15', label: 'Universal 15 hours' },
  { value: 'extended30', label: 'Extended 30 hours' },
  { value: 'two_year', label: '2-Year Funding' },
  { value: 'senif', label: 'SENIF' },
]

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'
const labelCls = 'block text-xs text-gray-600 mb-1'

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
    </div>
  )
}

function TextArea({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={inputCls} />
    </div>
  )
}

function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(opt => (
          <button key={String(opt.v)} type="button" onClick={() => onChange(opt.v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${value === opt.v ? 'bg-[#020e2f] text-white border-[#020e2f]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  )
}

function YesNoNote({ label, value, onChange, note, onNoteChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void; note: string; onNoteChange: (v: string) => void
}) {
  return (
    <div>
      <YesNo label={label} value={value} onChange={onChange} />
      {value && <textarea value={note} onChange={e => onNoteChange(e.target.value)} rows={2} className={`${inputCls} mt-2`} />}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      {children}
    </div>
  )
}

function SignaturePad({ label, onChange }: { label: string; onChange: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const onChangeRef = useRef(onChange)
  const [hasDrawn, setHasDrawn] = useState(false)
  onChangeRef.current = onChange

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const el = canvas
    const ctx = el.getContext('2d')!
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    function getPos(e: MouseEvent | Touch) {
      const rect = el.getBoundingClientRect()
      return { x: (e.clientX - rect.left) * (el.width / rect.width), y: (e.clientY - rect.top) * (el.height / rect.height) }
    }
    function onDown(e: MouseEvent | TouchEvent) { e.preventDefault(); drawing.current = true; lastPos.current = getPos('touches' in e ? e.touches[0] : e) }
    function onMove(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!drawing.current || !lastPos.current) return
      const pos = getPos('touches' in e ? e.touches[0] : e)
      ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke()
      lastPos.current = pos
    }
    function onUp(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!drawing.current) return
      drawing.current = false; lastPos.current = null; setHasDrawn(true); onChangeRef.current(el.toDataURL())
    }
    el.addEventListener('mousedown', onDown); el.addEventListener('mousemove', onMove); el.addEventListener('mouseup', onUp); el.addEventListener('mouseleave', onUp)
    el.addEventListener('touchstart', onDown, { passive: false }); el.addEventListener('touchmove', onMove, { passive: false }); el.addEventListener('touchend', onUp, { passive: false })
    return () => {
      el.removeEventListener('mousedown', onDown); el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseup', onUp); el.removeEventListener('mouseleave', onUp)
      el.removeEventListener('touchstart', onDown); el.removeEventListener('touchmove', onMove); el.removeEventListener('touchend', onUp)
    }
  }, [])

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false); onChangeRef.current('')
  }

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} width={400} height={100} className="w-full touch-none block" />
        {!hasDrawn && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-gray-300 text-sm select-none">Sign here</span></div>}
      </div>
      {hasDrawn && <button type="button" onClick={clear} className="mt-1 text-xs text-gray-400 hover:text-red-500">Clear signature</button>}
    </div>
  )
}

export default function EditEnrolmentForm({
  enrolment,
  signedPolicies,
}: {
  enrolment: EnrolmentRow
  signedPolicies: { policyName: string; parentPrintName: string | null; parentSignedAt: Date | null }[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [emailResult, setEmailResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const [medFormOpen, setMedFormOpen] = useState(!!enrolment.medicationFormData)
  const [welcomeFeePaid, setWelcomeFeePaid] = useState(enrolment.welcomeFeePaid)
  const [depositPaid, setDepositPaid] = useState(enrolment.depositPaid)

  const daysSessionsInitial: Record<string, string> = enrolment.daysSessions ? JSON.parse(enrolment.daysSessions) : {}
  const medFormInitial = enrolment.medicationFormData ? JSON.parse(enrolment.medicationFormData) : {}

  const [f, setF] = useState({
    childFirstName: enrolment.childFirstName, childLastName: enrolment.childLastName,
    childGender: enrolment.childGender ?? '', dateOfBirth: enrolment.dateOfBirth ?? '',
    childAddress: enrolment.childAddress ?? '', childPostcode: enrolment.childPostcode ?? '',
    birthCertificateSeen: enrolment.birthCertificateSeen, startDate: enrolment.startDate ?? '',
    parent1Name: enrolment.parent1Name ?? enrolment.parentCarerName, parent1DaytimePhone: enrolment.parent1DaytimePhone ?? '',
    parent1Mobile: enrolment.parent1Mobile ?? '', parent1Email: enrolment.parent1Email ?? '',
    parent1Relationship: enrolment.parent1Relationship ?? '', parent1ParentalResponsibility: enrolment.parent1ParentalResponsibility,
    parent2Name: enrolment.parent2Name ?? '', parent2DaytimePhone: enrolment.parent2DaytimePhone ?? '',
    parent2Mobile: enrolment.parent2Mobile ?? '', parent2Email: enrolment.parent2Email ?? '',
    parent2Relationship: enrolment.parent2Relationship ?? '', parent2ParentalResponsibility: enrolment.parent2ParentalResponsibility,
    ec1Name: enrolment.ec1Name ?? '', ec1DaytimePhone: enrolment.ec1DaytimePhone ?? '', ec1Mobile: enrolment.ec1Mobile ?? '',
    ec1Relationship: enrolment.ec1Relationship ?? '', ec1CanCollect: enrolment.ec1CanCollect,
    ec2Name: enrolment.ec2Name ?? '', ec2DaytimePhone: enrolment.ec2DaytimePhone ?? '', ec2Mobile: enrolment.ec2Mobile ?? '',
    ec2Relationship: enrolment.ec2Relationship ?? '', ec2CanCollect: enrolment.ec2CanCollect,
    collectionPassword: enrolment.collectionPassword ?? '',
    fundingType: enrolment.fundingType ?? '', fundingCode: enrolment.fundingCode ?? '', fundingCodeDate: enrolment.fundingCodeDate ?? '',
    fundingNotes: enrolment.fundingNotes ?? '', fundingApplicantName: enrolment.fundingApplicantName ?? '',
    fundingApplicantDob: enrolment.fundingApplicantDob ?? '', fundingApplicantNi: enrolment.fundingApplicantNi ?? '',
    daysSessions: daysSessionsInitial,
    childInterests: enrolment.childInterests ?? '', attendsOtherSetting: enrolment.attendsOtherSetting,
    attendsOtherSettingDetails: enrolment.attendsOtherSettingDetails ?? '', parentConcerns: enrolment.parentConcerns,
    parentConcernsDetails: enrolment.parentConcernsDetails ?? '',
    immunisationsUpToDate: enrolment.immunisationsUpToDate, immunisationsSignature: enrolment.immunisationsSignature ?? '',
    doctorName: enrolment.doctorName ?? '', doctorPracticeName: enrolment.doctorPracticeName ?? '',
    doctorPracticeAddress: enrolment.doctorPracticeAddress ?? '', doctorPhone: enrolment.doctorPhone ?? '',
    dentistName: enrolment.dentistName ?? '', dentistPhone: enrolment.dentistPhone ?? '',
    otherProfessionalsInvolved: enrolment.otherProfessionalsInvolved, otherProfessionalsDetails: enrolment.otherProfessionalsDetails ?? '',
    hasMedicalConditions: enrolment.hasMedicalConditions, medicalConditionsDetails: enrolment.medicalConditionsDetails ?? '',
    takesMedication: enrolment.takesMedication,
    medicationForm: {
      formDate: medFormInitial.formDate ?? '', name: medFormInitial.name ?? '', dosage: medFormInitial.dosage ?? '',
      frequency: medFormInitial.frequency ?? '', conditionDiagnosis: medFormInitial.conditionDiagnosis ?? '',
      conditionSymptoms: medFormInitial.conditionSymptoms ?? '', hospitalContactName: medFormInitial.hospitalContactName ?? '',
      hospitalContactPhone: medFormInitial.hospitalContactPhone ?? '', doctorContactName: medFormInitial.doctorContactName ?? '',
      doctorContactPhone: medFormInitial.doctorContactPhone ?? '', administeredAtHome: medFormInitial.administeredAtHome ?? '',
      durationOfTreatment: medFormInitial.durationOfTreatment ?? '', dateDispensed: medFormInitial.dateDispensed ?? '',
      storage: medFormInitial.storage ?? '', expiryDate: medFormInitial.expiryDate ?? '', specialPrecautions: medFormInitial.specialPrecautions ?? '',
      possibleSideEffects: medFormInitial.possibleSideEffects ?? '', emergencyProcedures: medFormInitial.emergencyProcedures ?? '',
      parentSignature: medFormInitial.parentSignature ?? '', parentPrintName: medFormInitial.parentPrintName ?? '',
    },
    ethnicity: enrolment.ethnicity ?? '', religion: enrolment.religion ?? '', culturalCelebrations: enrolment.culturalCelebrations ?? '',
    languagesSpokenAtHome: enrolment.languagesSpokenAtHome ?? '', mainLanguage: enrolment.mainLanguage ?? '',
    hearAboutUs: enrolment.hearAboutUs ?? '', notes: enrolment.notes ?? '',
  })

  function set<K extends keyof typeof f>(k: K, v: typeof f[K]) {
    setF(prev => ({ ...prev, [k]: v }))
    setSaved(false)
  }

  function toggleDay(day: string) {
    setF(prev => {
      const next = { ...prev.daysSessions }
      if (day in next) delete next[day]
      else next[day] = 'morning'
      return { ...prev, daysSessions: next }
    })
    setSaved(false)
  }

  async function handleSave() {
    if (!f.childFirstName.trim() || !f.childLastName.trim() || !f.parent1Name.trim()) return
    setSaving(true)
    await updateEnrolmentFull(enrolment.id, {
      childFirstName: f.childFirstName, childLastName: f.childLastName, childGender: f.childGender || undefined,
      dateOfBirth: f.dateOfBirth || undefined, childAddress: f.childAddress || undefined, childPostcode: f.childPostcode || undefined,
      birthCertificateSeen: f.birthCertificateSeen, startDate: f.startDate || undefined,
      parent1Name: f.parent1Name, parent1DaytimePhone: f.parent1DaytimePhone || undefined, parent1Mobile: f.parent1Mobile || undefined,
      parent1Email: f.parent1Email || undefined, parent1Relationship: f.parent1Relationship || undefined,
      parent1ParentalResponsibility: f.parent1ParentalResponsibility,
      parent2Name: f.parent2Name || undefined, parent2DaytimePhone: f.parent2DaytimePhone || undefined, parent2Mobile: f.parent2Mobile || undefined,
      parent2Email: f.parent2Email || undefined, parent2Relationship: f.parent2Relationship || undefined,
      parent2ParentalResponsibility: f.parent2ParentalResponsibility,
      ec1Name: f.ec1Name || undefined, ec1DaytimePhone: f.ec1DaytimePhone || undefined, ec1Mobile: f.ec1Mobile || undefined,
      ec1Relationship: f.ec1Relationship || undefined, ec1CanCollect: f.ec1CanCollect,
      ec2Name: f.ec2Name || undefined, ec2DaytimePhone: f.ec2DaytimePhone || undefined, ec2Mobile: f.ec2Mobile || undefined,
      ec2Relationship: f.ec2Relationship || undefined, ec2CanCollect: f.ec2CanCollect,
      collectionPassword: f.collectionPassword || undefined,
      fundingType: f.fundingType || undefined, fundingCode: f.fundingCode || undefined, fundingCodeDate: f.fundingCodeDate || undefined,
      fundingNotes: f.fundingNotes || undefined, fundingApplicantName: f.fundingApplicantName || undefined,
      fundingApplicantDob: f.fundingApplicantDob || undefined, fundingApplicantNi: f.fundingApplicantNi || undefined,
      daysSessions: f.daysSessions,
      childInterests: f.childInterests || undefined, attendsOtherSetting: f.attendsOtherSetting,
      attendsOtherSettingDetails: f.attendsOtherSettingDetails || undefined, parentConcerns: f.parentConcerns,
      parentConcernsDetails: f.parentConcernsDetails || undefined,
      immunisationsUpToDate: f.immunisationsUpToDate ?? undefined, immunisationsSignature: f.immunisationsSignature || undefined,
      doctorName: f.doctorName || undefined, doctorPracticeName: f.doctorPracticeName || undefined,
      doctorPracticeAddress: f.doctorPracticeAddress || undefined, doctorPhone: f.doctorPhone || undefined,
      dentistName: f.dentistName || undefined, dentistPhone: f.dentistPhone || undefined,
      otherProfessionalsInvolved: f.otherProfessionalsInvolved, otherProfessionalsDetails: f.otherProfessionalsDetails || undefined,
      hasMedicalConditions: f.hasMedicalConditions, medicalConditionsDetails: f.medicalConditionsDetails || undefined,
      takesMedication: f.takesMedication, medicationFormData: f.takesMedication ? JSON.stringify(f.medicationForm) : undefined,
      ethnicity: f.ethnicity || undefined, religion: f.religion || undefined, culturalCelebrations: f.culturalCelebrations || undefined,
      languagesSpokenAtHome: f.languagesSpokenAtHome || undefined, mainLanguage: f.mainLanguage || undefined,
      hearAboutUs: f.hearAboutUs || undefined, notes: f.notes || undefined,
    })
    setSaving(false)
    setSaved(true)
  }

  async function handleRemove() {
    if (!confirm(`Remove ${f.childFirstName} ${f.childLastName} from enrolments? This cannot be undone.`)) return
    setRemoving(true)
    await removeEnrolment(enrolment.id)
    router.push('/enrolments')
  }

  async function handleEmailInvoice() {
    setEmailing(true)
    setEmailResult(null)
    const result = await emailEnrolmentInvoice(enrolment.id)
    setEmailing(false)
    setEmailResult(result)
  }

  function handleOpenInvoice() {
    const html = generateEnrolmentInvoiceHTML({
      firstName: f.childFirstName, lastName: f.childLastName, parentCarerName: f.parent1Name,
      contactEmail: f.parent1Email || null, welcomeFeePaid, depositPaid,
    }, enrolment.intakeYear)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 15000)
  }

  return (
    <div className="space-y-4">
      <Section title="Child's Details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name *" value={f.childFirstName} onChange={v => set('childFirstName', v)} />
          <Field label="Last name *" value={f.childLastName} onChange={v => set('childLastName', v)} />
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <div className="flex gap-2">
            {['male', 'female'].map(g => (
              <button key={g} type="button" onClick={() => set('childGender', g)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border capitalize transition-colors ${f.childGender === g ? 'bg-[#020e2f] text-white border-[#020e2f]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <Field label="Date of birth" type="date" value={f.dateOfBirth} onChange={v => set('dateOfBirth', v)} />
        <Field label="Full address" value={f.childAddress} onChange={v => set('childAddress', v)} />
        <Field label="Postcode" value={f.childPostcode} onChange={v => set('childPostcode', v)} />
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={f.birthCertificateSeen} onChange={e => set('birthCertificateSeen', e.target.checked)} className="rounded" />
          <label className="text-sm text-gray-700">Birth certificate seen</label>
        </div>
        <Field label="Start date (only if different from the standard September intake)" type="date" value={f.startDate} onChange={v => set('startDate', v)} />
      </Section>

      <Section title="Family Details">
        <p className="text-sm font-semibold text-gray-700">Parent 1</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *" value={f.parent1Name} onChange={v => set('parent1Name', v)} />
          <Field label="Relationship" value={f.parent1Relationship} onChange={v => set('parent1Relationship', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daytime number" value={f.parent1DaytimePhone} onChange={v => set('parent1DaytimePhone', v)} />
          <Field label="Mobile" value={f.parent1Mobile} onChange={v => set('parent1Mobile', v)} />
        </div>
        <Field label="Email" type="email" value={f.parent1Email} onChange={v => set('parent1Email', v)} />
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={f.parent1ParentalResponsibility} onChange={e => set('parent1ParentalResponsibility', e.target.checked)} className="rounded" />
          <label className="text-sm text-gray-700">Has parental responsibility</label>
        </div>

        <p className="text-sm font-semibold text-gray-700 pt-3 border-t border-gray-100">Parent 2</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" value={f.parent2Name} onChange={v => set('parent2Name', v)} />
          <Field label="Relationship" value={f.parent2Relationship} onChange={v => set('parent2Relationship', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daytime number" value={f.parent2DaytimePhone} onChange={v => set('parent2DaytimePhone', v)} />
          <Field label="Mobile" value={f.parent2Mobile} onChange={v => set('parent2Mobile', v)} />
        </div>
        <Field label="Email" type="email" value={f.parent2Email} onChange={v => set('parent2Email', v)} />
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={f.parent2ParentalResponsibility} onChange={e => set('parent2ParentalResponsibility', e.target.checked)} className="rounded" />
          <label className="text-sm text-gray-700">Has parental responsibility</label>
        </div>
      </Section>

      <Section title="Emergency Contacts">
        <p className="text-xs text-gray-400">Not Parent 1 or 2 — doesn&apos;t need to live locally.</p>
        <p className="text-sm font-semibold text-gray-700">Emergency contact 1</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" value={f.ec1Name} onChange={v => set('ec1Name', v)} />
          <Field label="Relationship" value={f.ec1Relationship} onChange={v => set('ec1Relationship', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daytime number" value={f.ec1DaytimePhone} onChange={v => set('ec1DaytimePhone', v)} />
          <Field label="Mobile" value={f.ec1Mobile} onChange={v => set('ec1Mobile', v)} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={f.ec1CanCollect} onChange={e => set('ec1CanCollect', e.target.checked)} className="rounded" />
          <label className="text-sm text-gray-700">Has permission to collect child</label>
        </div>

        <p className="text-sm font-semibold text-gray-700 pt-3 border-t border-gray-100">Emergency contact 2</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" value={f.ec2Name} onChange={v => set('ec2Name', v)} />
          <Field label="Relationship" value={f.ec2Relationship} onChange={v => set('ec2Relationship', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daytime number" value={f.ec2DaytimePhone} onChange={v => set('ec2DaytimePhone', v)} />
          <Field label="Mobile" value={f.ec2Mobile} onChange={v => set('ec2Mobile', v)} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={f.ec2CanCollect} onChange={e => set('ec2CanCollect', e.target.checked)} className="rounded" />
          <label className="text-sm text-gray-700">Has permission to collect child</label>
        </div>

        <Field label="Password for collection" value={f.collectionPassword} onChange={v => set('collectionPassword', v)} />
      </Section>

      <Section title="Funding & Sessions">
        <div>
          <label className={labelCls}>Funding</label>
          <select value={f.fundingType} onChange={e => set('fundingType', e.target.value)} className={inputCls}>
            {FUNDING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {(f.fundingType === 'extended30' || f.fundingType === 'two_year') && (
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Funding code" value={f.fundingCode} onChange={v => set('fundingCode', v)} />
              <Field label="Code valid from" type="date" value={f.fundingCodeDate} onChange={v => set('fundingCodeDate', v)} />
            </div>
            <p className="text-sm font-semibold text-gray-700">Parent who applied for the code</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={f.fundingApplicantName} onChange={v => set('fundingApplicantName', v)} />
              <Field label="Date of birth" type="date" value={f.fundingApplicantDob} onChange={v => set('fundingApplicantDob', v)} />
            </div>
            <Field label="NI number" value={f.fundingApplicantNi} onChange={v => set('fundingApplicantNi', v)} />
          </div>
        )}
        <TextArea label="Funding notes" value={f.fundingNotes} onChange={v => set('fundingNotes', v)} />
        <div>
          <label className={`${labelCls} mb-2`}>Days & sessions needed</label>
          <div className="flex gap-4 flex-wrap">
            {DAYS.map(day => (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <button type="button" onClick={() => toggleDay(day)}
                  className={`w-14 py-1.5 rounded-lg text-sm font-semibold transition-colors ${day in f.daysSessions ? 'bg-[#020e2f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {DAY_LABEL[day]}
                </button>
                {day in f.daysSessions && (
                  <div className="flex flex-col gap-1">
                    {(['morning', 'afternoon', 'full_day'] as const).map(st => (
                      <button key={st} type="button" onClick={() => set('daysSessions', { ...f.daysSessions, [day]: st })}
                        className={`w-14 py-1 rounded text-xs font-medium transition-colors ${f.daysSessions[day] === st ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {SESSION_LABEL[st]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="About Your Child">
        <TextArea label="What does your child like to play with?" value={f.childInterests} onChange={v => set('childInterests', v)} rows={3} />
        <YesNoNote label="Have they attended, or do they currently attend, another setting?" value={f.attendsOtherSetting} onChange={v => set('attendsOtherSetting', v)} note={f.attendsOtherSettingDetails} onNoteChange={v => set('attendsOtherSettingDetails', v)} />
        <YesNoNote label="As a parent, do you have any concerns or worries about your child?" value={f.parentConcerns} onChange={v => set('parentConcerns', v)} note={f.parentConcernsDetails} onNoteChange={v => set('parentConcernsDetails', v)} />
      </Section>

      <Section title="Health Questions">
        <YesNo label="Are your child's immunisations up to date?" value={f.immunisationsUpToDate ?? false} onChange={v => set('immunisationsUpToDate', v)} />
        <SignaturePad label="Parent signature" onChange={v => set('immunisationsSignature', v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Doctor's name" value={f.doctorName} onChange={v => set('doctorName', v)} />
          <Field label="Practice name" value={f.doctorPracticeName} onChange={v => set('doctorPracticeName', v)} />
        </div>
        <Field label="Practice address" value={f.doctorPracticeAddress} onChange={v => set('doctorPracticeAddress', v)} />
        <Field label="Doctor's number" value={f.doctorPhone} onChange={v => set('doctorPhone', v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dentist surgery name" value={f.dentistName} onChange={v => set('dentistName', v)} />
          <Field label="Dentist number" value={f.dentistPhone} onChange={v => set('dentistPhone', v)} />
        </div>
        <YesNoNote label="Any other professionals involved with your child?" value={f.otherProfessionalsInvolved} onChange={v => set('otherProfessionalsInvolved', v)} note={f.otherProfessionalsDetails} onNoteChange={v => set('otherProfessionalsDetails', v)} />
        <YesNoNote label="Any known medical conditions, allergies or special dietary needs?" value={f.hasMedicalConditions} onChange={v => set('hasMedicalConditions', v)} note={f.medicalConditionsDetails} onNoteChange={v => set('medicalConditionsDetails', v)} />
        <div>
          <YesNo label="Does your child regularly take any medication?" value={f.takesMedication} onChange={v => { set('takesMedication', v); setMedFormOpen(v) }} />
          {f.takesMedication && (
            <div className="mt-2">
              {!medFormOpen ? (
                <button type="button" onClick={() => setMedFormOpen(true)} className="text-xs text-blue-700 hover:underline">
                  {f.medicationForm.name ? 'Edit prescribed medicine details' : 'Open Prescribed Medicine form'}
                </button>
              ) : (
                <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">Prescribed Medicine Form</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Condition / diagnosis" value={f.medicationForm.conditionDiagnosis} onChange={v => set('medicationForm', { ...f.medicationForm, conditionDiagnosis: v })} />
                    <Field label="Medication name" value={f.medicationForm.name} onChange={v => set('medicationForm', { ...f.medicationForm, name: v })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dosage" value={f.medicationForm.dosage} onChange={v => set('medicationForm', { ...f.medicationForm, dosage: v })} />
                    <Field label="Frequency" value={f.medicationForm.frequency} onChange={v => set('medicationForm', { ...f.medicationForm, frequency: v })} />
                  </div>
                  <TextArea label="Symptoms" value={f.medicationForm.conditionSymptoms} onChange={v => set('medicationForm', { ...f.medicationForm, conditionSymptoms: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Doctor contact name" value={f.medicationForm.doctorContactName} onChange={v => set('medicationForm', { ...f.medicationForm, doctorContactName: v })} />
                    <Field label="Doctor contact phone" value={f.medicationForm.doctorContactPhone} onChange={v => set('medicationForm', { ...f.medicationForm, doctorContactPhone: v })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Hospital contact name" value={f.medicationForm.hospitalContactName} onChange={v => set('medicationForm', { ...f.medicationForm, hospitalContactName: v })} />
                    <Field label="Hospital contact phone" value={f.medicationForm.hospitalContactPhone} onChange={v => set('medicationForm', { ...f.medicationForm, hospitalContactPhone: v })} />
                  </div>
                  <Field label="Administered at home" value={f.medicationForm.administeredAtHome} onChange={v => set('medicationForm', { ...f.medicationForm, administeredAtHome: v })} />
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Duration of treatment" value={f.medicationForm.durationOfTreatment} onChange={v => set('medicationForm', { ...f.medicationForm, durationOfTreatment: v })} />
                    <Field label="Date dispensed" type="date" value={f.medicationForm.dateDispensed} onChange={v => set('medicationForm', { ...f.medicationForm, dateDispensed: v })} />
                    <Field label="Expiry date" type="date" value={f.medicationForm.expiryDate} onChange={v => set('medicationForm', { ...f.medicationForm, expiryDate: v })} />
                  </div>
                  <Field label="Storage" value={f.medicationForm.storage} onChange={v => set('medicationForm', { ...f.medicationForm, storage: v })} />
                  <Field label="Special precautions" value={f.medicationForm.specialPrecautions} onChange={v => set('medicationForm', { ...f.medicationForm, specialPrecautions: v })} />
                  <Field label="Possible side effects" value={f.medicationForm.possibleSideEffects} onChange={v => set('medicationForm', { ...f.medicationForm, possibleSideEffects: v })} />
                  <TextArea label="Emergency procedures" value={f.medicationForm.emergencyProcedures} onChange={v => set('medicationForm', { ...f.medicationForm, emergencyProcedures: v })} />
                  <Field label="Parent print name" value={f.medicationForm.parentPrintName} onChange={v => set('medicationForm', { ...f.medicationForm, parentPrintName: v })} />
                  <SignaturePad label="Parent signature" onChange={v => set('medicationForm', { ...f.medicationForm, parentSignature: v })} />
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section title="Ethnicity, Culture & Language">
        <Field label="Ethnicity / cultural background" value={f.ethnicity} onChange={v => set('ethnicity', v)} />
        <Field label="Family religion" value={f.religion} onChange={v => set('religion', v)} />
        <TextArea label="Special occasions to acknowledge/celebrate" value={f.culturalCelebrations} onChange={v => set('culturalCelebrations', v)} rows={3} />
        <Field label="Languages spoken at home" value={f.languagesSpokenAtHome} onChange={v => set('languagesSpokenAtHome', v)} />
        <Field label="Main language" value={f.mainLanguage} onChange={v => set('mainLanguage', v)} />
        <Field label="How did you hear about us" value={f.hearAboutUs} onChange={v => set('hearAboutUs', v)} />
        <TextArea label="Notes" value={f.notes} onChange={v => set('notes', v)} />
      </Section>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving || !f.childFirstName.trim() || !f.childLastName.trim() || !f.parent1Name.trim()}
          className="px-5 py-2.5 bg-[#020e2f] hover:bg-[#010922] text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
      </div>

      <Section title="Fees & Documents">
        <div className="flex items-start gap-3 flex-wrap">
          <button type="button" onClick={handleOpenInvoice} className="text-xs text-blue-700 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
            Open invoice
          </button>
          <button type="button" onClick={handleEmailInvoice} disabled={emailing}
            className="text-xs text-white bg-blue-700 hover:bg-blue-800 rounded-lg px-3 py-2 transition-colors disabled:opacity-50">
            {emailing ? 'Sending…' : '✉ Email invoice to parent'}
          </button>
        </div>
        {emailResult && (
          emailResult.ok
            ? <p className="text-xs text-green-700">✓ Invoice emailed.</p>
            : <p className="text-xs text-red-600">Couldn&apos;t send: {emailResult.error}</p>
        )}

        <div className="pt-2 border-t border-gray-100 flex items-start gap-3 flex-wrap">
          <button type="button" onClick={() => { const next = !welcomeFeePaid; setWelcomeFeePaid(next); updateEnrolmentFee(enrolment.id, 'welcomeFeePaid', next) }}
            className={`flex items-start gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${welcomeFeePaid ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-500'}`}>
            <span className="mt-0.5">{welcomeFeePaid ? '✓' : '○'}</span>
            <div>Welcome fee £50 received</div>
          </button>
          <button type="button" onClick={() => { const next = !depositPaid; setDepositPaid(next); updateEnrolmentFee(enrolment.id, 'depositPaid', next) }}
            className={`flex items-start gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${depositPaid ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-500'}`}>
            <span className="mt-0.5">{depositPaid ? '✓' : '○'}</span>
            <div>Deposit £50 received</div>
          </button>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-1.5">Welcome pack &amp; settling in</p>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Pack given
              <input type="date" defaultValue={enrolment.welcomePackGivenAt ?? ''} onChange={e => updateEnrolmentAdminField(enrolment.id, 'welcomePackGivenAt', e.target.value)} className="border border-gray-300 rounded px-1.5 py-1 text-xs text-gray-900 bg-white" />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Polo given
              <input type="date" defaultValue={enrolment.tshirtGivenAt ?? ''} onChange={e => updateEnrolmentAdminField(enrolment.id, 'tshirtGivenAt', e.target.value)} className="border border-gray-300 rounded px-1.5 py-1 text-xs text-gray-900 bg-white" />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Session 1
              <input type="date" defaultValue={enrolment.settlingSession1 ?? ''} onChange={e => updateEnrolmentAdminField(enrolment.id, 'settlingSession1', e.target.value)} className="border border-gray-300 rounded px-1.5 py-1 text-xs text-gray-900 bg-white" />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Session 2
              <input type="date" defaultValue={enrolment.settlingSession2 ?? ''} onChange={e => updateEnrolmentAdminField(enrolment.id, 'settlingSession2', e.target.value)} className="border border-gray-300 rounded px-1.5 py-1 text-xs text-gray-900 bg-white" />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Session 3
              <input type="date" defaultValue={enrolment.settlingSession3 ?? ''} onChange={e => updateEnrolmentAdminField(enrolment.id, 'settlingSession3', e.target.value)} className="border border-gray-300 rounded px-1.5 py-1 text-xs text-gray-900 bg-white" />
            </label>
          </div>
        </div>

        {signedPolicies.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-1.5">Signed policies</p>
            <div className="flex flex-wrap gap-1.5">
              {signedPolicies.map((p, i) => (
                <span key={i} className="text-xs bg-green-50 border border-green-200 text-green-700 rounded-full px-2.5 py-1">
                  ✓ {p.policyName} — {p.parentPrintName}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-red-700">Remove this enrolment</p>
          <p className="text-xs text-red-500 mt-0.5">Cannot be undone.</p>
        </div>
        <button onClick={handleRemove} disabled={removing} className="px-4 py-2 text-sm text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
          {removing ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  )
}
