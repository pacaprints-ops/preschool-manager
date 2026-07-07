'use client'

import { useState } from 'react'
import { updateParentContact } from '../actions'

type ParentData = {
  parentName: string | null
  parentEmail: string | null
  parentPhone: string | null
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function ParentSection({ childId, data }: { childId: string; data: ParentData }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    parentName: data.parentName ?? '',
    parentEmail: data.parentEmail ?? '',
    parentPhone: data.parentPhone ?? '',
  })

  async function handleSave() {
    setSaving(true)
    await updateParentContact(childId, {
      parentName: form.parentName || null,
      parentEmail: form.parentEmail || null,
      parentPhone: form.parentPhone || null,
    })
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setForm({
      parentName: data.parentName ?? '',
      parentEmail: data.parentEmail ?? '',
      parentPhone: data.parentPhone ?? '',
    })
    setEditing(false)
  }

  const hasData = data.parentName || data.parentEmail || data.parentPhone

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Parent / Billing Contact</h2>
          <p className="text-xs text-gray-400 mt-0.5">Invoice emails are sent to this address</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-blue-800 hover:text-blue-900">
            {hasData ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>

      {!editing ? (
        hasData ? (
          <div className="space-y-1 text-sm">
            {data.parentName && <div className="font-medium text-gray-900">{data.parentName}</div>}
            {data.parentEmail && (
              <div className="text-gray-500 flex items-center gap-1.5">
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">Invoice email</span>
                {data.parentEmail}
              </div>
            )}
            {data.parentPhone && <div className="text-gray-500">{data.parentPhone}</div>}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No parent contact added yet.</p>
        )
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Parent / Carer name</label>
            <input
              value={form.parentName}
              onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
              placeholder="e.g. Sarah Smith"
              className={input}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email (for invoices)</label>
              <input
                type="email"
                value={form.parentEmail}
                onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))}
                placeholder="parent@email.com"
                className={input}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone</label>
              <input
                value={form.parentPhone}
                onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))}
                className={input}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={handleCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
