import { db } from '@/lib/db'
import {
  children, childSessions, emergencyContacts, medications,
  childNotes, accidentForms, registerEntries, terms, users, childSiblings, medicineAdministrations,
  childHolidays, sessionSegments, sessionConfig,
} from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import ChildInfoSection from './ChildInfoSection'
import SessionsSection from './SessionsSection'
import ContactsSection from './ContactsSection'
import MedicationsSection from './MedicationsSection'
import NotesSection from './NotesSection'
import AccidentsSection from './AccidentsSection'
import SicknessSection from './SicknessSection'
import HolidaySection from './HolidaySection'
import SiblingsSection from './SiblingsSection'
import MedicineAdminSection from './MedicineAdminSection'
import FundingSection from './FundingSection'
import ParentSection from './ParentSection'
import AttendanceLogSection from './AttendanceLogSection'

export default async function ChildProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const session = await auth()
  const { id } = await params
  const { edit } = await searchParams

  const [child] = await db.select().from(children).where(eq(children.id, id)).limit(1)
  if (!child) notFound()

  const [
    childSessionsData,
    contacts,
    meds,
    notes,
    accidents,
    allStaff,
    allTerms,
    siblingLinks,
    medicineAdmins,
    holidays,
    allChildEntries,
  ] = await Promise.all([
    db.select().from(childSessions).where(eq(childSessions.childId, id)),
    db.select().from(emergencyContacts).where(eq(emergencyContacts.childId, id)),
    db.select().from(medications).where(eq(medications.childId, id)),
    db.select({
      note: childNotes,
      authorName: users.name,
    }).from(childNotes)
      .leftJoin(users, eq(childNotes.authorId, users.id))
      .where(eq(childNotes.childId, id))
      .orderBy(childNotes.createdAt),
    db.select({
      form: accidentForms,
      reporterName: users.name,
    }).from(accidentForms)
      .leftJoin(users, eq(accidentForms.reportedById, users.id))
      .where(eq(accidentForms.childId, id))
      .orderBy(accidentForms.incidentDate),
    db.select({ id: users.id, name: users.name }).from(users),
    db.select().from(terms).orderBy(terms.startDate),
    db.select({ siblingId: childSiblings.siblingId }).from(childSiblings).where(eq(childSiblings.childId, id)),
    db.select().from(medicineAdministrations).where(eq(medicineAdministrations.childId, id)).orderBy(medicineAdministrations.givenAt),
    db.select().from(childHolidays).where(eq(childHolidays.childId, id)).orderBy(childHolidays.startDate),
    db.select({
      date: registerEntries.date,
      sessionType: registerEntries.sessionType,
      status: registerEntries.status,
      absenceReason: registerEntries.absenceReason,
      signedInAt: registerEntries.signedInAt,
      signedOutAt: registerEntries.signedOutAt,
      droppedBy: registerEntries.droppedBy,
      rule48h: registerEntries.rule48h,
    }).from(registerEntries).where(eq(registerEntries.childId, id)).orderBy(registerEntries.date),
  ])

  const childSessionIds = childSessionsData.map(s => s.id)
  const [segments, sessionConfigs] = await Promise.all([
    childSessionIds.length > 0
      ? db.select().from(sessionSegments).where(inArray(sessionSegments.childSessionId, childSessionIds))
      : Promise.resolve([]),
    db.select().from(sessionConfig),
  ])

  // Fetch sibling details
  const siblingIds = siblingLinks.map(s => s.siblingId)
  const siblings = siblingIds.length > 0
    ? await db.select({ id: children.id, firstName: children.firstName, lastName: children.lastName, archived: children.archived })
        .from(children)
        .where(inArray(children.id, siblingIds))
    : []

  // All active children for linking new siblings (excluding self and already linked)
  const allChildren = await db.select({ id: children.id, firstName: children.firstName, lastName: children.lastName })
    .from(children)
    .where(eq(children.archived, false))

  const enrolledDays = childSessionsData.map(s => s.day)

  const serialisedEntries = allChildEntries.map(e => ({
    date: e.date,
    sessionType: e.sessionType,
    status: e.status,
    absenceReason: e.absenceReason,
    signedInAt: e.signedInAt ? e.signedInAt.toISOString() : null,
    signedOutAt: e.signedOutAt ? e.signedOutAt.toISOString() : null,
    droppedBy: e.droppedBy,
    rule48h: e.rule48h,
  }))

  const serialisedTerms = allTerms.map(t => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    academicYear: t.academicYear,
  }))

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/children" className="text-sm text-gray-500 hover:text-gray-700">Children</Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-xl font-bold text-gray-800">
              {child.firstName} {child.lastName}
            </h1>
            {child.hasAllergies && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">⚠ Allergy</span>
            )}
            {child.archived && (
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">Archived</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            DOB: {new Date(child.dateOfBirth + 'T12:00:00').toLocaleDateString('en-GB')}
            {' · '}{(() => {
              const dob = new Date(child.dateOfBirth + 'T12:00:00')
              const now = new Date()
              let years = now.getFullYear() - dob.getFullYear()
              let months = now.getMonth() - dob.getMonth()
              if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
                years--
                months += 12
              }
              if (now.getDate() < dob.getDate()) months--
              if (months < 0) months += 12
              return months === 0 ? `${years}y old` : `${years}y ${months}m old`
            })()}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <SicknessSection
          allTerms={serialisedTerms}
          allEntries={serialisedEntries}
          enrolledDays={enrolledDays}
        />
        <HolidaySection
          childId={id}
          childName={`${child.firstName} ${child.lastName}`}
          holidays={holidays}
          enrolledDays={enrolledDays}
        />
        <ChildInfoSection child={child} staff={allStaff} defaultEditing={edit === '1'} />
        <ContactsSection childId={id} contacts={contacts} />
        <ParentSection
          childId={id}
          data={{
            parentName: child.parentName ?? null,
            parentEmail: child.parentEmail ?? null,
            parentPhone: child.parentPhone ?? null,
          }}
        />
        <SiblingsSection childId={id} siblings={siblings} allChildren={allChildren} />
        <FundingSection
          childId={id}
          funding={{
            twoYearFunding: child.twoYearFunding,
            extendedHours: child.extendedHours,
            eypp: child.eypp,
            sen: child.sen,
            senTier: child.senTier,
            daf: child.daf,
            dep: child.dep,
          }}
        />
        <SessionsSection childId={id} sessions={childSessionsData} segments={segments} sessionConfigs={sessionConfigs} />
        <MedicationsSection
          childId={id}
          medications={meds}
          contacts={contacts}
          child={{ firstName: child.firstName, lastName: child.lastName, dateOfBirth: child.dateOfBirth, address: child.address ?? null }}
        />
        <MedicineAdminSection
          childId={id}
          administrations={medicineAdmins}
          staff={allStaff}
        />
        <NotesSection childId={id} notes={notes} userId={session?.user?.id ?? ''} />
        <AccidentsSection
          childId={id}
          accidents={accidents}
          userId={session?.user?.id ?? ''}
          staff={allStaff}
          child={{ firstName: child.firstName, lastName: child.lastName, dateOfBirth: child.dateOfBirth, address: child.address ?? null }}
        />
        <AttendanceLogSection entries={serialisedEntries} />

        {!child.archived ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Archive this child</p>
              <p className="text-xs text-red-500 mt-0.5">Records are kept for 7 years. This child will no longer appear on the register.</p>
            </div>
            <form action={async () => {
              'use server'
              const { archiveChild } = await import('../actions')
              await archiveChild(id)
            }}>
              <button className="px-4 py-2 text-sm text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors">
                Archive
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">This child is archived.</p>
            <form action={async () => {
              'use server'
              const { unarchiveChild } = await import('../actions')
              await unarchiveChild(id)
            }}>
              <button className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                Restore
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
