'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navLinks = [
  { href: '/register', label: 'Register' },
  { href: '/children', label: 'Children' },
  { href: '/admin/ratios', label: 'Termly Register' },
  { href: '/enrolments', label: 'Enrolments' },
  { href: '/admin/keyworkers', label: 'Key Workers' },
]
const staffOnlyLinks = [
  { href: '/admin/staff', label: 'My Record' },
]
const adminLinks = [
  { href: '/admin/staff', label: 'Staff' },
]
const sharedAdminLinks = [
  { href: '/admin', label: 'Admin' },
]

export default function NavClient({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const allLinks = isAdmin
    ? [...navLinks, ...adminLinks, ...sharedAdminLinks]
    : [...navLinks, ...staffOnlyLinks, ...sharedAdminLinks]

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="bg-[#020e2f] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">

        {/* Desktop */}
        <div className="hidden lg:flex items-center h-14 gap-1">
          <span className="font-bold text-sm tracking-wide text-white/90 mr-3 shrink-0">
            Winton Pre-School
          </span>
          <div className="flex items-center gap-0.5 flex-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <span className="mx-2 text-white/20 select-none">|</span>
            {(isAdmin ? adminLinks : staffOnlyLinks).map(link => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {sharedAdminLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-white/50 hover:text-white transition-colors ml-2 px-2 py-1 rounded hover:bg-white/10"
          >
            Sign out
          </button>
        </div>

        {/* Mobile header */}
        <div className="flex lg:hidden items-center justify-between h-14">
          <span className="font-bold text-sm tracking-wide">Winton Pre-School</span>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? (
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="18" y2="18" />
                <line x1="18" y1="4" x2="4" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="19" y2="6" />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="16" x2="19" y2="16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden border-t border-white/10 bg-[#010922]">
          <div className="max-w-6xl mx-auto px-2 py-2 space-y-0.5">
            {allLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center w-full px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
