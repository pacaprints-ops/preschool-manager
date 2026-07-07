'use client'

import { useEffect } from 'react'

type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  adminConsent: boolean
  formDate: string | null
  conditionDiagnosis: string | null
  conditionSymptoms: string | null
  hospitalContactName: string | null
  hospitalContactPhone: string | null
  doctorContactName: string | null
  doctorContactPhone: string | null
  administeredAtHome: string | null
  durationOfTreatment: string | null
  dateDispensed: string | null
  storage: string | null
  expiryDate: string | null
  specialPrecautions: string | null
  possibleSideEffects: string | null
  emergencyProcedures: string | null
  parentSignature: string | null
  parentPrintName: string | null
  staffSignature: string | null
  staffPrintName: string | null
  signedDate: string | null
}

type Contact = {
  name: string
  relationship: string
  phone: string
}

type Child = {
  firstName: string
  lastName: string
  dateOfBirth: string
  address: string | null
}

function fmtDate(d: string | null) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Line({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 6, gap: 4 }}>
      <span style={{ fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap', minWidth: wide ? 200 : 'auto' }}>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted #555', minWidth: 60, fontSize: 9, paddingBottom: 1, paddingLeft: 4 }}>{value ?? ''}</span>
    </div>
  )
}

function ContactCol({ title, name, relationship, workPhone, mobile, homeNum }: {
  title: string; name?: string; relationship?: string; workPhone?: string; mobile?: string; homeNum?: string
}) {
  return (
    <div style={{ flex: 1, marginRight: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4, textDecoration: 'underline' }}>{title}</div>
      <Line label="Name" value={name} />
      <Line label="Relationship" value={relationship} />
      <Line label="Phone No. (work)" value={workPhone} />
      <Line label="Mobile" value={mobile} />
      <Line label="Home Number" value={homeNum} />
    </div>
  )
}

