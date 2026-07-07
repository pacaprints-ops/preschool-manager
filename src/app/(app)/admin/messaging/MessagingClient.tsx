'use client'

import { useState, useRef } from 'react'
import { sendParentMessage } from './actions'

type Message = {
  id: string
  subject: string
  body: string
  recipientCount: number
  sentByName: string
  sentAt: string
  filterType: string
}

type ChildItem = { id: string; name: string; hasEmail: boolean }

const FILTER_LABELS: Record<string, string> = {
  all: 'All parents',
  morning: 'Morning session parents',
  afternoon: 'Afternoon session parents',
  full_day: 'Full day session parents',
  single_child: 'Single child',
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

function filterLabel(filterType: string, childList: ChildItem[]): string {
  if (filterType.startsWith('single:')) {
    const id = filterType.replace('single:', '')
    const child = childList.find(c => c.id === id)
    return child ? `Single child — ${child.name}` : 'Single child'
  }
  return FILTER_LABELS[filterType] ?? filterType
}

export default function MessagingClient({
  messages,
  parentCount,
  childList,
}: {
  messages: Message[]
  parentCount: number
  childList: ChildItem[]
}) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'morning' | 'afternoon' | 'full_day' | 'single_child'>('all')
  const [childSearch, setChildSearch] = useState('')
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ count: number } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filteredChildren = childList.filter(c =>
    c.name.toLowerCase().includes(childSearch.toLowerCase())
  )

  const selectedChild = childList.find(c => c.id === selectedChildId)

  const canSend = subject.trim() && body.trim() &&
    (filterType !== 'single_child' || !!selectedChildId)

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    const result = await sendParentMessage({
      subject,
      body,
      filterType,
      childId: filterType === 'single_child' ? selectedChildId ?? undefined : undefined,
    })
    setSending(false)
    setSent({ count: result.count })
    setSubject('')
    setBody('')
    setPdfFile(null)
    setChildSearch('')
    setSelectedChildId(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">

      {/* Compose */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">New message</h2>

        {sent && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Message sent to {sent.count} parent{sent.count !== 1 ? 's' : ''}.
            <button onClick={() => setSent(null)} className="ml-2 text-green-500 hover:text-green-700 underline text-xs">Dismiss</button>
          </div>
        )}

        <div className="space-y-3">

          {/* Send to */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Send to</label>
            <select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value as typeof filterType)
                setSelectedChildId(null)
                setChildSearch('')
              }}
              className={input}
            >
              <option value="all">All parents ({parentCount} with email on file)</option>
              <option value="morning">Morning session parents only</option>
              <option value="afternoon">Afternoon session parents only</option>
              <option value="full_day">Full day session parents only</option>
              <option value="single_child">Single child…</option>
            </select>
          </div>

          {/* Single child picker */}
          {filterType === 'single_child' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              {selectedChild ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{selectedChild.name}</span>
                    {!selectedChild.hasEmail && (
                      <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">No email on file</span>
                    )}
                  </div>
                  <button onClick={() => { setSelectedChildId(null); setChildSearch('') }}
                    className="text-xs text-gray-400 hover:text-gray-600">Change</button>
                </div>
              ) : (
                <>
                  <input
                    value={childSearch}
                    onChange={e => setChildSearch(e.target.value)}
                    placeholder="Search child name…"
                    className={input}
                    autoFocus
                  />
                  {childSearch.length > 0 && (
                    <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                      {filteredChildren.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No children found</div>
                      ) : filteredChildren.map(c => (
                        <button key={c.id} type="button"
                          onClick={() => { setSelectedChildId(c.id); setChildSearch('') }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between">
                          <span className={c.hasEmail ? 'text-gray-900' : 'text-gray-400'}>{c.name}</span>
                          {!c.hasEmail && <span className="text-xs text-amber-500">No email</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Term dates reminder"
              className={input}
            />
          </div>

          {/* Message body */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder="Type your message here…"
              className={input + ' resize-none'}
            />
          </div>

          {/* PDF attachment */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Attach PDF (optional — e.g. newsletter)</label>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {pdfFile && (
                <button onClick={() => { setPdfFile(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="text-xs text-red-400 hover:text-red-600">Remove</button>
              )}
            </div>
            {pdfFile && (
              <p className="text-xs text-green-700 mt-1">📎 {pdfFile.name} selected</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">Each parent receives a separate email — no one can see other parents&apos; addresses.</p>
            <button
              onClick={handleSend}
              disabled={sending || !canSend}
              className="px-5 py-2 bg-[#020e2f] hover:opacity-90 text-white text-sm rounded-lg disabled:opacity-40 transition-opacity whitespace-nowrap"
            >
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </div>
      </div>

      {/* Message log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Sent messages</h2>
          <p className="text-xs text-gray-400 mt-0.5">All messages sent to parents</p>
        </div>

        {messages.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No messages sent yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map(m => (
              <div key={m.id} className="px-4 py-3">
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{m.subject}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {filterLabel(m.filterType, childList)}
                      {' · '}{m.recipientCount} recipient{m.recipientCount !== 1 ? 's' : ''}
                      {' · '}sent by {m.sentByName}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-gray-400">
                      {new Date(m.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(m.sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                {expanded === m.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
