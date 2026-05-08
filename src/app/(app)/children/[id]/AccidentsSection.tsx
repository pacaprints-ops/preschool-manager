'use client'

import { useState, useRef, useEffect } from 'react'
import { addAccidentForm, signAccidentForm, updateAccidentDsl } from '../actions'
import AccidentPrintView from './AccidentPrintView'

type Accident = {
  form: {
    id: string
    incidentDate: Date
    incidentType: string
    incidentLocation: string | null
    description: string
    injury: string
    actionTaken: string
    isHeadInjury: boolean
    headInjuryAdviceGiven: boolean
    headInjuryMonitoringFollowed: boolean
    firstAidPersonId: string | null
    firstAidAdministered: string | null
    reporterJobRole: string | null
    reporterSignature: string | null
    firstAiderSignature: string | null
    bodyLocation: string | null
    parentNotified: boolean
    parentNotifiedAt: Date | null
    parentCarerName: string | null
    parentSignature: string | null
    parentSignedAt: Date | null
    previousConcerns: string | null
    previousConcernsOther: string | null
    dslInformedAt: Date | null
  }
  reporterName: string | null
}

type Staff = { id: string; name: string }

type Child = {
  firstName: string
  lastName: string
  dateOfBirth: string
  address: string | null
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'
const label = 'block text-xs text-gray-500 mb-1'

function fmtDt(d: Date | string) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const CONCERNS = ['injury', 'health', 'developmental', 'safeguarding', 'other'] as const

// ─── Body diagram ─────────────────────────────────────────────────────────────

function BodyDiagram({
  location,
  onPlace,
  compact = false,
}: {
  location: { x: number; y: number } | null
  onPlace?: (loc: { x: number; y: number } | null) => void
  compact?: boolean
}) {
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onPlace) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 220
    onPlace({ x, y })
  }

  const skin = '#fcd9bd'
  const skinBorder = '#e8a87c'
  const clothes = '#dbeafe'
  const clothesBorder = '#93c5fd'

  return (
    <div className="flex flex-col items-center gap-1">
      {onPlace && (
        <p className="text-xs text-gray-400 text-center">Tap to mark injury</p>
      )}
      <svg
        viewBox="0 0 100 220"
        className={`${compact ? 'w-14' : 'w-full max-w-[130px]'} ${onPlace ? 'cursor-crosshair' : ''}`}
        onClick={handleClick}
      >
        {/* Head */}
        <circle cx="50" cy="16" r="13" fill={skin} stroke={skinBorder} strokeWidth="1.5" />
        {/* Eyes */}
        <circle cx="44" cy="13" r="2" fill="#374151" />
        <circle cx="56" cy="13" r="2" fill="#374151" />
        {/* Eye shine */}
        <circle cx="45" cy="12.2" r="0.7" fill="white" />
        <circle cx="57" cy="12.2" r="0.7" fill="white" />
        {/* Nose */}
        <ellipse cx="50" cy="17.5" r="1.2" ry="0.9" fill={skinBorder} />
        {/* Smile */}
        <path d="M 45.5,21 Q 50,24.5 54.5,21" stroke={skinBorder} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* Ears */}
        <ellipse cx="36" cy="16" rx="2.5" ry="3.5" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
        <ellipse cx="64" cy="16" rx="2.5" ry="3.5" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
        {/* Neck */}
        <rect x="45" y="28" width="10" height="8" rx="3" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
        {/* Torso */}
        <rect x="27" y="35" width="46" height="56" rx="10" fill={clothes} stroke={clothesBorder} strokeWidth="1.5" />
        {/* Left arm */}
        <rect x="8" y="37" width="17" height="56" rx="8" fill={clothes} stroke={clothesBorder} strokeWidth="1.3" />
        {/* Right arm */}
        <rect x="75" y="37" width="17" height="56" rx="8" fill={clothes} stroke={clothesBorder} strokeWidth="1.3" />
        {/* Left hand */}
        <ellipse cx="16.5" cy="97" rx="8" ry="6" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
        {/* Right hand */}
        <ellipse cx="83.5" cy="97" rx="8" ry="6" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
        {/* Left leg */}
        <rect x="28" y="91" width="19" height="96" rx="9" fill={clothes} stroke={clothesBorder} strokeWidth="1.3" />
        {/* Right leg */}
        <rect x="53" y="91" width="19" height="96" rx="9" fill={clothes} stroke={clothesBorder} strokeWidth="1.3" />
        {/* Left foot */}
        <ellipse cx="37" cy="194" rx="14" ry="7" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
        {/* Right foot */}
        <ellipse cx="62" cy="194" rx="14" ry="7" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
        {/* Injury marker */}
        {location && (
          <>
            <circle cx={location.x} cy={location.y} r="7" fill="#ef4444" opacity="0.2" />
            <circle cx={location.x} cy={location.y} r="4" fill="#ef4444" />
            <circle cx={location.x} cy={location.y} r="1.5" fill="white" />
          </>
        )}
      </svg>
      {onPlace && location && (
        <button
          type="button"
          onClick={() => onPlace(null)}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          Clear
        </button>
      )}
    </div>
  )
}