export default function MedicationPrintView({
  medication,
  child,
  contacts,
  onClose,
}: {
  medication: Medication
  child: Child
  contacts: Contact[]
  onClose: () => void
}) {
  useEffect(() => {
    document.body.classList.add('printing-medication')
    return () => document.body.classList.remove('printing-medication')
  }, [])

  const c1 = contacts[0]
  const c2 = contacts[1]
  const border = '1px solid #333'
  const pageStyle: React.CSSProperties = {
    width: 680, margin: '0 auto', fontFamily: 'Times New Roman, serif',
    background: 'white', padding: '24px 32px', boxSizing: 'border-box',
  }

  return (
    <div
      className="medication-print-root"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16 }}
    >
      {/* Toolbar — hidden on print */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10000 }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#020e2f', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}
        >
          🖨 Print
        </button>
        <button
          onClick={onClose}
          style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>

      {/* ── PAGE 1 (front) ── */}
      <div style={{ ...pageStyle, marginTop: 60 }} className="print-page">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Winton Pre-School</div>
          <div style={{ fontWeight: 700, fontSize: 12 }}>Administration of Prescribed Medicine</div>
        </div>

        {/* Intro */}
        <p style={{ fontSize: 8.5, lineHeight: 1.4, marginBottom: 10 }}>
          In order for your child to receive medicines (eg: antibiotics, Epi-pens, Inhalers) whilst in Pre-School, you need to complete and sign the form below. This form needs to be completed, signed and dated on every day the medicine is to be given. Please bring medicines when your child attends the Pre-School and take back home again when your child leaves. (The only exception could be spare inhalers/Epi-pens supplied by parents/carers in case of emergency). <strong>All medicines must have the pharmacists label clearly showing the name of the medication, child's name, frequency of administering, prescribed dosage and date prescribed.</strong>
        </p>

        {/* To be completed by parent or carer */}
        <div style={{ border, padding: '8px 10px', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 10, textDecoration: 'underline', marginBottom: 8 }}>To be completed by parent or carer</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Line label="Date" value={fmtDate(medication.formDate)} />
              <Line label="Child's full name" value={`${child.firstName} ${child.lastName}`} />
              <Line label="Address" value={child.address ?? ''} />
              <Line label="Date of birth" value={fmtDate(child.dateOfBirth)} />
              <Line label="Condition / diagnosis" value={medication.conditionDiagnosis ?? ''} />
            </div>
            <div style={{ width: 80, flexShrink: 0 }}>
              <div style={{ border, width: 72, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>Photo<br />of child</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact information */}
        <div style={{ border, padding: '8px 10px' }}>
          <div style={{ fontWeight: 700, fontSize: 10, textDecoration: 'underline', marginBottom: 8 }}>Contact information</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <ContactCol
              title="Family contact 1"
              name={c1?.name}
              relationship={c1?.relationship}
              mobile={c1?.phone}
            />
            <ContactCol
              title="Family contact 2"
              name={c2?.name}
              relationship={c2?.relationship}
              mobile={c2?.phone}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4, textDecoration: 'underline' }}>Hospital Contact</div>
              <Line label="Name" value={medication.hospitalContactName ?? ''} />
              <Line label="Phone No." value={medication.hospitalContactPhone ?? ''} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4, textDecoration: 'underline' }}>Doctors Contact</div>
              <Line label="Name" value={medication.doctorContactName ?? ''} />
              <Line label="Phone No." value={medication.doctorContactPhone ?? ''} />
            </div>
          </div>
        </div>
      </div>

      {/* ── PAGE 2 (back) ── */}
      <div style={{ ...pageStyle, marginTop: 32, marginBottom: 32, pageBreakBefore: 'always' }} className="print-page">
        {/* Symptoms */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 4 }}>Describe the condition and give details of the child's individual symptoms:</div>
          <div style={{ border, minHeight: 48, padding: '4px 8px', fontSize: 9 }}>{medication.conditionSymptoms ?? ''}</div>
        </div>

        {/* Medication section */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>MEDICATION</div>
          <div style={{ fontSize: 9, marginBottom: 6 }}>
            <em><u>I understand that I must deliver the medicine personally to the agreed member of staff.</u></em>
          </div>
          <Line label="Medication administered at home:" value={medication.administeredAtHome ?? ''} wide />
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 600 }}>Medication to be administered <u>in setting</u></div>
            <div style={{ fontSize: 9, marginTop: 2, marginBottom: 2 }}>Name/type of medication <em>(as prescribed on the container)</em></div>
            <div style={{ border, minHeight: 22, padding: '2px 6px', fontSize: 9, marginBottom: 6 }}>{medication.name}</div>
          </div>
          <Line label="For how long will your child take this medication:" value={medication.durationOfTreatment ?? ''} />
          <Line label="Date dispensed:" value={fmtDate(medication.dateDispensed)} />
        </div>

        {/* Directions */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 4 }}>Full directions for use:</div>
          <Line label="Dosage and method:" value={medication.dosage} />
          <Line label="Timing:" value={medication.frequency} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
            <div style={{ flex: 2 }}>
              <Line label="How it should be stored:" value={medication.storage ?? ''} />
            </div>
            <div style={{ flex: 1 }}>
              <Line label="Expiry date:" value={fmtDate(medication.expiryDate)} />
            </div>
          </div>
          <Line label="Special precautions:" value={medication.specialPrecautions ?? ''} />
          <Line label="Any possible side effects:" value={medication.possibleSideEffects ?? ''} />
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 2 }}>Procedures to take in an emergency:</div>
            <div style={{ border, minHeight: 36, padding: '3px 6px', fontSize: 9 }}>{medication.emergencyProcedures ?? ''}</div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 2 }}>Parent signature:</div>
              {medication.parentSignature
                ? <img src={medication.parentSignature} alt="Parent signature" style={{ height: 40, border, display: 'block' }} />
                : <div style={{ border, height: 40 }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <Line label="Print name:" value={medication.parentPrintName ?? ''} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 2 }}>Staff signature:</div>
              {medication.staffSignature
                ? <img src={medication.staffSignature} alt="Staff signature" style={{ height: 40, border, display: 'block' }} />
                : <div style={{ border, height: 40 }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <Line label="Print name:" value={medication.staffPrintName ?? ''} />
            </div>
          </div>
          <Line label="Date:" value={fmtDate(medication.signedDate)} />
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body > *:not(.medication-print-root) { display: none !important; }
          .medication-print-root { position: static !important; background: none !important; padding: 0 !important; display: block !important; }
          .print-page { page-break-after: always; }
        }
      `}</style>
    </div>
  )
}
