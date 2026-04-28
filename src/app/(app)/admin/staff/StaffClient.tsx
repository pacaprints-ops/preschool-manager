'use client'

import { useState } from 'react'
import { addSickness, deleteSickness, addTraining, deleteTraining, updateWorkingDays, updateDBS } from './actions'

type StaffMember = { id: string; name: string; email: string; role: string; workingDays: string; dbsCertNumber: string | null; dbsIssueDate: string | null; dbsOnUpdateService: boolean }
type Sickness = { id: string; userId: string; startDate: string; endDate: string | null; reason: string | null; notes: string | null }
type Training = { id: string; userId: string; trainingName: string; completedDate: string; expiryDate: string | null; notes: string | null }

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
const DAY_LABEL: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' }

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function StaffClient({ staff, sickness, training }: {
  staff: StaffMember[]
  sickness: Sickness[]
  training: Training[]
}) {
  const [selectedStaff, setSelectedStaff] = useState<string>(staff[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState<'rota' | 'training' | 'sickness' | 'dbs'>('rota')
  const [saving, setSaving] = useState(false)
  const [dbsForm, setDbsForm] = useState<Record<string, { dbsCertNumber: string; dbsIssueDate: string; dbsOnUpdateService: boolean }>>(
    Object.fromEntries(staff.map(s => [s.id, {
      dbsCertNumber: s.dbsCertNumber ?? '',
      dbsIssueDate: s.dbsIssueDate ?? '',
      dbsOnUpdateService: s.dbsOnUpdateService ?? false,
    }]))
  )
  const [savingDbs, setSavingDbs] = useState(false)
  const [addingTraining, setAddingTraining] = useState(false)
  const [addingSickness, setAddingSickness] = useState(false)
  const [trainingForm, setTrainingForm] = useState({ trainingName: '', completedDate: '', expiryDate: '', notes: '' })
  const [sicknessForm, setSicknessForm] = useState({ startDate: '', endDate: '', reason: '', notes: '' })
  const [workingDaysMap, setWorkingDaysMap] = useState<Record<string, string>>(
    Object.fromEntries(staff.map(s => [s.id, s.workingDays]))
  )

  const selectedMember = staff.find(s => s.id === selectedStaff)
  const staffSickness = sickness.filter(s => s.userId === selectedStaff)
  const staffTraining = training.filter(t => t.userId === selectedStaff)

  const expiringTraining = training.filter(t => { const d = daysUntilExpiry(t.expiryDate); return d !== null && d <= 60 && d >= 0 })
  const expiredTraining = training.filter(t => { const d = daysUntilExpiry(t.expiryDate); return d !== null && d < 0 })

  async function handleAddTraining() {
    if (!trainingForm.trainingName || !trainingForm.completedDate) return
    setSaving(true)
    await addTraining(selectedStaff, trainingForm)
    setTrainingForm({ trainingName: '', completedDate: '', expiryDate: '', notes: '' })
    setSaving(false)
    setAddingTraining(false)
  }

  async function handleAddSickness() {
    if (!sicknessForm.startDate) return
    setSaving(true)
    await addSickness(selectedStaff, sicknessForm)
    setSicknessForm({ startDate: '', endDate: '', reason: '', notes: '' })
    setSaving(false)
    setAddingSickness(false)
  }

  async function toggleDay(userId: string, day: string) {
    const current = workingDaysMap[userId] ?? 'mon,tue,wed,thu,fri'
    const days = current.split(',').filter(Boolean)
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    const ordered = ALL_DAYS.filter(d => next.includes(d))
    const str = ordered.join(',')
    setWorkingDaysMap(m => ({ ...m, [userId]: str }))
    await updateWorkingDays(userId, str)
  }

  return (
    <div className="space-y-4">
      {(expiringTraining.length > 0 || expiredTraining.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2">Training Alerts</h3>
          <div className="space-y-1">
            {expiredTraining.map(t => {
              const member = staff.find(s => s.id === t.userId)
              return <div key={t.id} className="text-sm text-red-700"><strong>{member?.name}</strong> — {t.trainingName} expired {Math.abs(daysUntilExpiry(t.expiryDate) ?? 0)} days ago</div>
            })}
            {expiringTraining.map(t => {
              const member = staff.find(s => s.id === t.userId)
              return <div key={t.id} className="text-sm text-blue-800"><strong>{member?.name}</strong> — {t.trainingName} expires in {daysUntilExpiry(t.expiryDate)} days</div>
            })}
          </div>
        </div>
      )}

      {/* Team rota overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Rota</h3>
        <div className="overflow-x-auto -mx-4 px-4">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="text-left pr-8 py-1 text-gray-500 font-medium">Name</th>
              {ALL_DAYS.map(d => <th key={d} className="px-5 py-1 text-center text-gray-500 font-medium">{DAY_LABEL[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {staff.map(s => {
              const days = workingDaysMap[s.id]?.split(',').filter(Boolean) ?? []
              return (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="pr-8 py-2 font-medium text-gray-900">{s.name}</td>
                  {ALL_DAYS.map(d => (
                    <td key={d} className="px-5 py-2 text-center text-base">
                      {days.includes(d) ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Per-person panel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {staff.map(s => (
            <button key={s.id} onClick={() => setSelectedStaff(s.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${selectedStaff === s.id ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {s.name}
              {training.some(t => { if (t.userId !== s.id) return false; const d = daysUntilExpiry(t.expiryDate); return d !== null && d <= 60 }) && <span className="ml-1 text-red-500">•</span>}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['rota', 'training', 'sickness', 'dbs'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === tab ? 'bg-blue-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {tab.toUpperCase() === 'DBS' ? 'DBS' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'rota' && selectedMember && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Days <span className="font-semibold">{selectedMember.name}</span> works. Click to toggle.</p>
              <div className="flex gap-3 flex-wrap">
                {ALL_DAYS.map(day => {
                  const days = workingDaysMap[selectedStaff]?.split(',').filter(Boolean) ?? []
                  const working = days.includes(day)
                  return (
                    <button key={day} onClick={() => toggleDay(selectedStaff, day)}
                      className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl border-2 font-medium transition-colors ${working ? 'bg-blue-800 text-white border-blue-800' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}
                    >
                      <span className="text-sm">{DAY_LABEL[day]}</span>
                      <span className="text-xs opacity-70">{working ? 'Working' : 'Off'}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400">Changes save automatically.</p>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{staffTraining.length} records</span>
                <button onClick={() => setAddingTraining(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">{addingTraining ? 'Cancel' : '+ Add training'}</button>
              </div>
              {staffTraining.map(t => {
                const days = daysUntilExpiry(t.expiryDate)
                const isExpired = days !== null && days < 0
                const isExpiring = days !== null && days <= 60 && days >= 0
                return (
                  <div key={t.id} className={`flex items-start justify-between p-3 rounded-lg text-sm ${isExpired ? 'bg-red-50 border border-red-200' : isExpiring ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <div>
                      <div className="font-medium text-gray-900">{t.trainingName}</div>
                      <div className="text-gray-500">Completed: {new Date(t.completedDate + 'T12:00:00').toLocaleDateString('en-GB')}</div>
                      {t.expiryDate && (
                        <div className={isExpired ? 'text-red-600 font-medium' : isExpiring ? 'text-blue-800' : 'text-gray-500'}>
                          Expires: {new Date(t.expiryDate + 'T12:00:00').toLocaleDateString('en-GB')}
                          {isExpired && ' — EXPIRED'}{isExpiring && ` — ${days} days left`}
                        </div>
                      )}
                    </div>
                    <button onClick={() => deleteTraining(t.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </div>
                )
              })}
              {staffTraining.length === 0 && !addingTraining && <p className="text-sm text-gray-400">No training records.</p>}
              {addingTraining && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Training name *</label><input value={trainingForm.trainingName} onChange={e => setTrainingForm(f => ({ ...f, trainingName: e.target.value }))} placeholder="e.g. First Aid" className={inp} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Completed date *</label><input type="date" value={trainingForm.completedDate} onChange={e => setTrainingForm(f => ({ ...f, completedDate: e.target.value }))} className={inp} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Expiry date</label><input type="date" value={trainingForm.expiryDate} onChange={e => setTrainingForm(f => ({ ...f, expiryDate: e.target.value }))} className={inp} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">Notes</label><input value={trainingForm.notes} onChange={e => setTrainingForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
                  </div>
                  <button onClick={handleAddTraining} disabled={saving} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dbs' && selectedMember && (() => {
            const form = dbsForm[selectedStaff] ?? { dbsCertNumber: '', dbsIssueDate: '', dbsOnUpdateService: false }
            const dbsDaysLeft = form.dbsIssueDate
              ? Math.floor((new Date(form.dbsIssueDate).getTime() + 3 * 365.25 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
              : null
            return (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">DBS certificate details for <span className="font-semibold">{selectedMember.name}</span>.</p>
                {form.dbsIssueDate && dbsDaysLeft !== null && (
                  <div className={`rounded-lg px-3 py-2 text-sm ${dbsDaysLeft < 0 ? 'bg-red-50 border border-red-200 text-red-700' : dbsDaysLeft <= 90 ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                    {dbsDaysLeft < 0
                      ? `DBS renewal overdue — issued ${Math.abs(dbsDaysLeft)} days past 3 years`
                      : dbsDaysLeft <= 90
                        ? `DBS due for renewal in ${dbsDaysLeft} days`
                        : `DBS valid — ${dbsDaysLeft} days remaining`}
                    {form.dbsOnUpdateService && <span className="ml-2 font-medium">(On Update Service)</span>}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Certificate number</label>
                    <input value={form.dbsCertNumber} onChange={e => setDbsForm(f => ({ ...f, [selectedStaff]: { ...form, dbsCertNumber: e.target.value } }))} placeholder="e.g. 001234567890" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Issue date</label>
                    <input type="date" value={form.dbsIssueDate} onChange={e => setDbsForm(f => ({ ...f, [selectedStaff]: { ...form, dbsIssueDate: e.target.value } }))} className={inp} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="dbsUpdate" checked={form.dbsOnUpdateService} onChange={e => setDbsForm(f => ({ ...f, [selectedStaff]: { ...form, dbsOnUpdateService: e.target.checked } }))} className="rounded" />
                    <label htmlFor="dbsUpdate" className="text-sm text-gray-700">Enrolled on DBS Update Service</label>
                  </div>
                  <button
                    onClick={async () => {
                      setSavingDbs(true)
                      await updateDBS(selectedStaff, {
                        dbsCertNumber: form.dbsCertNumber,
                        dbsIssueDate: form.dbsIssueDate,
                        dbsOnUpdateService: form.dbsOnUpdateService,
                      })
                      setSavingDbs(false)
                    }}
                    disabled={savingDbs}
                    className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    {savingDbs ? 'Saving…' : 'Save DBS record'}
                  </button>
                </div>
              </div>
            )
          })()}

          {activeTab === 'sickness' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{staffSickness.length} records</span>
                <button onClick={() => setAddingSickness(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">{addingSickness ? 'Cancel' : '+ Log sickness'}</button>
              </div>
              {staffSickness.map(s => (
                <div key={s.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <div className="text-gray-900">{new Date(s.startDate + 'T12:00:00').toLocaleDateString('en-GB')} – {s.endDate ? new Date(s.endDate + 'T12:00:00').toLocaleDateString('en-GB') : 'ongoing'}</div>
                    {s.reason && <div className="text-gray-600">{s.reason}</div>}
                    {s.notes && <div className="text-gray-400 text-xs">{s.notes}</div>}
                  </div>
                  <button onClick={() => deleteSickness(s.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              ))}
              {staffSickness.length === 0 && !addingSickness && <p className="text-sm text-gray-400">No sickness records.</p>}
              {addingSickness && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Start date *</label><input type="date" value={sicknessForm.startDate} onChange={e => setSicknessForm(f => ({ ...f, startDate: e.target.value }))} className={inp} /></div>
                    <div><label className="block text-xs text-gray-600 mb-1">End date</label><input type="date" value={sicknessForm.endDate} onChange={e => setSicknessForm(f => ({ ...f, endDate: e.target.value }))} className={inp} /></div>
                  </div>
                  <div><label className="block text-xs text-gray-600 mb-1">Reason</label><input value={sicknessForm.reason} onChange={e => setSicknessForm(f => ({ ...f, reason: e.target.value }))} className={inp} /></div>
                  <button onClick={handleAddSickness} disabled={saving} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
