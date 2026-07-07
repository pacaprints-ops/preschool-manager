import WebsiteLayout from '@/components/WebsiteLayout'

export const metadata = {
  title: 'Policies & Procedures | Winton Pre-School Little Explorers',
  description: 'Our full policies and procedures, available for parents, carers and Ofsted to view at any time.',
}

type Doc = { title: string; href: string }
type Category = { title: string; icon: string; color: string; docs: Doc[] }

const categories: Category[] = [
  {
    title: 'Introduction & Fees',
    icon: '📋',
    color: 'slate',
    docs: [
      { title: '0. Introduction', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/0-Introduction-2025.pdf' },
      { title: 'Fees and Funding Policy', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2026/03/Fees-And-Funding-Policy-2026.pdf' },
    ],
  },
  {
    title: 'Health & Safety',
    icon: '🏥',
    color: 'red',
    docs: [
      { title: '01 Health and Safety Policy', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/01-Health-and-safety-policy-2025.pdf' },
      { title: '04.02 Administration of Medicine', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/04.02-Administration-of-medicine-2025.pdf' },
      { title: '04.05 Poorly Children', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/11/04.05-Poorly-children-2025-1.pdf' },
    ],
  },
  {
    title: 'Safeguarding & Inclusion',
    icon: '🛡️',
    color: 'purple',
    docs: [
      { title: '0.11 Whistle Blowing Policy', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/0.11-Whistle-Blowing-Policy.pdf' },
      { title: '05.01 Promoting Inclusion, Equality & Valuing Diversity', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/05.01-Promoting-inclusion-equality-and-valuing-diversity-2025-.pdf' },
      { title: '06.00 Safeguarding Children, People & Vulnerable Adults', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/06.00-Safeguarding-children-young-people-and-vulnerable-adults-policy-2025-1.pdf' },
      { title: '06.01 Responding to Safeguarding or Child Protection Concerns', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/06.01-Responding-to-safeguarding-or-child-protection-concerns-2025.pdf' },
      { title: '06.09 E-safety', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/06.09-E-safety-2025.pdf' },
    ],
  },
  {
    title: 'Data & Records',
    icon: '🔒',
    color: 'blue',
    docs: [
      { title: '07.02 Confidentiality, Recording & Sharing Information', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/07.02-Confidentiality-recording-and-sharing-information-2025.pdf' },
      { title: '07.03 Client Access to Records', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/07.03-Client-access-to-records-2025.pdf' },
    ],
  },
  {
    title: 'Early Years Practice',
    icon: '🌱',
    color: 'green',
    docs: [
      { title: '09 Early Years Practice Policy', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09-Early-years-practice-policy-2025.pdf' },
      { title: '09.01 Waiting List and Admissions', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.01-Waiting-list-and-admissions-2025.pdf' },
      { title: '09.01a About Our Childcare and Early Education', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.01a-About-our-childcare-and-early-education-2025.pdf' },
      { title: '09.01c Childcare & Early Education Terms and Conditions', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.01c-Childcare-and-early-education-terms-and-conditions-2025.pdf' },
      { title: '09.02 Attendance and Absences', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.02-Attendance-and-Absences-2025.pdf' },
      { title: '09.03 Prime Times — The Role of the Key Person', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.03-Prime-times-The-role-of-the-key-person-2025.docx.pdf' },
      { title: '09.04 Prime Times — Settling In and Transitions', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.04-Prime-times-Settling-in-and-transitions-2025.docx.pdf' },
      { title: "09.05 Establishing Children's Starting Points", href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.05-Establishing-childrens-starting-points-2025.docx.pdf' },
      { title: '09.06 Prime Times — Arrivals and Departures', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.06-Prime-times-Arrivals-and-departures-2025.docx.pdf' },
      { title: '09.07 Prime Times — Mealtimes', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.07-Prime-times-mealtimes-2025.docx.pdf' },
      { title: '09.08 Prime Times — Snack-times and Mealtimes', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.08-Prime-times-Snack-times-and-mealtimes-2025.docx.pdf' },
      { title: '09.09 Prime Times — Intimate Care and Nappy Changing', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.09-Prime-times-–-Intimate-care-and-nappy-changing-2025.docx.pdf' },
      { title: '09.10 Prime Times — Sleep and Rest Time', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.10-Prime-times-Sleep-and-rest-time-2025.docx.pdf' },
      { title: '09.11 Managing Separation Anxiety in Children', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.11-Managing-separation-anxiety-in-children-2025.docx.pdf' },
      { title: '09.12a Promoting Positive Behaviour', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.12a-Promoting-positive-behaviour-2025.pdf' },
      { title: '09.12b Anti-Bullying Policy', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.12b-Anti-Bullying-Policy-2025.pdf' },
      { title: '09.13 Identification, Assessment & Support for Children with SEND', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.13-Identification-assessment-and-support-for-children-with-SEND-2025.pdf' },
      { title: '09.14 Prime Times — Transition to School', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/09.14-Prime-times-Transition-to-school-2025.pdf' },
    ],
  },
  {
    title: 'Parents & Complaints',
    icon: '🤝',
    color: 'orange',
    docs: [
      { title: '10.01 Working in Partnership with Parents & Other Agencies', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/10.01-Working-in-partnership-with-parents-and-other-agencies-2025.pdf' },
      { title: '10.02 Complaints Procedure for Parents and Service Users', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/10.02-Complaints-procedure-for-parents-and-service-users-2025.pdf' },
    ],
  },
  {
    title: 'Facilities',
    icon: '🚗',
    color: 'amber',
    docs: [
      { title: '12 Car Park Policy', href: 'https://wintonpreschool.org.uk/wp-content/uploads/2025/10/12-car-park-policy.pdf' },
    ],
  },
]

const statutoryGuidance: Doc[] = [
  { title: 'Working Together to Safeguard Children', href: 'https://assets.publishing.service.gov.uk/media/6849a7b67cba25f610c7db3f/Working_together_to_safeguard_children_2023_-_statutory_guidance.pdf' },
  { title: 'Keeping Children Safe in Education', href: 'https://assets.publishing.service.gov.uk/media/68add931969253904d155860/Keeping_children_safe_in_education_from_1_September_2025.pdf' },
  { title: 'Early Years Foundation Stage Statutory Framework', href: 'https://assets.publishing.service.gov.uk/media/68c024cb8c6d992f23edd79c/Early_years_foundation_stage_statutory_framework_-_for_group_and_school-based_providers.pdf.pdf' },
]

const COLOR_CLASSES: Record<string, { border: string; bg: string; heading: string }> = {
  slate: { border: 'border-slate-200', bg: 'bg-slate-50', heading: 'text-slate-900' },
  red: { border: 'border-red-200', bg: 'bg-red-50', heading: 'text-red-900' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', heading: 'text-purple-900' },
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', heading: 'text-blue-900' },
  green: { border: 'border-green-200', bg: 'bg-green-50', heading: 'text-green-900' },
  orange: { border: 'border-orange-200', bg: 'bg-orange-50', heading: 'text-orange-900' },
  amber: { border: 'border-amber-200', bg: 'bg-amber-50', heading: 'text-amber-900' },
}

export default function PoliciesPage() {
  return (
    <WebsiteLayout>

      {/* Page header */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Policies & Procedures</h1>
          <p className="text-gray-500">Our full policies, available for parents, carers and Ofsted to view at any time</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">

        <div>
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mb-6">
            Below is our full set of policies and procedures. These are reviewed regularly and are
            available to every parent and carer at any time — if you'd like a paper copy of any
            document, just ask a member of the team.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 max-w-3xl">
            <div className="font-semibold text-blue-900 mb-1">✅ Registration details</div>
            <p className="text-sm text-blue-800 leading-relaxed">
              Ofsted URN: 2753785 · Pre-School Learning Alliance membership no. 00216170<br />
              Questions about any of our policies? Call{' '}
              <a href="tel:07305240440" className="underline hover:no-underline">07305 240440</a> or email{' '}
              <a href="mailto:info@wintonpreschool.org.uk" className="underline hover:no-underline">info@wintonpreschool.org.uk</a>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map(cat => {
            const c = COLOR_CLASSES[cat.color]
            return (
              <div key={cat.title} className={`rounded-xl border p-6 ${c.border} ${c.bg}`}>
                <div className={`flex items-center gap-2 font-extrabold text-lg mb-4 ${c.heading}`}>
                  <span className="text-xl">{cat.icon}</span>
                  {cat.title}
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                  {cat.docs.map(doc => (
                    <a key={doc.href} href={doc.href} target="_blank" rel="noreferrer"
                      className="flex items-start gap-2 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:underline">
                      <span className="shrink-0">📄</span>
                      <span>{doc.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Statutory guidance */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center gap-2 font-extrabold text-lg mb-1 text-gray-900">
            <span className="text-xl">📖</span>
            Statutory guidance
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Government guidance that informs our policies — hosted externally on gov.uk.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
            {statutoryGuidance.map(doc => (
              <a key={doc.href} href={doc.href} target="_blank" rel="noreferrer"
                className="flex items-start gap-2 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:underline">
                <span className="shrink-0">🔗</span>
                <span>{doc.title}</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </WebsiteLayout>
  )
}
