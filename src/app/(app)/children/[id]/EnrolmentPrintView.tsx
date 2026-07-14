'use client'

// Full-record view of an enrolment intake form + signed policies — the same
// data captured on the "Add Child" wizard, kept as a permanent, printable
// document on the child's profile.

export type EnrolmentRecord = {
  intakeYear: number
  childFirstName: string
  childLastName: string
  childGender: string | null
  dateOfBirth: string | null
  childAddress: string | null
  childPostcode: string | null
  birthCertificateSeen: boolean
  parent1Name: string | null
  parent1DaytimePhone: string | null
  parent1Mobile: string | null
  parent1Email: string | null
  parent1Relationship: string | null
  parent1ParentalResponsibility: boolean
  parent2Name: string | null
  parent2DaytimePhone: string | null
  parent2Mobile: string | null
  parent2Email: string | null
  parent2Relationship: string | null
  parent2ParentalResponsibility: boolean
  ec1Name: string | null
  ec1DaytimePhone: string | null
  ec1Mobile: string | null
  ec1Relationship: string | null
  ec1CanCollect: boolean
  ec2Name: string | null
  ec2DaytimePhone: string | null
  ec2Mobile: string | null
  ec2Relationship: string | null
  ec2CanCollect: boolean
  collectionPassword: string | null
  fundingType: string | null
  fundingCode: string | null
  fundingCodeDate: string | null
  fundingNotes: string | null
  fundingApplicantName: string | null
  fundingApplicantDob: string | null
  fundingApplicantNi: string | null
  childInterests: string | null
  attendsOtherSetting: boolean
  attendsOtherSettingDetails: string | null
  parentConcerns: boolean
  parentConcernsDetails: string | null
  immunisationsUpToDate: boolean | null
  immunisationsSignature: string | null
  doctorName: string | null
  doctorPracticeName: string | null
  doctorPracticeAddress: string | null
  doctorPhone: string | null
  dentistName: string | null
  dentistPhone: string | null
  otherProfessionalsInvolved: boolean
  otherProfessionalsDetails: string | null
  hasMedicalConditions: boolean
  medicalConditionsDetails: string | null
  takesMedication: boolean
  ethnicity: string | null
  religion: string | null
  culturalCelebrations: string | null
  languagesSpokenAtHome: string | null
  mainLanguage: string | null
  hearAboutUs: string | null
  policiesManagerName: string | null
  policiesManagerSignedAt: Date | string | null
  welcomePackGivenAt: string | null
  tshirtGivenAt: string | null
  settlingSession1: string | null
  settlingSession2: string | null
  settlingSession3: string | null
  notes: string | null
  addedAt: Date | string
}

export type SignedPolicy = {
  policyName: string
  parentPrintName: string | null
  parentSignature: string | null
  parentSignedAt: Date | string | null
  notes: string | null
}

function fmtDate(d: string | Date | null) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d.length <= 10 ? d + 'T12:00:00' : d) : d
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function YN({ v }: { v: boolean | null }) {
  if (v === null) return <span>—</span>
  return <span>{v ? 'Yes' : 'No'}</span>
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === '' || value === null || value === undefined) return null
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 10, padding: '2px 0' }}>
      <span style={{ color: '#666', minWidth: 170 }}>{label}</span>
      <span style={{ color: '#111', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '8px 10px', marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 10.5, textDecoration: 'underline', marginBottom: 4, color: '#020e2f' }}>{title}</div>
      {children}
    </div>
  )
}

