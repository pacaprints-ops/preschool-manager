'use client'

import { useState } from 'react'
import { addTerm, deleteTerm, updateSessionRates } from './actions'

type Term = { id: string; name: string; academicYear: string; startDate: string; endDate: string; weekCount: number }
type SessionConf = { id: string; type: string; label: string; startTime: string; endTime: string; hours: string; hourlyRate2yo: string; hourlyRate34yo: string; contribution: string }

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function TermsClient({ terms, sessions }: { terms: Term[]; sessions: SessionConf[] }) {
  const [addingTerm, setAddingTerm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [sessionRates, setSessionRates] = useState<Record<string, { hourlyRate2yo: string; hourlyRate34yo: string; contribution: string }>>(
    Object.fromEntries(sessions.map(s => [s.id, { hourlyRate2yo: s.hourlyRate2yo, hourlyRate34yo: s.hourlyRate34yo, contribution: s.contribution }]))
  )
  const [termForm, setTermForm] = useState({ name: '', academicYear: '', startDate: '', endDate: '', weekCount: '' })

  function calcWeeks(start: string, end: string): string {
    if (!start || !end) return ''
    const diff = new Date(end).getTime() - new Date(start).getTime()
    if (diff <= 0) return ''
    return String(Math.round(diff / (7 * 24 * 60 * 60 * 1000)))
  }

  function handleDateChange(field: 'startDate' | 'endDate', value: string) {
    const next = { ...termForm, [field]: value }
    next.weekCount = calcWeeks(next.startDate, next.endDate)
    setTermForm(next)
  }

  async function handleAddTerm() {
    if (!termForm.name || !termForm.startDate || !termForm.endDate || !termForm.weekCount) return
    setSaving(true)
    await addTerm({ ...termForm, weekCount: parseInt(termForm.weekCount) })
    setTermForm({ name: '', academicYear: '', startDate: '', endDate: '', weekCount: '' })
    setSaving(false)
    setAddingTerm(false)
  }

  async function handleSaveSession(id: string) {
    const { hourlyRate2yo, hourlyRate34yo, contribution } = sessionRates[id]
    await updateSessionRates(id, hourlyRate2yo, hourlyRate34yo, contribution)
    setEditingSession(null)
  }

  return (
    <div className="space-y-6">
      {/* Session config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Session Rates</h2>
            <p className="text-xs text-gray-500 mt-0.5">Hourly rates by age group + consumable fee per session</p>
          </div>
        </div>
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{s.label}</div>
                  <div className="text-xs text-gray-500">{s.startTime} – {s.endTime} · {s.hours}h</div>
                </div>
                {editingSession !== s.id && (
                  <button onClick={() => setEditingSession(s.id)} className="text-xs text-blue-800 hover:text-blue-900 shrink-0">Edit</button>
                )}
              </div>
              {editingSession === s.id ? (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">2yo £/hr</label>
                      <input type="number" step="0.01" value={sessionRates[s.id]?.hourlyRate2yo ?? s.hourlyRate2yo}
                        onChange={e => setSessionRates(p => ({ ...p, [s.id]: { ...p[s.id], hourlyRate2yo: e.target.value } }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">3&4yo £/hr</label>
                      <input type="number" step="0.01" value={sessionRates[s.id]?.hourlyRate34yo ?? s.hourlyRate34yo}
                        onChange={e => setSessionRates(p => ({ ...p, [s.id]: { ...p[s.id], hourlyRate34yo: e.target.value } }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Consumable £</label>
                      <input type="number" step="0.01" value={sessionRates[s.id]?.contribution ?? s.contribution}
                        onChange={e => setSessionRates(p => ({ ...p, [s.id]: { ...p[s.id], contribution: e.target.value } }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveSession(s.id)} className="text-xs bg-blue-800 text-white px-3 py-1.5 rounded hover:bg-blue-900">Save</button>
                    <button onClick={() => setEditingSession(null)} className="text-xs text-gray-500 px-3 py-1.5 rounded border border-gray-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-600">
                  <span>2yo: <strong className="text-gray-900">£{s.hourlyRate2yo}/hr</strong></span>
                  <span>3&4yo: <strong className="text-gray-900">£{s.hourlyRate34yo}/hr</strong></span>
                  <span>Consumable: <strong className="text-gray-900">£{s.contribution}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Rates apply to paid sessions only. Funded sessions charge consumable fee only (£{sessions[0]?.contribution ?? '3.50'}/session).
        </p>
      </div>

      {/* Terms */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Academic Terms</h2>
          <button onClick={() => setAddingTerm(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">
            {addingTerm ? 'Cancel' : '+ Add term'}
          </button>
        </div>

        {terms.length === 0 && !addingTerm && (
          <p className="text-sm text-gray-400">No terms set. Add your first term to enable invoicing and attendance tracking.</p>
        )}

        <div className="space-y-2 mb-4">
          {terms.map(t => (
            <div key={t.id} className="flex items-start sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg text-sm flex-wrap">
              <div>
                <span className="font-medium text-gray-900">{t.name}</span>
                <span className="text-gray-500 ml-2">{t.academicYear}</span>
                <div className="text-xs text-gray-500 mt-0.5 sm:hidden">
                  {new Date(t.startDate + 'T12:00:00').toLocaleDateString('en-GB')} – {new Date(t.endDate + 'T12:00:00').toLocaleDateString('en-GB')} · {t.weekCount} wks
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="hidden sm:inline">{new Date(t.startDate + 'T12:00:00').toLocaleDateString('en-GB')} – {new Date(t.endDate + 'T12:00:00').toLocaleDateString('en-GB')}</span>
                <span className="hidden sm:inline">{t.weekCount} weeks</span>
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
                <input value={termForm.name} onChange={e => setTermForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Autumn 1" className={input} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Academic year *</label>
                <input value={termForm.academicYear} onChange={e => setTermForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025-26" className={input} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start date *</label>
                <input type="date" value={termForm.startDate} onChange={e => handleDateChange('startDate', e.target.value)} className={input} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End date *</label>
                <input type="date" value={termForm.endDate} onChange={e => handleDateChange('endDate', e.target.value)} className={input} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Weeks *</label>
                <input type="number" value={termForm.weekCount} onChange={e => setTermForm(f => ({ ...f, weekCount: e.target.value }))} placeholder="auto" className={input} />
              </div>
            </div>
            <button onClick={handleAddTerm} disabled={saving} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Add term'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
