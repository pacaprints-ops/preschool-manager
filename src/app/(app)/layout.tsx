import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'

const navLinks = [
  { href: '/register', label: 'Register' },
  { href: '/children', label: 'Children' },
  { href: '/waiting-list', label: 'Waiting List' },
]

const adminLinks = [
  { href: '/admin/invoicing', label: 'Invoicing' },
  { href: '/admin/staff', label: 'Staff' },
  { href: '/admin/ratios', label: 'Ratios' },
  { href: '/admin/terms', label: 'Term Dates' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const isAdmin = session.user?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
          <span className="font-bold text-sm tracking-wide">Winton Pre-School</span>
          <div className="flex items-center gap-1 flex-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <span className="mx-2 text-blue-300">|</span>
                {adminLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </div>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <button className="text-xs text-blue-200 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
