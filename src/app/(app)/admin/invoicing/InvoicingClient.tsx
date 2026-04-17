'use client'

import React, { useState } from 'react'
import { generateInvoices, markInvoicePaid, markInvoiceUnpaid, deleteInvoice, updateAdjustment } from './actions'

type Term = { id: string; name: string; academicYear: string; weekCount: number }
type ActiveChild = { id: string; firstName: string; lastName: string }
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
  child: { id: string; firstName: string; lastName: string }
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

const input = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400'

export default function InvoicingClient({
  terms,
  invoices,
  activeChildren,
}: {
  terms: Term[]
  invoices: InvoiceRow[]
  activeChildren: ActiveChild[]
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

  const termInvoices = invoices.filter(i => i.invoice.termId === selectedTerm)
  const totalDue = termInvoices.reduce((sum, i) => sum + parseFloat(i.invoice.amountDue), 0)
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

  return (
    <div className="space-y-4">

      {/* Term selector + generate */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className={input}>
          <option value="">— Select term —</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear})</option>)}
        </select>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedTerm || noneSelected}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg disabled:opacity-50"
        >
          {generating ? 'Generating…' : 'Generate invoices'}
        </button>
      </div>

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
            <button onClick={toggleAll} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeChildren.map(child => {
              const checked = selectedChildIds.has(child.id)
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleChild(child.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    checked
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-amber-400'
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          No terms set up yet. Go to <strong>Term Dates</strong> to add your first term.
        </div>
      )}

      {/* Stats */}
      {termInvoices.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">£{totalDue.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Total invoiced</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">£{totalPaid.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Received</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{outstanding}</div>
              <div className="text-xs text-gray-500 mt-1">Outstanding</div>
            </div>
          </div>

          {/* Invoice table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Child</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sessions</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Session cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Consumable</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Adjustment</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount due</th>
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
                        {inv.fundedSessions > 0 && (
                          <span className="text-green-700 block">{inv.fundedSessions} funded @ £0</span>
                        )}
                        {inv.paidSessions > 0 && (
                          <span className="block">{inv.paidSessions} paid</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        £{parseFloat(inv.sessionCost).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.consumableConsent
                          ? <span className="text-amber-700">£{parseFloat(inv.contributionTotal).toFixed(2)}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {parseFloat(inv.adjustmentAmount) !== 0
                          ? <span className={parseFloat(inv.adjustmentAmount) < 0 ? 'text-red-600' : 'text-blue-600'}>
                              {parseFloat(inv.adjustmentAmount) < 0 ? '' : '+'}£{parseFloat(inv.adjustmentAmount).toFixed(2)}
                            </span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        £{parseFloat(inv.amountDue).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[inv.status]}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end whitespace-nowrap">
                          <a
                            href={`/api/invoice/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium px-2 py-0.5 rounded"
                          >
                            PDF
                          </a>
                          <button
                            onClick={() => editingAdjustment === inv.id ? setEditingAdjustment(null) : openAdjustment(inv)}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            Adjust
                          </button>
                          {inv.status !== 'paid' ? (
                            <button
                              onClick={() => markInvoicePaid(inv.id)}
                              className="text-xs text-green-600 hover:text-green-700 font-medium"
                            >
                              Paid
                            </button>
                          ) : (
                            <button
                              onClick={() => markInvoiceUnpaid(inv.id)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Unpaid
                            </button>
                          )}
                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Adjustment editor row */}
                    {editingAdjustment === inv.id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                          <div className="flex items-end gap-3 flex-wrap">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Adjustment (negative to deduct, e.g. -30.00)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={adjAmount}
                                onChange={e => setAdjAmount(e.target.value)}
                                placeholder="-30.00"
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
                              />
                            </div>
                            <div className="flex-1 min-w-48">
                              <label className="block text-xs text-gray-500 mb-1">Note</label>
                              <input
                                type="text"
                                value={adjNote}
                                onChange={e => setAdjNote(e.target.value)}
                                placeholder="e.g. Bank holiday deduction"
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveAdjustment(inv.id)}
                                disabled={savingAdj}
                                className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                              >
                                {savingAdj ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingAdjustment(null)}
                                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                              >
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
    </div>
  )
}
