'use client'

import { useRef, useState, useEffect } from 'react'
import { addEnrolment, updateEnrolmentFee, updateEnrolmentAdminField, emailEnrolmentInvoice } from './actions'
import CohortSection, { type ReturningChild, type NewStarter, type LeavingChild, type StaffMember, generateEnrolmentInvoiceHTML } from './CohortSection'

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

type Cohort = {
  intakeYear: number
  returningChildren: ReturningChild[]
  newStarters: NewStarter[]
  leavingChildren: LeavingChild[] | null
}

export type Policy = { id: string; name: string; content: string }

const STEPS = ['year', 'child', 'family', 'emergency', 'funding', 'about', 'health', 'culture', 'policies', 'fees'] as const
type Step = typeof STEPS[number]

const STEP_TITLE: Record<Step, string> = {
  year: 'Which September?',
  child: "Child's Details",
  family: 'Family Details',
  emergency: 'Emergency Contacts',
  funding: 'Funding & Sessions',
  about: 'About Your Child',
  health: 'Health Questions',
  culture: 'Ethnicity, Culture & Language',
  policies: 'Policies',
  fees: 'Welcome Fee & Deposit',
}

type MedForm = {
  formDate: string
  name: string
  dosage: string
  frequency: string
  conditionDiagnosis: string
  conditionSymptoms: string
  hospitalContactName: string
  hospitalContactPhone: string
  doctorContactName: string
  doctorContactPhone: string
  administeredAtHome: string
  durationOfTreatment: string
  dateDispensed: string
  storage: string
  expiryDate: string
  specialPrecautions: string
  possibleSideEffects: string
  emergencyProcedures: string
  parentSignature: string
  parentPrintName: string
}

const EMPTY_MED: MedForm = {
  formDate: new Date().toISOString().slice(0, 10), name: '', dosage: '', frequency: '',
  conditionDiagnosis: '', conditionSymptoms: '', hospitalContactName: '', hospitalContactPhone: '',
  doctorContactName: '', doctorContactPhone: '', administeredAtHome: '', durationOfTreatment: '',
  dateDispensed: '', storage: '', expiryDate: '', specialPrecautions: '', possibleSideEffects: '',
  emergencyProcedures: '', parentSignature: '', parentPrintName: '',
}

type FormState = {
  childFirstName: string
  childLastName: string
  childGender: string
  dateOfBirth: string
  childAddress: string
  childPostcode: string
  birthCertificateSeen: boolean
  startDate: string

  parent1Name: string
  parent1DaytimePhone: string
  parent1Mobile: string
  parent1Email: string
  parent1Relationship: string
  parent1ParentalResponsibility: boolean
  parent2Name: string
  parent2DaytimePhone: string
  parent2Mobile: string
  parent2Email: string
  parent2Relationship: string
  parent2ParentalResponsibility: boolean

  ec1Name: string
  ec1DaytimePhone: string
  ec1Mobile: string
  ec1Relationship: string
  ec1CanCollect: boolean
  ec2Name: string
  ec2DaytimePhone: string
  ec2Mobile: string
  ec2Relationship: string
  ec2CanCollect: boolean
  collectionPassword: string

  fundingType: string
  fundingCode: string
  fundingCodeDate: string
  fundingNotes: string
  fundingApplicantName: string
  fundingApplicantDob: string
  fundingApplicantNi: string
  daysSessions: Record<string, string>

  childInterests: string
  attendsOtherSetting: boolean
  attendsOtherSettingDetails: string
  parentConcerns: boolean
  parentConcernsDetails: string

  immunisationsUpToDate: boolean | null
  immunisationsSignature: string
  doctorName: string
  doctorPracticeName: string
  doctorPracticeAddress: string
  doctorPhone: string
  dentistName: string
  dentistPhone: string
  otherProfessionalsInvolved: boolean
  otherProfessionalsDetails: string
  hasMedicalConditions: boolean
  medicalConditionsDetails: string
  takesMedication: boolean
  medicationForm: MedForm

  ethnicity: string
  religion: string
  culturalCelebrations: string
  languagesSpokenAtHome: string
  mainLanguage: string
  hearAboutUs: string
  notes: string
}

