'use client'

import { useEffect } from 'react'

type FormData = {
  id: string
  incidentDate: Date
  incidentType: string
  incidentLocation: string | null
  description: string
  injury: string
  actionTaken: string
  isHeadInjury: boolean
  headInjuryAdviceGiven: boolean
  headInjuryMonitoringFollowed: boolean
  firstAidPersonId: string | null
  firstAidAdministered: string | null
  bodyLocation: string | null
  parentNotified: boolean
  parentNotifiedAt: Date | null
  parentCarerName: string | null
  parentSignature: string | null
  parentSignedAt: Date | null
  previousConcerns: string | null
  previousConcernsOther: string | null
  dslInformedAt: Date | null
}

type Child = {
  firstName: string
  lastName: string
  dateOfBirth: string
  address: string | null
}

type Staff = { id: string; name: string }

function fmtDate(d: Date | string | null) {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtTime(d: Date | string | null) {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDob(dob: string) {
  return new Date(dob + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Tick({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 14, height: 14, border: '1.5px solid #111', marginRight: 4,
        fontSize: 10, lineHeight: 1, flexShrink: 0,
      }}
    >
      {checked ? '✓' : ''}
    </span>
  )
}

function Row({ label, value, half }: { label: string; value?: string; half?: boolean }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #ccc', minHeight: 28, flex: half ? '0 0 50%' : '1 1 100%' }}>
      <div style={{ minWidth: 180, padding: '4px 8px', borderRight: '1px solid #ccc', fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>
        {label}
      </div>
      <div style={{ flex: 1, padding: '4px 8px', fontSize: 10 }}>{value ?? ''}</div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#020e2f', color: 'white', padding: '4px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
      {children}
    </div>
  )
}

function BodyDiagramPrint({ location }: { location: { x: number; y: number } | null }) {
  const skin = '#fcd9bd'; const skinBorder = '#e8a87c'
  const clothes = '#dbeafe'; const clothesBorder = '#93c5fd'
  return (
    <svg viewBox="0 0 100 220" style={{ width: 80, display: 'block' }}>
      <circle cx="50" cy="16" r="13" fill={skin} stroke={skinBorder} strokeWidth="1.5" />
      <circle cx="44" cy="13" r="2" fill="#374151" />
      <circle cx="56" cy="13" r="2" fill="#374151" />
      <circle cx="45" cy="12.2" r="0.7" fill="white" />
      <circle cx="57" cy="12.2" r="0.7" fill="white" />
      <ellipse cx="50" cy="17.5" rx="1.2" ry="0.9" fill={skinBorder} />
      <path d="M 45.5,21 Q 50,24.5 54.5,21" stroke={skinBorder} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <ellipse cx="36" cy="16" rx="2.5" ry="3.5" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
      <ellipse cx="64" cy="16" rx="2.5" ry="3.5" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
      <rect x="45" y="28" width="10" height="8" rx="3" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
      <rect x="27" y="35" width="46" height="56" rx="10" fill={clothes} stroke={clothesBorder} strokeWidth="1.5" />
      <rect x="8" y="37" width="17" height="56" rx="8" fill={clothes} stroke={clothesBorder} strokeWidth="1.3" />
      <rect x="75" y="37" width="17" height="56" rx="8" fill={clothes} stroke={clothesBorder} strokeWidth="1.3" />
      <ellipse cx="16.5" cy="97" rx="8" ry="6" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
      <ellipse cx="83.5" cy="97" rx="8" ry="6" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
      <rect x="28" y="91" width="19" height="96" rx="9" fill={clothes} stroke={clothesBorder} strokeWidth="1.3" />
      <rect x="53" y="91" width="19" height="96" rx="9" fill={clothes} stroke={clothesBorder} strokeWidth="1.3" />
      <ellipse cx="37" cy="194" rx="14" ry="7" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
      <ellipse cx="62" cy="194" rx="14" ry="7" fill={skin} stroke={skinBorder} strokeWidth="1.2" />
      {location && (
        <>
          <circle cx={location.x} cy={location.y} r="7" fill="#ef4444" opacity="0.2" />
          <circle cx={location.x} cy={location.y} r="4" fill="#ef4444" />
          <circle cx={location.x} cy={location.y} r="1.5" fill="white" />
        </>
      )}
    </svg>
  )
}

const CONCERNS = ['injury', 'health', 'developmental', 'safeguarding', 'other'] as const

export default function AccidentPrintView({
  form,
  child,
  reporterName,
  staff,
  onClose,
}: {
  form: FormData
  child: Child
  reporterName: string | null
  staff: Staff[]
  onClose: () => void
}) {
  useEffect(() => {
    document.body.classList.add('printing-accident')
    return () => document.body.classList.remove('printing-accident')
  }, [])

  const loc = form.bodyLocation ? JSON.parse(form.bodyLocation) as { x: number; y: number } : null
  const concerns: string[] = form.previousConcerns ? JSON.parse(form.previousConcerns) : []
  const firstAider = staff.find(s => s.id === form.firstAidPersonId)
  const isSamePerson = !form.firstAidPersonId || form.firstAidPersonId === staff.find(s => s.name === reporterName)?.id

  const border = '1px solid #ccc'
  const sectionStyle: React.CSSProperties = { border, marginBottom: 8 }

  return (
    <div
      className="accident-print-root"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px' }}
    >
      {/* Toolbar — hidden on print */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10000 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 16px', background: '#020e2f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          🖨 Print
        </button>
        <button
          onClick={onClose}
          style={{ padding: '8px 16px', background: 'white', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          Close
        </button>
      </div>

      {/* Form content */}
      <div style={{ background: 'white', width: '100%', maxWidth: 720, margin: '48px auto 16px', padding: '24px 28px', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 10, color: '#111', lineHeight: 1.4 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #020e2f', paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#020e2f' }}>ACCIDENT / INCIDENT CARE FORM</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Tick checked={form.incidentType === 'within_provision'} />
                Accident/incident WITHIN provision
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Tick checked={form.incidentType === 'out_of_setting'} />
                Accident/incident OUT OF SETTING
              </label>
            </div>
          </div>
        </div>

        {/* ── Setting ── */}
        <div style={{ ...sectionStyle }}>
          <div style={{ display: 'flex', borderBottom: border }}>
            <div style={{ minWidth: 180, padding: '4px 8px', borderRight: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>
              Name of provision/setting:
            </div>
            <div style={{ flex: 1, padding: '4px 8px', fontSize: 10 }}>
              Winton Pre-School Little Explorers Ltd.<br />
              St. Bernadette's Church Hall, 46 Draycott Road, Bournemouth, BH10 5AR
            </div>
          </div>
        </div>

        {/* ── Child details ── */}
        <div style={{ ...sectionStyle }}>
          <SectionHeader>Child Details</SectionHeader>
          <div style={{ display: 'flex' }}>
            <Row label="Name:" value={`${child.firstName} ${child.lastName}`} half />
            <Row label="Date of Birth:" value={fmtDob(child.dateOfBirth)} half />
          </div>
          <Row label="Address:" value={child.address ?? ''} />
        </div>

        {/* ── Incident details ── */}
        <div style={{ ...sectionStyle }}>
          <SectionHeader>Incident Details</SectionHeader>
          <div style={{ display: 'flex' }}>
            <Row label="Date of incident:" value={fmtDate(form.incidentDate)} half />
            <Row label="Time of incident:" value={fmtTime(form.incidentDate)} half />
          </div>
          <Row label="Exact location:" value={form.incidentLocation ?? ''} />

          {/* Details + body diagram side by side */}
          <div style={{ display: 'flex', borderBottom: border }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: border }}>
                <div style={{ padding: '4px 8px', borderBottom: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>Details of incident:</div>
                <div style={{ padding: '6px 8px', minHeight: 60, fontSize: 10, whiteSpace: 'pre-wrap' }}>{form.description}</div>
              </div>
              <div style={{ borderBottom: border }}>
                <div style={{ padding: '4px 8px', borderBottom: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>Injury:</div>
                <div style={{ padding: '6px 8px', minHeight: 36, fontSize: 10 }}>{form.injury}</div>
              </div>
              <div>
                <div style={{ padding: '4px 8px', borderBottom: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>Action:</div>
                <div style={{ padding: '6px 8px', minHeight: 36, fontSize: 10, whiteSpace: 'pre-wrap' }}>{form.actionTaken}</div>
              </div>
            </div>
            {/* Body diagram */}
            <div style={{ width: 110, borderLeft: border, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 4 }}>
              <div style={{ fontSize: 9, color: '#666', textAlign: 'center' }}>Injury location</div>
              <BodyDiagramPrint location={loc} />
            </div>
          </div>

          {/* Head injury */}
          <div style={{ padding: '6px 8px', backgroundColor: form.isHeadInjury ? '#fff7ed' : undefined }}>
            <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
              If this is a head injury: (please tick)
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Tick checked={form.isHeadInjury} /> Head injury
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Tick checked={form.headInjuryAdviceGiven} /> Advice given to parent/carer
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Tick checked={form.headInjuryMonitoringFollowed} /> Head injury monitoring followed
              </label>
            </div>
          </div>
        </div>

        {/* ── Parent / carer ── */}
        <div style={{ ...sectionStyle }}>
          <SectionHeader>Parent / Carer</SectionHeader>
          <Row label="Name of parent/carer:" value={form.parentCarerName ?? ''} />
          <div style={{ display: 'flex', borderBottom: border }}>
            <div style={{ minWidth: 180, padding: '4px 8px', borderRight: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>
              Parent/carer signature:
            </div>
            <div style={{ flex: 1, padding: '4px 8px', minHeight: 50 }}>
              {form.parentSignature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.parentSignature} alt="Signature" style={{ maxHeight: 50 }} />
              ) : null}
            </div>
          </div>
          <div style={{ display: 'flex', borderBottom: border }}>
            <Row label="Date informed:" value={form.parentNotifiedAt ? fmtDate(form.parentNotifiedAt) : ''} half />
            <Row label="Time informed:" value={form.parentNotifiedAt ? fmtTime(form.parentNotifiedAt) : ''} half />
          </div>

          {/* Parent note */}
          <div style={{ padding: '6px 8px', fontSize: 9, color: '#444', fontStyle: 'italic', borderTop: border }}>
            <strong>*If you would like a copy of this form, please let staff know.*</strong> Originals kept in the accident/incident file for one term and then moved to child&apos;s registration folder or cause of concern folder, where applicable.
          </div>
        </div>

        {/* ── Previous concerns (DSL) ── */}
        <div style={{ ...sectionStyle }}>
          <SectionHeader>Previous Incident Concerns — DSL to Complete</SectionHeader>
          <div style={{ padding: '6px 8px' }}>
            <div style={{ fontSize: 10, marginBottom: 6 }}>Please tick all that apply:</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {CONCERNS.filter(c => c !== 'other').map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                  <Tick checked={concerns.includes(c)} />
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Tick checked={concerns.includes('other')} />
                Other:
              </label>
              <span style={{ borderBottom: '1px solid #aaa', minWidth: 120, fontSize: 10, paddingBottom: 1 }}>
                {form.previousConcernsOther ?? ''}
              </span>
            </div>
          </div>
        </div>

        {/* ── Person reporting / first aid ── */}
        <div style={{ ...sectionStyle }}>
          <SectionHeader>Details of Person(s) Reporting or Observing the Incident</SectionHeader>
          <div style={{ display: 'flex' }}>
            <Row label="Full name:" value={reporterName ?? ''} half />
            <Row label="Job role:" value="" half />
          </div>
          <div style={{ display: 'flex', borderBottom: border }}>
            <div style={{ flex: 1, borderRight: border }}>
              <div style={{ padding: '4px 8px', borderBottom: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>Signature:</div>
              <div style={{ minHeight: 44 }} />
            </div>
            <div style={{ flex: 1 }}>
              <Row label="Date & time of recording:" value={`${fmtDate(form.incidentDate)} ${fmtTime(form.incidentDate)}`} />
            </div>
          </div>
          <Row label="Name of person completing First Aid:" value={isSamePerson ? (reporterName ?? '') : (firstAider?.name ?? '')} />
          <Row label="First aid administered:" value={form.firstAidAdministered ?? ''} />
          <div style={{ borderBottom: border }}>
            <div style={{ padding: '4px 8px', borderBottom: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>Signature:</div>
            <div style={{ minHeight: 44 }} />
          </div>
          <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tick checked={isSamePerson} />
            <span style={{ fontSize: 10 }}>
              Please tick if the details of the person recording are the same as for the person reporting or observing the incident.
            </span>
          </div>
        </div>

        {/* ── DSL ── */}
        <div style={{ ...sectionStyle }}>
          <SectionHeader>Information Passed to Designated Safeguarding Lead (DSL)</SectionHeader>
          <div style={{ display: 'flex', borderBottom: border }}>
            <div style={{ minWidth: 180, padding: '4px 8px', borderRight: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>Full name of DSL:</div>
            <div style={{ flex: 1, padding: '4px 8px', fontSize: 10, lineHeight: 1.6 }}>
              Sally Burnell / Louise Tovey<br />
              07305 240440 &nbsp;·&nbsp; info@wintonpreschool.org.uk
            </div>
          </div>
          <div style={{ display: 'flex', borderBottom: border }}>
            <Row label="Date information shared:" value={form.dslInformedAt ? fmtDate(form.dslInformedAt) : ''} half />
            <Row label="Time information shared:" value={form.dslInformedAt ? fmtTime(form.dslInformedAt) : ''} half />
          </div>
          <div>
            <div style={{ padding: '4px 8px', borderBottom: border, fontWeight: 600, fontSize: 10, backgroundColor: '#f9f9f9' }}>Designated Safeguarding Lead signature:</div>
            <div style={{ minHeight: 50 }} />
          </div>
        </div>

        <div style={{ fontSize: 8, color: '#888', textAlign: 'center', marginTop: 8 }}>
          Records are kept for 7 years.
        </div>
      </div>
    </div>
  )
}
