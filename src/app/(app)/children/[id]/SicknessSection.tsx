export default function SicknessSection({
  termPercent, yearPercent, termName,
  termAbsences, termTotal, yearAbsences, yearTotal,
}: {
  termPercent: number | null
  yearPercent: number | null
  termName?: string
  termAbsences: number
  termTotal: number
  yearAbsences: number
  yearTotal: number
}) {
  if (termTotal === 0 && yearTotal === 0) return null

  function badge(pct: number | null) {
    if (pct === null) return 'bg-gray-100 text-gray-500'
    if (pct >= 20) return 'bg-red-100 text-red-700'
    if (pct >= 10) return 'bg-orange-100 text-orange-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Attendance</h2>
      <div className="flex gap-4">
        <div className="flex-1 text-center p-3 rounded-lg bg-gray-50">
          <div className={`text-2xl font-bold rounded-lg px-2 py-1 inline-block ${badge(termPercent)}`}>
            {termPercent !== null ? `${termPercent}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {termName ?? 'This term'} absence
          </div>
          <div className="text-xs text-gray-400">{termAbsences} of {termTotal} sessions</div>
        </div>
        <div className="flex-1 text-center p-3 rounded-lg bg-gray-50">
          <div className={`text-2xl font-bold rounded-lg px-2 py-1 inline-block ${badge(yearPercent)}`}>
            {yearPercent !== null ? `${yearPercent}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">This year absence</div>
          <div className="text-xs text-gray-400">{yearAbsences} of {yearTotal} sessions</div>
        </div>
      </div>
    </div>
  )
}