const EMPTY_FORM: FormState = {
  childFirstName: '', childLastName: '', childGender: '', dateOfBirth: '', childAddress: '', childPostcode: '',
  birthCertificateSeen: false, startDate: '',
  parent1Name: '', parent1DaytimePhone: '', parent1Mobile: '', parent1Email: '', parent1Relationship: '', parent1ParentalResponsibility: false,
  parent2Name: '', parent2DaytimePhone: '', parent2Mobile: '', parent2Email: '', parent2Relationship: '', parent2ParentalResponsibility: false,
  ec1Name: '', ec1DaytimePhone: '', ec1Mobile: '', ec1Relationship: '', ec1CanCollect: false,
  ec2Name: '', ec2DaytimePhone: '', ec2Mobile: '', ec2Relationship: '', ec2CanCollect: false,
  collectionPassword: '',
  fundingType: '', fundingCode: '', fundingCodeDate: '', fundingNotes: '', fundingApplicantName: '', fundingApplicantDob: '', fundingApplicantNi: '',
  daysSessions: {},
  childInterests: '', attendsOtherSetting: false, attendsOtherSettingDetails: '', parentConcerns: false, parentConcernsDetails: '',
  immunisationsUpToDate: null, immunisationsSignature: '',
  doctorName: '', doctorPracticeName: '', doctorPracticeAddress: '', doctorPhone: '', dentistName: '', dentistPhone: '',
  otherProfessionalsInvolved: false, otherProfessionalsDetails: '',
  hasMedicalConditions: false, medicalConditionsDetails: '',
  takesMedication: false, medicationForm: EMPTY_MED,
  ethnicity: '', religion: '', culturalCelebrations: '', languagesSpokenAtHome: '', mainLanguage: '', hearAboutUs: '', notes: '',
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'
const labelCls = 'block text-xs text-gray-600 mb-1'

// ─── Small reusable field helpers ──────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
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
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              value === opt.v ? 'bg-[#020e2f] text-white border-[#020e2f]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  )
}

function YesNoNote({ label, value, onChange, note, onNoteChange, notePlaceholder }: {
  label: string; value: boolean; onChange: (v: boolean) => void
  note: string; onNoteChange: (v: string) => void; notePlaceholder?: string
}) {
  return (
    <div>
      <YesNo label={label} value={value} onChange={onChange} />
      {value && (
        <textarea
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          rows={2}
          placeholder={notePlaceholder}
          className={`${inputCls} mt-2`}
        />
      )}
    </div>
  )
}

