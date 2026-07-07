import WebsiteLayout from '@/components/WebsiteLayout'

export const metadata = {
  title: 'Sessions & Funding | Winton Pre-School Little Explorers',
  description: 'Find out about our session times and government funding options for children aged 2–5 at Winton Pre-School.',
}

export default function SessionsPage() {
  return (
    <WebsiteLayout>

      {/* Page header */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Sessions & Funding</h1>
          <p className="text-gray-500">What we offer and how to make the most of your free entitlement</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">

        {/* Sessions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our sessions</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                name: 'Morning session',
                time: '9:00 am – 12:00 pm',
                hours: '3 hours',
                color: '#92400E', bg: '#FEF3C7', radius: '26% 30% 24% 28% / 28% 24% 30% 26%',
              },
              {
                name: 'Afternoon session',
                time: '12:00 pm – 3:00 pm',
                hours: '3 hours',
                color: '#7C3AED', bg: '#EDE9FE', radius: '28% 24% 30% 26% / 26% 30% 24% 28%',
              },
              {
                name: 'Full day',
                time: '9:00 am – 3:00 pm',
                hours: '6 hours',
                color: '#065F46', bg: '#D1FAE5', radius: '24% 28% 26% 30% / 30% 26% 28% 24%',
              },
            ].map(s => (
              <div key={s.name}
                style={{ backgroundColor: s.bg, borderRadius: s.radius }}
                className="px-6 py-7 shadow-md w-full h-full">
                <div style={{ color: s.color }} className="font-extrabold text-xl mb-1">{s.name}</div>
                <div style={{ color: s.color }} className="font-semibold text-sm mb-1">{s.time}</div>
                <div className="text-gray-700 text-xs opacity-70">{s.hours} · Mon–Fri · Term time</div>
              </div>
            ))}
          </div>
          <p className="text-base text-gray-500 mt-4">
            We are open Monday to Friday, term time only. Sessions can be funded or paid depending on your child's eligibility.
          </p>
        </section>

        {/* Funded hours */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Government funding</h2>
          <p className="text-gray-500 text-lg mb-6">Your child may be entitled to free pre-school hours funded by the government.</p>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="text-2xl">🎓</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg mb-1">15 hours — Universal entitlement (all 3 & 4 year olds)</div>
                  <p className="text-base text-gray-600 leading-relaxed">
                    All children aged 3 and 4 are entitled to 15 free hours of early education per week during term time.
                    This starts the term after your child's third birthday. No application needed — just let us know
                    and we'll claim on your behalf.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="text-2xl">⭐</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg mb-1">30 hours — Extended entitlement (working families)</div>
                  <p className="text-base text-gray-600 leading-relaxed">
                    If you and your partner (if you have one) are both working and each earn at least the National Minimum Wage
                    for 16 hours a week, you may be entitled to 30 free hours per week. You'll need to apply via the
                    government's Childcare Choices website and get a code to give us.
                  </p>
                  <a href="https://www.childcarechoices.gov.uk" target="_blank" rel="noreferrer"
                    className="text-sm text-blue-700 hover:underline mt-2 inline-block">
                    Check eligibility at childcarechoices.gov.uk →
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="text-2xl">🌟</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg mb-1">15 hours — 2-year-old funding (eligible families)</div>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Some 2 year olds are entitled to 15 free hours per week if their family receives certain benefits
                    or has a low income. Your child may also qualify if they are looked after by a local authority,
                    have an EHCP, or receive DLA. Check eligibility via your local council or the government website.
                  </p>
                  <a href="https://www.gov.uk/help-with-childcare-costs/free-childcare-2-year-olds" target="_blank" rel="noreferrer"
                    className="text-sm text-blue-700 hover:underline mt-2 inline-block">
                    Check eligibility on gov.uk →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Consumable charge */}
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="font-semibold text-amber-900 mb-2">Voluntary consumable contribution</div>
          <p className="text-sm text-amber-800 leading-relaxed">
            A small voluntary consumable contribution of £3.50 per session helps cover the cost of art materials,
            snacks and activities. This is entirely optional and does not affect your child's place.
          </p>
        </section>

        {/* How to apply */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to apply</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { step: '1', title: 'Get in touch', desc: 'Call or email us to find out about availability and arrange a visit to see the setting.' },
              { step: '2', title: 'Complete a form', desc: 'We\'ll give you an application form to fill in with details about your child and family.' },
              { step: '3', title: 'Confirm your place', desc: 'Once your place is confirmed, we\'ll help you claim any funded hours you\'re entitled to.' },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 rounded-full bg-[#020e2f] text-white flex items-center justify-center font-bold text-sm mb-3">
                  {s.step}
                </div>
                <div className="font-bold text-gray-800 text-base mb-1.5">{s.title}</div>
                <p className="text-base text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-[#020e2f] text-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to apply or have a question?</h2>
          <p className="text-white/60 text-sm mb-5">We'd love to hear from you.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="tel:07305240440"
              className="px-5 py-2.5 bg-white text-[#020e2f] font-semibold rounded-lg text-sm hover:bg-blue-50 transition-colors">
              📞 07305 240440
            </a>
            <a href="mailto:info@wintonpreschool.org.uk"
              className="px-5 py-2.5 border border-white/30 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
              ✉ info@wintonpreschool.org.uk
            </a>
          </div>
        </section>

      </div>
    </WebsiteLayout>
  )
}
