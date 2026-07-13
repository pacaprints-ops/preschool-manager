'use client'

import React, { useState } from 'react'
import { addEnrolment, removeEnrolment, updateEnrolmentFee, confirmEnrolmentKeyworker, updateEnrolmentStartDate, bulkPromoteEnrolments } from './actions'

function generateEnrolmentInvoiceHTML(child: NewStarter, intakeYear: number): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const welcomePaid = child.welcomeFeePaid
  const depositPaid = child.depositPaid
  const welcomeAmt = 50
  const depositAmt = 50
  const total = (!welcomePaid ? welcomeAmt : 0) + (!depositPaid ? depositAmt : 0)

  const rows = [
    !welcomePaid && `
      <tr>
        <td>
          <strong>Welcome Fee</strong><br>
          <span style="font-size:11px;color:#555;">Includes 3 settle-in sessions, home visit and t-shirt. Non-refundable.</span>
        </td>
        <td style="text-align:right;font-weight:600;white-space:nowrap;">£50.00</td>
      </tr>`,
    welcomePaid && `
      <tr style="color:#888;">
        <td><strong>Welcome Fee</strong> <span style="font-size:11px;background:#dcfce7;color:#166534;padding:1px 6px;border-radius:4px;font-weight:600;">PAID</span></td>
        <td style="text-align:right;white-space:nowrap;text-decoration:line-through;">£50.00</td>
      </tr>`,
    !depositPaid && `
      <tr>
        <td>
          <strong>Term Deposit</strong><br>
          <span style="font-size:11px;color:#555;">Paid in advance. Deducted from your first term invoice.</span>
        </td>
        <td style="text-align:right;font-weight:600;white-space:nowrap;">£50.00</td>
      </tr>`,
    depositPaid && `
      <tr style="color:#888;">
        <td><strong>Term Deposit</strong> <span style="font-size:11px;background:#dcfce7;color:#166534;padding:1px 6px;border-radius:4px;font-weight:600;">PAID</span></td>
        <td style="text-align:right;white-space:nowrap;text-decoration:line-through;">£50.00</td>
      </tr>`,
  ].filter(Boolean).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Enrolment Invoice — ${child.firstName} ${child.lastName}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; margin: 40px auto; color: #000; max-width: 580px; }
    h1 { font-size: 17px; text-align: center; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { text-align: center; font-size: 12px; color: #555; margin-bottom: 24px; }
    .meta { margin-bottom: 20px; font-size: 12px; }
    .meta td { padding: 2px 6px; }
    .meta .label { font-weight: 700; width: 140px; }
    table.items { width: 100%; border-collapse: collapse; margin: 20px 0 8px; }
    table.items th { border: 1px solid #bbb; padding: 8px 10px; background: #f0f0f0; font-size: 12px; text-align: left; }
    table.items td { border: 1px solid #bbb; padding: 10px; vertical-align: top; }
    .total-row td { border: 2px solid #333; padding: 10px; font-weight: 800; font-size: 15px; }
    .notes { font-size: 11px; color: #555; margin-top: 24px; border-top: 1px solid #ddd; padding-top: 14px; line-height: 1.6; }
    #print-btn { display: block; margin: 24px auto 0; padding: 9px 22px; background: #1e3a8a; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: Arial, sans-serif; }
    @media print { #print-btn { display: none; } }
  </style>
</head>
<body>
  <h1>Winton Pre-School</h1>
  <div class="subtitle">Enrolment Invoice · September ${intakeYear}</div>

  <table class="meta">
    <tr><td class="label">Child:</td><td>${child.firstName} ${child.lastName}</td></tr>
    <tr><td class="label">Parent / Carer:</td><td>${child.parentCarerName}</td></tr>
    ${child.contactEmail ? `<tr><td class="label">Email:</td><td>${child.contactEmail}</td></tr>` : ''}
    <tr><td class="label">Date issued:</td><td>${today}</td></tr>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right;white-space:nowrap;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>Total ${total === 0 ? '(all paid)' : 'due'}</td>
        <td style="text-align:right;white-space:nowrap;">£${total.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="notes">
    <strong>Welcome fee</strong> — Non-refundable. Covers 3 settle-in sessions, a home visit and a pre-school t-shirt.<br>
    <strong>Term deposit</strong> — Held in advance and deducted from your first term invoice once your child starts.
    ${child.contactEmail ? `<br><br>Please make payment by bank transfer and quote your child's name as the reference.` : ''}
  </div>

  <button id="print-btn" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABEL: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const DAY_ABBR: Record<string, string> = { monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu', friday: 'fri' }
const SESSION_HOURS: Record<string, number> = { morning: 3, afternoon: 3, full_day: 6 }
const SESSION_LABEL: Record<string, string> = { morning: 'AM', afternoon: 'PM', full_day: 'Full' }

type ReturningChild = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  needs1to1: boolean
  sessions: { day: string; sessionType: string }[]
}

type NewStarter = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  startDate: string | null
  parentCarerName: string
  contactPhone: string | null
  contactEmail: string | null
  daysSessions: Record<string, string>
  notes: string | null
  welcomeFeePaid: boolean
  depositPaid: boolean
  confirmedKeyworkerId: string | null
  promotedChildId: string | null
}

type StaffMember = {
  id: string
  name: string
  workingDays: string // comma-separated abbreviations: "mon,tue,wed,thu,fri"
  keyChildrenCount: number
}

type FormState = {
  childFirstName: string
  childLastName: string
  dateOfBirth: string
  startDate: string
  parentCarerName: string
  contactPhone: string
  contactEmail: string
  daysSessions: Record<string, string>
  notes: string
}

const EMPTY_FORM: FormState = {
  childFirstName: '', childLastName: '', dateOfBirth: '', startDate: '',
  parentCarerName: '', contactPhone: '', contactEmail: '',
  daysSessions: {}, notes: '',
}

// Reference date for age calculations: 1 September of the intake year
function ageAtSeptember(dob: string | null, year: number): number | null {
  if (!dob) return null
  const ref = new Date(`${year}-09-01T12:00:00`)
  const d = new Date(dob + 'T12:00:00')
  let age = ref.getFullYear() - d.getFullYear()
  if (ref.getMonth() < d.getMonth() || (ref.getMonth() === d.getMonth() && ref.getDate() < d.getDate())) age--
  return age
}

function fmtDob(dob: string | null): string {
  if (!dob) return '—'
  return new Date(dob + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDayHoursFromSessions(sessions: { day: string; sessionType: string }[]): Record<string, number> {
  const h: Record<string, number> = {}
  for (const s of sessions) {
    h[s.day] = (h[s.day] || 0) + (SESSION_HOURS[s.sessionType] ?? 0)
  }
  return h
}

function getDayHoursFromRecord(daysSessions: Record<string, string>): Record<string, number> {
  const h: Record<string, number> = {}
  for (const [day, sessionType] of Object.entries(daysSessions)) {
    h[day] = SESSION_HOURS[sessionType] ?? 0
  }
  return h
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function EnrolmentsClient({
  returningChildren,
  newStarters,
  intakeYear,
  isAdmin,
  staffData,
}: {
  returningChildren: ReturningChild[]
  newStarters: NewStarter[]
  intakeYear: number
  isAdmin: boolean
  staffData: StaffMember[]
}) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [confirmingKw, setConfirmingKw] = useState<string | null>(null) // enrolmentId currently being saved
  const [changingKw, setChangingKw] = useState<Set<string>>(new Set()) // enrolmentIds in "change" mode
  const [editingStartDate, setEditingStartDate] = useState<string | null>(null) // enrolmentId
  const [startDateDraft, setStartDateDraft] = useState('')
  const [bulkPromoting, setBulkPromoting] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ promoted: number; skipped: { name: string; reason: string }[] } | null>(null)

  function toggleFormDay(day: string) {
    setForm(f => {
      const next = { ...f.daysSessions }
      if (day in next) {
        delete next[day]
      } else {
        next[day] = 'morning'
      }
      return { ...f, daysSessions: next }
    })
  }

  function setFormSession(day: string, sessionType: string) {
    setForm(f => ({ ...f, daysSessions: { ...f.daysSessions, [day]: sessionType } }))
  }

  async function handleAdd() {
    if (!form.childFirstName || !form.childLastName || !form.parentCarerName) return
    setSaving(true)
    await addEnrolment({
      intakeYear,
      childFirstName: form.childFirstName,
      childLastName: form.childLastName,
      dateOfBirth: form.dateOfBirth || undefined,
      startDate: form.startDate || undefined,
      parentCarerName: form.parentCarerName,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
      daysSessions: form.daysSessions,
      notes: form.notes || undefined,
    })
    setForm(EMPTY_FORM)
    setSaving(false)
    setAdding(false)
  }

  async function handleSaveStartDate(id: string) {
    await updateEnrolmentStartDate(id, startDateDraft)
    setEditingStartDate(null)
  }

  async function handleBulkPromote() {
    const notYetPromoted = enrichedNew.filter(c => !c.promotedChildId)
    if (notYetPromoted.length === 0) return
    if (!confirm(`Promote all ${notYetPromoted.length} not-yet-started new starters to active child profiles now? Anyone with a future start date or missing date of birth will be skipped and can be promoted individually.`)) return
    setBulkPromoting(true)
    setBulkResult(null)
    const result = await bulkPromoteEnrolments(intakeYear)
    setBulkPromoting(false)
    setBulkResult(result)
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} from the enrolments list?`)) return
    setRemoving(id)
    await removeEnrolment(id)
    setRemoving(null)
  }

  // Enrich returning children with hours and age
  const enrichedReturning = returningChildren.map(c => {
    const dayHours = getDayHoursFromSessions(c.sessions)
    return {
      ...c,
      dayHours,
      totalHours: Object.values(dayHours).reduce((a, b) => a + b, 0),
      age: ageAtSeptember(c.dateOfBirth, intakeYear),
    }
  })

  // Enrich new starters with hours and age — welcomeFeePaid/depositPaid are kept via spread
  const enrichedNew = newStarters.map(c => {
    const dayHours = getDayHoursFromRecord(c.daysSessions)
    return {
      ...c,
      dayHours,
      totalHours: Object.values(dayHours).reduce((a, b) => a + b, 0),
      age: ageAtSeptember(c.dateOfBirth, intakeYear),
    }
  })

  // Footer stats across all children
  const allEnriched = [...enrichedReturning, ...enrichedNew]
  const dayStats = DAYS.map(day => {
    const attending = allEnriched.filter(c => (c.dayHours[day] ?? 0) > 0)
    const gen = attending.filter(c => !('needs1to1' in c && c.needs1to1))
    const age2 = attending.filter(c => c.age === 2)
    const gen2 = gen.filter(c => c.age === 2).length
    const gen34 = gen.filter(c => c.age !== null && c.age >= 3).length
    const count1to1 = attending.filter(c => 'needs1to1' in c && c.needs1to1).length
    const staffInRatio = Math.ceil(gen2 / 4) + Math.ceil(gen34 / 8)
    return { total: attending.length, count2yr: age2.length, staffInRatio, count1to1, totalStaff: staffInRatio + count1to1 }
  })

  let rowNum = 0

  const thBase = 'px-2 py-2 text-center text-xs font-bold border-r border-white/20 last:border-r-0'
  const thLeft = 'px-2 py-2 text-left text-xs font-bold border-r border-white/20'
  const td = 'px-2 py-1.5 text-xs border-r border-gray-100 last:border-r-0'
  const tdCenter = 'px-1 py-1.5 text-xs text-center border-r border-gray-100 last:border-r-0'

  function handlePrint() {
    const style = document.createElement('style')
    style.id = 'print-landscape'
    style.textContent = '@media print { @page { size: A4 landscape; margin: 8mm; } }'
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.getElementById('print-landscape')?.remove(), 1000)
  }

  const totalCount = enrichedReturning.length + enrichedNew.length

  return (
    <div>
      {/* Header */}
      <div className="print:hidden flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">September {intakeYear} Enrolments</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} children · {enrichedReturning.length} returning · {enrichedNew.length} new
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#020e2f] text-white text-sm font-medium rounded-lg hover:bg-[#010922]"
          >
            🖨 Print
          </button>
          {isAdmin && enrichedNew.some(c => !c.promotedChildId) && (
            <button
              onClick={handleBulkPromote}
              disabled={bulkPromoting}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {bulkPromoting ? 'Promoting…' : '✓ Promote all ready starters'}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setAdding(a => !a)}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {adding ? 'Cancel' : '+ Add Child'}
            </button>
          )}
        </div>
      </div>

      {bulkResult && (
        <div className="print:hidden mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong>{bulkResult.promoted} child{bulkResult.promoted !== 1 ? 'ren' : ''} promoted</strong> to active profiles.
              {bulkResult.skipped.length > 0 && (
                <div className="mt-1.5 text-amber-700">
                  {bulkResult.skipped.length} skipped: {bulkResult.skipped.map(s => `${s.name} (${s.reason})`).join(', ')}
                </div>
              )}
            </div>
            <button onClick={() => setBulkResult(null)} className="text-xs text-green-500 hover:text-green-700 shrink-0">Dismiss</button>
          </div>
        </div>
      )}

      {/* Print header */}
      <div className="hidden print:flex justify-between items-baseline mb-3">
        <div className="font-bold text-sm">Winton Pre-School — September {intakeYear} Enrolments</div>
        <div className="text-sm">{totalCount} children</div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="print:hidden bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Add new starter</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Child first name *</label>
              <input value={form.childFirstName} onChange={e => setForm(f => ({ ...f, childFirstName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Child last name *</label>
              <input value={form.childLastName} onChange={e => setForm(f => ({ ...f, childLastName: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date of birth</label>
              <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Parent / carer name *</label>
              <input value={form.parentCarerName} onChange={e => setForm(f => ({ ...f, parentCarerName: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone</label>
              <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Start date <span className="font-normal text-gray-400">(only if different from the standard September intake)</span>
            </label>
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={`${inputCls} max-w-xs`} />
          </div>

          {/* Days & sessions picker */}
          <div>
            <label className="block text-xs text-gray-600 mb-2">Days & sessions needed</label>
            <div className="flex gap-4 flex-wrap">
              {DAYS.map(day => (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFormDay(day)}
                    className={`w-14 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      day in form.daysSessions
                        ? 'bg-[#020e2f] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {DAY_LABEL[day]}
                  </button>
                  {day in form.daysSessions && (
                    <div className="flex flex-col gap-1">
                      {(['morning', 'afternoon', 'full_day'] as const).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFormSession(day, st)}
                          className={`w-14 py-1 rounded text-xs font-medium transition-colors ${
                            form.daysSessions[day] === st
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {SESSION_LABEL[st]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls} />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !form.childFirstName || !form.childLastName || !form.parentCarerName}
            className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add to enrolments'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 print:rounded-none print:border-none print:overflow-visible">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#020e2f] text-white">
              <th className={`${thLeft} w-8`}>No.</th>
              <th className={`${thLeft} min-w-[80px]`}>First Name</th>
              <th className={`${thLeft} min-w-[90px]`}>Last Name</th>
              <th className={`${thLeft} w-[110px]`}>D.O.B (Age in Sept)</th>
              {DAYS.map(day => (
                <th key={day} className={`${thBase} w-10`}>{DAY_LABEL[day]}</th>
              ))}
              <th className={`${thBase} w-12`}>Total Wk</th>
            </tr>
          </thead>
          <tbody>

            {/* Returning children */}
            {enrichedReturning.length > 0 && (
              <tr className="bg-[#eef2f7]">
                <td colSpan={10} className="px-3 py-1 text-xs font-bold text-[#020e2f] uppercase tracking-wider border-b border-gray-200">
                  Returning Children — {enrichedReturning.length}
                </td>
              </tr>
            )}
            {enrichedReturning.map(child => {
              rowNum++
              return (
                <tr key={child.id} className="border-b border-gray-100 even:bg-gray-50/40">
                  <td className={`${td} text-center text-gray-400 font-medium`}>{rowNum}</td>
                  <td className={`${td} font-semibold text-gray-900`}>{child.firstName}</td>
                  <td className={`${td} text-gray-800`}>{child.lastName}</td>
                  <td className={`${td} text-gray-700 whitespace-nowrap`}>
                    {fmtDob(child.dateOfBirth)}
                    {child.age !== null && <span className="text-gray-400 ml-1">({child.age})</span>}
                  </td>
                  {DAYS.map(day => (
                    <td key={day} className={`${tdCenter} font-medium`}>
                      {child.dayHours[day]
                        ? <span className="text-gray-800">{child.dayHours[day]}</span>
                        : <span className="text-gray-200">—</span>
                      }
                    </td>
                  ))}
                  <td className={`${tdCenter} font-bold text-gray-800`}>
                    {child.totalHours || <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              )
            })}

            {/* New starters */}
            {enrichedNew.length > 0 && (
              <tr className="bg-[#eef2f7]">
                <td colSpan={10} className="px-3 py-1 text-xs font-bold text-[#020e2f] uppercase tracking-wider border-b border-gray-200">
                  New Starters — {enrichedNew.length}
                </td>
              </tr>
            )}
            {enrichedNew.map(child => {
              rowNum++
              const isExpanded = expandedId === child.id
              return (
                <React.Fragment key={child.id}>
                  <tr
                    className="border-b border-gray-100 even:bg-gray-50/40 cursor-pointer hover:bg-blue-50/40 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : child.id)}
                  >
                    <td className={`${td} text-center text-gray-400 font-medium`}>{rowNum}</td>
                    <td className={`${td} font-semibold text-gray-900`}>
                      <span>{child.firstName}</span>
                      {child.promotedChildId
                        ? <span className="ml-1.5 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Started</span>
                        : <span className="ml-1.5 text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wide">New</span>
                      }
                      {child.startDate && (
                        <span className="ml-1.5 text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wide" title={`Starts ${fmtDob(child.startDate)}`}>
                          Starts {fmtDob(child.startDate)}
                        </span>
                      )}
                    </td>
                    <td className={`${td} text-gray-800`}>{child.lastName}</td>
                    <td className={`${td} text-gray-700 whitespace-nowrap`}>
                      {fmtDob(child.dateOfBirth)}
                      {child.age !== null && <span className="text-gray-400 ml-1">({child.age})</span>}
                    </td>
                    {DAYS.map(day => (
                      <td key={day} className={`${tdCenter} font-medium`}>
                        {child.dayHours[day]
                          ? <span className="text-gray-800">{child.dayHours[day]}</span>
                          : <span className="text-gray-200">—</span>
                        }
                      </td>
                    ))}
                    <td className={`${tdCenter} font-bold text-gray-800`}>
                      {child.totalHours || <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-amber-50 border-b border-amber-100 print:hidden">
                      <td colSpan={10} className="px-4 py-3 space-y-3">
                        {/* Contact details */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1.5 text-xs">
                          <div>
                            <span className="text-gray-500">Parent / carer: </span>
                            <span className="text-gray-900 font-medium">{child.parentCarerName}</span>
                          </div>
                          {child.contactPhone && (
                            <div>
                              <span className="text-gray-500">Phone: </span>
                              <span className="text-gray-900">{child.contactPhone}</span>
                            </div>
                          )}
                          {child.contactEmail && (
                            <div>
                              <span className="text-gray-500">Email: </span>
                              <span className="text-gray-900">{child.contactEmail}</span>
                            </div>
                          )}
                          {child.notes && (
                            <div className="col-span-2 sm:col-span-3">
                              <span className="text-gray-500">Notes: </span>
                              <span className="text-gray-900">{child.notes}</span>
                            </div>
                          )}
                          <div onClick={e => e.stopPropagation()}>
                            <span className="text-gray-500">Start date: </span>
                            {editingStartDate === child.id ? (
                              <span className="inline-flex items-center gap-1.5">
                                <input
                                  type="date"
                                  value={startDateDraft}
                                  onChange={e => setStartDateDraft(e.target.value)}
                                  className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-900 bg-white"
                                />
                                <button onClick={() => handleSaveStartDate(child.id)} className="text-blue-700 hover:underline">Save</button>
                                <button onClick={() => setEditingStartDate(null)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                              </span>
                            ) : (
                              <span className="text-gray-900">
                                {child.startDate ? fmtDob(child.startDate) : 'Standard September intake'}
                                {isAdmin && (
                                  <button
                                    onClick={() => { setEditingStartDate(child.id); setStartDateDraft(child.startDate ?? '') }}
                                    className="ml-1.5 text-blue-700 hover:underline"
                                  >
                                    Edit
                                  </button>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fees */}
                        <div className="flex items-start gap-3 flex-wrap">
                          <span className="text-xs text-gray-500 font-medium mt-2">Fees:</span>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); updateEnrolmentFee(child.id, 'welcomeFeePaid', !child.welcomeFeePaid) }}
                            disabled={!isAdmin}
                            className={`flex items-start gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                              child.welcomeFeePaid
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : 'bg-white border-gray-300 text-gray-500'
                            } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                          >
                            <span className="mt-0.5">{child.welcomeFeePaid ? '✓' : '○'}</span>
                            <div>
                              <div>Welcome fee £50</div>
                              <div className="text-[10px] opacity-60 font-normal mt-0.5">3 settle-in sessions, home visit &amp; t-shirt · non-refundable</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); updateEnrolmentFee(child.id, 'depositPaid', !child.depositPaid) }}
                            disabled={!isAdmin}
                            className={`flex items-start gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                              child.depositPaid
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : 'bg-white border-gray-300 text-gray-500'
                            } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                          >
                            <span className="mt-0.5">{child.depositPaid ? '✓' : '○'}</span>
                            <div>
                              <div>Deposit £50 per term</div>
                              <div className="text-[10px] opacity-60 font-normal mt-0.5">paid in advance · deducted from first invoice</div>
                            </div>
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              const html = generateEnrolmentInvoiceHTML(child, intakeYear)
                              const blob = new Blob([html], { type: 'text/html' })
                              const url = URL.createObjectURL(blob)
                              window.open(url, '_blank')
                              setTimeout(() => URL.revokeObjectURL(url), 15000)
                            }}
                            className="text-xs text-blue-700 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors"
                          >
                            Generate invoice
                          </button>
                          {isAdmin && (
                            <button
                              onClick={e => { e.stopPropagation(); handleRemove(child.id, `${child.firstName} ${child.lastName}`) }}
                              disabled={removing === child.id}
                              className="ml-auto text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
                            >
                              {removing === child.id ? 'Removing...' : 'Remove'}
                            </button>
                          )}
                        </div>

                        {/* Profile status */}
                        <div className="flex items-center gap-3 pt-1 border-t border-amber-200">
                          {child.promotedChildId ? (
                            <a
                              href={`/children/${child.promotedChildId}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-300 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
                            >
                              ✓ Profile created — View child profile →
                            </a>
                          ) : isAdmin ? (
                            <a
                              href={`/enrolments/${child.id}/promote`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#020e2f] text-white text-xs font-medium rounded-lg hover:bg-[#010922] transition-colors"
                            >
                              + Start child profile
                            </a>
                          ) : null}
                        </div>

                        {/* Keyworker confirmation */}
                        {(() => {
                          const hasDays = Object.keys(child.daysSessions).length > 0
                          const confirmedStaff = child.confirmedKeyworkerId
                            ? staffData.find(s => s.id === child.confirmedKeyworkerId)
                            : null
                          const isChanging = changingKw.has(child.id)
                          const isConfirming = confirmingKw === child.id

                          async function handleConfirm(e: React.MouseEvent, staffId: string) {
                            e.stopPropagation()
                            setConfirmingKw(child.id)
                            await confirmEnrolmentKeyworker(child.id, staffId)
                            setChangingKw(prev => { const s = new Set(prev); s.delete(child.id); return s })
                            setConfirmingKw(null)
                          }

                          async function handleClear(e: React.MouseEvent) {
                            e.stopPropagation()
                            setConfirmingKw(child.id)
                            await confirmEnrolmentKeyworker(child.id, null)
                            setChangingKw(prev => { const s = new Set(prev); s.delete(child.id); return s })
                            setConfirmingKw(null)
                          }

                          const requiredAbbrs = Object.keys(child.daysSessions).map(d => DAY_ABBR[d]).filter(Boolean)
                          const ranked = staffData
                            .map(s => {
                              const staffDays = s.workingDays.split(',').map(d => d.trim())
                              const matchingDays = Object.keys(child.daysSessions).filter(d => staffDays.includes(DAY_ABBR[d]))
                              return { ...s, matchCount: matchingDays.length, matchingDays }
                            })
                            .filter(s => s.matchCount > 0)
                            .sort((a, b) => b.matchCount - a.matchCount || a.keyChildrenCount - b.keyChildrenCount)

                          return (
                            <div className="pt-2 border-t border-amber-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-600">Keyworker</span>
                                {confirmedStaff && !isChanging && (
                                  <button
                                    onClick={e => { e.stopPropagation(); setChangingKw(prev => new Set([...prev, child.id])) }}
                                    className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                                  >
                                    Change
                                  </button>
                                )}
                              </div>

                              {/* Confirmed state */}
                              {confirmedStaff && !isChanging && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-xs text-green-800 w-fit">
                                  <span className="text-green-500">✓</span>
                                  <span className="font-semibold">{confirmedStaff.name}</span>
                                  <span className="text-green-600">
                                    {ranked.find(r => r.id === confirmedStaff.id)?.matchingDays.map(d => DAY_LABEL[d]).join(', ')}
                                  </span>
                                </div>
                              )}

                              {/* Pick / change list */}
                              {(!confirmedStaff || isChanging) && (
                                <>
                                  {!hasDays ? (
                                    <p className="text-xs text-gray-400">Add days above to see suggestions.</p>
                                  ) : ranked.length === 0 ? (
                                    <p className="text-xs text-gray-400">No staff available for the selected days.</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {ranked.map((s, i) => (
                                        <button
                                          key={s.id}
                                          type="button"
                                          disabled={isConfirming}
                                          onClick={e => handleConfirm(e, s.id)}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors disabled:opacity-50 ${
                                            i === 0
                                              ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                          }`}
                                        >
                                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                            i === 0 ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'
                                          }`}>{i + 1}</span>
                                          <span className="font-medium">{s.name}</span>
                                          <span className={i === 0 ? 'text-green-600' : 'text-gray-400'}>
                                            {s.matchingDays.map(d => DAY_LABEL[d]).join(', ')}
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                            s.keyChildrenCount === 0
                                              ? 'bg-blue-50 text-blue-600'
                                              : s.keyChildrenCount <= 6
                                              ? 'bg-green-100 text-green-700'
                                              : s.keyChildrenCount <= 10
                                              ? 'bg-amber-100 text-amber-700'
                                              : 'bg-red-50 text-red-600'
                                          }`}>
                                            {s.keyChildrenCount} key {s.keyChildrenCount === 1 ? 'child' : 'children'}
                                          </span>
                                          {s.matchCount < requiredAbbrs.length && (
                                            <span className="text-[10px] text-gray-400">({s.matchCount}/{requiredAbbrs.length} days)</span>
                                          )}
                                          {isConfirming && confirmingKw === child.id
                                            ? <span className="text-[10px] text-gray-400">…</span>
                                            : <span className={`text-[10px] font-semibold ${i === 0 ? 'text-green-700' : 'text-gray-400'}`}>Confirm →</span>
                                          }
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {isChanging && (
                                    <div className="flex items-center gap-3 mt-2">
                                      <button
                                        onClick={e => { e.stopPropagation(); setChangingKw(prev => { const s = new Set(prev); s.delete(child.id); return s }) }}
                                        className="text-[10px] text-gray-400 hover:text-gray-600"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleClear}
                                        disabled={isConfirming}
                                        className="text-[10px] text-red-400 hover:text-red-600 disabled:opacity-50"
                                      >
                                        Remove assignment
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}

            {totalCount === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">
                  No children enrolled for September {intakeYear} yet.
                </td>
              </tr>
            )}

            {/* Spacer */}
            <tr><td colSpan={10} className="py-0.5 bg-gray-200" /></tr>

            {/* Footer stats */}
            {[
              { label: 'Total Children', values: dayStats.map(s => s.total), cls: 'font-bold text-gray-800' },
              { label: '2 Year Olds', values: dayStats.map(s => s.count2yr), cls: 'text-blue-700 font-medium' },
              { label: 'Staff in Ratio', values: dayStats.map(s => s.staffInRatio), cls: 'text-gray-700 font-medium' },
              { label: '1A (1-2-1)', values: dayStats.map(s => s.count1to1), cls: 'text-purple-700 font-medium' },
              { label: 'Total Staff', values: dayStats.map(s => s.totalStaff), cls: 'font-bold text-gray-900' },
            ].map(row => (
              <tr key={row.label} className="bg-gray-50 border-t border-gray-200">
                <td colSpan={4} className="px-3 py-1.5 text-xs font-semibold text-gray-700">{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} className={`px-1 py-1.5 text-center text-xs border-r border-gray-200 ${row.cls}`}>
                    {v > 0 ? v : <span className="text-gray-300">—</span>}
                  </td>
                ))}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="print:hidden mt-3 text-xs text-gray-400">
        Returning children are auto-populated from active children not starting school in September {intakeYear}. Click a new starter row to see contact details.
      </p>
    </div>
  )
}
