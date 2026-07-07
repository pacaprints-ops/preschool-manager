import Link from 'next/link'
import Image from 'next/image'
import WebsiteLayout from '@/components/WebsiteLayout'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata = {
  title: 'About Us | Winton Pre-School Little Explorers',
  description: 'Learn about Winton Pre-School Little Explorers — our values, our setting, and our approach to early years education.',
}

export default function AboutPage() {
  return (
    <WebsiteLayout>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-1">About Our Pre-School</h1>
          <p className="text-gray-500">Who we are, what we do, and what we stand for</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">

        {/* ── ABOUT — text + info cards ────────────────────────────────── */}
        <section className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-5">Welcome to Winton Pre-School</h2>
            <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
              <p>
                Winton Pre-School Little Explorers is located at St Bernadette's Church on Draycott Rd.
                We are staffed by a trained and experienced, dedicated team of caring individuals who recognise
                that your children's personal development is of prime importance.
              </p>
              <p>
                Working to strict codes of practice, laid down by our regulatory bodies, we provide quality
                learning and development. Government funding for 15–30 hours per week is available for 3 &amp; 4
                year olds (starting from the term after their third birthday).
              </p>
              <p>Additional hours may be added for a fee.</p>
              <p>
                Our opening hours are 09:00–15:00 Monday to Friday. This means we are able to offer 15–30 hours
                of funding to those that are eligible.
              </p>
              <p>We also accept funding for 2 year olds from eligible families.</p>
              <p>
                We pride ourselves on being all-inclusive and a setting which has good provision for supporting
                special educational needs and development.
              </p>
              <p>
                Our aim is for your children to move on to school with the self-esteem and confidence to grow
                into respected and successful individuals.
              </p>
              <p>
                If you are considering placing your child's first years with Winton Pre-School Little Explorers,
                please contact us by telephone:{' '}
                <a href="tel:07305240440" className="text-[#3DB85C] font-semibold hover:underline">07305 240440</a>
                {' '}or email:{' '}
                <a href="mailto:info@wintonpreschool.org.uk" className="text-[#3DB85C] font-semibold hover:underline">info@wintonpreschool.org.uk</a>
                {' '}— for more details or to arrange a time to visit.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="font-semibold text-blue-900 mb-2">📍 Our setting</div>
              <p className="text-sm text-blue-800 leading-relaxed mb-4">
                St Bernadette's Church Hall<br />
                46 Draycott Rd<br />
                Bournemouth, BH10 5AR
              </p>
              <div className="rounded-lg overflow-hidden border border-blue-200">
                <iframe
                  src="https://www.google.com/maps?q=St+Bernadette%27s+Church+Hall%2C+46+Draycott+Rd%2C+Bournemouth+BH10+5AR&output=embed"
                  width="100%"
                  height="220"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map to Winton Pre-School Little Explorers"
                />
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="font-semibold text-green-900 mb-2">✅ Ofsted registered</div>
              <p className="text-sm text-green-800">
                Ofsted URN: 2753785<br />
                Most recent inspection: November 2025<br />
                <a href="https://reports.ofsted.gov.uk/provider/16/2753785" target="_blank" rel="noreferrer"
                  className="underline hover:no-underline mt-1 inline-block">View our Ofsted report →</a>
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="font-semibold text-slate-900 mb-2">🤝 Pre-School Learning Alliance</div>
              <p className="text-sm text-slate-700">
                We are proud members of the Pre-School Learning Alliance (membership no. 00216170),
                the leading early years charity supporting quality childcare across England.
              </p>
            </div>
          </div>
        </section>

        {/* ── PERSONAL MESSAGE ──────────────────────────────────────────── */}
        <ScrollReveal>
          <section
            style={{ backgroundColor: '#FCE7F3' }}
            className="rounded-3xl px-6 py-12 md:px-16 md:py-16 shadow-md">
            <div className="max-w-3xl mx-auto text-center">
                <p style={{ color: '#9D174D' }} className="font-extrabold uppercase tracking-widest text-sm mb-4">
                  A word from us
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 leading-snug">
                  We built the pre-school we'd want for our own children
                </h2>
                <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                  <p>
                    When we started Winton Pre-School Little Explorers, we wanted somewhere small enough
                    to feel like family — where every child is known, and every parent is greeted by name.
                  </p>
                  <p>
                    We're hands-on owners, not distant managers. You'll see us most mornings and at pick-up,
                    and if you ever have a question, a worry, or just fancy a chat, our door is always open.
                  </p>
                  <p>
                    Thank you for trusting us with the most important people in your life — it's something
                    we never take lightly.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 mt-8">
                  <div className="flex -space-x-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden shadow-md border-2 border-white">
                      <Image src="/images/louise.jpeg" alt="Louise" width={112} height={112} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-14 h-14 rounded-full overflow-hidden shadow-md border-2 border-white">
                      <Image src="/images/sally.jpeg" alt="Sally" width={112} height={112} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-gray-900">Louise &amp; Sally</div>
                    <div className="text-sm text-gray-500">Owners &amp; Managing Directors</div>
                  </div>
                </div>
              </div>
          </section>
        </ScrollReveal>

        {/* ── VALUES — blobs ───────────────────────────────────────────── */}
        <ScrollReveal>
          <section>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Our values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Every child',   desc: 'We value each child as a unique individual and celebrate every achievement, however small.',                color: '#C2440E', bg: '#FFE0C2', radius: '45% 55% 50% 50% / 50% 50% 55% 45%' },
                { title: 'Play & learn',  desc: 'Children learn best when engaged and curious. Play is at the heart of everything we do.',                   color: '#7C3AED', bg: '#EDE9FE', radius: '50% 50% 55% 45% / 45% 55% 50% 50%' },
                { title: 'Inclusive',     desc: 'We welcome all children, including those with special educational needs and disabilities.',                  color: '#92400E', bg: '#FEF3C7', radius: '55% 45% 45% 55% / 50% 50% 50% 50%' },
                { title: 'Family',        desc: 'Families are the most important people in a child\'s life. We work together as true partners.',             color: '#065F46', bg: '#D1FAE5', radius: '50% 50% 45% 55% / 55% 45% 50% 50%' },
                { title: 'Safety',        desc: 'The safety and welfare of every child is our highest priority at all times.',                               color: '#9F1239', bg: '#FFE4E6', radius: '45% 55% 55% 45% / 50% 50% 45% 55%' },
                { title: 'Qualified',     desc: 'Our team holds Level 3+ Early Years qualifications, with two Designated Safeguarding Leads on site.',       color: '#1E40AF', bg: '#DBEAFE', radius: '55% 45% 50% 50% / 45% 55% 50% 50%' },
              ].map(item => (
                <div key={item.title}>
                  <div
                    style={{ backgroundColor: item.bg, borderRadius: item.radius }}
                    className="px-7 py-6 shadow-md w-full h-full">
                    <div style={{ color: item.color }} className="font-extrabold text-xl mb-1">{item.title}</div>
                    <div className="text-gray-700 text-sm leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── GALLERY — images to be added here ────────────────────────── */}

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <ScrollReveal>
          <section className="bg-[#020e2f] text-white rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Interested in a place?</h2>
            <p className="text-white/60 text-sm mb-5">Get in touch to find out about availability or to arrange a visit.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="tel:07305240440"
                className="px-5 py-2.5 bg-[#3DB85C] text-white font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity">
                📞 07305 240440
              </a>
              <a href="mailto:info@wintonpreschool.org.uk"
                className="px-5 py-2.5 bg-[#FF6B00] text-white font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity">
                ✉ Email us
              </a>
            </div>
          </section>
        </ScrollReveal>

      </div>
    </WebsiteLayout>
  )
}
