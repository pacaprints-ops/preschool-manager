'use client'

import { useState } from 'react'
import { addEmergencyContact, deleteEmergencyContact } from '../actions'

type Contact = {
  id: string
  name: string
  relationship: string
  phone: string
  email: string | null
  isAuthorisedCollector: boolean
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700'

export default function ContactsSection({ childId, contacts }: { childId: string; contacts: Contact[] }) {
  const [sectionOpen, setSectionOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', relationship: '', phone: '', email: '', isAuthorisedCollector: false })

  async function handleAdd() {
    if (!form.name || !form.relationship || !form.phone) return
    setSaving(true)
    await addEmergencyContact(childId, form)
    setForm({ name: '', relationship: '', phone: '', email: '', isAuthorisedCollector: false })
    setSaving(false)
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <button onClick={() => setSectionOpen(o => !o)} className="w-full flex items-center justify-between text-left">
        <h2 className="text-sm font-semibold text-gray-700">
          Emergency Contacts
          {contacts.length > 0 && <span className="ml-1.5 font-normal text-gray-400">({contacts.length})</span>}
        </h2>
        <span className={`text-gray-400 transition-transform shrink-0 ml-2 ${sectionOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {sectionOpen && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex justify-end mb-3">
            <button onClick={() => setAdding(a => !a)} className="text-xs text-blue-800 hover:text-blue-900">
              {adding ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {contacts.length === 0 && !adding && (
            <p className="text-sm text-gray-400">No contacts added yet.</p>
          )}

          <div className="space-y-3">
            {contacts.map(c => (
              <div key={c.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{c.name}
                    {c.isAuthorisedCollector && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Authorised collector</span>
                    )}
                  </div>
                  <div className="text-gray-500">{c.relationship} · {c.phone}</div>
                  {c.email && <div className="text-gray-500">{c.email}</div>}
                </div>
                <button onClick={() => deleteEmergencyContact(c.id, childId)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
            ))}
          </div>

          {adding && (
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Relationship *</label>
                  <input value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="e.g. Mother, Grandparent" className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Email</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={input} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="collector" checked={form.isAuthorisedCollector} onChange={e => setForm(f => ({ ...f, isAuthorisedCollector: e.target.checked }))} className="rounded" />
                <label htmlFor="collector" className="text-sm text-gray-700">Authorised to collect child</label>
              </div>
              <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-blue-500 hover:bg-blue-900 text-white text-sm rounded-lg disabled:opacity-50">
                {saving ? 'Saving…' : 'Add contact'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