// ─── Signature pad ────────────────────────────────────────────────────────────

function SignaturePad({ onChange }: { onChange: (data: string) => void }) {
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
      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} width={400} height={100} className="w-full touch-none block" />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm select-none">Sign here</span>
          </div>
        )}
      </div>
      {hasDrawn && (
        <button type="button" onClick={clear} className="mt-1 text-xs text-gray-400 hover:text-red-500">
          Clear signature
        </button>
      )}
    </div>
  )
}

// ─── Inline signing (unsigned forms in the log) ───────────────────────────────

function InlineSign({ formId, childId, onDone }: { formId: string; childId: string; onDone: () => void }) {
  const [sig, setSig] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!sig) return
    setSaving(true)
    await signAccidentForm(formId, childId, sig, name.trim() || undefined)
    setSaving(false)
    onDone()
  }

  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
      <p className="text-xs font-medium text-amber-700">Parent / guardian signature required</p>
      <div>
        <label className={label}>Parent / carer name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className={inp} />
      </div>
      <SignaturePad onChange={setSig} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!sig || saving}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save signature'}
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </div>
  )
}

// ─── DSL inline edit ──────────────────────────────────────────────────────────

function DslPanel({ formId, childId, form, onDone }: {
  formId: string
  childId: string
  form: Accident['form']
  onDone: () => void
}) {
  const existing: string[] = form.previousConcerns ? JSON.parse(form.previousConcerns) : []
  const [concerns, setConcerns] = useState<string[]>(existing)
  const [other, setOther] = useState(form.previousConcernsOther ?? '')
  const [dslAt, setDslAt] = useState(
    form.dslInformedAt ? new Date(form.dslInformedAt).toISOString().slice(0, 16) : ''
  )
  const [saving, setSaving] = useState(false)

  function toggle(c: string) {
    setConcerns(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c])
  }

  async function handleSave() {
    setSaving(true)
    await updateAccidentDsl(formId, childId, {
      previousConcerns: concerns.length > 0 ? JSON.stringify(concerns) : undefined,
      previousConcernsOther: other.trim() || undefined,
      dslInformedAt: dslAt || undefined,
    })
    setSaving(false)
    onDone()
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      <p className="text-xs font-semibold text-blue-800">DSL — Information passed to Designated Safeguarding Lead</p>

      <div>
        <p className="text-xs text-gray-600 mb-2">Previous incident concerns (tick all that apply):</p>
        <div className="flex flex-wrap gap-3">
          {CONCERNS.map(c => (
            <label key={c} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" checked={concerns.includes(c)} onChange={() => toggle(c)} className="rounded" />
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </label>
          ))}
        </div>
        {concerns.includes('other') && (
          <input
            value={other}
            onChange={e => setOther(e.target.value)}
            placeholder="Describe other concern…"
            className={`${inp} mt-2`}
          />
        )}
      </div>

      <div>
        <label className={label}>Date & time information shared with DSL</label>
        <input type="datetime-local" value={dslAt} onChange={e => setDslAt(e.target.value)} className={inp} />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs rounded-lg disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function blank(userId: string) {
  return {
    incidentDate: new Date().toISOString().slice(0, 16),
    incidentType: 'within_provision',
    incidentLocation: '',
    description: '',
    injury: '',
    actionTaken: '',
    isHeadInjury: false,
    headInjuryAdviceGiven: false,
    headInjuryMonitoringFollowed: false,
    reportedById: userId,
    reporterJobRole: '',
    reporterSignature: '',
    firstAidSamePerson: true,
    firstAidPersonId: '',
    firstAidAdministered: '',
    firstAiderSignature: '',
    bodyLocation: null as { x: number; y: number } | null,
    parentNotified: false,
    parentNotifiedAt: '',
    parentCarerName: '',
    parentSignature: '',
    previousConcerns: [] as string[],
    previousConcernsOther: '',
    dslInformedAt: '',
  }
}

export default function AccidentsSection({
  childId,
  accidents,
  userId,
  staff,
  child,
}: {
  childId: string
  accidents: Accident[]
  userId: string
  staff: Staff[]
  child: Child
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [signingId, setSigningId] = useState<string | null>(null)
  const [dslId, setDslId] = useState<string | null>(null)
  const [printForm, setPrintForm] = useState<Accident | null>(null)

  const [fd, setFd] = useState(() => blank(userId))

  function reset() { setFd(blank(userId)) }

  function set<K extends keyof typeof fd>(k: K, v: typeof fd[K]) {
    setFd(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!fd.description || !fd.injury || !fd.actionTaken) return
    setSaving(true)
    await addAccidentForm(childId, fd.reportedById || userId, {
      incidentDate: fd.incidentDate,
      incidentType: fd.incidentType,
      incidentLocation: fd.incidentLocation || undefined,
      description: fd.description,
      injury: fd.injury,
      actionTaken: fd.actionTaken,
      isHeadInjury: fd.isHeadInjury,
      headInjuryAdviceGiven: fd.headInjuryAdviceGiven,
      headInjuryMonitoringFollowed: fd.headInjuryMonitoringFollowed,
      firstAidPersonId: fd.firstAidSamePerson ? (fd.reportedById || userId) : (fd.firstAidPersonId || undefined),
      firstAidAdministered: fd.firstAidAdministered || undefined,
      reporterJobRole: fd.reporterJobRole || undefined,
      reporterSignature: fd.reporterSignature || undefined,
      firstAiderSignature: fd.firstAidSamePerson ? (fd.reporterSignature || undefined) : (fd.firstAiderSignature || undefined),
      bodyLocation: fd.bodyLocation ? JSON.stringify(fd.bodyLocation) : undefined,
      parentNotified: fd.parentNotified,
      parentNotifiedAt: fd.parentNotifiedAt || undefined,
      parentCarerName: fd.parentCarerName || undefined,
      parentSignature: fd.parentSignature || undefined,
      previousConcerns: fd.previousConcerns.length > 0 ? JSON.stringify(fd.previousConcerns) : undefined,
      previousConcernsOther: fd.previousConcernsOther || undefined,
      dslInformedAt: fd.dslInformedAt || undefined,
    })
    setSaving(false)
    reset()
    setModalOpen(false)
  }

  const unsignedCount = accidents.filter(a => !a.form.parentSignature).length

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Accident Forms</h2>
          {unsignedCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {unsignedCount} unsigned
            </span>
          )}
        </div>
        <button
          onClick={() => { reset(); setModalOpen(true) }}
          className="text-xs text-blue-800 hover:text-blue-900"
        >
          + Add
        </button>
      </div>

      {accidents.length === 0 && (
        <p className="text-sm text-gray-400">No accident forms recorded.</p>
      )}

      {/* Accident log */}
      <div className="space-y-2">
        {accidents.map(({ form: a, reporterName }) => {
          const loc = a.bodyLocation ? JSON.parse(a.bodyLocation) as { x: number; y: number } : null
          const isExpanded = expandedId === a.id
          const isSigning = signingId === a.id
          const isDsl = dslId === a.id
          const signed = !!a.parentSignature
          const concerns: string[] = a.previousConcerns ? JSON.parse(a.previousConcerns) : []
          const firstAider = staff.find(s => s.id === a.firstAidPersonId)

          return (
            <div key={a.id} className={`rounded-lg border text-sm overflow-hidden ${signed ? 'border-gray-200' : 'border-amber-200 bg-amber-50'}`}>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">
                    {new Date(a.incidentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}
                    <span className="font-normal text-gray-500 text-xs">
                      {new Date(a.incidentDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                  <span className="text-gray-500 text-xs truncate max-w-[180px]">{a.injury}</span>
                  {a.isHeadInjury && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Head injury</span>
                  )}
                  {!signed && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">⚠ Needs signature</span>
                  )}
                </div>
                <span className="text-gray-400 text-xs ml-2">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
                  {/* Top row: diagram + incident details */}
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <BodyDiagram location={loc} compact={false} />
                    </div>
                    <div className="flex-1 space-y-2 text-sm">
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.incidentType === 'out_of_setting' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {a.incidentType === 'out_of_setting' ? 'Out of setting' : 'Within provision'}
                        </span>
                        {a.incidentLocation && (
                          <span className="text-xs text-gray-500">📍 {a.incidentLocation}</span>
                        )}
                      </div>
                      <div><span className="font-medium text-gray-700">Details: </span><span className="text-gray-600">{a.description}</span></div>
                      <div><span className="font-medium text-gray-700">Injury: </span><span className="text-gray-600">{a.injury}</span></div>
                      <div><span className="font-medium text-gray-700">Action taken: </span><span className="text-gray-600">{a.actionTaken}</span></div>
                      {a.firstAidAdministered && (
                        <div><span className="font-medium text-gray-700">First aid: </span><span className="text-gray-600">{a.firstAidAdministered}{firstAider ? ` (${firstAider.name})` : ''}</span></div>
                      )}
                      <div className="text-xs text-gray-400">
                        Reported by {reporterName ?? 'Unknown'}
                        {a.parentNotified && ` · Parent notified${a.parentNotifiedAt ? ' ' + fmtDt(a.parentNotifiedAt) : ''}`}
                      </div>
                    </div>
                  </div>

                  {/* Head injury */}
                  {a.isHeadInjury && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-semibold text-red-700">Head injury</p>
                      <p className={a.headInjuryAdviceGiven ? 'text-green-700' : 'text-gray-400'}>
                        {a.headInjuryAdviceGiven ? '✓' : '✗'} Advice given to parent/carer
                      </p>
                      <p className={a.headInjuryMonitoringFollowed ? 'text-green-700' : 'text-gray-400'}>
                        {a.headInjuryMonitoringFollowed ? '✓' : '✗'} Head injury monitoring followed
                      </p>
                    </div>
                  )}

                  {/* Parent signature */}
                  {signed ? (
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-xs text-green-600 font-medium mb-1">
                        Signed by {a.parentCarerName ?? 'parent/carer'}{a.parentSignedAt ? ' · ' + new Date(a.parentSignedAt).toLocaleDateString('en-GB') : ''}
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.parentSignature!} alt="Parent signature" className="border border-gray-200 rounded max-h-16 bg-white" />
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 pt-2">
                      {!isSigning && (
                        <button
                          type="button"
                          onClick={() => setSigningId(a.id)}
                          className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg"
                        >
                          Get parent signature
                        </button>
                      )}
                    </div>
                  )}

                  {isSigning && !signed && (
                    <InlineSign formId={a.id} childId={childId} onDone={() => setSigningId(null)} />
                  )}

                  {/* DSL section */}
                  <div className="border-t border-gray-100 pt-2">
                    {!isDsl ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {concerns.length > 0 ? (
                            <span className="text-blue-700 font-medium">DSL concerns: {concerns.join(', ')}{a.previousConcernsOther ? ` — ${a.previousConcernsOther}` : ''}</span>
                          ) : 'No DSL concerns logged'}
                          {a.dslInformedAt && <span className="ml-2 text-gray-400">· Passed to DSL {fmtDt(a.dslInformedAt)}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDslId(a.id)}
                          className="text-xs text-blue-700 hover:underline ml-2 shrink-0"
                        >
                          {concerns.length > 0 || a.dslInformedAt ? 'Edit DSL' : 'Add DSL info'}
                        </button>
                      </div>
                    ) : (
                      <DslPanel formId={a.id} childId={childId} form={a} onDone={() => setDslId(null)} />
                    )}
                  </div>

                  {/* Print button */}
                  <div className="border-t border-gray-100 pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPrintForm({ form: a, reporterName })}
                      className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                    >
                      🖨 View / Print form
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Print view ── */}
      {printForm && (
        <AccidentPrintView
          form={printForm.form}
          child={child}
          reporterName={printForm.reporterName}
          staff={staff}
          onClose={() => setPrintForm(null)}
        />
      )}

      {/* ── New accident modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-4">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">New Accident / Incident Form</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            <div className="p-5 space-y-5">

              {/* Incident type */}
              <div className="flex gap-3">
                {[
                  { val: 'within_provision', label: 'Within provision' },
                  { val: 'out_of_setting', label: 'Out of setting' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => set('incidentType', opt.val)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${fd.incidentType === opt.val ? 'bg-[#020e2f] text-white border-[#020e2f]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Date/time + location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Date & time of incident *</label>
                  <input type="datetime-local" value={fd.incidentDate} onChange={e => set('incidentDate', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={label}>Exact location</label>
                  <input value={fd.incidentLocation} onChange={e => set('incidentLocation', e.target.value)} placeholder="e.g. Outdoor area" className={inp} />
                </div>
              </div>

              {/* Body diagram + text fields */}
              <div className="flex gap-5">
                <div className="shrink-0 flex flex-col items-center pt-1">
                  <BodyDiagram location={fd.bodyLocation} onPlace={loc => set('bodyLocation', loc)} />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className={label}>Details of incident *</label>
                    <textarea value={fd.description} onChange={e => set('description', e.target.value)} rows={3} className={inp} placeholder="Describe what happened…" />
                  </div>
                  <div>
                    <label className={label}>Injury *</label>
                    <input value={fd.injury} onChange={e => set('injury', e.target.value)} className={inp} placeholder="e.g. Graze to right knee" />
                  </div>
                  <div>
                    <label className={label}>Action taken *</label>
                    <textarea value={fd.actionTaken} onChange={e => set('actionTaken', e.target.value)} rows={2} className={inp} placeholder="e.g. Wound cleaned, plaster applied…" />
                  </div>
                </div>
              </div>

              {/* Head injury */}
              <div className="border border-gray-200 rounded-lg p-3 flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={fd.isHeadInjury} onChange={e => set('isHeadInjury', e.target.checked)} className="rounded" />
                  This is a head injury
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={fd.headInjuryMonitoringFollowed} onChange={e => set('headInjuryMonitoringFollowed', e.target.checked)} className="rounded" />
                  Head injury monitoring followed
                </label>
              </div>

              {/* Staff — reporter + first aider */}
              <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-600">Staff details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Reported by</label>
                    <select value={fd.reportedById} onChange={e => set('reportedById', e.target.value)} className={inp}>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Job role</label>
                    <input value={fd.reporterJobRole} onChange={e => set('reporterJobRole', e.target.value)} placeholder="e.g. Practitioner" className={inp} />
                  </div>
                </div>
                <div>
                  <label className={label}>Reporter signature <span className="text-gray-400 font-normal">(optional)</span></label>
                  <SignaturePad onChange={sig => set('reporterSignature', sig)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={fd.firstAidSamePerson} onChange={e => set('firstAidSamePerson', e.target.checked)} className="rounded" />
                  Same person completed first aid
                </label>
                {!fd.firstAidSamePerson && (
                  <div>
                    <label className={label}>First aider</label>
                    <select value={fd.firstAidPersonId} onChange={e => set('firstAidPersonId', e.target.value)} className={inp}>
                      <option value="">Select…</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className={label}>First aid administered</label>
                  <input value={fd.firstAidAdministered} onChange={e => set('firstAidAdministered', e.target.value)} placeholder="e.g. Plaster, ice pack, wound cleaned…" className={inp} />
                </div>
                {!fd.firstAidSamePerson && (
                  <div>
                    <label className={label}>First aider signature <span className="text-gray-400 font-normal">(optional)</span></label>
                    <SignaturePad onChange={sig => set('firstAiderSignature', sig)} />
                  </div>
                )}
              </div>

              {/* Parent / carer */}
              <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-600">Parent / carer</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={fd.parentNotified} onChange={e => set('parentNotified', e.target.checked)} className="rounded" />
                    Parent / carer informed
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={fd.headInjuryAdviceGiven} onChange={e => set('headInjuryAdviceGiven', e.target.checked)} className="rounded" />
                    Advice given to parent / carer
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Parent / carer name</label>
                    <input value={fd.parentCarerName} onChange={e => set('parentCarerName', e.target.value)} placeholder="Full name" className={inp} />
                  </div>
                  <div>
                    <label className={label}>Date & time informed</label>
                    <input type="datetime-local" value={fd.parentNotifiedAt} onChange={e => { set('parentNotifiedAt', e.target.value); set('parentNotified', true) }} className={inp} />
                  </div>
                </div>
                <div>
                  <label className={`${label} flex items-center gap-1`}>
                    Parent / guardian signature
                    <span className="text-gray-400 font-normal">(optional — can be added later)</span>
                  </label>
                  <SignaturePad onChange={sig => set('parentSignature', sig)} />
                </div>
              </div>

              {/* DSL */}
              <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-600">DSL — Previous Incident Concerns <span className="text-gray-400 font-normal">(DSL to complete — optional)</span></p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {CONCERNS.map(c => (
                    <label key={c} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fd.previousConcerns.includes(c)}
                        onChange={e => set('previousConcerns', e.target.checked ? [...fd.previousConcerns, c] : fd.previousConcerns.filter(x => x !== c))}
                        className="rounded"
                      />
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </label>
                  ))}
                </div>
                {fd.previousConcerns.includes('other') && (
                  <input value={fd.previousConcernsOther} onChange={e => set('previousConcernsOther', e.target.value)} placeholder="Describe other concern…" className={inp} />
                )}
                <div>
                  <label className={label}>Date & time information shared with DSL</label>
                  <input type="datetime-local" value={fd.dslInformedAt} onChange={e => set('dslInformedAt', e.target.value)} className={inp} />
                </div>
              </div>

            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !fd.description || !fd.injury || !fd.actionTaken}
                className="px-5 py-2 bg-[#020e2f] hover:bg-[#010922] text-white text-sm font-medium rounded-lg disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save accident form'}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
