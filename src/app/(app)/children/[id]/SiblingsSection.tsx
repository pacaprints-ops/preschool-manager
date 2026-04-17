'use client'

import { useState } from 'react'
import Link from 'next/link'
import { addSibling, removeSibling } from '../actions'

type Sibling = { id: string; firstName: string; lastName: string; archived: boolean }
type Child = { id: string; firstName: string; lastName: string }

export default function SiblingsSection({
  childId,
  siblings,
  allChildren,
}: {
  childId: string
  siblings: Sibling[]
  allChildren: Child[]
}) {
  const [linking, setLinking] = useState(false)
  const [selectedId, setSelectedId] = useState('')

  const available = allChildren.filter(
    c => c.id !== childId && !siblings.some(s => s.id === c.id)
  )

  async function handleLink() {
    if (!selectedId) return
    await addSibling(childId, selectedId)
    setSelectedId('')
    setLinking(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Siblings</h2>
        {available.length > 0 && (
          <button onClick={() => setLinking(l => !l)} className="text-xs text-blue-800 hover:text-blue-900">
            {linking ? 'Cancel' : '+ Link sibling'}
          </button>
        )}
      </div>

      {siblings.length === 0 && !linking && (
        <p className="text-sm text-gray-400">No siblings linked.</p>
      )}

      <div className="space-y-2">
        {siblings.map(s => (
          <div key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-sm">
            <Link href={`/children/${s.id}`} className="font-medium text-blue-900 hover:underline">
              {s.firstName} {s.lastName}
            </Link>
            <div className="flex items-center gap-3">
              {s.archived && <span className="text-xs text-gray-400">archived</span>}
              <button
                onClick={() => removeSibling(childId, s.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Unlink
              </button>
            </div>
          </div>
        ))}
      </div>

      {linking && (
        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            <option value="">— Select child —</option>
            {available.map(c => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
          <button
            onClick={handleLink}
            disabled={!selectedId}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
          >
            Link
          </button>
        </div>
      )}
    </div>
  )
}
