import { db } from '@/lib/db'
import {
  children, childSessions, emergencyContacts, medications,
  childNotes, accidentForms, registerEntries, terms, users, childSiblings, medicineAdministrations,
} from '@/lib/db/schema'
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm'
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
import SiblingsSection from './SiblingsSection'
import MedicineAdminSection from './MedicineAdminSection'

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

  // Sickness stats
  const today = new Date()
  const currentTerm = allTerms.find(t =>
    new Date(t.startDate) <= today && new Date(t.endDate) >= today
  )

  let termAbsences = 0
  let termTotal = 0
  let yearAbsences = 0
  let yearTotal = 0

  if (currentTerm) {
    const termEntries = await db.select().from(registerEntries).where(
      and(
        eq(registerEntries.childId, id),
        gte(registerEntries.date, currentTerm.startDate),
        lte(registerEntries.date, currentTerm.endDate)
      )
    )
    termAbsences = termEntries.filter(e => e.status === 'absent').length
    termTotal = termEntries.length

    const yearEntries = await db.select().from(registerEntries).where(
      and(
        eq(registerEntries.childId, id),
        gte(registerEntries.date, currentTerm.academicYear.split('-')[0] + '-09-01')
      )
    )
    yearAbsences = yearEntries.filter(e => e.status === 'absent').length
    yearTotal = yearEntries.length
  }

  const termSicknessPercent = termTotal > 0 ? Math.round((termAbsences / termTotal) * 100) : null
  const yearSicknessPercent = yearTotal > 0 ? Math.round((yearAbsences / yearTotal) * 100) : null

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
          termPercent={termSicknessPercent}
          yearPercent={yearSicknessPercent}
          termName={currentTerm?.name}
          termAbsences={termAbsences}
          termTotal={termTotal}
          yearAbsences={yearAbsences}
          yearTotal={yearTotal}
        />
        <ChildInfoSection child={child} staff={allStaff} defaultEditing={edit === '1'} />
        <SiblingsSection childId={id} siblings={siblings} allChildren={allChildren} />
        <SessionsSection childId={id} sessions={childSessionsData} />
        <ContactsSection childId={id} contacts={contacts} />
        <MedicationsSection childId={id} medications={meds} />
        <MedicineAdminSection
          childId={id}
          administrations={medicineAdmins}
          staff={allStaff}
        />
        <NotesSection childId={id} notes={notes} userId={session?.user?.id ?? ''} />
        <AccidentsSection childId={id} accidents={accidents} userId={session?.user?.id ?? ''} />

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
