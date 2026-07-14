'use client'
import { useState } from 'react'
import Link from 'next/link'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/team', label: 'Our Team' },
  { href: '/sessions', label: 'Sessions & Funding' },
  { href: '/policies', label: 'Policies' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="lg:hidden ml-auto">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        className="text-white text-3xl leading-none px-2 py-1">
        {open ? '✕' : '☰'}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#020e2f] border-t border-white/10 shadow-xl z-50">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-4 text-white font-semibold text-lg border-b border-white/10 hover:bg-white/10 transition-colors">
              {link.label}
            </Link>
          ))}
          <a href="tel:07305240440" className="block px-6 py-4 text-white/70 text-base border-b border-white/10">
            📞 07305 240440
          </a>
          <a href="mailto:info@wintonpreschool.org.uk" className="block px-6 py-4 text-white/70 text-base border-b border-white/10">
            ✉️ info@wintonpreschool.org.uk
          </a>
          <Link href="/login"
            onClick={() => setOpen(false)}
            className="block px-6 py-4 text-white/50 text-base font-semibold">
            🔒 Staff login
          </Link>
        </div>
      )}
    </div>
  )
}
