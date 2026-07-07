import WebsiteLayout from '@/components/WebsiteLayout'

export const metadata = {
  title: 'Privacy Policy | Winton Pre-School Little Explorers',
  description: 'How Winton Pre-School Little Explorers collects, uses and protects your and your child\'s personal information.',
}

export default function PrivacyPage() {
  return (
    <WebsiteLayout>

      {/* Page header */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
          <p className="text-gray-500">How we look after your family's information</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10 text-gray-700 leading-relaxed">

        <p className="text-lg">
          Winton Pre-School Little Explorers ("we", "us") is committed to protecting the privacy of
          the children, parents and carers we work with. This page explains what information we
          collect, why we collect it, and how it's kept safe, in line with UK GDPR and the Data
          Protection Act 2018.
        </p>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">What information we collect</h2>
          <p className="mb-3">Depending on your family's stage with us, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Enquiry and waiting list details — your name, contact details, and your child's name and date of birth</li>
            <li>Registration information — address, emergency contacts, days and sessions attended</li>
            <li>Health and medical information — allergies, medical conditions, medication consent, and accident/incident records</li>
            <li>Safeguarding information relevant to your child's welfare</li>
            <li>Funding and fee information, including eligibility for government-funded hours</li>
            <li>Daily register and attendance records</li>
            <li>Photographs of children taken for learning journals and displays (only with your consent)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Why we collect it</h2>
          <p>
            We collect this information because we need it to provide safe, high-quality early years
            care and education, to meet our statutory duties under the Early Years Foundation Stage
            framework, to keep children safe, to claim government-funded hours on your behalf, and to
            communicate with you about your child.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Who we share it with</h2>
          <p>
            We only share information where we're required to, including with our local authority
            (for funded hours claims), Ofsted (on request, as our regulator), and other agencies
            where there is a safeguarding concern. We do not sell or share your information with
            third parties for marketing purposes.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">How long we keep it</h2>
          <p>
            Children's records are securely archived when they leave us and kept for 7 years, in line
            with statutory guidance for early years providers. After this, records are securely destroyed.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies and this website</h2>
          <p>
            This website embeds a Google Map on our About page to help you find us — Google may set
            cookies when this loads. We don't use any analytics or advertising cookies ourselves.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="font-semibold text-blue-900 mb-2">Your rights</div>
          <p className="text-sm text-blue-800 leading-relaxed">
            You have the right to ask what information we hold about you or your child, to request
            corrections, and in some cases to ask us to delete it. To make a request, or if you have
            any questions about this policy, contact us at{' '}
            <a href="mailto:info@wintonpreschool.org.uk" className="underline hover:no-underline">info@wintonpreschool.org.uk</a>{' '}
            or <a href="tel:07305240440" className="underline hover:no-underline">07305 240440</a>.
            You can also raise a concern with the{' '}
            <a href="https://ico.org.uk" target="_blank" rel="noreferrer" className="underline hover:no-underline">
              Information Commissioner's Office (ICO)
            </a>.
          </p>
        </div>

        <p className="text-sm text-gray-400">Last updated: July 2026</p>

      </div>
    </WebsiteLayout>
  )
}
