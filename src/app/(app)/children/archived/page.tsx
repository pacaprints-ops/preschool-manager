import { db } from '@/lib/db'
import { children } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function ArchivedChildrenPage() {
  const archived = await db
    .select()
    .from(children)
    .where(eq(children.archived, true))
    .orderBy(children.lastName)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Archived Children</h1>
          <p className="text-sm text-gray-500 mt-0.5">Records retained for 7 years · {archived.length} archived</p>
        </div>
        <Link href="/children" className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          ← Active children
        </Link>
      </div>

      {archived.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          No archived children.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DOB</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Archived</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {archived.map(child => (
                <tr key={child.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">{child.firstName} {child.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {child.dateOfBirth ? new Date(child.dateOfBirth + 'T12:00:00').toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {child.archivedAt ? new Date(child.archivedAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/children/${child.id}`} className="text-amber-600 hover:text-amber-700 font-medium">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
