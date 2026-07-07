'use client'

import { useState } from 'react'
import { updateChildFunding } from '../actions'

type FundingData = {
  twoYearFunding: boolean
  extendedHours: boolean
  eypp: boolean
  sen: boolean
  senTier: string | null
  daf: boolean
  dep: boolean
}

const FUNDING_TYPES = [
  {
    key: 'extendedHours',
    label: 'Extended 30h',
    description: 'Working parents of 3 & 4 year olds — additional 15h on top of universal',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'twoYearFunding',
    label: '2-year-old funding',
    description: 'Funded hours for eligible 2-year-olds (working parents or disadvantaged)',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'eypp',
    label: 'EYPP',
    description: 'Early Years Pupil Premium — £1.15 per funded hour claimed from LA (up to 570h)',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    key: 'sen',
    label: 'SENIF',
    description: 'SEN Inclusion Fund — tiered LA lump sum for children with additional needs',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    key: 'daf',
    label: 'DAF',
    description: 'Disability Access Fund — £975/year for children receiving DLA',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    key: 'dep',
    label: 'Deprivation supplement',
    description: 'Additional per-hour supplement based on area deprivation index',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
] as const

export default function FundingSection({
  childId,
  funding,
}: {
  childId: string
  funding: FundingData
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(funding)

  async function handleSave() {
    setSaving(true)
    await updateChildFunding(childId, data)
    setSaving(false)
    setEditing(false)
  }

  const activeFunding = FUNDING_TYPES.filter(f => data[f.key as keyof FundingData])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Funding & Entitlements</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-xs text-blue-800 hover:text-blue-900">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-900 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setData(funding); setEditing(false) }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 px-2.5 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
        <span className="font-semibold">Universal 15h</span> — all 3 &amp; 4 year olds receive this automatically
      </div>

      {!editing ? (
        <div>
          {activeFunding.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No additional funding types set</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {activeFunding.map(f => (
                <span key={f.key} className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${f.color}`}>
                  {f.label}
                  {f.key === 'sen' && data.senTier && ` — Tier ${data.senTier}`}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {FUNDING_TYPES.map(f => (
            <div key={f.key}>
              <div className="flex items-start gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  id={`funding-${f.key}`}
                  checked={!!data[f.key as keyof FundingData]}
                  onChange={e => {
                    const v = e.target.checked
                    setData(d => ({
                      ...d,
                      [f.key]: v,
                      ...(f.key === 'sen' ? { senTier: v ? (d.senTier ?? '1') : null } : {}),
                    }))
                  }}
                  className="rounded mt-0.5 flex-shrink-0"
                />
                <div>
                  <label htmlFor={`funding-${f.key}`} className="text-sm font-medium text-gray-700 cursor-pointer">{f.label}</label>
                  <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                </div>
              </div>
              {f.key === 'sen' && data.sen && (
                <div className="ml-6 mt-1.5">
                  <label className="block text-xs text-gray-600 mb-1">SENIF Tier</label>
                  <select
                    value={data.senTier ?? '1'}
                    onChange={e => setData(d => ({ ...d, senTier: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
