import { db } from '@/lib/db'
import { children, childSessions, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function ChildrenPage() {
  const activeChildren = await db
    .select({
      child: children,
      keyWorker: users,
    })
    .from(children)
    .leftJoin(users, eq(children.keyWorkerId, users.id))
    .where(eq(children.archived, false))
    .orderBy(children.firstName)

  const sessions = await db.select().from(childSessions)
  const sessionMap: Record<string, typeof sessions> = {}
  for (const s of sessions) {
    if (!sessionMap[s.childId]) sessionMap[s.childId] = []
    sessionMap[s.childId].push(s)
  }

  const DAY_SHORT: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
  }
  const SESSION_SHORT: Record<string, string> = {
    morning: 'AM', afternoon: 'PM', full_day: 'FD',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Children</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeChildren.length} active</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/children/archived"
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Archived
          </Link>
          <Link
            href="/children/new"
            className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            + Add Child
          </Link>
        </div>
      </div>

      {activeChildren.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          No active children yet.{' '}
          <Link href="/children/new" className="text-amber-600 hover:underline">Add the first child.</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DOB</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sessions</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Key Worker</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Funded</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeChildren.map(({ child, keyWorker }) => {
                const childSess = sessionMap[child.id] ?? []
                return (
                  <tr key={child.id} className="hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {child.firstName} {child.lastName}
                        </span>
                        {child.hasAllergies && (
                          <span className="inline-flex bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">⚠ Allergy</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {child.dateOfBirth
                        ? new Date(child.dateOfBirth + 'T12:00:00').toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {childSess.length === 0 ? (
                          <span className="text-gray-400">None set</span>
                        ) : (
                          childSess.map(s => (
                            <span key={s.id} className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded">
                              {DAY_SHORT[s.day]} {SESSION_SHORT[s.sessionType]}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{keyWorker?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {childSess.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (() => {
                        const f = childSess.filter(s => s.isFunded).length
                        const p = childSess.filter(s => !s.isFunded).length
                        return (
                          <div className="flex gap-1 flex-wrap">
                            {f > 0 && <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">{f}F</span>}
                            {p > 0 && <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{p}P</span>}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/children/${child.id}`}
                        className="text-amber-600 hover:text-amber-700 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
