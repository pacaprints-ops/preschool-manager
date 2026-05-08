'use client'

import { useState } from 'react'
import { addSickness, deleteSickness, addTraining, deleteTraining, updateWorkingDays, updateDBS, addTimesheetEntry, deleteTimesheetEntry } from './actions'

type StaffMember = { id: string; name: string; email: string; role: string; workingDays: string; dbsCertNumber: string | null; dbsIssueDate: string | null; dbsOnUpdateService: boolean }
type Sickness = { id: string; userId: string; startDate: string; endDate: string | null; reason: string | null; notes: string | null }
type Training = { id: string; userId: string; trainingName: string; completedDate: string; expiryDate: string | null; notes: string | null }
type HoursLogEntry = { id: string; userId: string | null; date: string; signedInAt: string | null; signedOutAt: string | null }
type TimesheetEntry = { id: string; userId: string; date: string; timeIn: string | null; timeOut: string | null; hoursWorked: string; notes: string | null }

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
const DAY_LABEL: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' }

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtUTCTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function calcHoursFromTimes(timeIn: string | null, timeOut: string | null): number | null {
  if (!timeIn || !timeOut) return null
  const [ih, im] = timeIn.split(':').map(Number)
  const [oh, om] = timeOut.split(':').map(Number)
  const mins = (oh * 60 + om) - (ih * 60 + im)
  return mins > 0 ? Math.round(mins / 60 * 100) / 100 : null
}

// Compare timesheet entry against the logged sign-in/out for same date/user
function discrepancyMinutes(
  sheet: TimesheetEntry,
  log: HoursLogEntry | undefined,
): number | null {
  if (!log) return null
  const logIn = fmtUTCTime(log.signedInAt)
  const logOut = fmtUTCTime(log.signedOutAt)
  if (!logIn || !logOut || !sheet.timeIn || !sheet.timeOut) return null
  const logMins = calcHoursFromTimes(logIn, logOut)
  const sheetMins = calcHoursFromTimes(sheet.timeIn, sheet.timeOut)
  if (logMins === null || sheetMins === null) return null
  return Math.abs(logMins - sheetMins) * 60
}