// ─── Signature pad ────────────────────────────────────────────────────────────

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
    function onDown(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      drawing.current = true
      lastPos.current = getPos('touches' in e ? e.touches[0] : e)
    }
    function onMove(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!drawing.current || !lastPos.current) return
      const pos = getPos('touches' in e ? e.touches[0] : e)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPos.current = pos
    }
    function onUp(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!drawing.current) return
      drawing.current = false
      lastPos.current = null
      setHasDrawn(true)
      onChangeRef.current(el.toDataURL())
    }
    el.addEventListener('mousedown', onDown)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseup', onUp)
    el.addEventListener('mouseleave', onUp)
    el.addEventListener('touchstart', onDown, { passive: false })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onUp, { passive: false })
    return () => {
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseup', onUp)
      el.removeEventListener('mouseleave', onUp)
      el.removeEventListener('touchstart', onDown)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onUp)
    }
  }, [])

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    onChangeRef.current('')
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function EnrolmentsClient({
  cohorts,
  isAdmin,
  staffData,
  policies,
}: {
  cohorts: Cohort[]
  isAdmin: boolean
  staffData: StaffMember[]
  policies: Policy[]
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<Step>('year')
  const [pickedYear, setPickedYear] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [medFormOpen, setMedFormOpen] = useState(false)
  const [signatures, setSignatures] = useState<Record<string, { parentPrintName: string; parentSignature: string; notes: string }>>({})
  const [activePolicyId, setActivePolicyId] = useState<string | null>(null)
  const [signingManager, setSigningManager] = useState(false)
  const [managerName, setManagerName] = useState('')
  const [managerSignature, setManagerSignature] = useState('')
  const [savedEnrolment, setSavedEnrolment] = useState<{
    id: string; welcomeFeePaid: boolean; depositPaid: boolean
    welcomePackGivenAt: string; tshirtGivenAt: string
    settlingSession1: string; settlingSession2: string; settlingSession3: string
  } | null>(null)
  const [emailingInvoice, setEmailingInvoice] = useState(false)
  const [invoiceEmailResult, setInvoiceEmailResult] = useState<{ ok: boolean; error?: string } | null>(null)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function openModal() {
    setPickedYear(null)
    setForm(EMPTY_FORM)
    setSignatures({})
    setActivePolicyId(null)
    setSigningManager(false)
    setManagerName('')
    setManagerSignature('')
    setSavedEnrolment(null)
    setStep('year')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function toggleFormDay(day: string) {
    setForm(f => {
      const next = { ...f.daysSessions }
      if (day in next) delete next[day]
      else next[day] = 'morning'
      return { ...f, daysSessions: next }
    })
  }

  function setFormSession(day: string, sessionType: string) {
    setForm(f => ({ ...f, daysSessions: { ...f.daysSessions, [day]: sessionType } }))
  }

  const stepIndex = STEPS.indexOf(step)

  function goNext() {
    const i = STEPS.indexOf(step)
    if (i < STEPS.length - 1) setStep(STEPS[i + 1])
  }
  function goBack() {
    const i = STEPS.indexOf(step)
    if (i > 0) setStep(STEPS[i - 1])
  }

  function isPolicySigned(policyId: string) {
    const s = signatures[policyId]
    return !!s?.parentPrintName.trim() && !!s?.parentSignature
  }

  const canProceed =
    step === 'year' ? pickedYear !== null :
    step === 'child' ? form.childFirstName.trim() !== '' && form.childLastName.trim() !== '' :
    step === 'family' ? form.parent1Name.trim() !== '' :
    step === 'policies' ? (
      policies.length === 0 ||
      (policies.every(p => isPolicySigned(p.id)) && managerName.trim() !== '' && managerSignature !== '')
    ) :
    true

  async function handleSaveAndContinueToFees() {
    if (!pickedYear) return
    setSaving(true)
    const id = await addEnrolment({
      intakeYear: pickedYear,
      childFirstName: form.childFirstName,
      childLastName: form.childLastName,
      childGender: form.childGender || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      childAddress: form.childAddress || undefined,
      childPostcode: form.childPostcode || undefined,
      birthCertificateSeen: form.birthCertificateSeen,
      startDate: form.startDate || undefined,
      parent1Name: form.parent1Name,
      parent1DaytimePhone: form.parent1DaytimePhone || undefined,
      parent1Mobile: form.parent1Mobile || undefined,
      parent1Email: form.parent1Email || undefined,
      parent1Relationship: form.parent1Relationship || undefined,
      parent1ParentalResponsibility: form.parent1ParentalResponsibility,
      parent2Name: form.parent2Name || undefined,
      parent2DaytimePhone: form.parent2DaytimePhone || undefined,
      parent2Mobile: form.parent2Mobile || undefined,
      parent2Email: form.parent2Email || undefined,
      parent2Relationship: form.parent2Relationship || undefined,
      parent2ParentalResponsibility: form.parent2ParentalResponsibility,
      ec1Name: form.ec1Name || undefined,
      ec1DaytimePhone: form.ec1DaytimePhone || undefined,
      ec1Mobile: form.ec1Mobile || undefined,
      ec1Relationship: form.ec1Relationship || undefined,
      ec1CanCollect: form.ec1CanCollect,
      ec2Name: form.ec2Name || undefined,
      ec2DaytimePhone: form.ec2DaytimePhone || undefined,
      ec2Mobile: form.ec2Mobile || undefined,
      ec2Relationship: form.ec2Relationship || undefined,
      ec2CanCollect: form.ec2CanCollect,
      collectionPassword: form.collectionPassword || undefined,
      fundingType: form.fundingType || undefined,
      fundingCode: form.fundingCode || undefined,
      fundingCodeDate: form.fundingCodeDate || undefined,
      fundingNotes: form.fundingNotes || undefined,
      fundingApplicantName: form.fundingApplicantName || undefined,
      fundingApplicantDob: form.fundingApplicantDob || undefined,
      fundingApplicantNi: form.fundingApplicantNi || undefined,
      daysSessions: form.daysSessions,
      childInterests: form.childInterests || undefined,
      attendsOtherSetting: form.attendsOtherSetting,
      attendsOtherSettingDetails: form.attendsOtherSettingDetails || undefined,
      parentConcerns: form.parentConcerns,
      parentConcernsDetails: form.parentConcernsDetails || undefined,
      immunisationsUpToDate: form.immunisationsUpToDate ?? undefined,
      immunisationsSignature: form.immunisationsSignature || undefined,
      doctorName: form.doctorName || undefined,
      doctorPracticeName: form.doctorPracticeName || undefined,
      doctorPracticeAddress: form.doctorPracticeAddress || undefined,
      doctorPhone: form.doctorPhone || undefined,
      dentistName: form.dentistName || undefined,
      dentistPhone: form.dentistPhone || undefined,
      otherProfessionalsInvolved: form.otherProfessionalsInvolved,
      otherProfessionalsDetails: form.otherProfessionalsDetails || undefined,
      hasMedicalConditions: form.hasMedicalConditions,
      medicalConditionsDetails: form.medicalConditionsDetails || undefined,
      takesMedication: form.takesMedication,
      medicationFormData: form.takesMedication ? JSON.stringify(form.medicationForm) : undefined,
      ethnicity: form.ethnicity || undefined,
      religion: form.religion || undefined,
      culturalCelebrations: form.culturalCelebrations || undefined,
      languagesSpokenAtHome: form.languagesSpokenAtHome || undefined,
      mainLanguage: form.mainLanguage || undefined,
      hearAboutUs: form.hearAboutUs || undefined,
      notes: form.notes || undefined,
      policySignatures: Object.entries(signatures).map(([policyId, s]) => ({ policyId, ...s })),
      policiesManagerName: managerName || undefined,
    })
    setSaving(false)
    setSavedEnrolment({
      id, welcomeFeePaid: false, depositPaid: false,
      welcomePackGivenAt: '', tshirtGivenAt: '', settlingSession1: '', settlingSession2: '', settlingSession3: '',
    })
    setStep('fees')
  }

  async function handleEmailInvoice() {
    if (!savedEnrolment) return
    setEmailingInvoice(true)
    setInvoiceEmailResult(null)
    const result = await emailEnrolmentInvoice(savedEnrolment.id)
    setEmailingInvoice(false)
    setInvoiceEmailResult(result)
  }

  function handleOpenInvoice() {
    if (!savedEnrolment || !pickedYear) return
    const html = generateEnrolmentInvoiceHTML({
      firstName: form.childFirstName, lastName: form.childLastName,
      parentCarerName: form.parent1Name, contactEmail: form.parent1Email || null,
      welcomeFeePaid: savedEnrolment.welcomeFeePaid, depositPaid: savedEnrolment.depositPaid,
    }, pickedYear)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 15000)
  }

  function handlePrint() {
    const style = document.createElement('style')
    style.id = 'print-landscape'
    style.textContent = '@media print { @page { size: A4 landscape; margin: 8mm; } }'
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.getElementById('print-landscape')?.remove(), 1000)
  }

  return (
    <div>
      {/* Page header */}
      <div className="print:hidden flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Enrolments</h1>
          <p className="text-sm text-gray-500 mt-0.5">The next three September intakes, always up to date.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="px-4 py-2 bg-[#020e2f] text-white text-sm font-medium rounded-lg hover:bg-[#010922]">🖨 Print</button>
          {isAdmin && (
            <button onClick={openModal} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors">+ Add Child</button>
          )}
        </div>
      </div>

      {/* Cohort sections */}
      {cohorts.map((cohort, i) => (
        <CohortSection
          key={cohort.intakeYear}
          intakeYear={cohort.intakeYear}
          returningChildren={cohort.returningChildren}
          newStarters={cohort.newStarters}
          leavingChildren={cohort.leavingChildren}
          isAdmin={isAdmin}
          staffData={staffData}
          accentIndex={i}
        />
      ))}

      {/* Add Child wizard modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">{STEP_TITLE[step]}</h3>
                {step !== 'year' && step !== 'fees' && (
                  <p className="text-xs text-gray-400 mt-0.5">Step {stepIndex} of {STEPS.length - 2} · September {pickedYear}</p>
                )}
              </div>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* ── Step: Year ───────────────────────────────────────────── */}
              {step === 'year' && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Which intake is this child starting in?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cohorts.map(c => (
                      <button
                        key={c.intakeYear}
                        type="button"
                        onClick={() => { setPickedYear(c.intakeYear); setStep('child') }}
                        className={`px-4 py-4 rounded-lg border text-center transition-colors ${pickedYear === c.intakeYear ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'}`}
                      >
                        <div className="text-lg font-bold text-gray-900">September {c.intakeYear}</div>
                        <div className="text-xs text-gray-500 mt-1">{c.newStarters.length} new starter{c.newStarters.length !== 1 ? 's' : ''} so far</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step: Child's Details ────────────────────────────────── */}
              {step === 'child' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Child first name *" value={form.childFirstName} onChange={v => set('childFirstName', v)} />
                    <Field label="Child last name *" value={form.childLastName} onChange={v => set('childLastName', v)} />
                  </div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <div className="flex gap-2">
                      {['male', 'female'].map(g => (
                        <button key={g} type="button" onClick={() => set('childGender', g)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium border capitalize transition-colors ${form.childGender === g ? 'bg-[#020e2f] text-white border-[#020e2f]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} />
                  <Field label="Full address" value={form.childAddress} onChange={v => set('childAddress', v)} />
                  <Field label="Postcode" value={form.childPostcode} onChange={v => set('childPostcode', v)} />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.birthCertificateSeen} onChange={e => set('birthCertificateSeen', e.target.checked)} className="rounded" />
                    <label className="text-sm text-gray-700">Birth certificate seen</label>
                  </div>
                  <Field label="Start date (only if different from the standard September intake)" type="date" value={form.startDate} onChange={v => set('startDate', v)} />
                </>
              )}

              {/* ── Step: Family Details ─────────────────────────────────── */}
              {step === 'family' && (
                <>
                  <p className="text-sm font-semibold text-gray-700">Parent 1</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name *" value={form.parent1Name} onChange={v => set('parent1Name', v)} />
                    <Field label="Relationship to child" value={form.parent1Relationship} onChange={v => set('parent1Relationship', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Daytime number" value={form.parent1DaytimePhone} onChange={v => set('parent1DaytimePhone', v)} />
                    <Field label="Mobile" value={form.parent1Mobile} onChange={v => set('parent1Mobile', v)} />
                  </div>
                  <Field label="Email address" type="email" value={form.parent1Email} onChange={v => set('parent1Email', v)} />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.parent1ParentalResponsibility} onChange={e => set('parent1ParentalResponsibility', e.target.checked)} className="rounded" />
                    <label className="text-sm text-gray-700">Has parental responsibility</label>
                  </div>

                  <p className="text-sm font-semibold text-gray-700 pt-3 border-t border-gray-100">Parent 2</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name" value={form.parent2Name} onChange={v => set('parent2Name', v)} />
                    <Field label="Relationship to child" value={form.parent2Relationship} onChange={v => set('parent2Relationship', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Daytime number" value={form.parent2DaytimePhone} onChange={v => set('parent2DaytimePhone', v)} />
                    <Field label="Mobile" value={form.parent2Mobile} onChange={v => set('parent2Mobile', v)} />
                  </div>
                  <Field label="Email address" type="email" value={form.parent2Email} onChange={v => set('parent2Email', v)} />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.parent2ParentalResponsibility} onChange={e => set('parent2ParentalResponsibility', e.target.checked)} className="rounded" />
                    <label className="text-sm text-gray-700">Has parental responsibility</label>
                  </div>
                </>
              )}

              {/* ── Step: Emergency Contacts ──────────────────────────────── */}
              {step === 'emergency' && (
                <>
                  <p className="text-xs text-gray-400">Not Parent 1 or 2 — doesn&apos;t need to live locally.</p>
                  <p className="text-sm font-semibold text-gray-700">Emergency contact 1</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name" value={form.ec1Name} onChange={v => set('ec1Name', v)} />
                    <Field label="Relationship to child" value={form.ec1Relationship} onChange={v => set('ec1Relationship', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Daytime number" value={form.ec1DaytimePhone} onChange={v => set('ec1DaytimePhone', v)} />
                    <Field label="Mobile" value={form.ec1Mobile} onChange={v => set('ec1Mobile', v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.ec1CanCollect} onChange={e => set('ec1CanCollect', e.target.checked)} className="rounded" />
                    <label className="text-sm text-gray-700">Has permission to collect child</label>
                  </div>

                  <p className="text-sm font-semibold text-gray-700 pt-3 border-t border-gray-100">Emergency contact 2</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name" value={form.ec2Name} onChange={v => set('ec2Name', v)} />
                    <Field label="Relationship to child" value={form.ec2Relationship} onChange={v => set('ec2Relationship', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Daytime number" value={form.ec2DaytimePhone} onChange={v => set('ec2DaytimePhone', v)} />
                    <Field label="Mobile" value={form.ec2Mobile} onChange={v => set('ec2Mobile', v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.ec2CanCollect} onChange={e => set('ec2CanCollect', e.target.checked)} className="rounded" />
                    <label className="text-sm text-gray-700">Has permission to collect child</label>
                  </div>

                  <Field label="Password for collection" value={form.collectionPassword} onChange={v => set('collectionPassword', v)} />
                </>
              )}

              {/* ── Step: Funding & Sessions ──────────────────────────────── */}
              {step === 'funding' && (
                <>
                  <div>
                    <label className={labelCls}>Funding</label>
                    <select value={form.fundingType} onChange={e => set('fundingType', e.target.value)} className={inputCls}>
                      {FUNDING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {(form.fundingType === 'extended30' || form.fundingType === 'two_year') && (
                    <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Funding code" value={form.fundingCode} onChange={v => set('fundingCode', v)} />
                        <Field label="Code valid from" type="date" value={form.fundingCodeDate} onChange={v => set('fundingCodeDate', v)} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Parent who applied for the code</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Name" value={form.fundingApplicantName} onChange={v => set('fundingApplicantName', v)} />
                        <Field label="Date of birth" type="date" value={form.fundingApplicantDob} onChange={v => set('fundingApplicantDob', v)} />
                      </div>
                      <Field label="NI number" value={form.fundingApplicantNi} onChange={v => set('fundingApplicantNi', v)} />
                    </div>
                  )}
                  <TextArea label="Funding notes" value={form.fundingNotes} onChange={v => set('fundingNotes', v)} />

                  <div>
                    <label className={`${labelCls} mb-2`}>Days & sessions needed</label>
                    <div className="flex gap-4 flex-wrap">
                      {DAYS.map(day => (
                        <div key={day} className="flex flex-col items-center gap-1.5">
                          <button type="button" onClick={() => toggleFormDay(day)}
                            className={`w-14 py-1.5 rounded-lg text-sm font-semibold transition-colors ${day in form.daysSessions ? 'bg-[#020e2f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {DAY_LABEL[day]}
                          </button>
                          {day in form.daysSessions && (
                            <div className="flex flex-col gap-1">
                              {(['morning', 'afternoon', 'full_day'] as const).map(st => (
                                <button key={st} type="button" onClick={() => setFormSession(day, st)}
                                  className={`w-14 py-1 rounded text-xs font-medium transition-colors ${form.daysSessions[day] === st ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                  {SESSION_LABEL[st]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Step: About Your Child ────────────────────────────────── */}
              {step === 'about' && (
                <>
                  <TextArea label="What does your child like to play with?" value={form.childInterests} onChange={v => set('childInterests', v)} rows={3} />
                  <YesNoNote
                    label="Have they attended, or do they currently attend, another setting?"
                    value={form.attendsOtherSetting} onChange={v => set('attendsOtherSetting', v)}
                    note={form.attendsOtherSettingDetails} onNoteChange={v => set('attendsOtherSettingDetails', v)}
                    notePlaceholder="Which setting, and any details…"
                  />
                  <YesNoNote
                    label="As a parent, do you have any concerns or worries about your child?"
                    value={form.parentConcerns} onChange={v => set('parentConcerns', v)}
                    note={form.parentConcernsDetails} onNoteChange={v => set('parentConcernsDetails', v)}
                  />
                </>
              )}

              {/* ── Step: Health Questions ────────────────────────────────── */}
              {step === 'health' && (
                <>
                  <YesNo label="Are your child's immunisations up to date?" value={form.immunisationsUpToDate ?? false} onChange={v => set('immunisationsUpToDate', v)} />
                  <SignaturePad label="Parent signature" onChange={v => set('immunisationsSignature', v)} />

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Doctor's name" value={form.doctorName} onChange={v => set('doctorName', v)} />
                    <Field label="Practice name" value={form.doctorPracticeName} onChange={v => set('doctorPracticeName', v)} />
                  </div>
                  <Field label="Practice address" value={form.doctorPracticeAddress} onChange={v => set('doctorPracticeAddress', v)} />
                  <Field label="Doctor's number" value={form.doctorPhone} onChange={v => set('doctorPhone', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dentist surgery name" value={form.dentistName} onChange={v => set('dentistName', v)} />
                    <Field label="Dentist number" value={form.dentistPhone} onChange={v => set('dentistPhone', v)} />
                  </div>

                  <YesNoNote
                    label="Any other professionals involved with your child?"
                    value={form.otherProfessionalsInvolved} onChange={v => set('otherProfessionalsInvolved', v)}
                    note={form.otherProfessionalsDetails} onNoteChange={v => set('otherProfessionalsDetails', v)}
                  />
                  <YesNoNote
                    label="Does your child suffer from any known medical conditions, allergies or special dietary needs?"
                    value={form.hasMedicalConditions} onChange={v => set('hasMedicalConditions', v)}
                    note={form.medicalConditionsDetails} onNoteChange={v => set('medicalConditionsDetails', v)}
                  />

                  <div>
                    <YesNo
                      label="Does your child regularly take any medication?"
                      value={form.takesMedication}
                      onChange={v => { set('takesMedication', v); setMedFormOpen(v) }}
                    />
                    {form.takesMedication && (
                      <div className="mt-2">
                        {!medFormOpen ? (
                          <button type="button" onClick={() => setMedFormOpen(true)} className="text-xs text-blue-700 hover:underline">
                            {form.medicationForm.name ? 'Edit prescribed medicine details' : 'Open Prescribed Medicine form'}
                          </button>
                        ) : (
                          <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-600">Prescribed Medicine Form</p>
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Condition / diagnosis" value={form.medicationForm.conditionDiagnosis} onChange={v => set('medicationForm', { ...form.medicationForm, conditionDiagnosis: v })} />
                              <Field label="Medication name" value={form.medicationForm.name} onChange={v => set('medicationForm', { ...form.medicationForm, name: v })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Dosage" value={form.medicationForm.dosage} onChange={v => set('medicationForm', { ...form.medicationForm, dosage: v })} />
                              <Field label="Frequency" value={form.medicationForm.frequency} onChange={v => set('medicationForm', { ...form.medicationForm, frequency: v })} />
                            </div>
                            <TextArea label="Symptoms" value={form.medicationForm.conditionSymptoms} onChange={v => set('medicationForm', { ...form.medicationForm, conditionSymptoms: v })} />
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Doctor contact name" value={form.medicationForm.doctorContactName} onChange={v => set('medicationForm', { ...form.medicationForm, doctorContactName: v })} />
                              <Field label="Doctor contact phone" value={form.medicationForm.doctorContactPhone} onChange={v => set('medicationForm', { ...form.medicationForm, doctorContactPhone: v })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Hospital contact name" value={form.medicationForm.hospitalContactName} onChange={v => set('medicationForm', { ...form.medicationForm, hospitalContactName: v })} />
                              <Field label="Hospital contact phone" value={form.medicationForm.hospitalContactPhone} onChange={v => set('medicationForm', { ...form.medicationForm, hospitalContactPhone: v })} />
                            </div>
                            <Field label="Administered at home" value={form.medicationForm.administeredAtHome} onChange={v => set('medicationForm', { ...form.medicationForm, administeredAtHome: v })} />
                            <div className="grid grid-cols-3 gap-3">
                              <Field label="Duration of treatment" value={form.medicationForm.durationOfTreatment} onChange={v => set('medicationForm', { ...form.medicationForm, durationOfTreatment: v })} />
                              <Field label="Date dispensed" type="date" value={form.medicationForm.dateDispensed} onChange={v => set('medicationForm', { ...form.medicationForm, dateDispensed: v })} />
                              <Field label="Expiry date" type="date" value={form.medicationForm.expiryDate} onChange={v => set('medicationForm', { ...form.medicationForm, expiryDate: v })} />
                            </div>
                            <Field label="Storage" value={form.medicationForm.storage} onChange={v => set('medicationForm', { ...form.medicationForm, storage: v })} />
                            <Field label="Special precautions" value={form.medicationForm.specialPrecautions} onChange={v => set('medicationForm', { ...form.medicationForm, specialPrecautions: v })} />
                            <Field label="Possible side effects" value={form.medicationForm.possibleSideEffects} onChange={v => set('medicationForm', { ...form.medicationForm, possibleSideEffects: v })} />
                            <TextArea label="Emergency procedures" value={form.medicationForm.emergencyProcedures} onChange={v => set('medicationForm', { ...form.medicationForm, emergencyProcedures: v })} />
                            <Field label="Parent print name" value={form.medicationForm.parentPrintName} onChange={v => set('medicationForm', { ...form.medicationForm, parentPrintName: v })} />
                            <SignaturePad label="Parent signature" onChange={v => set('medicationForm', { ...form.medicationForm, parentSignature: v })} />
                            <p className="text-[11px] text-gray-400">Saved with this enrolment. A staff signature will be added on the full Prescribed Medicine form once {form.childFirstName || 'the child'} starts.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Step: Ethnicity, Culture & Language ───────────────────── */}
              {step === 'culture' && (
                <>
                  <Field label="How would you describe your child's ethnicity or cultural background?" value={form.ethnicity} onChange={v => set('ethnicity', v)} />
                  <Field label="Family religion (if applicable)" value={form.religion} onChange={v => set('religion', v)} />
                  <TextArea label="Are there any special occasions celebrated in your culture/home that your child will be taking part in and you would like acknowledged and celebrated whilst in our setting?" value={form.culturalCelebrations} onChange={v => set('culturalCelebrations', v)} rows={3} />
                  <Field label="What languages are spoken at home?" value={form.languagesSpokenAtHome} onChange={v => set('languagesSpokenAtHome', v)} />
                  <Field label="What is their main language?" value={form.mainLanguage} onChange={v => set('mainLanguage', v)} />
                  <Field label="How did you hear about our school?" value={form.hearAboutUs} onChange={v => set('hearAboutUs', v)} />
                  <TextArea label="Any other notes" value={form.notes} onChange={v => set('notes', v)} />
                </>
              )}

              {/* ── Step: Policies ─────────────────────────────────────────── */}
              {step === 'policies' && !signingManager && (
                policies.length === 0 ? (
                  <p className="text-sm text-gray-400">No policies have been added yet. Ask an admin to add your policies, then come back to this step — for now you can continue.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-1">Open each policy to read and sign it. Once all are signed, a member of staff signs once at the end.</p>
                    {policies.map(p => {
                      const signed = isPolicySigned(p.id) ? signatures[p.id] : null
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActivePolicyId(p.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${signed ? 'border-green-300 bg-green-50 hover:bg-green-100' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <span className="text-sm font-medium text-gray-800">{p.name}</span>
                          {signed
                            ? <span className="text-xs text-green-700 font-medium shrink-0 ml-2">✓ Signed by {signed.parentPrintName}</span>
                            : <span className="text-xs text-blue-700 font-medium shrink-0 ml-2">Open to read & sign →</span>
                          }
                        </button>
                      )
                    })}
                    {policies.every(p => isPolicySigned(p.id)) && (
                      <button
                        type="button"
                        onClick={() => setSigningManager(true)}
                        className="mt-2 w-full px-3 py-2.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100"
                      >
                        All policies signed — staff sign-off →
                      </button>
                    )}
                  </div>
                )
              )}

              {/* ── Step: Policies — manager sign-off ─────────────────────── */}
              {step === 'policies' && signingManager && (
                <div className="space-y-3">
                  <button type="button" onClick={() => setSigningManager(false)} className="text-xs text-blue-700 hover:underline">← Back to policies</button>
                  <p className="text-sm text-gray-600">
                    {policies.length} polic{policies.length !== 1 ? 'ies' : 'y'} signed by {form.parent1Name || 'the parent/carer'}. One staff sign-off covers all of them.
                  </p>
                  <Field label="Staff member name" value={managerName} onChange={setManagerName} />
                  <SignaturePad label="Staff signature" onChange={setManagerSignature} />
                </div>
              )}

              {/* ── Policy document popup ─────────────────────────────────── */}
              {activePolicyId && (() => {
                const p = policies.find(pol => pol.id === activePolicyId)
                if (!p) return null
                const draft = signatures[p.id] ?? { parentPrintName: '', parentSignature: '', notes: '' }
                return (
                  <div className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl my-4 rounded" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#020e2f]">
                        <div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">Winton Pre-School Little Explorers</div>
                          <h3 className="text-base font-bold text-[#020e2f]">{p.name}</h3>
                        </div>
                        <button type="button" onClick={() => setActivePolicyId(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
                      </div>
                      <div className="px-6 py-4 max-h-[50vh] overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border-b border-gray-100">
                        {p.content}
                      </div>
                      <div className="px-6 py-4 space-y-3 bg-gray-50">
                        {p.name.toLowerCase().includes('information sharing') && (
                          <TextArea
                            label="Exceptions (optional)"
                            value={draft.notes}
                            onChange={v => setSignatures(s => ({ ...s, [p.id]: { ...draft, notes: v } }))}
                          />
                        )}
                        <Field label="Parent / carer print name" value={draft.parentPrintName} onChange={v => setSignatures(s => ({ ...s, [p.id]: { ...draft, parentPrintName: v } }))} />
                        <SignaturePad label="Parent / carer signature" onChange={sig => setSignatures(s => ({ ...s, [p.id]: { ...draft, parentSignature: sig } }))} />
                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            disabled={!draft.parentPrintName.trim() || !draft.parentSignature}
                            onClick={() => setActivePolicyId(null)}
                            className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
                          >
                            Sign & close
                          </button>
                          <button type="button" onClick={() => setActivePolicyId(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Close without signing</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── Step: Fees ─────────────────────────────────────────────── */}
              {step === 'fees' && savedEnrolment && (
                <div className="space-y-3">
                  <p className="text-sm text-green-700 font-medium">✓ {form.childFirstName} {form.childLastName} saved to September {pickedYear} enrolments.</p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Welcome fee &amp; deposit invoice</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={handleEmailInvoice}
                        disabled={emailingInvoice}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {emailingInvoice ? 'Sending…' : '✉ Email invoice to parent'}
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenInvoice}
                        className="text-sm text-blue-700 border border-blue-300 rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors"
                      >
                        Open invoice
                      </button>
                    </div>
                    {invoiceEmailResult && (
                      invoiceEmailResult.ok
                        ? <p className="text-xs text-green-700 mt-2">✓ Invoice emailed to the parent.</p>
                        : <p className="text-xs text-red-600 mt-2">Couldn&apos;t send: {invoiceEmailResult.error}</p>
                    )}
                  </div>

                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">Already paid in person? Mark as received</summary>
                    <div className="flex items-start gap-3 flex-wrap mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !savedEnrolment.welcomeFeePaid
                          setSavedEnrolment(s => s ? { ...s, welcomeFeePaid: next } : s)
                          updateEnrolmentFee(savedEnrolment.id, 'welcomeFeePaid', next)
                        }}
                        className={`flex items-start gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${savedEnrolment.welcomeFeePaid ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-500'}`}
                      >
                        <span className="mt-0.5">{savedEnrolment.welcomeFeePaid ? '✓' : '○'}</span>
                        <div>Welcome fee £50 received</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !savedEnrolment.depositPaid
                          setSavedEnrolment(s => s ? { ...s, depositPaid: next } : s)
                          updateEnrolmentFee(savedEnrolment.id, 'depositPaid', next)
                        }}
                        className={`flex items-start gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${savedEnrolment.depositPaid ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-500'}`}
                      >
                        <span className="mt-0.5">{savedEnrolment.depositPaid ? '✓' : '○'}</span>
                        <div>Deposit £50 received</div>
                      </button>
                    </div>
                  </details>

                  <div className="border-t border-gray-100 pt-3 space-y-3">
                    <p className="text-xs font-semibold text-gray-600">Welcome pack &amp; settling in</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Welcome pack given" type="date"
                        value={savedEnrolment.welcomePackGivenAt}
                        onChange={v => { setSavedEnrolment(s => s ? { ...s, welcomePackGivenAt: v } : s); updateEnrolmentAdminField(savedEnrolment.id, 'welcomePackGivenAt', v) }}
                      />
                      <Field
                        label="Polo shirt given" type="date"
                        value={savedEnrolment.tshirtGivenAt}
                        onChange={v => { setSavedEnrolment(s => s ? { ...s, tshirtGivenAt: v } : s); updateEnrolmentAdminField(savedEnrolment.id, 'tshirtGivenAt', v) }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">Settling-in sessions — can be left blank and filled in later once booked.</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Field
                        label="Session 1" type="date"
                        value={savedEnrolment.settlingSession1}
                        onChange={v => { setSavedEnrolment(s => s ? { ...s, settlingSession1: v } : s); updateEnrolmentAdminField(savedEnrolment.id, 'settlingSession1', v) }}
                      />
                      <Field
                        label="Session 2" type="date"
                        value={savedEnrolment.settlingSession2}
                        onChange={v => { setSavedEnrolment(s => s ? { ...s, settlingSession2: v } : s); updateEnrolmentAdminField(savedEnrolment.id, 'settlingSession2', v) }}
                      />
                      <Field
                        label="Session 3" type="date"
                        value={savedEnrolment.settlingSession3}
                        onChange={v => { setSavedEnrolment(s => s ? { ...s, settlingSession3: v } : s); updateEnrolmentAdminField(savedEnrolment.id, 'settlingSession3', v) }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
              <div>
                {step !== 'year' && step !== 'fees' && (
                  <button type="button" onClick={goBack} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button>
                )}
              </div>
              <div className="flex gap-3">
                {step === 'fees' ? (
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg">Done</button>
                ) : step === 'policies' ? (
                  <button
                    type="button"
                    onClick={handleSaveAndContinueToFees}
                    disabled={!canProceed || saving}
                    className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save & continue'}
                  </button>
                ) : step !== 'year' ? (
                  <button type="button" onClick={goNext} disabled={!canProceed} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">Next →</button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