export default function EnrolmentPrintView({
  enrolment,
  policies,
  childName,
  onClose,
}: {
  enrolment: EnrolmentRecord
  policies: SignedPolicy[]
  childName: string
  onClose: () => void
}) {
  return (
    <div
      className="enrolment-print-root"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16 }}
    >
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10000 }}>
        <button onClick={() => window.print()} style={{ background: '#020e2f', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>🖨 Print</button>
        <button onClick={onClose} style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>Close</button>
      </div>

      <div style={{ background: 'white', width: '100%', maxWidth: 720, margin: '48px auto 16px', padding: '24px 28px', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 10, color: '#111', lineHeight: 1.4 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #020e2f', paddingBottom: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#020e2f' }}>Enrolment Record</div>
            <div style={{ fontSize: 10, color: '#666' }}>{childName} · September {enrolment.intakeYear} intake</div>
          </div>
          <div style={{ fontSize: 9, color: '#999' }}>Submitted {fmtDate(enrolment.addedAt)}</div>
        </div>

        <Section title="Child's Details">
          <Row label="Name" value={`${enrolment.childFirstName} ${enrolment.childLastName}`} />
          <Row label="Gender" value={enrolment.childGender} />
          <Row label="Date of birth" value={fmtDate(enrolment.dateOfBirth)} />
          <Row label="Address" value={enrolment.childAddress} />
          <Row label="Postcode" value={enrolment.childPostcode} />
          <Row label="Birth certificate seen" value={<YN v={enrolment.birthCertificateSeen} />} />
        </Section>

        <Section title="Family Details — Parent 1">
          <Row label="Name" value={enrolment.parent1Name} />
          <Row label="Relationship" value={enrolment.parent1Relationship} />
          <Row label="Daytime phone" value={enrolment.parent1DaytimePhone} />
          <Row label="Mobile" value={enrolment.parent1Mobile} />
          <Row label="Email" value={enrolment.parent1Email} />
          <Row label="Parental responsibility" value={<YN v={enrolment.parent1ParentalResponsibility} />} />
        </Section>

        {enrolment.parent2Name && (
          <Section title="Family Details — Parent 2">
            <Row label="Name" value={enrolment.parent2Name} />
            <Row label="Relationship" value={enrolment.parent2Relationship} />
            <Row label="Daytime phone" value={enrolment.parent2DaytimePhone} />
            <Row label="Mobile" value={enrolment.parent2Mobile} />
            <Row label="Email" value={enrolment.parent2Email} />
            <Row label="Parental responsibility" value={<YN v={enrolment.parent2ParentalResponsibility} />} />
          </Section>
        )}

        {(enrolment.ec1Name || enrolment.ec2Name) && (
          <Section title="Emergency Contacts">
            {enrolment.ec1Name && (
              <>
                <Row label="Contact 1" value={enrolment.ec1Name} />
                <Row label="Relationship" value={enrolment.ec1Relationship} />
                <Row label="Daytime phone" value={enrolment.ec1DaytimePhone} />
                <Row label="Mobile" value={enrolment.ec1Mobile} />
                <Row label="Can collect child" value={<YN v={enrolment.ec1CanCollect} />} />
              </>
            )}
            {enrolment.ec2Name && (
              <>
                <Row label="Contact 2" value={enrolment.ec2Name} />
                <Row label="Relationship" value={enrolment.ec2Relationship} />
                <Row label="Daytime phone" value={enrolment.ec2DaytimePhone} />
                <Row label="Mobile" value={enrolment.ec2Mobile} />
                <Row label="Can collect child" value={<YN v={enrolment.ec2CanCollect} />} />
              </>
            )}
            <Row label="Collection password" value={enrolment.collectionPassword} />
          </Section>
        )}

        <Section title="Funding">
          <Row label="Funding type" value={enrolment.fundingType} />
          <Row label="Funding code" value={enrolment.fundingCode} />
          <Row label="Code valid from" value={enrolment.fundingCodeDate ? fmtDate(enrolment.fundingCodeDate) : null} />
          <Row label="Applicant" value={enrolment.fundingApplicantName} />
          <Row label="Applicant DOB" value={enrolment.fundingApplicantDob ? fmtDate(enrolment.fundingApplicantDob) : null} />
          <Row label="Applicant NI number" value={enrolment.fundingApplicantNi} />
          <Row label="Notes" value={enrolment.fundingNotes} />
        </Section>

        <Section title="About Your Child">
          <Row label="Likes to play with" value={enrolment.childInterests} />
          <Row label="Attends another setting" value={<YN v={enrolment.attendsOtherSetting} />} />
          {enrolment.attendsOtherSetting && <Row label="Details" value={enrolment.attendsOtherSettingDetails} />}
          <Row label="Parent concerns" value={<YN v={enrolment.parentConcerns} />} />
          {enrolment.parentConcerns && <Row label="Details" value={enrolment.parentConcernsDetails} />}
        </Section>

        <Section title="Health">
          <Row label="Immunisations up to date" value={<YN v={enrolment.immunisationsUpToDate} />} />
          <Row label="Doctor" value={enrolment.doctorName} />
          <Row label="Practice" value={enrolment.doctorPracticeName} />
          <Row label="Practice address" value={enrolment.doctorPracticeAddress} />
          <Row label="Doctor's number" value={enrolment.doctorPhone} />
          <Row label="Dentist" value={enrolment.dentistName} />
          <Row label="Dentist number" value={enrolment.dentistPhone} />
          <Row label="Other professionals involved" value={<YN v={enrolment.otherProfessionalsInvolved} />} />
          {enrolment.otherProfessionalsInvolved && <Row label="Details" value={enrolment.otherProfessionalsDetails} />}
          <Row label="Medical conditions / allergies / diet" value={<YN v={enrolment.hasMedicalConditions} />} />
          {enrolment.hasMedicalConditions && <Row label="Details" value={enrolment.medicalConditionsDetails} />}
          <Row label="Takes regular medication" value={<YN v={enrolment.takesMedication} />} />
          {enrolment.immunisationsSignature && (
            <div style={{ marginTop: 4 }}>
              <div style={{ color: '#666', fontSize: 9 }}>Parent signature (immunisations)</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrolment.immunisationsSignature} alt="Parent signature" style={{ maxHeight: 40, border: '1px solid #eee' }} />
            </div>
          )}
        </Section>

        <Section title="Ethnicity, Culture & Language">
          <Row label="Ethnicity / cultural background" value={enrolment.ethnicity} />
          <Row label="Family religion" value={enrolment.religion} />
          <Row label="Cultural celebrations" value={enrolment.culturalCelebrations} />
          <Row label="Languages spoken at home" value={enrolment.languagesSpokenAtHome} />
          <Row label="Main language" value={enrolment.mainLanguage} />
          <Row label="How did you hear about us" value={enrolment.hearAboutUs} />
          <Row label="Notes" value={enrolment.notes} />
        </Section>

        {policies.length > 0 && (
          <Section title="Signed Policies">
            {policies.map((p, i) => (
              <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
                <Row label="Policy" value={p.policyName} />
                <Row label="Signed by" value={p.parentPrintName} />
                <Row label="Signed on" value={fmtDate(p.parentSignedAt)} />
                {p.notes && <Row label="Notes / exceptions" value={p.notes} />}
                {p.parentSignature && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.parentSignature} alt="Signature" style={{ maxHeight: 40, border: '1px solid #eee', marginTop: 2 }} />
                )}
              </div>
            ))}
            {enrolment.policiesManagerName && (
              <Row label="Countersigned on behalf of setting" value={`${enrolment.policiesManagerName} · ${fmtDate(enrolment.policiesManagerSignedAt)}`} />
            )}
          </Section>
        )}

        {(enrolment.welcomePackGivenAt || enrolment.tshirtGivenAt || enrolment.settlingSession1) && (
          <Section title="Welcome Pack & Settling In">
            <Row label="Welcome pack given" value={enrolment.welcomePackGivenAt ? fmtDate(enrolment.welcomePackGivenAt) : null} />
            <Row label="Polo shirt given" value={enrolment.tshirtGivenAt ? fmtDate(enrolment.tshirtGivenAt) : null} />
            <Row label="Settling-in session 1" value={enrolment.settlingSession1 ? fmtDate(enrolment.settlingSession1) : null} />
            <Row label="Settling-in session 2" value={enrolment.settlingSession2 ? fmtDate(enrolment.settlingSession2) : null} />
            <Row label="Settling-in session 3" value={enrolment.settlingSession3 ? fmtDate(enrolment.settlingSession3) : null} />
          </Section>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body > *:not(.enrolment-print-root) { display: none !important; }
          .enrolment-print-root { position: static !important; background: none !important; padding: 0 !important; display: block !important; }
        }
      `}</style>
    </div>
  )
}
