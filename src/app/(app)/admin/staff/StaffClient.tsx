'use client'

import { useState } from 'react'
import { addSickness, deleteSickness, addTraining, deleteTraining, addHours } from './actions'

type StaffMember = { id: string; name: string; email: string; role: string }
type Sickness = { id: string; userId: string; startDate: string; endDate: string | null; reason: string | null; notes: string | null }
type Training = { id: string; userId: string; trainingName: string; completedDate: string; expiryDate: string | null; notes: string | null }
type Hours = { id: string; userId: string; date: string; hoursWorked: string; notes: string | null }

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400'

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function StaffClient({ staff, sickness, training, hours }: {
  staff: StaffMember[]
  sickness: Sickness[]
  training: Training[]
  hours: Hours[]
}) {
  const [selectedStaff, setSelectedStaff] = useState<string>(staff[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState<'training' | 'sickness' | 'hours'>('training')
  const [saving, setSaving] = useState(false)
  const [addingTraining, setAddingTraining] = useState(false)
  const [addingSickness, setAddingSickness] = useState(false)
  const [addingHours, setAddingHours] = useState(false)
  const [trainingForm, setTrainingForm] = useState({ trainingName: '', completedDate: '', expiryDate: '', notes: '' })
  const [sicknessForm, setSicknessForm] = useState({ startDate: '', endDate: '', reason: '', notes: '' })
  const [hoursForm, setHoursForm] = useState({ date: '', hoursWorked: '', notes: '' })

  const staffSickness = sickness.filter(s => s.userId === selectedStaff)
  const staffTraining = training.filter(t => t.userId === selectedStaff)
  const staffHours = hours.filter(h => h.userId === selectedStaff)

  // Expiring soon (within 60 days)
  const expiringTraining = training.filter(t => {
    const days = daysUntilExpiry(t.expiryDate)
    return days !== null && days <= 60 && days >= 0
  })
  const expiredTraining = training.filter(t => {
    const days = daysUntilExpiry(t.expiryDate)
    return days !== null && days < 0
  })

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

  async function handleAddHours() {
    if (!hoursForm.date || !hoursForm.hoursWorked) return
    setSaving(true)
    await addHours(selectedStaff, hoursForm)
    setHoursForm({ date: '', hoursWorked: '', notes: '' })
    setSaving(false)
    setAddingHours(false)
  }

  return (
    <div className="space-y-4">
      {(expiringTraining.length > 0 || expiredTraining.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2">Training Alerts</h3>
          <div className="space-y-1">
            {expiredTraining.map(t => {
              const member = staff.find(s => s.id === t.userId)
              return (
                <div key={t.id} className="text-sm text-red-700">
                  ⚠ <strong>{member?.name}</strong> — {t.trainingName} expired {Math.abs(daysUntilExpiry(t.expiryDate) ?? 0)} days ago
                </div>
              )
            })}
            {expiringTraining.map(t => {
              const member = staff.find(s => s.id === t.userId)
              const days = daysUntilExpiry(t.expiryDate)
              return (
                <div key={t.id} className="text-sm text-orange-700">
                  ⚡ <strong>{member?.name}</strong> — {t.trainingName} expires in {days} days
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {staff.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStaff(s.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${selectedStaff === s.id ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {s.name}
              {training.some(t => {
                if (t.userId !== s.id) return false
                const days = daysUntilExpiry(t.expiryDate)
                return days !== null && days <= 60
              }) && <span className="ml-1 text-red-500">●</span>}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4">
            {(['training', 'sickness', 'hours'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === tab ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'training' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{staffTraining.length} training records</span>
                <button onClick={() => setAddingTraining(a => !a)} className="text-xs text-amber-600 hover:text-amber-700">
                  {addingTraining ? 'Cancel' : '+ Add training'}
                </button>
              </div>
              {staffTraining.map(t => {
                const days = daysUntilExpiry(t.expiryDate)
                const isExpired = days !== null && days < 0
                const isExpiring = days !== null && days <= 60 && days >= 0
                return (
                  <div key={t.id} className={`flex items-start justify-between p-3 rounded-lg text-sm ${isExpired ? 'bg-red-50 border border-red-200' : isExpiring ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                    <div>
                      <div className="font-medium text-gray-900">{t.trainingName}</div>
                      <div className="text-gray-500">Completed: {new Date(t.completedDate + 'T12:00:00').toLocaleDateString('en-GB')}</div>
                      {t.expiryDate && (
                        <div className={isExpired ? 'text-red-600 font-medium' : isExpiring ? 'text-orange-600' : 'text-gray-500'}>
                          Expires: {new Date(t.expiryDate + 'T12:00:00').toLocaleDateString('en-GB')}
                          {isExpired && ' — EXPIRED'}
                          {isExpiring && ` — ${days} days left`}
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
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Training name *</label>
                      <input value={trainingForm.trainingName} onChange={e => setTrainingForm(f => ({ ...f, trainingName: e.target.value }))} placeholder="e.g. First Aid, Safeguarding" className={input} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Completed date *</label>
                      <input type="date" value={trainingForm.completedDate} onChange={e => setTrainingForm(f => ({ ...f, completedDate: e.target.value }))} className={input} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Expiry date</label>
                      <input type="date" value={trainingForm.expiryDate} onChange={e => setTrainingForm(f => ({ ...f, expiryDate: e.target.value }))} className={input} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Notes</label>
                      <input value={trainingForm.notes} onChange={e => setTrainingForm(f => ({ ...f, notes: e.target.value }))} className={input} />
                    </div>
                  </div>
                  <button onClick={handleAddTraining} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sickness' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{staffSickness.length} sickness records</span>
                <button onClick={() => setAddingSickness(a => !a)} className="text-xs text-amber-600 hover:text-amber-700">
                  {addingSickness ? 'Cancel' : '+ Log sickness'}
                </button>
              </div>
              {staffSickness.map(s => (
                <div key={s.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <div className="text-gray-900">{new Date(s.startDate + 'T12:00:00').toLocaleDateString('en-GB')} – {s.endDate ? new Date(s.endDate + 'T12:00:00').toLocaleDateString('en-GB') : 'ongoing'}</div>
                    {s.reason && <div className="text-gray-500">{s.reason}</div>}
                    {s.notes && <div className="text-gray-400 text-xs">{s.notes}</div>}
                  </div>
                  <button onClick={() => deleteSickness(s.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              ))}
              {staffSickness.length === 0 && !addingSickness && <p className="text-sm text-gray-400">No sickness records.</p>}
              {addingSickness && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Start date *</label>
                      <input type="date" value={sicknessForm.startDate} onChange={e => setSicknessForm(f => ({ ...f, startDate: e.target.value }))} className={input} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End date</label>
                      <input type="date" value={sicknessForm.endDate} onChange={e => setSicknessForm(f => ({ ...f, endDate: e.target.value }))} className={input} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Reason</label>
                    <input value={sicknessForm.reason} onChange={e => setSicknessForm(f => ({ ...f, reason: e.target.value }))} className={input} />
                  </div>
                  <button onClick={handleAddSickness} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{staffHours.length} entries</span>
                <button onClick={() => setAddingHours(a => !a)} className="text-xs text-amber-600 hover:text-amber-700">
                  {addingHours ? 'Cancel' : '+ Log hours'}
                </button>
              </div>
              {staffHours.slice(-10).reverse().map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="text-gray-900">{new Date(h.date + 'T12:00:00').toLocaleDateString('en-GB')}</span>
                    {h.notes && <span className="text-gray-500 ml-2">— {h.notes}</span>}
                  </div>
                  <span className="font-medium text-gray-900">{h.hoursWorked}h</span>
                </div>
              ))}
              {staffHours.length === 0 && !addingHours && <p className="text-sm text-gray-400">No hours logged.</p>}
              {addingHours && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date *</label>
                      <input type="date" value={hoursForm.date} onChange={e => setHoursForm(f => ({ ...f, date: e.target.value }))} className={input} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hours worked *</label>
                      <input type="number" step="0.5" value={hoursForm.hoursWorked} onChange={e => setHoursForm(f => ({ ...f, hoursWorked: e.target.value }))} className={input} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Notes</label>
                    <input value={hoursForm.notes} onChange={e => setHoursForm(f => ({ ...f, notes: e.target.value }))} className={input} />
                  </div>
                  <button onClick={handleAddHours} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
