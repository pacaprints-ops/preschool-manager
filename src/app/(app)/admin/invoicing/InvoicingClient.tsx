'use client'

import React, { useState } from 'react'
import { generateInvoices, markInvoicePaid, markInvoiceUnpaid, deleteInvoice, updateAdjustment, markLateFeePaid, markLateFeeUnpaid, deleteLateFee, waiveLateFee, sendInvoiceEmail, sendLateFeeEmail, sendOverdueReminders, markExtraSessionPaid, markExtraSessionUnpaid, deleteExtraSession, waiveExtraSession, applyConsumableWaiver } from './actions'

type Term = { id: string; name: string; academicYear: string; weekCount: number }
type ActiveChild = { id: string; firstName: string; lastName: string }
type LateFeeRow = {
  fee: {
    id: string
    date: string
    signedOutAt: Date
    minutesLate: number
    ratePerMinute: string
    totalAmount: string
    status: string
    paidAt: Date | null
    notes: string | null
  }
  child: { id: string; firstName: string; lastName: string; parentEmail: string | null }
}
type ExtraSessionRow = {
  session: {
    id: string
    date: string
    sessionType: string
    isFunded: boolean
    amount: string
    status: string
    notes: string | null
  }
  child: { id: string; firstName: string; lastName: string; parentEmail: string | null }
}
type InvoiceRow = {
  invoice: {
    id: string
    termId: string
    paidSessions: number
    fundedSessions: number
    fundedHoursTotal: string
    fundedHoursPerWeek: string
    paidHoursPerWeek: string
    sessionCost: string
    consumableConsent: boolean
    contributionTotal: string
    fundedValue: string
    adjustmentAmount: string
    adjustmentNote: string | null
    amountDue: string
    status: 'draft' | 'sent' | 'paid' | 'overdue'
    parentEmail: string | null
    sentAt: Date | null
    paidAt: Date | null
  }
  child: {
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
    twoYearFunding: boolean
    extendedHours: boolean
    eypp: boolean
    sen: boolean
    senTier: string | null
    daf: boolean
    dep: boolean
  }
}

type SessionConfig = {
  type: string
  hourlyRate2yo: string
  hourlyRate34yo: string
}

