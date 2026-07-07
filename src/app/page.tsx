import Link from 'next/link'
import Image from 'next/image'
import WebsiteLayout from '@/components/WebsiteLayout'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata = {
  title: 'Winton Pre-School Little Explorers | Bournemouth',
  description: 'A warm, nurturing pre-school in Bournemouth for children aged 2–5. Government-funded places available. Term time, Monday to Friday.',
}

export default function HomePage() {
  return (
    <WebsiteLayout>

      {/* ── INFO STRIP ───────────────────────────────────────────────────── */}
      <section className="bg-[#FFFBF5] border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-center gap-6 md:gap-16 flex-wrap">
            {[
              { icon: '✅', label: 'Ofsted', value: 'Inspected Nov 2025', sub: 'View report →', href: 'https://reports.ofsted.gov.uk/provider/16/2753785', bg: 'bg-green-100' },
              { icon: '📞', label: 'Call us', value: '07305 240440', sub: 'Mon–Fri term time', href: 'tel:07305240440', bg: 'bg-yellow-100' },
              { icon: '📍', label: 'Location', value: 'Draycott Rd', sub: 'Bournemouth BH10 5AR', href: null, bg: 'bg-red-100' },
              { icon: '🕘', label: 'Hours', value: '9am – 3pm', sub: 'Term time only', href: null, bg: 'bg-orange-100' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                <div className={`w-14 h-14 rounded-full ${item.bg} shadow-md flex items-center justify-center text-2xl`}>
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{item.label}</div>
                <div className="font-bold text-gray-900 text-sm">{item.value}</div>
                {item.href ? (
                  <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                    className="text-xs text-[#3DB85C] font-semibold hover:underline">{item.sub}</a>
                ) : (
                  <div className="text-xs text-gray-500">{item.sub}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h1 className="hero-line-1 text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                Welcome to Winton Pre-School Little Explorers
              </h1>
              <h2 className="hero-line-2 text-xl md:text-2xl font-bold text-gray-600 mb-4">
                Where little explorers love to learn
              </h2>
              <p className="hero-line-3 text-lg text-gray-500 mb-8 leading-relaxed">
                A warm, nurturing pre-school in Bournemouth for children aged 2–5.
                Government-funded places available for eligible families.
              </p>
              <a href="mailto:info@wintonpreschool.org.uk"
                className="hero-cta inline-block px-8 py-4 bg-[#3DB85C] text-white font-bold text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg">
                Arrange a visit
              </a>
            </div>
            <div className="hero-line-2">
              <Image
                src="/images/homepage-1.jpeg"
                alt="Children at Winton Pre-School Little Explorers"
                width={600}
                height={400}
                className="rounded-2xl w-full object-cover shadow-lg"
                style={{ maxHeight: '340px' }}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE OFFER — blobs ────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { title: 'Play',    desc: 'Creative, joyful and wonderfully messy every day',       color: '#C2440E', bg: '#FFE0C2', radius: '45% 55% 50% 50% / 50% 50% 55% 45%' },
              { title: 'Love',    desc: 'Every child is truly seen, valued and celebrated',        color: '#7C3AED', bg: '#EDE9FE', radius: '50% 50% 55% 45% / 45% 55% 50% 50%' },
              { title: 'Learn',   desc: 'Curious minds flourish through EYFS-led activities',      color: '#92400E', bg: '#FEF3C7', radius: '55% 45% 45% 55% / 50% 50% 50% 50%' },
              { title: 'Explore', desc: 'Fresh air, nature and outdoor adventure',                 color: '#065F46', bg: '#D1FAE5', radius: '50% 50% 45% 55% / 55% 45% 50% 50%' },
              { title: 'Care',    desc: 'A nurturing, inclusive and safe home from home',          color: '#9F1239', bg: '#FFE4E6', radius: '45% 55% 55% 45% / 50% 50% 45% 55%' },
            ].map(item => (
              <div key={item.title}>
                <div
                  style={{ backgroundColor: item.bg, borderRadius: item.radius }}
                  className="px-5 py-7 shadow-md w-full h-full">
                  <div style={{ color: item.color }} className="font-extrabold text-2xl md:text-lg mb-1">{item.title}</div>
                  <div className="text-gray-700 text-base md:text-sm leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── WELCOME ──────────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-[#FFF5E8] border-y border-orange-100 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/staff.jpeg"
                  alt="Winton Pre-School Little Explorers team"
                  width={1600}
                  height={900}
                  className="w-full h-full object-cover"
                  style={{ minHeight: '380px' }}
                />
              </div>
              <div>
                <p className="text-[#020e2f] font-bold uppercase tracking-widest text-sm mb-3">Welcome</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                  A place your child will love
                </h2>
                <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                  <p>
                    At Winton Pre-School Little Explorers, we provide a safe, stimulating environment
                    where children can play, explore and develop at their own pace. Our experienced,
                    qualified team is passionate about giving every child the best possible start.
                  </p>
                  <p>
                    We are an inclusive setting, welcoming children with special educational needs
                    and disabilities, and are proud members of the Pre-School Learning Alliance.
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/about"
                    className="px-6 py-3 bg-[#FF6B00] text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                    About us
                  </Link>
                  <Link href="/team"
                    className="px-6 py-3 border-2 border-[#3DB85C] text-[#3DB85C] font-bold rounded-xl hover:bg-green-50 transition-colors">
                    Meet our team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── THREE IMAGES ─────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-3 gap-5">
            {[
              { src: '/images/homepage-4.jpg', alt: 'Children playing at Winton Pre-School' },
              { src: '/images/homepage-2.jpg', alt: 'Creative activities at Winton Pre-School' },
              { src: '/images/garden.jpeg', alt: 'Our outdoor garden area at Winton Pre-School' },
            ].map(img => (
              <div key={img.src} className="rounded-2xl overflow-hidden shadow-md" style={{ aspectRatio: '4/3' }}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={600}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── OFSTED + FUNDING — split screen ──────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-[#FFF5E8] border-y border-orange-100 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-0 items-start">

              {/* LEFT: Ofsted */}
              <div className="md:pr-14 pb-12 md:pb-0 md:border-r-2 md:border-dashed md:border-[#020e2f]">
                <Image
                  src="/images/ofsted-image.jpg"
                  alt="Ofsted inspected"
                  width={200}
                  height={80}
                  className="h-16 w-auto mb-5 object-contain"
                />
                <h3 className="text-xl font-extrabold text-gray-900 mb-3 leading-snug">
                  Ofsted came to visit us in November 2025 — and we're really proud of what they found.
                </h3>
                <p className="text-gray-600 leading-relaxed mb-2">
                  They saw children who are happy, settled and making brilliant progress. They saw a team
                  who genuinely cares — not just about what children learn, but about how they feel every single day.
                </p>
                <p className="text-gray-600 leading-relaxed mb-5">
                  That's what we're all about here.
                </p>
                <a href="https://reports.ofsted.gov.uk/provider/16/2753785" target="_blank" rel="noreferrer"
                  className="text-[#020e2f] font-bold hover:underline">
                  Read the full inspection report →
                </a>
              </div>

              {/* RIGHT: Funding */}
              <div className="md:pl-14 pt-12 md:pt-0">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Government funding available</h2>
                <p className="text-gray-500 text-sm mb-5">Your child may be entitled to free pre-school hours — at no cost to you.</p>
                <div className="space-y-3 mb-5">
                  {[
                    { hours: '15 hours', title: 'All 3 & 4 year olds', desc: 'From the term after their 3rd birthday. No application needed.' },
                    { hours: '30 hours', title: 'Working families', desc: 'For eligible working families. Apply via Childcare Choices.' },
                  ].map(f => (
                    <div key={f.title} className="bg-white rounded-xl p-4 shadow border border-orange-100 flex items-start gap-4">
                      <div className="text-2xl font-extrabold text-[#FFB800] shrink-0">{f.hours}</div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{f.title}</div>
                        <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/sessions"
                  className="inline-block px-5 py-2.5 border-2 border-[#3DB85C] text-[#3DB85C] font-bold rounded-xl hover:bg-green-50 transition-colors text-sm">
                  Sessions & funding info →
                </Link>
              </div>

            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-xl mx-auto mb-12">
              <p className="text-[#020e2f] font-bold uppercase tracking-widest text-sm mb-2">What parents say</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Loved by local families</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { quote: 'My daughter absolutely loves coming here every day. The staff are warm, caring and really know her well. We feel so lucky to have found such a wonderful setting.', name: 'Parent of pre-school child' },
                { quote: 'The team are incredible — they go above and beyond. Our son has come on so much since starting and he is so happy every morning when we drop him off.', name: 'Parent of pre-school child' },
                { quote: 'We were nervous about our child starting pre-school but the staff made the settling in process so smooth. They kept us informed every step of the way.', name: 'Parent of pre-school child' },
              ].map((t, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-4xl text-[#020e2f] mb-3 leading-none font-serif">"</div>
                  <p className="text-gray-700 text-lg leading-relaxed mb-4 italic">{t.quote}</p>
                  <div className="font-bold text-gray-900">{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── FACEBOOK CALLOUT ─────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-white pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-[#1877F2] rounded-2xl px-8 py-8 shadow-lg flex flex-col sm:flex-row items-center gap-5 justify-between">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="text-4xl">📘</div>
                <p className="text-white font-bold text-lg leading-snug">
                  Please visit our fantastic Winton Pre-School Facebook page which is regularly updated!
                </p>
              </div>
              <a href="https://www.facebook.com/profile.php?id=61550099136714" target="_blank" rel="noreferrer"
                className="shrink-0 px-6 py-3 bg-white text-[#1877F2] font-bold rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap">
                Visit our page →
              </a>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── ARRANGE A VISIT CTA ──────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-[#FFF5E8] border-t border-orange-100 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Ready to find out more?</h2>
            <p className="text-gray-500 text-xl mb-8">
              Get in touch to arrange a visit or ask any questions. We'd love to hear from you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="tel:07305240440"
                className="px-8 py-4 bg-[#3DB85C] text-white font-bold text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg">
                📞 07305 240440
              </a>
              <a href="mailto:info@wintonpreschool.org.uk"
                className="px-8 py-4 bg-[#FF6B00] text-white font-bold text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg">
                ✉️ info@wintonpreschool.org.uk
              </a>
            </div>
            <p className="text-gray-400 mt-5">St Bernadette's Church Hall, 46 Draycott Rd, Bournemouth BH10 5AR</p>
          </div>
        </section>
      </ScrollReveal>

    </WebsiteLayout>
  )
}
