'use client'

import { useState, useRef, useEffect } from 'react'
import { addMedication, deleteMedication } from '../actions'
import MedicationPrintView from './MedicationPrintView'

type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  adminConsent: boolean
  notes: string | null
  formDate: string | null
  conditionDiagnosis: string | null
  conditionSymptoms: string | null
  hospitalContactName: string | null
  hospitalContactPhone: string | null
  doctorContactName: string | null
  doctorContactPhone: string | null
  administeredAtHome: string | null
  durationOfTreatment: string | null
  dateDispensed: string | null
  storage: string | null
  expiryDate: string | null
  specialPrecautions: string | null
  possibleSideEffects: string | null
  emergencyProcedures: string | null
  parentSignature: string | null
  parentPrintName: string | null
  staffSignature: string | null
  staffPrintName: string | null
  signedDate: string | null
}

type Contact = {
  id: string
  name: string
  relationship: string
  phone: string
}

type Child = {
  firstName: string
  lastName: string
  dateOfBirth: string
  address: string | null
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
      return {
        x: (e.clientX - rect.left) * (el.width / rect.width),
        y: (e.clientY - rect.top) * (el.height / rect.height),
      }
    }
    function onDown(e: MouseEvent | TouchEvent) {
      e.preventDefault(); drawing.current = true; lastPos.current = getPos('touches' in e ? e.touches[0] : e)
    }
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
      drawing.current = false; lastPos.current = null; setHasDrawn(true)
      onChangeRef.current(el.toDataURL())
    }
    el.addEventListener('mousedown', onDown); el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseup', onUp); el.addEventListener('mouseleave', onUp)
    el.addEventListener('touchstart', onDown, { passive: false }); el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onUp, { passive: false })
    return () => {
      el.removeEventListener('mousedown', onDown); el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseup', onUp); el.removeEventListener('mouseleave', onUp)
      el.removeEventListener('touchstart', onDown); el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onUp)
    }
  }, [])

  function clear() {
    const el = canvasRef.current
    if (!el) return
    el.getContext('2d')!.clearRect(0, 0, el.width, el.height)
    setHasDrawn(false); onChangeRef.current('')
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} width={400} height={80} className="w-full touch-none block" />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm select-none">Sign here</span>
          </div>
        )}
      </div>
      {hasDrawn && (
        <button type="button" onClick={clear} className="mt-1 text-xs text-gray-400 hover:text-gray-600">Clear</button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type FormState = {
  // Page 1
  formDate: string
  conditionDiagnosis: string
  hospitalContactName: string
  hospitalContactPhone: string
  doctorContactName: string
  doctorContactPhone: string
  // Page 2
  conditionSymptoms: string
  administeredAtHome: string
  name: string
  durationOfTreatment: string
  dateDispensed: string
  dosage: string
  frequency: string
  storage: string
  expiryDate: string
  specialPrecautions: string
  possibleSideEffects: string
  emergencyProcedures: string
  adminConsent: boolean
  parentSignature: string
  parentPrintName: string
  staffSignature: string
  staffPrintName: string
  signedDate: string
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM: FormState = {
  formDate: todayStr(), conditionDiagnosis: '',
  hospitalContactName: '', hospitalContactPhone: '',
  doctorContactName: '', doctorContactPhone: '',
  conditionSymptoms: '', administeredAtHome: '',
  name: '', durationOfTreatment: '', dateDispensed: '',
  dosage: '', frequency: '', storage: '', expiryDate: '',
  specialPrecautions: '', possibleSideEffects: '', emergencyProcedures: '',
  adminConsent: false,
  parentSignature: '', parentPrintName: '',
  staffSignature: '', staffPrintName: '',
  signedDate: todayStr(),
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'
const lbl = 'block text-xs text-gray-500 mb-1'
const ta = `${inp} resize-none`

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#020e2f] text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">{children}</div>
}

export default function MedicationsSection({
  childId,
  medications,
  contacts,
  child,
}: {
  childId: string
  medications: Medication[]
  contacts: Contact[]
  child: Child
}) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState<Medication | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleAdd() {
    if (!form.name) return
    setSaving(true)
    await addMedication(childId, {
      name: form.name,
      dosage: form.dosage,
      frequency: form.frequency,
      adminConsent: form.adminConsent,
      formDate: form.formDate,
      conditionDiagnosis: form.conditionDiagnosis,
      conditionSymptoms: form.conditionSymptoms,
      hospitalContactName: form.hospitalContactName,
      hospitalContactPhone: form.hospitalContactPhone,
      doctorContactName: form.doctorContactName,
      doctorContactPhone: form.doctorContactPhone,
      administeredAtHome: form.administeredAtHome,
      durationOfTreatment: form.durationOfTreatment,
      dateDispensed: form.dateDispensed,
      storage: form.storage,
      expiryDate: form.expiryDate,
      specialPrecautions: form.specialPrecautions,
      possibleSideEffects: form.possibleSideEffects,
      emergencyProcedures: form.emergencyProcedures,
      parentSignature: form.parentSignature,
      parentPrintName: form.parentPrintName,
      staffSignature: form.staffSignature,
      staffPrintName: form.staffPrintName,
      signedDate: form.signedDate,
    })
    setForm({ ...EMPTY_FORM, formDate: todayStr(), signedDate: todayStr() })
    setSaving(false)
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Prescribed Medicines</h2>
        <button
          onClick={() => setAdding(a => !a)}
          className="text-xs text-blue-800 hover:text-blue-900 font-medium"
        >
          {adding ? 'Cancel' : '+ Add prescribed medicine form'}
        </button>
      </div>

      {/* Existing medication forms list */}
      {medications.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No prescribed medicine forms on record.</p>
      )}
      <div className="space-y-2 mb-4">
        {medications.map(m => (
          <div key={m.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <span className="text-sm font-medium text-gray-900">{m.name}</span>
              {m.adminConsent && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Staff may administer</span>
              )}
              {m.formDate && <span className="ml-2 text-xs text-gray-400">{fmtDate(m.formDate)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrinting(m)}
                className="text-xs text-[#020e2f] border border-[#020e2f]/20 rounded-lg px-3 py-1 hover:bg-[#020e2f]/5"
              >
                View / Print
              </button>
              <button
                onClick={() => deleteMedication(m.id, childId)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add form modal ── */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">Administration of Prescribed Medicine</h2>
                <p className="text-xs text-gray-400 mt-0.5">{child.firstName} {child.lastName}</p>
              </div>
              <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* ── Page 1 ── */}
              <SectionHeading>Page 1 — Child &amp; Contact Details</SectionHeading>

              {/* Child info (read-only) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <div><span className="text-xs text-gray-400">Child name: </span><span className="font-medium text-gray-800">{child.firstName} {child.lastName}</span></div>
                <div><span className="text-xs text-gray-400">DOB: </span><span className="font-medium text-gray-800">{fmtDate(child.dateOfBirth)}</span></div>
                {child.address && <div className="col-span-2"><span className="text-xs text-gray-400">Address: </span><span className="text-gray-700">{child.address}</span></div>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Date *</label>
                  <input type="date" value={form.formDate} onChange={e => set('formDate', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Condition / diagnosis</label>
                  <input value={form.conditionDiagnosis} onChange={e => set('conditionDiagnosis', e.target.value)} placeholder="e.g. Asthma, ear infection" className={inp} />
                </div>
              </div>

              {/* Contacts — auto-filled notice */}
              {contacts.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                  Family contacts will be pulled from this child's emergency contacts when printing the form.
                </div>
              )}

              {/* Hospital / Doctor contacts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hospital Contact</div>
                  <div>
                    <label className={lbl}>Name</label>
                    <input value={form.hospitalContactName} onChange={e => set('hospitalContactName', e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Phone No.</label>
                    <input value={form.hospitalContactPhone} onChange={e => set('hospitalContactPhone', e.target.value)} className={inp} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Doctor's Contact</div>
                  <div>
                    <label className={lbl}>Name</label>
                    <input value={form.doctorContactName} onChange={e => set('doctorContactName', e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Phone No.</label>
                    <input value={form.doctorContactPhone} onChange={e => set('doctorContactPhone', e.target.value)} className={inp} />
                  </div>
                </div>
              </div>

              {/* ── Page 2 ── */}
              <SectionHeading>Page 2 — Medication Details</SectionHeading>

              <div>
                <label className={lbl}>Describe the condition and individual symptoms</label>
                <textarea rows={3} value={form.conditionSymptoms} onChange={e => set('conditionSymptoms', e.target.value)} className={ta} />
              </div>

              <div>
                <label className={lbl}>Medication administered at home (what and when)</label>
                <input value={form.administeredAtHome} onChange={e => set('administeredAtHome', e.target.value)} className={inp} />
              </div>

              <div>
                <label className={lbl}>Name / type of medication <span className="text-gray-400">(as on the container)</span> *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Amoxicillin 250mg/5ml" className={inp} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Duration of treatment</label>
                  <input value={form.durationOfTreatment} onChange={e => set('durationOfTreatment', e.target.value)} placeholder="e.g. 5 days, ongoing" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Date dispensed</label>
                  <input type="date" value={form.dateDispensed} onChange={e => set('dateDispensed', e.target.value)} className={inp} />
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Full directions for use</div>
                <div>
                  <label className={lbl}>Dosage and method</label>
                  <input value={form.dosage} onChange={e => set('dosage', e.target.value)} placeholder="e.g. 5ml, by mouth" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Timing</label>
                  <input value={form.frequency} onChange={e => set('frequency', e.target.value)} placeholder="e.g. Once daily at lunchtime" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>How it should be stored</label>
                    <input value={form.storage} onChange={e => set('storage', e.target.value)} placeholder="e.g. Refrigerate" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Expiry date</label>
                    <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} className={inp} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Special precautions</label>
                  <input value={form.specialPrecautions} onChange={e => set('specialPrecautions', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Any possible side effects</label>
                  <input value={form.possibleSideEffects} onChange={e => set('possibleSideEffects', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Procedures to take in an emergency</label>
                  <textarea rows={2} value={form.emergencyProcedures} onChange={e => set('emergencyProcedures', e.target.value)} className={ta} />
                </div>
              </div>

              {/* Admin consent */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.adminConsent} onChange={e => set('adminConsent', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">Parent consent for staff to administer this medicine</span>
              </label>

              {/* Signatures */}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Signatures</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SignaturePad label="Parent signature" onChange={sig => set('parentSignature', sig)} />
                    <div>
                      <label className={lbl}>Parent print name</label>
                      <input value={form.parentPrintName} onChange={e => set('parentPrintName', e.target.value)} className={inp} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <SignaturePad label="Staff signature" onChange={sig => set('staffSignature', sig)} />
                    <div>
                      <label className={lbl}>Staff print name</label>
                      <input value={form.staffPrintName} onChange={e => set('staffPrintName', e.target.value)} className={inp} />
                    </div>
                  </div>
                </div>
                <div className="max-w-xs">
                  <label className={lbl}>Date signed</label>
                  <input type="date" value={form.signedDate} onChange={e => set('signedDate', e.target.value)} className={inp} />
                </div>
              </div>

            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button
                onClick={handleAdd}
                disabled={saving || !form.name}
                className="px-6 py-2 bg-[#020e2f] hover:bg-[#010922] text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save form'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print view overlay */}
      {printing && (
        <MedicationPrintView
          medication={printing}
          child={child}
          contacts={contacts.map(c => ({ name: c.name, relationship: c.relationship, phone: c.phone }))}
          onClose={() => setPrinting(null)}
        />
      )}
    </div>
  )
}