type ReminderRow = {
  id: string
  invoiceId: string
  sentAt: string
  email: string
  type: string
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

const SESSION_TYPE_LABEL: Record<string, string> = {
  morning: 'Morning', afternoon: 'Afternoon', full_day: 'Full Day',
}

const input = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function InvoicingClient({
  terms,
  invoices,
  activeChildren,
  lateFees,
  extraSessions,
  sessionConfigs,
  reminders,
}: {
  terms: Term[]
  invoices: InvoiceRow[]
  activeChildren: ActiveChild[]
  lateFees: LateFeeRow[]
  extraSessions: ExtraSessionRow[]
  sessionConfigs: SessionConfig[]
  reminders: ReminderRow[]
}) {
  const [selectedTerm, setSelectedTerm] = useState<string>(terms[terms.length - 1]?.id ?? '')
  const [generating, setGenerating] = useState(false)
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(
    new Set(activeChildren.map(c => c.id))
  )
  const [editingAdjustment, setEditingAdjustment] = useState<string | null>(null)
  const [adjAmount, setAdjAmount] = useState('')
  const [adjNote, setAdjNote] = useState('')
  const [savingAdj, setSavingAdj] = useState(false)
  const [waivingFeeId, setWaivingFeeId] = useState<string | null>(null)
  const [waiveReason, setWaiveReason] = useState('')
  const [waivingExtraId, setWaivingExtraId] = useState<string | null>(null)
  const [extraWaiveReason, setExtraWaiveReason] = useState('')
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null)
  const [sendingLateFeeId, setSendingLateFeeId] = useState<string | null>(null)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [remindersSent, setRemindersSent] = useState<number | null>(null)
  const [waiverDate, setWaiverDate] = useState('')
  const [waiverMode, setWaiverMode] = useState<'everyone' | 'selected'>('everyone')
  const [waiverChildIds, setWaiverChildIds] = useState<Set<string>>(new Set())
  const [waiverReason, setWaiverReason] = useState('')
  const [applyingWaiver, setApplyingWaiver] = useState(false)
  const [waiverResult, setWaiverResult] = useState<{ affected: number; skippedNoInvoice: string[]; skippedNoConsent: string[] } | null>(null)

  async function handleApplyWaiver() {
    if (!selectedTerm || !waiverDate) return
    if (waiverMode === 'selected' && waiverChildIds.size === 0) return
    if (!confirm(`Apply a £3.50 consumable waiver for ${waiverDate} to ${waiverMode === 'everyone' ? 'everyone scheduled that day' : `${waiverChildIds.size} selected child${waiverChildIds.size !== 1 ? 'ren' : ''}`}?`)) return
    setApplyingWaiver(true)
    setWaiverResult(null)
    const result = await applyConsumableWaiver(
      selectedTerm,
      waiverDate,
      waiverMode === 'everyone' ? { mode: 'everyone' } : { mode: 'selected', childIds: [...waiverChildIds] },
      waiverReason
    )
    setApplyingWaiver(false)
    setWaiverResult(result)
  }

  const termInvoices = invoices.filter(i => i.invoice.termId === selectedTerm)
  const totalDue = termInvoices.reduce((sum, i) => sum + parseFloat(i.invoice.amountDue), 0)

  const termInvoiceIds = new Set(termInvoices.map(i => i.invoice.id))
  const termReminders = reminders.filter(r => termInvoiceIds.has(r.invoiceId))
  const remindersByInvoice = termReminders.reduce<Record<string, ReminderRow[]>>((acc, r) => {
    if (!acc[r.invoiceId]) acc[r.invoiceId] = []
    acc[r.invoiceId].push(r)
    return acc
  }, {})
  const totalPaid = termInvoices.filter(i => i.invoice.status === 'paid').reduce((sum, i) => sum + parseFloat(i.invoice.amountDue), 0)
  const outstanding = termInvoices.filter(i => i.invoice.status !== 'paid').length

  const allSelected = activeChildren.length > 0 && selectedChildIds.size === activeChildren.length
  const noneSelected = selectedChildIds.size === 0

  function toggleChild(id: string) {
    setSelectedChildIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelectedChildIds(new Set())
    else setSelectedChildIds(new Set(activeChildren.map(c => c.id)))
  }

  async function handleGenerate() {
    if (!selectedTerm || noneSelected) return
    setGenerating(true)
    const count = await generateInvoices(selectedTerm, [...selectedChildIds])
    setGenerating(false)
    if (count === 0) alert('Invoices already generated for the selected children, or none found.')
  }

  async function handleSendLateFee(feeId: string) {
    setSendingLateFeeId(feeId)
    try {
      await sendLateFeeEmail(feeId)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to send email')
    }
    setSendingLateFeeId(null)
  }

  async function handleSendInvoice(invId: string, alreadySent: boolean) {
    if (alreadySent && !confirm('This invoice has already been sent. Send again?')) return
    setSendingInvoiceId(invId)
    try {
      await sendInvoiceEmail(invId, alreadySent ? 'reminder' : 'initial')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to send email')
    }
    setSendingInvoiceId(null)
  }

  async function handleSendReminders() {
    if (!selectedTerm) return
    setSendingReminders(true)
    try {
      const count = await sendOverdueReminders(selectedTerm)
      setRemindersSent(count)
      setTimeout(() => setRemindersSent(null), 5000)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to send reminders')
    }
    setSendingReminders(false)
  }

  function openAdjustment(inv: InvoiceRow['invoice']) {
    setEditingAdjustment(inv.id)
    setAdjAmount(parseFloat(inv.adjustmentAmount) !== 0 ? inv.adjustmentAmount : '')
    setAdjNote(inv.adjustmentNote ?? '')
  }

  async function saveAdjustment(id: string) {
    setSavingAdj(true)
    await updateAdjustment(id, adjAmount || '0', adjNote)
    setSavingAdj(false)
    setEditingAdjustment(null)
  }

  const AdjEditor = ({ invId }: { invId: string }) => (
    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Amount (negative to deduct)</label>
          <input type="number" step="0.01" value={adjAmount} onChange={e => setAdjAmount(e.target.value)}
            placeholder="-30.00" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Note</label>
          <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
            placeholder="e.g. Discount" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => saveAdjustment(invId)} disabled={savingAdj}
          className="px-3 py-1.5 bg-blue-800 text-white text-xs rounded hover:bg-blue-900 disabled:opacity-50">
          {savingAdj ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => setEditingAdjustment(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  )

  const unpaidInvoices = invoices.filter(i => i.invoice.status !== 'paid')
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + parseFloat(i.invoice.amountDue), 0)

  // Group unpaid by child
  const unpaidByChild = unpaidInvoices.reduce<Record<string, { child: { id: string; firstName: string; lastName: string }; total: number; terms: string[] }>>((acc, { invoice: inv, child }) => {
    if (!acc[child.id]) acc[child.id] = { child, total: 0, terms: [] }
    acc[child.id].total += parseFloat(inv.amountDue)
    const term = terms.find(t => t.id === inv.termId)
    if (term) acc[child.id].terms.push(term.name)
    return acc
  }, {})
  const unpaidChildren = Object.values(unpaidByChild).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-4">

      {/* ── Term & invoices ─────────────────────────────────────────────── */}

      {/* Term selector + generate */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className={input}>
          <option value="">— Select term —</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear})</option>)}
        </select>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedTerm || noneSelected}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
        >
          {generating ? 'Generating…' : 'Generate invoices'}
        </button>
      </div>

      {/* Invoice log — bulk PDF download by term or whole academic year */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Invoice log</h3>
        <p className="text-xs text-gray-500 mb-3">Download every generated invoice for a term, or a whole school year, as one PDF.</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={selectedTerm ? `/api/invoice/bulk/pdf?termId=${selectedTerm}` : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!selectedTerm || termInvoices.length === 0}
            className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
              selectedTerm && termInvoices.length > 0
                ? 'text-blue-700 border-blue-200 hover:bg-blue-50'
                : 'text-gray-300 border-gray-200 pointer-events-none'
            }`}
          >
            📥 Download {terms.find(t => t.id === selectedTerm)?.name ?? 'selected term'} ({termInvoices.length} invoice{termInvoices.length !== 1 ? 's' : ''})
          </a>
          {[...new Set(terms.map(t => t.academicYear))].map(year => {
            const count = invoices.filter(i => terms.find(t => t.id === i.invoice.termId)?.academicYear === year).length
            return (
              <a
                key={year}
                href={count > 0 ? `/api/invoice/bulk/pdf?academicYear=${encodeURIComponent(year)}` : undefined}
                target="_blank"
                rel="noreferrer"
                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                  count > 0
                    ? 'text-blue-700 border-blue-200 hover:bg-blue-50'
                    : 'text-gray-300 border-gray-200 pointer-events-none'
                }`}
              >
                📥 Download whole {year} year ({count} invoice{count !== 1 ? 's' : ''})
              </a>
            )
          })}
        </div>
      </div>

      {/* Consumable fee waiver — ad hoc closure or optional-day exceptions */}
      {selectedTerm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Consumable fee waiver</h3>
          <p className="text-xs text-gray-500 mb-3">
            Waive the £3.50 consumable fee for one date on {terms.find(t => t.id === selectedTerm)?.name}&apos;s invoices — e.g. an unplanned closure, or an optional day some children skip.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <input type="date" value={waiverDate} onChange={e => setWaiverDate(e.target.value)} className={input} />
              <select value={waiverMode} onChange={e => setWaiverMode(e.target.value as 'everyone' | 'selected')} className={input}>
                <option value="everyone">Everyone scheduled that day</option>
                <option value="selected">Pick specific children</option>
              </select>
            </div>

            {waiverMode === 'selected' && (
              <div className="flex flex-wrap gap-2">
                {activeChildren.map(child => {
                  const checked = waiverChildIds.has(child.id)
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setWaiverChildIds(prev => {
                        const next = new Set(prev)
                        if (next.has(child.id)) next.delete(child.id)
                        else next.add(child.id)
                        return next
                      })}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        checked
                          ? 'bg-blue-800 text-white border-blue-800'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600'
                      }`}
                    >
                      {child.firstName} {child.lastName}
                    </button>
                  )
                })}
              </div>
            )}

            <input
              type="text"
              placeholder="Reason (optional) — e.g. staff training day, half the class in"
              value={waiverReason}
              onChange={e => setWaiverReason(e.target.value)}
              className={`${input} w-full`}
            />

            <button
              onClick={handleApplyWaiver}
              disabled={applyingWaiver || !waiverDate || (waiverMode === 'selected' && waiverChildIds.size === 0)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {applyingWaiver ? 'Applying…' : 'Apply waiver'}
            </button>

            {waiverResult && (
              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-green-700 font-medium">✓ Waived for {waiverResult.affected} invoice{waiverResult.affected !== 1 ? 's' : ''}.</p>
                {waiverResult.skippedNoConsent.length > 0 && (
                  <p className="mt-1">Skipped (no consumable consent): {waiverResult.skippedNoConsent.join(', ')}</p>
                )}
                {waiverResult.skippedNoInvoice.length > 0 && (
                  <p className="mt-1">Skipped (no invoice generated for this term yet): {waiverResult.skippedNoInvoice.join(', ')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Child selection */}
      {selectedTerm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Select children to invoice
              <span className="ml-2 text-xs font-normal text-gray-400">
                {selectedChildIds.size} of {activeChildren.length} selected
              </span>
            </h3>
            <button onClick={toggleAll} className="text-xs text-blue-800 hover:text-blue-900 font-medium">
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeChildren.map(child => {
              const checked = selectedChildIds.has(child.id)
              return (
                <button key={child.id} type="button" onClick={() => toggleChild(child.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    checked
                      ? 'bg-blue-800 text-white border-blue-800'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600'
                  }`}
                >
                  {child.firstName} {child.lastName}
                </button>
              )
            })}
            {activeChildren.length === 0 && (
              <p className="text-sm text-gray-400">No active children found.</p>
            )}
          </div>
        </div>
      )}

      {terms.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
          No terms set up yet. Go to <strong>Term Dates</strong> to add your first term.
        </div>
      )}

      {/* Stats + funding claims + invoice table for the selected term */}
      {termInvoices.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">£{totalDue.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Total invoiced</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-700">£{totalPaid.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Received</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-800">{outstanding}</div>
              <div className="text-xs text-gray-500 mt-1">Outstanding</div>
            </div>
          </div>

          {/* 7-day reminder button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
            >
              {sendingReminders ? 'Sending…' : 'Send 7-day reminders'}
            </button>
            {remindersSent !== null && (
              <span className="text-sm text-green-600">{remindersSent} reminder{remindersSent !== 1 ? 's' : ''} sent</span>
            )}
          </div>

          {/* Funding claims summary */}
          <FundingClaimsPanel termInvoices={termInvoices} sessionConfigs={sessionConfigs} />

          {/* Mobile/tablet cards */}
          <div className="lg:hidden space-y-3">
            {termInvoices.map(({ invoice: inv, child }) => (
              <div key={inv.id} className={`bg-white rounded-xl border border-gray-200 p-4 ${inv.status === 'paid' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{child.firstName} {child.lastName}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[inv.status]}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">£{parseFloat(inv.amountDue).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">due</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5 mb-3">
                  {inv.fundedSessions > 0 && <div className="text-green-700">{inv.fundedSessions} funded sessions @ £0</div>}
                  {inv.paidSessions > 0 && <div>{inv.paidSessions} paid sessions: £{parseFloat(inv.sessionCost).toFixed(2)}</div>}
                  {inv.consumableConsent && <div>Consumable: £{parseFloat(inv.contributionTotal).toFixed(2)}</div>}
                  {parseFloat(inv.adjustmentAmount) !== 0 && (
                    <div className={parseFloat(inv.adjustmentAmount) < 0 ? 'text-red-600' : 'text-blue-600'}>
                      Adj: {parseFloat(inv.adjustmentAmount) > 0 ? '+' : ''}£{parseFloat(inv.adjustmentAmount).toFixed(2)}
                      {inv.adjustmentNote && ` (${inv.adjustmentNote})`}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={`/api/invoice/${inv.id}/pdf`} target="_blank" rel="noreferrer"
                    className="text-xs bg-blue-100 text-blue-900 hover:bg-blue-200 font-medium px-2.5 py-1 rounded-full">
                    PDF
                  </a>
                  {inv.parentEmail ? (
                    <button
                      onClick={() => handleSendInvoice(inv.id, inv.status === 'sent')}
                      disabled={sendingInvoiceId === inv.id}
                      className="text-xs text-indigo-700 font-medium px-2.5 py-1 rounded-full border border-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      {sendingInvoiceId === inv.id ? 'Sending…' : inv.status === 'sent' ? 'Resend' : 'Send'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 px-2.5 py-1 rounded-full border border-gray-200" title="No email address on invoice">No email</span>
                  )}
                  <button onClick={() => editingAdjustment === inv.id ? setEditingAdjustment(null) : openAdjustment(inv)}
                    className="text-xs text-blue-800 hover:text-blue-900 px-2.5 py-1 rounded-full border border-blue-200">
                    {editingAdjustment === inv.id ? 'Cancel' : 'Adjust'}
                  </button>
                  {inv.status !== 'paid' ? (
                    <button onClick={() => markInvoicePaid(inv.id)}
                      className="text-xs text-green-700 font-medium px-2.5 py-1 rounded-full border border-green-200 hover:bg-green-50">
                      Mark paid
                    </button>
                  ) : (
                    <button onClick={() => markInvoiceUnpaid(inv.id)}
                      className="text-xs text-gray-500 px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-50">
                      Unpaid
                    </button>
                  )}
                  <button onClick={() => deleteInvoice(inv.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2.5 py-1 rounded-full border border-red-200">
                    Delete
                  </button>
                </div>
                {editingAdjustment === inv.id && <AdjEditor invId={inv.id} />}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Child</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sessions</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Sessions</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Consumable</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Adj</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Due</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {termInvoices.map(({ invoice: inv, child }) => (
                  <React.Fragment key={inv.id}>
                    <tr className={inv.status === 'paid' ? 'opacity-60' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">{child.firstName} {child.lastName}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {inv.fundedSessions > 0 && <span className="text-green-700 block">{inv.fundedSessions} funded</span>}
                        {inv.paidSessions > 0 && <span className="block">{inv.paidSessions} paid</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">£{parseFloat(inv.sessionCost).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        {inv.consumableConsent
                          ? <span className="text-blue-900">£{parseFloat(inv.contributionTotal).toFixed(2)}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {parseFloat(inv.adjustmentAmount) !== 0
                          ? <span className={parseFloat(inv.adjustmentAmount) < 0 ? 'text-red-600' : 'text-blue-600'}>
                              {parseFloat(inv.adjustmentAmount) < 0 ? '' : '+'}£{parseFloat(inv.adjustmentAmount).toFixed(2)}
                            </span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">£{parseFloat(inv.amountDue).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[inv.status]}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end whitespace-nowrap">
                          <a href={`/api/invoice/${inv.id}/pdf`} target="_blank" rel="noreferrer"
                            className="text-xs bg-blue-100 text-blue-900 hover:bg-blue-200 font-medium px-2 py-0.5 rounded">
                            PDF
                          </a>
                          {inv.parentEmail ? (
                            <button
                              onClick={() => handleSendInvoice(inv.id, inv.status === 'sent')}
                              disabled={sendingInvoiceId === inv.id}
                              className="text-xs text-indigo-700 hover:text-indigo-900 font-medium disabled:opacity-50"
                            >
                              {sendingInvoiceId === inv.id ? 'Sending…' : inv.status === 'sent' ? 'Resend' : 'Send'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300" title="No email on invoice">—</span>
                          )}
                          <button onClick={() => editingAdjustment === inv.id ? setEditingAdjustment(null) : openAdjustment(inv)}
                            className="text-xs text-blue-800 hover:text-blue-900">Adjust</button>
                          {inv.status !== 'paid' ? (
                            <button onClick={() => markInvoicePaid(inv.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Paid</button>
                          ) : (
                            <button onClick={() => markInvoiceUnpaid(inv.id)} className="text-xs text-gray-400 hover:text-gray-600">Unpaid</button>
                          )}
                          <button onClick={() => deleteInvoice(inv.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
                        </div>
                      </td>
                    </tr>
                    {editingAdjustment === inv.id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                          <div className="flex items-end gap-3 flex-wrap">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Amount (negative to deduct)</label>
                              <input type="number" step="0.01" value={adjAmount} onChange={e => setAdjAmount(e.target.value)}
                                placeholder="-30.00" className="border border-gray-300 rounded px-2 py-1 text-sm w-28 bg-white text-gray-900" />
                            </div>
                            <div className="flex-1 min-w-48">
                              <label className="block text-xs text-gray-500 mb-1">Note</label>
                              <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
                                placeholder="e.g. Sibling discount" className="border border-gray-300 rounded px-2 py-1 text-sm w-full bg-white text-gray-900" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => saveAdjustment(inv.id)} disabled={savingAdj}
                                className="px-3 py-1.5 bg-blue-800 text-white text-xs rounded hover:bg-blue-900 disabled:opacity-50">
                                {savingAdj ? 'Saving…' : 'Save'}
                              </button>
                              <button onClick={() => setEditingAdjustment(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {termInvoices.length === 0 && selectedTerm && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          No invoices generated for this term yet. Select children above and click &ldquo;Generate invoices&rdquo;.
        </div>
      )}

      {/* Reminder log */}
      {termReminders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Reminder log</h3>
            <p className="text-xs text-gray-400 mt-0.5">All invoice emails sent for this term</p>
          </div>
          <div className="divide-y divide-gray-100">
            {termReminders.map(r => {
              const inv = termInvoices.find(i => i.invoice.id === r.invoiceId)
              return (
                <div key={r.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{inv ? `${inv.child.firstName} ${inv.child.lastName}` : '—'}</span>
                    <span className="text-xs text-gray-500 ml-2">{r.email}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'initial' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.type === 'initial' ? 'Invoice sent' : 'Reminder'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Across all terms ────────────────────────────────────────────── */}
      {unpaidChildren.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-2">Across all terms</p>
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-amber-800">Outstanding balances</h3>
              <span className="text-sm font-bold text-amber-900">£{totalOutstanding.toFixed(2)} total</span>
            </div>
            <div className="space-y-1.5">
              {unpaidChildren.map(({ child, total, terms: termNames }) => (
                <div key={child.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{child.firstName} {child.lastName}</span>
                    <span className="text-xs text-gray-500 ml-2">{termNames.join(', ')}</span>
                  </div>
                  <span className="font-semibold text-amber-800">£{total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Other charges (not term invoices) ───────────────────────────── */}
      {(lateFees.length > 0 || extraSessions.length > 0) && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-2">Other charges</p>
      )}

      {/* Late pickup fees */}
      {lateFees.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Late pickup fees</h3>
            <span className="text-xs text-gray-400">{lateFees.filter(f => f.fee.status === 'unpaid').length} unpaid</span>
          </div>
          <div className="divide-y divide-gray-100">
            {lateFees.map(({ fee, child }) => (
              <div key={fee.id} className={`px-4 py-3 ${fee.status !== 'unpaid' ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm">{child.firstName} {child.lastName}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(fee.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {' — '}signed out {new Date(fee.signedOutAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{fee.minutesLate} min late
                    </span>
                    {fee.status === 'waived' && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        Waived{fee.notes ? ` — ${fee.notes}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">£{parseFloat(fee.totalAmount).toFixed(2)}</span>
                    {fee.status === 'unpaid' && (
                      <>
                        {child.parentEmail ? (
                          <button
                            onClick={() => handleSendLateFee(fee.id)}
                            disabled={sendingLateFeeId === fee.id}
                            className="text-xs text-indigo-700 hover:text-indigo-900 font-medium disabled:opacity-50"
                          >
                            {sendingLateFeeId === fee.id ? 'Sending…' : 'Send'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300" title="No email for this child">No email</span>
                        )}
                        <button onClick={() => markLateFeePaid(fee.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Mark paid</button>
                        <button
                          onClick={() => { setWaivingFeeId(fee.id); setWaiveReason('') }}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Waive
                        </button>
                      </>
                    )}
                    {fee.status === 'paid' && (
                      <button onClick={() => markLateFeeUnpaid(fee.id)} className="text-xs text-gray-400 hover:text-gray-600">Unpaid</button>
                    )}
                    {fee.status === 'waived' && (
                      <button onClick={() => markLateFeeUnpaid(fee.id)} className="text-xs text-gray-400 hover:text-gray-600">Undo waive</button>
                    )}
                    <button onClick={() => deleteLateFee(fee.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>

                {/* Inline waive form */}
                {waivingFeeId === fee.id && (
                  <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <input
                      autoFocus
                      value={waiveReason}
                      onChange={e => setWaiveReason(e.target.value)}
                      placeholder="Reason (optional — e.g. parent called ahead)"
                      className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    />
                    <button
                      onClick={async () => {
                        await waiveLateFee(fee.id, waiveReason.trim() || undefined)
                        setWaivingFeeId(null)
                        setWaiveReason('')
                      }}
                      className="text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap"
                    >
                      Confirm waive
                    </button>
                    <button
                      onClick={() => { setWaivingFeeId(null); setWaiveReason('') }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extra one-off sessions */}
      {extraSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Extra one-off sessions</h3>
            <span className="text-xs text-gray-400">{extraSessions.filter(e => e.session.status === 'unpaid').length} unpaid</span>
          </div>
          <div className="divide-y divide-gray-100">
            {extraSessions.map(({ session: es, child }) => (
              <div key={es.id} className={`px-4 py-3 ${es.status !== 'unpaid' ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm">{child.firstName} {child.lastName}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(es.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {' — '}{SESSION_TYPE_LABEL[es.sessionType] ?? es.sessionType}
                      {es.isFunded && ' · funded'}
                    </span>
                    {es.status === 'waived' && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        Waived{es.notes ? ` — ${es.notes}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">£{parseFloat(es.amount).toFixed(2)}</span>
                    {es.status === 'unpaid' && (
                      <>
                        <button onClick={() => markExtraSessionPaid(es.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Mark paid</button>
                        <button
                          onClick={() => { setWaivingExtraId(es.id); setExtraWaiveReason('') }}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Waive
                        </button>
                      </>
                    )}
                    {es.status === 'paid' && (
                      <button onClick={() => markExtraSessionUnpaid(es.id)} className="text-xs text-gray-400 hover:text-gray-600">Unpaid</button>
                    )}
                    {es.status === 'waived' && (
                      <button onClick={() => markExtraSessionUnpaid(es.id)} className="text-xs text-gray-400 hover:text-gray-600">Undo waive</button>
                    )}
                    <button onClick={() => deleteExtraSession(es.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>

                {waivingExtraId === es.id && (
                  <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <input
                      autoFocus
                      value={extraWaiveReason}
                      onChange={e => setExtraWaiveReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    />
                    <button
                      onClick={async () => {
                        await waiveExtraSession(es.id, extraWaiveReason.trim() || undefined)
                        setWaivingExtraId(null)
                        setExtraWaiveReason('')
                      }}
                      className="text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap"
                    >
                      Confirm waive
                    </button>
                    <button
                      onClick={() => { setWaivingExtraId(null); setExtraWaiveReason('') }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function FundingClaimsPanel({
  termInvoices,
  sessionConfigs,
}: {
  termInvoices: InvoiceRow[]
  sessionConfigs: SessionConfig[]
}) {
  // BCP LA base rates from April 2026 (EYSFF 2026/27)
  const LA_RATE_34YO = 5.86
  const LA_RATE_2YO  = 8.27
  const EYPP_RATE    = 1.15   // per funded hour (up to 570h)
  const DAF_ANNUAL   = 975    // per eligible child per year
  const DEP_RATE_34  = 0.33   // deprivation supplement per hour — 3 & 4 year olds
  const DEP_RATE_2YO = 0.65   // deprivation supplement per hour — 2 year olds
  const SENIF_RATES: Record<string, number> = { '1': 2.43, '2': 4.86, '3': 7.49 }

  // Always use BCP LA base rates for funding claims (not private session rates)
  const rate34 = LA_RATE_34YO
  const rate2yo = LA_RATE_2YO

  // Group invoices by funding type
  let funded34Hours = 0
  let funded2yoHours = 0
  let eyppHours = 0
  let dep34Hours = 0
  let dep2yoHours = 0
  let dafCount = 0
  let senTotal = 0
  const senChildren: { name: string; tier: string | null }[] = []
  let extendedCount = 0

  for (const { invoice: inv, child } of termInvoices) {
    const fh = parseFloat(inv.fundedHoursTotal)
    if (fh <= 0) continue

    if (child.twoYearFunding) {
      funded2yoHours += fh
    } else {
      funded34Hours += fh
    }
    if (child.extendedHours) extendedCount++
    if (child.eypp) eyppHours += fh
    if (child.dep) {
      if (child.twoYearFunding) dep2yoHours += fh
      else dep34Hours += fh
    }
    if (child.daf) dafCount++
    if (child.sen && !senChildren.find(s => s.name === `${child.firstName} ${child.lastName}`)) {
      senChildren.push({ name: `${child.firstName} ${child.lastName}`, tier: child.senTier })
      senTotal += fh * (SENIF_RATES[child.senTier ?? '1'] ?? 2.43)
    }
  }

  const hasClaims = funded34Hours > 0 || funded2yoHours > 0 || eyppHours > 0 || dafCount > 0 || dep34Hours > 0 || dep2yoHours > 0 || senChildren.length > 0
  if (!hasClaims) return null

  const dafTermAmount = DAF_ANNUAL / 3

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">LA Funding Claims</h3>
        <p className="text-xs text-gray-400 mt-0.5">Estimated amounts this setting can claim from the local authority for this term</p>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">

        {funded34Hours > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-blue-600 mb-1">
              Universal 15h{extendedCount > 0 ? ` + Extended 30h` : ''}
            </div>
            <div className="text-lg font-bold text-blue-900">
              £{(funded34Hours * rate34).toFixed(2)}
            </div>
            <div className="text-[11px] text-blue-500 mt-0.5">
              {funded34Hours.toFixed(1)}h @ £{rate34.toFixed(2)}/h
              {extendedCount > 0 && ` · ${extendedCount} on extended`}
            </div>
          </div>
        )}

        {funded2yoHours > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-blue-600 mb-1">2-Year-Old Funding</div>
            <div className="text-lg font-bold text-blue-900">
              £{(funded2yoHours * rate2yo).toFixed(2)}
            </div>
            <div className="text-[11px] text-blue-500 mt-0.5">
              {funded2yoHours.toFixed(1)}h @ £{rate2yo.toFixed(2)}/h
            </div>
          </div>
        )}

        {eyppHours > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-purple-600 mb-1">EYPP</div>
            <div className="text-lg font-bold text-purple-900">
              £{(eyppHours * EYPP_RATE).toFixed(2)}
            </div>
            <div className="text-[11px] text-purple-500 mt-0.5">
              {eyppHours.toFixed(1)}h × £{EYPP_RATE.toFixed(2)}
            </div>
          </div>
        )}

        {dafCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-orange-600 mb-1">DAF</div>
            <div className="text-lg font-bold text-orange-900">
              £{(dafCount * dafTermAmount).toFixed(2)}
            </div>
            <div className="text-[11px] text-orange-500 mt-0.5">
              {dafCount} child{dafCount !== 1 ? 'ren' : ''} × £{dafTermAmount.toFixed(2)}/term
            </div>
          </div>
        )}

        {(dep34Hours > 0 || dep2yoHours > 0) && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-orange-600 mb-1">Deprivation Supplement</div>
            <div className="text-lg font-bold text-orange-900">
              £{(dep34Hours * DEP_RATE_34 + dep2yoHours * DEP_RATE_2YO).toFixed(2)}
            </div>
            <div className="text-[11px] text-orange-500 mt-0.5 space-y-0.5">
              {dep34Hours > 0 && <div>{dep34Hours.toFixed(1)}h × £{DEP_RATE_34} (3–4yo)</div>}
              {dep2yoHours > 0 && <div>{dep2yoHours.toFixed(1)}h × £{DEP_RATE_2YO} (2yo)</div>}
            </div>
          </div>
        )}

        {senChildren.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-purple-600 mb-1">SENIF</div>
            <div className="text-lg font-bold text-purple-900">
              £{senTotal.toFixed(2)}
            </div>
            <div className="text-[11px] text-purple-500 mt-0.5 space-y-0.5">
              {senChildren.map((s, i) => (
                <div key={i}>{s.name}{s.tier ? ` — Tier ${s.tier} (£${SENIF_RATES[s.tier]}/h)` : ''}</div>
              ))}
            </div>
          </div>
        )}

      </div>
      <div className="px-4 pb-3 text-[11px] text-gray-400">
        Rates based on your session config. Check against your LA funding statement for final amounts.
      </div>
    </div>
  )
}
