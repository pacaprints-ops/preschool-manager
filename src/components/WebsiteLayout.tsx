import Link from 'next/link'
import Image from 'next/image'
import { ReactNode } from 'react'
import MobileNav from './MobileNav'

function WebsiteHeader() {
  return (
    <header className="bg-[#020e2f] text-white relative">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-6 py-3">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/images/Logo.png"
              alt="Winton Pre-School Little Explorers"
              width={360}
              height={240}
              className="h-40 w-auto"
              priority
            />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/about', label: 'About Us' },
              { href: '/team', label: 'Our Team' },
              { href: '/sessions', label: 'Sessions & Funding' },
              { href: '/policies', label: 'Policies' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="px-4 py-2 rounded text-base font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Contact + staff login */}
          <div className="hidden md:flex items-center gap-4 text-base shrink-0">
            <a href="tel:07305240440"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors whitespace-nowrap font-medium">
              📞 07305 240440
            </a>
            <a href="mailto:info@wintonpreschool.org.uk"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors whitespace-nowrap font-medium">
              ✉️ info@wintonpreschool.org.uk
            </a>
            <div className="w-px h-4 bg-white/20" />
            <Link href="/login" className="text-sm text-white/40 hover:text-white/70 transition-colors">
              Staff login
            </Link>
          </div>

          {/* Mobile nav */}
          <MobileNav />

        </div>
      </div>
    </header>
  )
}

function WebsiteFooter() {
  return (
    <footer className="bg-[#020e2f] text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Image
              src="/images/Logo.png"
              alt="Winton Pre-School Little Explorers"
              width={160}
              height={107}
              className="h-16 w-auto mb-3"
            />
            <p className="text-sm text-white/60 leading-relaxed mb-3">
              A warm, nurturing pre-school setting in Bournemouth helping children learn, grow and thrive.
            </p>
            <a href="https://www.facebook.com/profile.php?id=61550099136714" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              📘 Follow us on Facebook
            </a>
          </div>
          <div>
            <div className="font-semibold text-sm mb-3 text-white/90">Contact us</div>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li>📍 St Bernadette's Church Hall<br />
                <span className="ml-5">46 Draycott Rd, Bournemouth BH10 5AR</span>
              </li>
              <li>📞 <a href="tel:07305240440" className="hover:text-white transition-colors">07305 240440</a></li>
              <li>✉️ <a href="mailto:info@wintonpreschool.org.uk" className="hover:text-white transition-colors">info@wintonpreschool.org.uk</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-sm mb-3 text-white/90">Opening hours</div>
            <ul className="space-y-1 text-sm text-white/70">
              <li>Monday – Friday</li>
              <li>9:00 am – 3:00 pm</li>
              <li className="text-white/50 text-xs mt-1">Term time only</li>
            </ul>
            <div className="mt-4 space-y-1 text-xs text-white/40">
              <div>Ofsted URN: 2753785</div>
              <div>Pre-School Learning Alliance: 00216170</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center text-xs text-white/30">
          <span>© {new Date().getFullYear()} Winton Pre-School Little Explorers Ltd. All rights reserved.</span>
          <Link href="/privacy" className="text-white/40 hover:text-white/70 transition-colors underline">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-[family-name:var(--font-nunito)]">
      <WebsiteHeader />
      <main className="flex-1">{children}</main>
      <WebsiteFooter />
    </div>
  )
}
