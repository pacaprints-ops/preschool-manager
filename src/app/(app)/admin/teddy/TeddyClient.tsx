'use client'

import { useState } from 'react'
import { giveTeddy, returnTeddy, deleteTeddyEntry } from './actions'

type Child = { id: string; firstName: string; lastName: string }

type TeddyEntry = {
  id: string
  childId: string
  takenDate: string
  returnedDate: string | null
  notes: string | null
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function TeddyClient({
  activeChildren,
  allEntries,
}: {
  activeChildren: Child[]
  allEntries: TeddyEntry[]
}) {
  const [working, setWorking] = useState<string | null>(null)
  const [givingTo, setGivingTo] = useState<string | null>(null) // childId being given teddy
  const [giveDate, setGiveDate] = useState(todayStr())
  const [giveNotes, setGiveNotes] = useState('')
  const [returningId, setReturningId] = useState<string | null>(null) // logId being returned
  const [returnDate, setReturnDate] = useState(todayStr())

  // Child currently holding the teddy (last entry with no returnedDate)
  const currentEntry = [...allEntries].reverse().find(e => !e.returnedDate) ?? null
  const currentHolder = currentEntry ? activeChildren.find(c => c.id === currentEntry.childId) : null

  // Build per-child status
  type ChildStatus = {
    child: Child
    currentEntry: TeddyEntry | null
    history: TeddyEntry[]
    lastTaken: string | null
    hadIt: boolean
  }

  const childStatuses: ChildStatus[] = activeChildren.map(child => {
    const entries = allEntries.filter(e => e.childId === child.id)
    const current = entries.find(e => !e.returnedDate) ?? null
    const history = entries.filter(e => e.returnedDate)
    const lastTaken = history.length > 0 ? history[history.length - 1].takenDate : null
    return { child, currentEntry: current, history, lastTaken, hadIt: entries.length > 0 }
  })

  const notYet = childStatuses.filter(s => !s.hadIt)
  const hadIt = childStatuses.filter(s => s.hadIt && !s.currentEntry)
  const currentlyHas = childStatuses.filter(s => s.currentEntry)

  async function handleGive(childId: string) {
    setWorking(childId)
    await giveTeddy(childId, giveDate, giveNotes || undefined)
    setGivingTo(null)
    setGiveDate(todayStr())
    setGiveNotes('')
    setWorking(null)
  }

  async function handleReturn(logId: string) {
    setWorking(logId)
    await returnTeddy(logId, returnDate)
    setReturningId(null)
    setReturnDate(todayStr())
    setWorking(null)
  }

  async function handleDelete(logId: string) {
    if (!confirm('Remove this teddy log entry?')) return
    setWorking(logId)
    await deleteTeddyEntry(logId)
    setWorking(null)
  }

  const inp = 'border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

  function StatusSection({ title, children: rows, emptyMsg }: { title: string; children: React.ReactNode; emptyMsg?: string }) {
    return (
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</div>
        {rows || <p className="text-sm text-gray-400 py-2">{emptyMsg}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">🧸 Paddington's Diary</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track who has taken Paddington home</p>
        </div>
        <div className="text-xs text-gray-400">
          {activeChildren.length} children · {hadIt.length + currentlyHas.length} have had it · {notYet.length} not yet
        </div>
      </div>

      {/* Currently with banner */}
      {currentHolder && currentEntry && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧸</span>
            <div>
              <div className="text-sm font-bold text-amber-900">Currently with {currentHolder.firstName} {currentHolder.lastName}</div>
              <div className="text-xs text-amber-700 mt-0.5">Taken home {fmtDate(currentEntry.takenDate)}{currentEntry.notes ? ` · ${currentEntry.notes}` : ''}</div>
            </div>
          </div>
          {returningId === currentEntry.id ? (
            <div className="flex items-center gap-2">
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className={inp} />
              <button
                onClick={() => handleReturn(currentEntry.id)}
                disabled={working === currentEntry.id}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {working === currentEntry.id ? '…' : 'Confirm return'}
              </button>
              <button onClick={() => setReturningId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => { setReturningId(currentEntry.id); setReturnDate(todayStr()) }}
              className="px-4 py-2 text-sm font-medium border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Mark returned
            </button>
          )}
        </div>
      )}

      {!currentHolder && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-xl">🧸</span>
          <p className="text-sm text-gray-500">Paddington is at school — not currently with anyone.</p>
        </div>
      )}

      {/* Children list */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

        {/* Not yet */}
        {notYet.length > 0 && (
          <div className="px-4 py-3 space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Not yet had Paddington</div>
            {notYet.map(({ child }) => (
              <div key={child.id}>
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    <span className="text-sm text-gray-700">{child.firstName} {child.lastName}</span>
                  </div>
                  {givingTo === child.id ? (
                    <div className="flex items-center gap-2">
                      <input type="date" value={giveDate} onChange={e => setGiveDate(e.target.value)} className={inp} />
                      <input value={giveNotes} onChange={e => setGiveNotes(e.target.value)} placeholder="Notes (optional)" className={`${inp} w-36`} />
                      <button
                        onClick={() => handleGive(child.id)}
                        disabled={working === child.id}
                        className="px-3 py-1.5 bg-[#020e2f] text-white text-xs font-medium rounded-lg disabled:opacity-50"
                      >
                        {working === child.id ? '…' : 'Give'}
                      </button>
                      <button onClick={() => setGivingTo(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setGivingTo(child.id); setGiveDate(todayStr()); setGiveNotes('') }}
                      disabled={!!currentHolder}
                      className="text-xs text-blue-700 hover:text-blue-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title={currentHolder ? `Return from ${currentHolder.firstName} first` : undefined}
                    >
                      Give Paddington →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Had it (returned) */}
        {hadIt.length > 0 && (
          <div className="px-4 py-3 space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Has had Paddington</div>
            {hadIt.map(({ child, history }) => (
              <div key={child.id}>
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    <span className="text-sm text-gray-700">{child.firstName} {child.lastName}</span>
                    <span className="text-xs text-gray-400">
                      {history.length === 1
                        ? fmtDate(history[0].takenDate)
                        : `${history.length}× — last ${fmtDate(history[history.length - 1].takenDate)}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {givingTo === child.id ? (
                      <>
                        <input type="date" value={giveDate} onChange={e => setGiveDate(e.target.value)} className={inp} />
                        <button
                          onClick={() => handleGive(child.id)}
                          disabled={working === child.id}
                          className="px-3 py-1.5 bg-[#020e2f] text-white text-xs font-medium rounded-lg disabled:opacity-50"
                        >
                          {working === child.id ? '…' : 'Give again'}
                        </button>
                        <button onClick={() => setGivingTo(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setGivingTo(child.id); setGiveDate(todayStr()); setGiveNotes('') }}
                        disabled={!!currentHolder}
                        className="text-xs text-gray-400 hover:text-gray-600 disabled:text-gray-200 disabled:cursor-not-allowed"
                      >
                        Give again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Currently has it */}
        {currentlyHas.length > 0 && (
          <div className="px-4 py-3 space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Currently has Paddington</div>
            {currentlyHas.map(({ child, currentEntry: entry }) => entry && (
              <div key={child.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{child.firstName} {child.lastName}</span>
                  <span className="text-xs text-amber-600">since {fmtDate(entry.takenDate)}</span>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={working === entry.id}
                  className="text-xs text-gray-300 hover:text-red-400 disabled:opacity-50"
                >
                  Remove entry
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Hint */}
      {currentHolder && (
        <p className="text-xs text-gray-400 mt-3">Return Paddington before giving to another child.</p>
      )}
    </div>
  )
}
