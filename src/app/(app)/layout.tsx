import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NavClient from './NavClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const isAdmin = session.user?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <NavClient isAdmin={isAdmin} />
      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-6">
        {children}
      </main>
    </div>
  )
}
