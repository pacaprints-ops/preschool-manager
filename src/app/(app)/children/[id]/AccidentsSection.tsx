'use client'

import { useState, useRef, useEffect } from 'react'
import { addAccidentForm, signAccidentForm } from '../actions'

type Accident = {
  form: {
    id: string
    incidentDate: Date
    description: string
    injury: string
    actionTaken: string
    parentNotified: boolean
    bodyLocation: string | null
    parentSignature: string | null
    parentSignedAt: Date | null
  }
  reporterName: string | null
}

type Staff = { id: string; name: string }

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

// ─── Body diagram ─────────────────────────────────────────────────────────────

function BodyDiagram({
  location,
  onPlace,
  compact = false,
}: {
  location: { x: number; y: number } | null
  onPlace?: (loc: { x: number; y: number }) => void
  compact?: boolean
}) {
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onPlace) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 220
    onPlace({ x, y })
  }

  return (
    <div className={`flex flex-col items-center gap-1 ${compact ? '' : ''}`}>
      {onPlace && (
        <p className="text-xs text-gray-400 text-center">Tap where the injury is</p>
      )}
      <svg
        viewBox="0 0 100 220"
        className={`${compact ? 'w-14' : 'w-full max-w-[140px]'} ${onPlace ? 'cursor-crosshair' : ''}`}
        onClick={handleClick}
      >
        {/* Head */}
        <circle cx="50" cy="14" r="12" fill="#f9fafb" stroke="#d1d5db" strokeWidth="2" />
        {/* Neck */}
        <rect x="45" y="26" width="10" height="8" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
        {/* Torso */}
        <rect x="28" y="33" width="44" height="62" rx="6" fill="#f9fafb" stroke="#d1d5db" strokeWidth="2" />
        {/* Left arm */}
        <rect x="8" y="33" width="18" height="62" rx="8" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
        {/* Right arm */}
        <rect x="74" y="33" width="18" height="62" rx="8" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
        {/* Left leg */}
        <rect x="28" y="96" width="19" height="95" rx="8" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
        {/* Right leg */}
        <rect x="53" y="96" width="19" height="95" rx="8" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
        {/* Left foot */}
        <ellipse cx="37" cy="198" rx="13" ry="7" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
        {/* Right foot */}
        <ellipse cx="62" cy="198" rx="13" ry="7" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
        {/* Injury marker */}
        {location && (
          <>
            <circle cx={location.x} cy={location.y} r="6" fill="#ef4444" opacity="0.15" />
            <circle cx={location.x} cy={location.y} r="3.5" fill="#ef4444" />
          </>
        )}
      </svg>
      {onPlace && location && (
        <button
          type="button"
          onClick={() => onPlace(null as unknown as { x: number; y: number })}
          className="text-xs text-gray-400 hover:text-red-500 mt-1"
        >
          Clear marker
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
      const scaleX = el.width / rect.width
      const scaleY = el.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
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

// ─── Inline signing pad (for existing unsigned forms in the log) ──────────────

function InlineSign({
  formId,
  childId,
  onDone,
}: {
  formId: string
  childId: string
  onDone: () => void
}) {
  const [sig, setSig] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!sig) return
    setSaving(true)
    await signAccidentForm(formId, childId, sig)
    setSaving(false)
    onDone()
  }

  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
      <p className="text-xs font-medium text-amber-700">Parent / guardian signature required</p>
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
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AccidentsSection({
  childId,
  accidents,
  userId,
  staff,
}: {
  childId: string
  accidents: Accident[]
  userId: string
  staff: Staff[]
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [signingId, setSigningId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    incidentDate: new Date().toISOString().slice(0, 16),
    description: '',
    injury: '',
    actionTaken: '',
    parentNotified: false,
    reportedById: userId,
    bodyLocation: null as { x: number; y: number } | null,
    parentSignature: '',
  })

  function resetForm() {
    setFormData({
      incidentDate: new Date().toISOString().slice(0, 16),
      description: '',
      injury: '',
      actionTaken: '',
      parentNotified: false,
      reportedById: userId,
      bodyLocation: null,
      parentSignature: '',
    })
  }

  function handleBodyPlace(loc: { x: number; y: number } | null) {
    setFormData(f => ({ ...f, bodyLocation: loc }))
  }

  async function handleSave() {
    if (!formData.description || !formData.injury || !formData.actionTaken) return
    setSaving(true)
    await addAccidentForm(childId, formData.reportedById || userId, {
      incidentDate: formData.incidentDate,
      description: formData.description,
      injury: formData.injury,
      actionTaken: formData.actionTaken,
      parentNotified: formData.parentNotified,
      bodyLocation: formData.bodyLocation ? JSON.stringify(formData.bodyLocation) : undefined,
      parentSignature: formData.parentSignature || undefined,
    })
    setSaving(false)
    resetForm()
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
          onClick={() => { resetForm(); setModalOpen(true) }}
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
          const signed = !!a.parentSignature

          return (
            <div key={a.id} className={`rounded-lg border text-sm overflow-hidden ${signed ? 'border-gray-200' : 'border-amber-200 bg-amber-50'}`}>
              {/* Row header — clickable */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">
                    {new Date(a.incidentDate).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {' '}
                    <span className="font-normal text-gray-500 text-xs">
                      {new Date(a.incidentDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                  <span className="text-gray-500 text-xs truncate max-w-[200px]">{a.injury}</span>
                  {!signed && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                      ⚠ Needs signature
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-xs ml-2">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
                  <div className="flex gap-4">
                    {/* Body diagram */}
                    <div className="shrink-0">
                      <BodyDiagram location={loc} compact={false} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">What happened: </span>
                        <span className="text-gray-600">{a.description}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Injury: </span>
                        <span className="text-gray-600">{a.injury}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Action taken: </span>
                        <span className="text-gray-600">{a.actionTaken}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Reported by {reporterName ?? 'Unknown'}
                        {a.parentNotified && ' · Parent notified'}
                      </div>

                      {/* Signature */}
                      {signed ? (
                        <div>
                          <p className="text-xs text-green-600 font-medium mb-1">
                            Signed {a.parentSignedAt ? new Date(a.parentSignedAt).toLocaleDateString('en-GB') : ''}
                          </p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.parentSignature!}
                            alt="Parent signature"
                            className="border border-gray-200 rounded max-h-16 bg-white"
                          />
                        </div>
                      ) : (
                        <>
                          {!isSigning && (
                            <button
                              type="button"
                              onClick={() => setSigningId(a.id)}
                              className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg"
                            >
                              Get parent signature
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline signing */}
                  {isSigning && !signed && (
                    <InlineSign
                      formId={a.id}
                      childId={childId}
                      onDone={() => setSigningId(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── New accident modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-4">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">New Accident Form</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Date/time */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Date & time of incident *</label>
                <input
                  type="datetime-local"
                  value={formData.incidentDate}
                  onChange={e => setFormData(f => ({ ...f, incidentDate: e.target.value }))}
                  className={input}
                />
              </div>

              {/* Body diagram + fields side by side */}
              <div className="flex gap-5">

                {/* Body diagram */}
                <div className="shrink-0 flex flex-col items-center pt-1">
                  <BodyDiagram
                    location={formData.bodyLocation}
                    onPlace={handleBodyPlace}
                  />
                </div>

                {/* Text fields */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">What happened *</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className={input}
                      placeholder="Describe the incident..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Injury / nature *</label>
                    <input
                      value={formData.injury}
                      onChange={e => setFormData(f => ({ ...f, injury: e.target.value }))}
                      className={input}
                      placeholder="e.g. Graze to right knee"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Action taken *</label>
                    <textarea
                      value={formData.actionTaken}
                      onChange={e => setFormData(f => ({ ...f, actionTaken: e.target.value }))}
                      rows={2}
                      className={input}
                      placeholder="e.g. First aid applied, ice pack used..."
                    />
                  </div>
                </div>
              </div>

              {/* Staff dropdown */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Reported by</label>
                <select
                  value={formData.reportedById}
                  onChange={e => setFormData(f => ({ ...f, reportedById: e.target.value }))}
                  className={input}
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Parent notified */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="parentNotified"
                  checked={formData.parentNotified}
                  onChange={e => setFormData(f => ({ ...f, parentNotified: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="parentNotified" className="text-sm text-gray-700">
                  Parent / guardian notified
                </label>
              </div>

              {/* Parent signature */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Parent / guardian signature <span className="text-gray-400 font-normal">(optional — can be added later)</span>
                </label>
                <SignaturePad onChange={sig => setFormData(f => ({ ...f, parentSignature: sig }))} />
              </div>

            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !formData.description || !formData.injury || !formData.actionTaken}
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