export default function StaffClient({ staff, sickness, training, hoursLog, timesheets }: {
  staff: StaffMember[]
  sickness: Sickness[]
  training: Training[]
  hoursLog: HoursLogEntry[]
  timesheets: TimesheetEntry[]
}) {
  const [selectedStaff, setSelectedStaff] = useState<string>(staff[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState<'rota' | 'training' | 'sickness' | 'dbs' | 'hours' | 'timesheet'>('rota')
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
  const [addingTimesheet, setAddingTimesheet] = useState(false)
  const [trainingForm, setTrainingForm] = useState({ trainingName: '', completedDate: '', expiryDate: '', notes: '' })
  const [sicknessForm, setSicknessForm] = useState({ startDate: '', endDate: '', reason: '', notes: '' })
  const [timesheetForm, setTimesheetForm] = useState({ date: '', timeIn: '', timeOut: '', notes: '' })
  const [workingDaysMap, setWorkingDaysMap] = useState<Record<string, string>>(
    Object.fromEntries(staff.map(s => [s.id, s.workingDays]))
  )

  const selectedMember = staff.find(s => s.id === selectedStaff)
  const staffSickness = sickness.filter(s => s.userId === selectedStaff)
  const staffTraining = training.filter(t => t.userId === selectedStaff)
  const staffHoursLog = hoursLog.filter(h => h.userId === selectedStaff)
  const staffTimesheets = timesheets.filter(t => t.userId === selectedStaff)

  // Build a map of date -> hoursLog entry for discrepancy checking
  const logByDate = Object.fromEntries(staffHoursLog.map(h => [h.date, h]))

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

  async function handleAddTimesheet() {
    if (!timesheetForm.date || !timesheetForm.timeIn || !timesheetForm.timeOut) return
    const hours = calcHoursFromTimes(timesheetForm.timeIn, timesheetForm.timeOut)
    if (!hours) return
    setSaving(true)
    await addTimesheetEntry(selectedStaff, {
      date: timesheetForm.date,
      timeIn: timesheetForm.timeIn,
      timeOut: timesheetForm.timeOut,
      hoursWorked: hours.toFixed(2),
      notes: timesheetForm.notes,
    })
    setTimesheetForm({ date: '', timeIn: '', timeOut: '', notes: '' })
    setSaving(false)
    setAddingTimesheet(false)
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

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'rota', label: 'Rota' },
    { key: 'hours', label: 'Hours log' },
    { key: 'timesheet', label: 'Timesheets' },
    { key: 'training', label: 'Training' },
    { key: 'sickness', label: 'Sickness' },
    { key: 'dbs', label: 'DBS' },
  ]

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
            {tabs.map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === key ? 'bg-blue-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Rota ── */}
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

          {/* ── Hours log ── */}
          {activeTab === 'hours' && selectedMember && (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Sign-in/out times recorded on the daily register for <span className="font-semibold">{selectedMember.name}</span>.
              </p>
              {staffHoursLog.length === 0 ? (
                <p className="text-sm text-gray-400">No sign-in records yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-2 pr-6 font-medium">Date</th>
                        <th className="pb-2 pr-6 font-medium">In</th>
                        <th className="pb-2 pr-6 font-medium">Out</th>
                        <th className="pb-2 font-medium">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staffHoursLog.slice().reverse().map(h => {
                        const inTime = fmtUTCTime(h.signedInAt)
                        const outTime = fmtUTCTime(h.signedOutAt)
                        const hrs = calcHoursFromTimes(inTime, outTime)
                        return (
                          <tr key={h.id}>
                            <td className="py-2 pr-6 text-gray-700">{fmtDate(h.date)}</td>
                            <td className="py-2 pr-6 text-gray-700 font-mono">{inTime ?? '—'}</td>
                            <td className="py-2 pr-6 text-gray-700 font-mono">{outTime ?? <span className="text-amber-500">Not signed out</span>}</td>
                            <td className="py-2 text-gray-700">{hrs !== null ? `${hrs.toFixed(2)}h` : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Timesheets ── */}
          {activeTab === 'timesheet' && selectedMember && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">
                  Timesheet entries for <span className="font-semibold">{selectedMember.name}</span>.
                  <span className="ml-1 text-xs text-gray-400">Flagged rows differ from the sign-in log by more than 15 min.</span>
                </p>
                <button onClick={() => setAddingTimesheet(a => !a)} className="text-xs text-blue-800 hover:text-blue-900 whitespace-nowrap">
                  {addingTimesheet ? 'Cancel' : '+ Add entry'}
                </button>
              </div>

              {addingTimesheet && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 border border-gray-200">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date *</label>
                      <input type="date" value={timesheetForm.date} onChange={e => setTimesheetForm(f => ({ ...f, date: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Time in *</label>
                      <input type="time" value={timesheetForm.timeIn} onChange={e => setTimesheetForm(f => ({ ...f, timeIn: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Time out *</label>
                      <input type="time" value={timesheetForm.timeOut} onChange={e => setTimesheetForm(f => ({ ...f, timeOut: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Notes</label>
                      <input value={timesheetForm.notes} onChange={e => setTimesheetForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" className={inp} />
                    </div>
                  </div>
                  {timesheetForm.timeIn && timesheetForm.timeOut && (
                    <p className="text-xs text-gray-500">
                      Calculated: <span className="font-semibold">{calcHoursFromTimes(timesheetForm.timeIn, timesheetForm.timeOut)?.toFixed(2) ?? '—'}h</span>
                    </p>
                  )}
                  <button
                    onClick={handleAddTimesheet}
                    disabled={saving || !timesheetForm.date || !timesheetForm.timeIn || !timesheetForm.timeOut}
                    className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save entry'}
                  </button>
                </div>
              )}

              {staffTimesheets.length === 0 && !addingTimesheet ? (
                <p className="text-sm text-gray-400">No timesheet entries yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">In</th>
                        <th className="pb-2 pr-4 font-medium">Out</th>
                        <th className="pb-2 pr-4 font-medium">Hours</th>
                        <th className="pb-2 pr-4 font-medium">Log</th>
                        <th className="pb-2 pr-4 font-medium">Notes</th>
                        <th className="pb-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staffTimesheets.slice().reverse().map(t => {
                        const logEntry = logByDate[t.date]
                        const diffMins = discrepancyMinutes(t, logEntry)
                        const hasDiscrepancy = diffMins !== null && diffMins > 15
                        const logIn = fmtUTCTime(logEntry?.signedInAt ?? null)
                        const logOut = fmtUTCTime(logEntry?.signedOutAt ?? null)
                        return (
                          <tr key={t.id} className={hasDiscrepancy ? 'bg-amber-50' : ''}>
                            <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">
                              {hasDiscrepancy && <span className="mr-1 text-amber-500" title="Timesheet differs from sign-in log by more than 15 min">⚠</span>}
                              {fmtDate(t.date)}
                            </td>
                            <td className="py-2 pr-4 text-gray-700 font-mono">{t.timeIn ?? '—'}</td>
                            <td className="py-2 pr-4 text-gray-700 font-mono">{t.timeOut ?? '—'}</td>
                            <td className="py-2 pr-4 text-gray-700">{Number(t.hoursWorked).toFixed(2)}h</td>
                            <td className="py-2 pr-4 text-xs text-gray-400">
                              {logIn && logOut
                                ? <span className="font-mono">{logIn}–{logOut}</span>
                                : logIn
                                  ? <span className="font-mono text-amber-500">{logIn} (no out)</span>
                                  : <span className="italic">No log</span>
                              }
                            </td>
                            <td className="py-2 pr-4 text-gray-400 text-xs">{t.notes ?? ''}</td>
                            <td className="py-2 text-right">
                              <button onClick={() => deleteTimesheetEntry(t.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Training ── */}
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

          {/* ── DBS ── */}
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

          {/* ── Sickness ── */}
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
