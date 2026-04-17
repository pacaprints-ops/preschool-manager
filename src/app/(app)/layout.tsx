import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // TODO: fetch role from profiles table once schema is set up
  const isAdmin = true

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-amber-600 text-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
          <span className="font-bold text-sm tracking-wide">Winton Pre-School</span>
          <div className="flex items-center gap-1 flex-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded text-sm hover:bg-amber-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <span className="mx-2 text-amber-400">|</span>
                {adminLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded text-sm hover:bg-amber-700 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-amber-200 hover:text-white transition-colors">Sign out</button>
          </form>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
