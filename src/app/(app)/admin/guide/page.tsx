export default function GuidePage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Staff Guide</h1>
          <p className="text-sm text-gray-500 mt-0.5">Feature overview — print or save as PDF to share with the team</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#020e2f] text-white text-sm rounded-lg hover:opacity-90"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="guide-content">
        <GuideDocument />
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .guide-content { font-family: Arial, sans-serif; font-size: 11pt; color: #111; }
        }
        .guide-content h1 { font-size: 20pt; font-weight: 700; color: #020e2f; margin: 0 0 4px; }
        .guide-content .subtitle { font-size: 10pt; color: #555; margin-bottom: 20px; }
        .guide-content h2 { font-size: 13pt; font-weight: 700; color: #020e2f; border-bottom: 2px solid #020e2f; padding-bottom: 4px; margin: 24px 0 10px; }
        .guide-content h3 { font-size: 11pt; font-weight: 700; color: #333; margin: 14px 0 6px; }
        .guide-content ul { margin: 0 0 10px 18px; padding: 0; }
        .guide-content li { margin-bottom: 3px; line-height: 1.5; }
        .guide-content .note { background: #f0f4ff; border-left: 3px solid #020e2f; padding: 8px 12px; margin: 10px 0; font-size: 10pt; }
        .guide-content .admin-only { background: #fef3c7; border-left: 3px solid #d97706; padding: 6px 10px; margin: 8px 0; font-size: 10pt; }
        .guide-content .page-break { page-break-before: always; }
        .guide-content table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
        .guide-content th { background: #020e2f; color: white; padding: 7px 10px; text-align: left; }
        .guide-content td { border: 1px solid #ccc; padding: 6px 10px; vertical-align: top; }
        .guide-content tr:nth-child(even) td { background: #f9f9f9; }
      `}</style>
    </div>
  )
}

function GuideDocument() {
  return (
    <div className="guide-content bg-white rounded-xl border border-gray-200 p-8">

      {/* Cover */}
      <h1>Winton Pre-School — Staff System Guide</h1>
      <div className="subtitle">How to use the school management system · May 2026</div>

      <div className="note">
        <strong>Access:</strong> The system is available at <strong>preschool-manager.vercel.app</strong> (moving to wintonpreschool.org.uk shortly).
        Louise and Sally have full admin access. All other staff have a staff login — see the Access section at the end of this guide.
      </div>

      {/* ── REGISTER ── */}
      <h2>Register</h2>
      <p style={{ marginBottom: 8, lineHeight: 1.6 }}>
        The daily register is the first thing you see when you log in. It automatically shows only the children
        scheduled for today — you don&apos;t need to scroll through the full list.
      </p>

      <h3>Marking attendance</h3>
      <ul>
        <li>Tap a child&apos;s name to expand their row and mark them <strong>Present</strong> or <strong>Absent</strong></li>
        <li>If absent, log the reason and tick whether the parent was contacted</li>
        <li>Children with allergies have an amber badge — tap to see allergy details</li>
        <li>If a child has an unsigned accident form, an amber &ldquo;Accident unsigned&rdquo; badge will appear — get it signed before they go home</li>
      </ul>

      <h3>Sign-in / sign-out</h3>
      <ul>
        <li>When a child arrives, tap <strong>Sign in</strong> to log the exact time. You can also record who dropped them off</li>
        <li>When they leave, tap <strong>Sign out</strong> — this logs the departure time for fire drill / headcount purposes</li>
        <li>At the end of the session, tap <strong>End session</strong> to sign out all remaining children at 3:00pm with no late fee</li>
        <li>If a child is signed out after 3:00pm, the register shows how many minutes late and the £1/min fee automatically</li>
      </ul>

      <h3>Session notes</h3>
      <ul>
        <li>Tap &ldquo;+ Note&rdquo; on any child to add a day-specific message (e.g. &ldquo;Nan collecting today&rdquo;, &ldquo;Leaving at 2pm&rdquo;)</li>
        <li>The button turns navy when a note is saved so staff can see it at a glance</li>
      </ul>

      <h3>Fire register</h3>
      <ul>
        <li>Tap <strong>Fire Register</strong> at the top of the page to open a printable list of all children and staff in the building</li>
        <li>Shows headcount stats — designed for evacuation use</li>
      </ul>

      <h3>Staff sign-in</h3>
      <ul>
        <li>Staff sign in and out using the Staff Sign-In section at the bottom of the register</li>
        <li>Visitors to the building are logged in the Visitors section</li>
      </ul>

      <h3>Staff ratio widget</h3>
      <ul>
        <li>A live ratio counter updates as children are marked present — shows how many staff are needed for the current session</li>
        <li>Ratio rules: 1:4 for 2-year-olds, 1:8 for 3–4-year-olds. Children with a 1-2-1 keyworker are counted separately</li>
      </ul>

      {/* ── ATTENDANCE HISTORY ── */}
      <h2>Attendance History</h2>
      <div className="admin-only"><strong>Admin only</strong></div>
      <ul>
        <li>Access via <strong>Attendance</strong> in the admin menu</li>
        <li>Pick any past date to view the full register for that day — who was present, absent, signed in/out times, absence reasons</li>
        <li>Tap <strong>Print / PDF</strong> to produce a printable record for that day — suitable for Ofsted inspections</li>
        <li>All attendance data is kept for 7 years as required by Ofsted</li>
      </ul>

      {/* ── CHILDREN ── */}
      <div className="page-break" />
      <h2>Children</h2>
      <p style={{ marginBottom: 8, lineHeight: 1.6 }}>
        Every active child has a full profile. Search by name, filter by day, or filter by key worker.
        Archived children (those who have left) are kept separately and accessible for 7 years.
      </p>

      <h3>Child profile sections</h3>
      <table>
        <thead>
          <tr><th>Section</th><th>What&apos;s in it</th></tr>
        </thead>
        <tbody>
          {[
            ['Attendance', 'Term-by-term attendance calendar — coloured dots show present (green), absent (red), holiday (amber), late pickup (blue). Stats show absence % this term and this year'],
            ['Child Information', 'Name, date of birth, address, key worker, allergies, medical notes, collection password, photo consent, consumable fee agreement, 1-2-1 keyworker flag'],
            ['Funding & Entitlements', 'Which funding types apply: Universal 15h (automatic), Extended 30h, 2YO funding, EYPP, SENIF (with tier), DAF, Deprivation supplement'],
            ['Siblings', 'Link to brother/sister profiles'],
            ['Sessions', 'Which days and session types (morning, afternoon, full day) the child attends, and whether each session is funded or paid'],
            ['Emergency Contacts', 'All authorised contacts with phone numbers and pickup authorisation'],
            ['Medications', 'Prescribed medicine forms with all required Ofsted fields. Printable from the profile'],
            ['Medicine Administration Log', 'Every time medication is given: what, dose, who gave it, who witnessed it, parent informed. Ofsted requirement'],
            ['Notes', 'General notes about the child — date stamped and author recorded'],
            ['Accidents', 'Full accident forms with body map, injury description, action taken, first aider, parent signature. Printable'],
            ['Holidays', 'Booked holidays — automatically creates absent register entries for the days affected'],
          ].map(([section, detail]) => (
            <tr key={section}>
              <td><strong>{section}</strong></td>
              <td>{detail}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Collection password</h3>
      <ul>
        <li>Each child can have a collection password on their profile</li>
        <li>If someone unfamiliar comes to collect, ask for the password before releasing the child</li>
      </ul>

      {/* ── TERMLY REGISTER ── */}
      <h2>Termly Register</h2>
      <ul>
        <li>Shows total children per day and how many staff are needed, broken down by age group</li>
        <li>Funding flags (DEP, EYPP, SEN) can be ticked per child per term for the LA submission</li>
        <li>Useful for planning rotas and checking ratios ahead of the term</li>
      </ul>

      {/* ── WAITING LIST ── */}
      <h2>Waiting List</h2>
      <ul>
        <li>Add prospective children with parent contact details, days needed, and notes</li>
        <li>Children stay in the order they were added — first in, first offered</li>
        <li>Status can be set to Waiting or Offered</li>
        <li>When a place is confirmed, tap <strong>Enrol</strong> — this creates the child&apos;s full profile automatically and takes you straight there to complete the details</li>
      </ul>

      {/* ── ENROLMENTS ── */}
      <div className="page-break" />
      <h2>Enrolments (September Intake Planning)</h2>
      <div className="admin-only"><strong>Admin only</strong></div>
      <ul>
        <li>Add new starters ahead of September — name, date of birth, parent contact, days and sessions needed</li>
        <li>The system suggests the best-fit keyworker for each child based on overlapping days and current workload</li>
        <li>Confirm or change the keyworker — this is remembered and pre-filled when the child&apos;s profile is created in September</li>
        <li>When September arrives, tap <strong>Start child profile</strong> on any enrolment — all the information pre-fills into a new child profile. Review and confirm, and the child is live on the system</li>
      </ul>

      {/* ── KEY WORKERS ── */}
      <h2>Key Workers</h2>
      <div className="admin-only"><strong>Admin only</strong></div>
      <ul>
        <li>Shows each staff member&apos;s current key children — sorted alphabetically, with the days each child attends</li>
        <li>Children with a 1-2-1 requirement are flagged with a purple badge</li>
        <li>Below the current year, a <strong>September intake</strong> section shows confirmed keyworker assignments for new starters</li>
        <li>Children without a keyworker are shown separately so no one is forgotten</li>
      </ul>

      {/* ── INVOICING ── */}
      <h2>Invoicing</h2>
      <div className="admin-only"><strong>Admin only</strong></div>

      <h3>Generating invoices</h3>
      <ul>
        <li>Select a term, choose which children to include (all selected by default), and tap <strong>Generate invoices</strong></li>
        <li>Each invoice is calculated automatically: funded sessions (£0 charge to parents), paid sessions (age-based hourly rate), consumable fee if agreed (£3.50 per session)</li>
        <li>Bank holidays are automatically deducted — England bank holidays 2025–2027 are built in</li>
        <li>A £50 deposit credit is applied to a child&apos;s first invoice if a deposit was paid at enrolment</li>
      </ul>

      <h3>Managing invoices</h3>
      <ul>
        <li>Tap <strong>PDF</strong> on any invoice to open a printable invoice with the school header and BACS payment details</li>
        <li>Tap <strong>Adjust</strong> to add or deduct any amount with a note (e.g. sibling discount)</li>
        <li>Mark invoices as Paid when payment is received</li>
        <li>Outstanding balances are shown at the top — every child with unpaid invoices and the total amount owed</li>
      </ul>

      <h3>Late pickup fees</h3>
      <ul>
        <li>Late fees are created automatically when a child is signed out after 3pm — £1 per minute</li>
        <li>They appear in the Late Pickup Fees section of the Invoicing page — mark paid once collected</li>
      </ul>

      <h3>LA Funding Claims</h3>
      <ul>
        <li>Once invoices are generated, the system shows an estimated breakdown of what the setting can claim from the local authority for that term</li>
        <li>Covers: Universal 15h / Extended 30h, 2-year-old funding, EYPP (£1/funded hour), DAF (£910/year), deprivation supplement (funded hours shown — apply your LA rate), SENIF (children listed by tier)</li>
        <li>Compare against your LA funding statement to verify</li>
      </ul>

      {/* ── STAFF ── */}
      <div className="page-break" />
      <h2>Staff</h2>
      <div className="admin-only"><strong>Admin only</strong></div>

      <h3>Rota</h3>
      <ul>
        <li>Weekly grid showing which days each staff member works</li>
        <li>Click any day to toggle on/off — saves instantly</li>
      </ul>

      <h3>Timesheets</h3>
      <ul>
        <li>Monthly timesheet grid per staff member — enter hours worked each day</li>
        <li>Toggle each day between Work (W), Holiday (H), or Sick (S)</li>
        <li>Holiday days: hours tracked, holiday pay accrual calculated at 12.07% of worked hours (standard for term-time workers)</li>
        <li>Sick days: SSP calculated automatically at £116.75/week ÷ contracted working days, with 3 waiting days per absence period</li>
        <li>Monthly summary at the bottom: worked hours, additional hours, key children total, extra hours</li>
        <li>Tap <strong>PDF ↗</strong> to open a printable timesheet — save as PDF and email to your accountant</li>
      </ul>

      <h3>Training records</h3>
      <ul>
        <li>Log every training course: name, date completed, expiry date, notes</li>
        <li>Expired training shows in red; training expiring within 60 days shows in blue — easy to spot at a glance</li>
      </ul>

      <h3>DBS tracking</h3>
      <ul>
        <li>Certificate number, issue date, and Update Service enrolment stored per staff member</li>
        <li>Colour-coded status: green = valid, amber = due within 90 days, red = overdue (3-year renewal cycle)</li>
      </ul>

      <h3>Personal details</h3>
      <ul>
        <li>Emergency contact details and medical/allergy information stored per staff member</li>
      </ul>

      <h3>Sickness log</h3>
      <ul>
        <li>Log sickness absences with start date, end date, reason, and notes</li>
        <li>Separate from the timesheet — used for tracking patterns and HR purposes</li>
      </ul>

      {/* ── TERM DATES ── */}
      <h2>Term Dates &amp; Session Rates</h2>
      <div className="admin-only"><strong>Admin only</strong></div>
      <ul>
        <li>Add and edit term dates — start date, end date, week count is calculated automatically</li>
        <li>Set hourly rates per session type (morning, afternoon, full day) for 2-year-olds and 3–4-year-olds separately</li>
        <li>Consumable fee rate can be updated here — currently £3.50 per session</li>
      </ul>

      {/* ── DATA RETENTION ── */}
      <div className="page-break" />
      <h2>Data Storage &amp; Retention</h2>

      <div className="note">
        All data is stored securely in a cloud database (Neon/Postgres, hosted in the EU). It is not stored on any
        individual device. Staff can access it from any device with a browser and their login details.
      </div>

      <table>
        <thead>
          <tr><th>Record type</th><th>How long kept</th><th>Where to find it</th></tr>
        </thead>
        <tbody>
          {[
            ['Daily attendance', '7 years (Ofsted requirement)', 'Attendance History page — pick any past date'],
            ['Child profiles', '7 years after child leaves', 'Children → Archived (for leavers)'],
            ['Accident forms', '7 years', 'Child profile → Accidents section'],
            ['Medication records', '7 years', 'Child profile → Medications & Medicine Admin Log'],
            ['Emergency contacts', 'As long as child is active / archived', 'Child profile → Emergency Contacts'],
            ['Invoices', 'As long as needed', 'Invoicing page'],
            ['Staff timesheets', 'As long as needed', 'Staff page → select staff member'],
            ['Staff training & DBS', 'As long as needed', 'Staff page → select staff member'],
            ['Waiting list', 'As long as needed', 'Waiting List page'],
          ].map(([type, retention, location]) => (
            <tr key={type}>
              <td><strong>{type}</strong></td>
              <td>{retention}</td>
              <td>{location}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Backups</h3>
      <ul>
        <li>The database is hosted by Neon (EU cloud provider) with automatic daily backups</li>
        <li>Point-in-time recovery is available — data can be restored to any point in the past 7 days if anything goes wrong</li>
        <li>No data is stored locally — staff losing a device does not affect any records</li>
      </ul>

      {/* ── ACCESS LEVELS ── */}
      <h2>Staff Access Levels</h2>

      <table>
        <thead>
          <tr><th>Feature</th><th>Admin (Louise &amp; Sally)</th><th>Staff</th></tr>
        </thead>
        <tbody>
          {[
            ['Register (today)', '✓', '✓'],
            ['Children — view profiles', '✓', '✓'],
            ['Children — edit profiles', '✓', '✓'],
            ['Termly Register / Ratios', '✓', '✓'],
            ['My Record (own timesheet, training, DBS, personal details)', '✓', '✓'],
            ['Attendance History (past dates)', '✓', '—'],
            ['Enrolments', '✓', '—'],
            ['Key Workers', '✓', '—'],
            ['Invoicing', '✓', '—'],
            ['All Staff — rota, other people\'s records', '✓', '—'],
            ['Term Dates & Rates', '✓', '—'],
            ['Staff Guide', '✓', '—'],
          ].map(([feature, admin, staff]) => (
            <tr key={feature}>
              <td>{feature}</td>
              <td style={{ textAlign: 'center', color: admin === '✓' ? '#166534' : '#999', fontWeight: admin === '✓' ? 700 : 400 }}>{admin}</td>
              <td style={{ textAlign: 'center', color: staff === '✓' ? '#166534' : '#999', fontWeight: staff === '✓' ? 700 : 400 }}>{staff}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Logging in</h3>
      <ul>
        <li>Go to <strong>wintonpreschool.org.uk</strong> (coming soon — currently preschool-manager.vercel.app)</li>
        <li>Each staff member has their own email and password</li>
        <li>Louise or Sally can set up new logins via the admin panel</li>
        <li>If you forget your password, contact Louise or Sally — they can reset it</li>
      </ul>

      {/* ── QUESTIONS ── */}
      <div className="page-break" />
      <h2>Questions &amp; Decisions Still Needed</h2>
      <p style={{ marginBottom: 8, lineHeight: 1.6 }}>
        The following features are designed and ready to build — we just need a few answers before we can finalise them.
      </p>

      <table>
        <thead>
          <tr><th>#</th><th>Topic</th><th>Question</th></tr>
        </thead>
        <tbody>
          {[
            ['1', 'Invoice emailing', 'When sending an invoice by email — should the parent email be pulled from their emergency contact record, or entered separately on the invoice? Would you like reminder emails for unpaid invoices, and if so, how many days after the due date?'],
            ['2', 'Funded hours report', 'Each term you submit funded hours to the LA. What format do they want — do they send a template, or any format? Which local authority?'],
            ['3', 'Parent announcements', 'Bulk emails to all parents (e.g. term start reminder, closure day). Should these also be saved in the app as a record of what was sent?'],
            ['4', 'Two-year progress check', 'Ofsted requires a written check for every child at age 2. Fields: date completed + sent to health visitor. Is that enough, or do you need more? Would you like an alert on the child\'s profile when they turn 2 and it hasn\'t been done yet?'],
            ['5', 'Supervision records', 'Ofsted expect manager–staff 1:1 supervision meetings to be logged. Suggested fields: date, staff member, manager, topics covered, actions agreed, next date. Is that right? How often are these done — monthly or termly?'],
            ['6', 'Key person meetings', 'A log of key person meetings with parents (Ofsted may ask). Suggested fields: date, key worker, parent name, topics, next meeting date. Is that right, or just date + notes?'],
            ['7', 'Staff logins', 'Please provide: full name and email address for each member of staff who needs a login.'],
          ].map(([num, topic, question]) => (
            <tr key={num}>
              <td style={{ width: 30 }}>{num}</td>
              <td style={{ width: 140 }}><strong>{topic}</strong></td>
              <td>{question}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="note" style={{ marginTop: 20 }}>
        <strong>Coming soon:</strong> Invoice emailing directly from the app · Bulk parent messaging ·
        Website at wintonpreschool.org.uk · Two-year progress check log · Supervision records · Key person meeting log
      </div>

      <div style={{ marginTop: 30, paddingTop: 12, borderTop: '1px solid #ddd', fontSize: '9pt', color: '#888', textAlign: 'center' }}>
        Winton Pre-School Management System · Built May 2026 · preschool-manager.vercel.app
      </div>

    </div>
  )
}
