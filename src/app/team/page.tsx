import Image from 'next/image'
import WebsiteLayout from '@/components/WebsiteLayout'

export const metadata = {
  title: 'Our Team | Winton Pre-School Little Explorers',
  description: 'Meet the qualified, experienced team at Winton Pre-School Little Explorers.',
}

const team = [
  {
    name: 'Sally',
    photo: '/images/sally.jpeg',
    roles: ['Managing Director / Owner', 'Senior Level 3 Practitioner'],
    badges: ['Designated Safeguarding Lead', 'First Aider'],
  },
  {
    name: 'Louise',
    photo: '/images/louise.jpeg',
    roles: ['Managing Director / Owner', 'Senior Level 3 Practitioner'],
    badges: ['Designated Safeguarding Lead', 'Health & Safety Co-ordinator', 'First Aider'],
  },
  {
    name: 'Sam',
    photo: '/images/sam.jpeg',
    roles: ['Deputy Manager / SENDCO', 'Level 3 Early Years Educator'],
    badges: ['Deputy Designated Safeguarding Lead', 'First Aider'],
  },
  {
    name: 'Annie',
    photo: '/images/annie.jpeg',
    roles: ['Level 3 Early Years Educator'],
    badges: ['First Aider', 'ENCO'],
  },
  {
    name: 'Dana',
    photo: '/images/dana.jpeg',
    roles: ['Level 3 Early Years Educator'],
    badges: ['First Aider', 'Communication Champion'],
  },
  {
    name: 'Kiana',
    photo: '/images/kiarna.jpeg',
    roles: ['Level 3 Early Years Educator'],
    badges: ['First Aider'],
  },
  {
    name: 'Sadie',
    photo: '/images/sadie.jpeg',
    roles: ['Level 3 Apprentice'],
    badges: ['First Aider'],
  },
  {
    name: 'Sky',
    photo: '/images/sky.jpeg',
    roles: ['Level 2 Apprentice'],
    badges: ['First Aider'],
  },
]

const BADGE_COLOURS: Record<string, string> = {
  'Designated Safeguarding Lead': 'bg-red-100 text-red-700 border-red-200',
  'Deputy Designated Safeguarding Lead': 'bg-orange-100 text-orange-700 border-orange-200',
  'First Aider': 'bg-green-100 text-green-700 border-green-200',
  'Health & Safety Co-ordinator': 'bg-blue-100 text-blue-700 border-blue-200',
  'ENCO': 'bg-purple-100 text-purple-700 border-purple-200',
  'Communication Champion': 'bg-teal-100 text-teal-700 border-teal-200',
}

export default function TeamPage() {
  return (
    <WebsiteLayout>

      {/* Page header */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Our Team</h1>
          <p className="text-gray-500">Experienced, qualified practitioners who love what they do</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">

        <p className="text-gray-600 text-lg leading-relaxed mb-10 max-w-2xl">
          Our team is made up of qualified Early Years professionals who are passionate about
          supporting children's development. All staff hold relevant childcare qualifications
          and undertake regular training to keep their knowledge and skills up to date.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {team.map(member => (
            <div key={member.name} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              {/* Photo */}
              <div className="w-40 h-40 rounded-full overflow-hidden mb-3 shadow-md mx-auto">
                <Image
                  src={member.photo}
                  alt={member.name}
                  width={320}
                  height={320}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 mb-3 text-center">
                {member.roles.map(r => (
                  <div key={r} className="text-sm text-gray-500">{r}</div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {member.badges.map(b => (
                  <span key={b}
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BADGE_COLOURS[b] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Staffing ratios note */}
        <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-5 max-w-2xl">
          <div className="font-bold text-blue-900 mb-1 text-base">Staffing ratios</div>
          <p className="text-base text-blue-800 leading-relaxed">
            We maintain a minimum staff-to-child ratio of 1:8 for 3–5 year olds and 1:4 for 2 year olds,
            in line with the EYFS statutory requirements. In practice we often exceed these ratios to
            ensure every child receives the attention they need.
          </p>
        </div>

      </div>
    </WebsiteLayout>
  )
}
