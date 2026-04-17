'use client'

import { useState } from 'react'
import { generateInvoices, markInvoicePaid, markInvoiceUnpaid, updateParentEmail, deleteInvoice } from './actions'

type Term = { id: string; name: string; academicYear: string; weekCount: number }
type InvoiceRow = {
  invoice: {
    id: string
    termId: string
    paidSessions: number
    fundedSessions: number
    fundedHoursTotal: string
    sessionCost: string
    contributionTotal: string
    fundedValue: string
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

export default function InvoicingClient({ terms, invoices }: { terms: Term[]; invoices: InvoiceRow[] }) {
  const [selectedTerm, setSelectedTerm] = useState<string>(terms[terms.length - 1]?.id ?? '')
  const [generating, setGenerating] = useState(false)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [emailValue, setEmailValue] = useState('')

  const termInvoices = invoices.filter(i => i.invoice.termId === selectedTerm)
  const totalDue = termInvoices.reduce((sum, i) => sum + parseFloat(i.invoice.amountDue), 0)
  const totalPaid = termInvoices.filter(i => i.invoice.status === 'paid').reduce((sum, i) => sum + parseFloat(i.invoice.amountDue), 0)
  const outstanding = termInvoices.filter(i => i.invoice.status !== 'paid').length

  async function handleGenerate() {
    if (!selectedTerm) return
    setGenerating(true)
    const count = await generateInvoices(selectedTerm)
    setGenerating(false)
    if (count === 0) alert('Invoices already generated for this term, or no active children.')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className={input}>
          <option value="">— Select term —</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear})</option>)}
        </select>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedTerm}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg disabled:opacity-50"
        >
          {generating ? 'Generating…' : 'Generate invoices'}
        </button>
      </div>

      {terms.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          No terms set up yet. Go to <strong>Term Dates</strong> to add your first term.
        </div>
      )}

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

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Child</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Paid sessions</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Funded sessions</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Session cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Contribution</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount due</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {termInvoices.map(({ invoice: inv, child }) => (
                  <tr key={inv.id} className={inv.status === 'paid' ? 'opacity-60' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{child.firstName} {child.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.paidSessions}</td>
                    <td className="px-4 py-3">
                      {inv.fundedSessions > 0 ? (
                        <span className="text-green-700">
                          {inv.fundedSessions} sessions · {parseFloat(inv.fundedHoursTotal).toFixed(1)}h @ £0
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">£{parseFloat(inv.sessionCost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">£{parseFloat(inv.contributionTotal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">£{parseFloat(inv.amountDue).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[inv.status]}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {inv.status !== 'paid' ? (
                          <button onClick={() => markInvoicePaid(inv.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">
                            Mark paid
                          </button>
                        ) : (
                          <button onClick={() => markInvoiceUnpaid(inv.id)} className="text-xs text-gray-400 hover:text-gray-600">
                            Unpaid
                          </button>
                        )}
                        <button onClick={() => deleteInvoice(inv.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            ⚠ Email sending coming soon — invoices currently need to be marked paid manually. Funded hours deduction uses a placeholder rate (£5/hr) — confirm actual rate.
          </p>
        </>
      )}

      {termInvoices.length === 0 && selectedTerm && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          No invoices generated for this term yet. Click &ldquo;Generate invoices&rdquo; above.
        </div>
      )}
    </div>
  )
}
