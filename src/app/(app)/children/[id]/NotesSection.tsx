'use client'

import { useState } from 'react'
import { addNote, deleteNote } from '../actions'

type Note = {
  note: { id: string; note: string; createdAt: Date; childId: string; authorId: string }
  authorName: string | null
}

export default function NotesSection({ childId, notes, userId }: { childId: string; notes: Note[]; userId: string }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!text.trim()) return
    setSaving(true)
    await addNote(childId, userId, text.trim())
    setText('')
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Notes</h2>

      <div className="space-y-3 mb-4">
        {notes.length === 0 && <p className="text-sm text-gray-400">No notes yet.</p>}
        {notes.map(({ note: n, authorName }) => (
          <div key={n.id} className="p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-gray-800 flex-1">{n.note}</p>
              <button onClick={() => deleteNote(n.id, childId)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Remove</button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {authorName ?? 'Unknown'} · {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          placeholder="Add a note…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !text.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}
