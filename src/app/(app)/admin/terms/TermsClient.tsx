'use client'

import { useState } from 'react'
import { addTerm, deleteTerm, updateSessionPrice } from './actions'

type Term = { id: string; name: string; academicYear: string; startDate: string; endDate: string; weekCount: number }
type SessionConf = { id: string; type: string; label: string; startTime: string; endTime: string; hours: string; price: string; contribution: string }

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400'

export default function TermsClient({ terms, sessions }: { terms: Term[]; sessions: SessionConf[] }) {
  const [addingTerm, setAddingTerm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [sessionPrices, setSessionPrices] = useState<Record<string, { price: string; contribution: string }>>(
    Object.fromEntries(sessions.map(s => [s.id, { price: s.price, contribution: s.contribution }]))
  )
  const [termForm, setTermForm] = useState({ name: '', academicYear: '', startDate: '', endDate: '', weekCount: '' })

  async function handleAddTerm() {
    if (!termForm.name || !termForm.startDate || !termForm.endDate || !termForm.weekCount) return
    setSaving(true)
    await addTerm({ ...termForm, weekCount: parseInt(termForm.weekCount) })
    setTermForm({ name: '', academicYear: '', startDate: '', endDate: '', weekCount: '' })
    setSaving(false)
    setAddingTerm(false)
  }

  async function handleSaveSession(id: string) {
    const { price, contribution } = sessionPrices[id]
    await updateSessionPrice(id, price, contribution)
    setEditingSession(null)
  }

  return (
    <div className="space-y-6">
      {/* Session config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Session Prices</h2>
          <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">⚠ Placeholder prices — confirm with Sally & Louise</span>
        </div>
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{s.label}</div>
                <div className="text-xs text-gray-500">{s.startTime} – {s.endTime} · {s.hours}h</div>
              </div>
              {editingSession === s.id ? (
                <div className="flex items-center gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Price £</label>
                    <input
                      type="number" step="0.01" value={sessionPrices[s.id]?.price ?? s.price}
                      onChange={e => setSessionPrices(p => ({ ...p, [s.id]: { ...p[s.id], price: e.target.value } }))}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Contribution £</label>
                    <input
                      type="number" step="0.01" value={sessionPrices[s.id]?.contribution ?? s.contribution}
                      onChange={e => setSessionPrices(p => ({ ...p, [s.id]: { ...p[s.id], contribution: e.target.value } }))}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex gap-1 mt-4">
                    <button onClick={() => handleSaveSession(s.id)} className="text-xs bg-amber-500 text-white px-2 py-1 rounded">Save</button>
                    <button onClick={() => setEditingSession(null)} className="text-xs text-gray-500 px-2 py-1 rounded border border-gray-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">£{s.price} + £{s.contribution} contribution</div>
                  <button onClick={() => setEditingSession(s.id)} className="text-xs text-amber-600 hover:text-amber-700">Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Academic Terms</h2>
          <button onClick={() => setAddingTerm(a => !a)} className="text-xs text-amber-600 hover:text-amber-700">
            {addingTerm ? 'Cancel' : '+ Add term'}
          </button>
        </div>

        {terms.length === 0 && !addingTerm && (
          <p className="text-sm text-gray-400">No terms set. Add your first term to enable invoicing and attendance tracking.</p>
        )}

        <div className="space-y-2 mb-4">
          {terms.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <span className="font-medium text-gray-900">{t.name}</span>
                <span className="text-gray-500 ml-2">{t.academicYear}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span>{new Date(t.startDate + 'T12:00:00').toLocaleDateString('en-GB')} – {new Date(t.endDate + 'T12:00:00').toLocaleDateString('en-GB')}</span>
                <span>{t.weekCount} weeks</span>
                <button onClick={() => deleteTerm(t.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {addingTerm && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Term name *</label>
                <input value={termForm.name} onChange={e => setTermForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Autumn Term 2025" className={input} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Academic year *</label>
                <input value={termForm.academicYear} onChange={e => setTermForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025-26" className={input} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start date *</label>
                <input type="date" value={termForm.startDate} onChange={e => setTermForm(f => ({ ...f, startDate: e.target.value }))} className={input} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End date *</label>
                <input type="date" value={termForm.endDate} onChange={e => setTermForm(f => ({ ...f, endDate: e.target.value }))} className={input} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Weeks *</label>
                <input type="number" value={termForm.weekCount} onChange={e => setTermForm(f => ({ ...f, weekCount: e.target.value }))} placeholder="12" className={input} />
              </div>
            </div>
            <button onClick={handleAddTerm} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Add term'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
