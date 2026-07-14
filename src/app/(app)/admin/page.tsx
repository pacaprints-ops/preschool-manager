import { auth } from '@/lib/auth'
import Link from 'next/link'

const tiles = [
  {
    href: '/admin/terms',
    label: 'Term Dates',
    description: 'Manage academic terms and holidays',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    href: '/admin/messaging',
    label: 'Messaging',
    description: 'Send emails to parents',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="2,4 12,13 22,4" />
      </svg>
    ),
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
  },
  {
    href: '/admin/invoicing',
    label: 'Invoicing',
    description: 'Generate and manage parent invoices',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    href: '/register/history',
    label: 'Attendance',
    description: 'View historical attendance records',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    href: '/admin/teddy',
    label: 'Paddington',
    description: 'Manage the travelling teddy bear',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <circle cx="7" cy="5" r="1.5" />
        <circle cx="17" cy="5" r="1.5" />
        <path d="M6 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      </svg>
    ),
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    href: '/admin/accident-log',
    label: 'Accident Log',
    description: 'Termly and yearly accident trends by location',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
  },
]

export default async function AdminHubPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'admin'

  const visibleTiles = isAdmin ? tiles : tiles.filter(t => t.href !== '/admin/invoicing' && t.href !== '/admin/accident-log')

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Admin</h1>
      <p className="text-sm text-gray-500 mb-6">Settings and tools for managing the pre-school.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {visibleTiles.map(tile => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`${tile.bg} ${tile.border} border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group`}
          >
            <div className={`${tile.color}`}>{tile.icon}</div>
            <div>
              <div className={`text-sm font-semibold ${tile.color} group-hover:underline`}>{tile.label}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-snug">{tile.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
