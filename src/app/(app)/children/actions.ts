'use server'

import { db } from '@/lib/db'
import {
  children, childSessions, emergencyContacts, medications,
  childNotes, accidentForms, waitingList, childSiblings, medicineAdministrations,
  childHolidays, registerEntries,
} from '@/lib/db/schema'
import { eq, or, and, gte, lte, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
// Note: redirect still used by archiveChild and promoteFromWaitingList

export async function createChild(data: {
  firstName: string
  lastName: string
  dateOfBirth: string
  address?: string
  keyWorkerId?: string
  hasAllergies: boolean
  allergies?: string
  medicalNotes?: string
  collectionPassword?: string
  photoConsent: boolean
  consumableConsent: boolean
  needs1to1: boolean
  parentName?: string
  parentEmail?: string
  parentPhone?: string
  depositPaid?: boolean
  twoYearFunding?: boolean
  extendedHours?: boolean
  eypp?: boolean
  sen?: boolean
  senTier?: string
  daf?: boolean
  dep?: boolean
}) {
  const [child] = await db.insert(children).values({
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    address: data.address || null,
    keyWorkerId: data.keyWorkerId || null,
    hasAllergies: data.hasAllergies,
    allergies: data.allergies || null,
    medicalNotes: data.medicalNotes || null,
    collectionPassword: data.collectionPassword || null,
    photoConsent: data.photoConsent,
    consumableConsent: data.consumableConsent,
    needs1to1: data.needs1to1,
    parentName: data.parentName || null,
    parentEmail: data.parentEmail || null,
    parentPhone: data.parentPhone || null,
    depositPaid: data.depositPaid ?? false,
    twoYearFunding: data.twoYearFunding ?? false,
    extendedHours: data.extendedHours ?? false,
    eypp: data.eypp ?? false,
    sen: data.sen ?? false,
    senTier: data.senTier || null,
    daf: data.daf ?? false,
    dep: data.dep ?? false,
  }).returning()

  revalidatePath('/children')
  return { id: child.id }
}

export async function updateChild(id: string, data: {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  address?: string
  keyWorkerId?: string
  hasAllergies?: boolean
  allergies?: string
  medicalNotes?: string
  collectionPassword?: string
  photoConsent?: boolean
  consumableConsent?: boolean
  needs1to1?: boolean
}) {
  await db.update(children).set({
    ...data,
    keyWorkerId: data.keyWorkerId || null,
    allergies: data.allergies || null,
    medicalNotes: data.medicalNotes || null,
    collectionPassword: data.collectionPassword || null,
  }).where(eq(children.id, id))
  revalidatePath(`/children/${id}`)
  revalidatePath('/children')
}

export async function archiveChild(id: string) {
  await db.update(children).set({
    archived: true,
    archivedAt: new Date(),
  }).where(eq(children.id, id))
  revalidatePath('/children')
  redirect('/children')
}

export async function unarchiveChild(id: string) {
  await db.update(children).set({
    archived: false,
    archivedAt: null,
  }).where(eq(children.id, id))
  revalidatePath('/children')
  revalidatePath(`/children/${id}`)
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function updateChildSessions(childId: string, sessions: { day: string; sessionType: string; isFunded: boolean }[]) {
  await db.delete(childSessions).where(eq(childSessions.childId, childId))
  if (sessions.length > 0) {
    await db.insert(childSessions).values(
      sessions.map(s => ({
        childId,
        day: s.day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
        sessionType: s.sessionType as 'morning' | 'afternoon' | 'full_day',
        isFunded: s.isFunded,
      }))
    )
  }
  revalidatePath(`/children/${childId}`)
}

// ─── Emergency contacts ───────────────────────────────────────────────────────

export async function addEmergencyContact(childId: string, data: {
  name: string
  relationship: string
  phone: string
  email?: string
  isAuthorisedCollector: boolean
}) {
  await db.insert(emergencyContacts).values({ childId, ...data, email: data.email || null })
  revalidatePath(`/children/${childId}`)
}

export async function deleteEmergencyContact(id: string, childId: string) {
  await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id))
  revalidatePath(`/children/${childId}`)
}

// ─── Medications ──────────────────────────────────────────────────────────────

export async function addMedication(childId: string, data: {
  name: string
  dosage: string
  frequency: string
  adminConsent: boolean
  notes?: string
  formDate?: string
  conditionDiagnosis?: string
  conditionSymptoms?: string
  hospitalContactName?: string
  hospitalContactPhone?: string
  doctorContactName?: string
  doctorContactPhone?: string
  administeredAtHome?: string
  durationOfTreatment?: string
  dateDispensed?: string
  storage?: string
  expiryDate?: string
  specialPrecautions?: string
  possibleSideEffects?: string
  emergencyProcedures?: string
  parentSignature?: string
  parentPrintName?: string
  staffSignature?: string
  staffPrintName?: string
  signedDate?: string
}) {
  await db.insert(medications).values({
    childId,
    name: data.name,
    dosage: data.dosage,
    frequency: data.frequency,
    adminConsent: data.adminConsent,
    notes: data.notes || null,
    formDate: data.formDate || null,
    conditionDiagnosis: data.conditionDiagnosis || null,
    conditionSymptoms: data.conditionSymptoms || null,
    hospitalContactName: data.hospitalContactName || null,
    hospitalContactPhone: data.hospitalContactPhone || null,
    doctorContactName: data.doctorContactName || null,
    doctorContactPhone: data.doctorContactPhone || null,
    administeredAtHome: data.administeredAtHome || null,
    durationOfTreatment: data.durationOfTreatment || null,
    dateDispensed: data.dateDispensed || null,
    storage: data.storage || null,
    expiryDate: data.expiryDate || null,
    specialPrecautions: data.specialPrecautions || null,
    possibleSideEffects: data.possibleSideEffects || null,
    emergencyProcedures: data.emergencyProcedures || null,
    parentSignature: data.parentSignature || null,
    parentPrintName: data.parentPrintName || null,
    staffSignature: data.staffSignature || null,
    staffPrintName: data.staffPrintName || null,
    signedDate: data.signedDate || null,
  })
  revalidatePath(`/children/${childId}`)
}

export async function deleteMedication(id: string, childId: string) {
  await db.delete(medications).where(eq(medications.id, id))
  revalidatePath(`/children/${childId}`)
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function addNote(childId: string, authorId: string, note: string) {
  await db.insert(childNotes).values({ childId, authorId, note })
  revalidatePath(`/children/${childId}`)
}

export async function deleteNote(id: string, childId: string) {
  await db.delete(childNotes).where(eq(childNotes.id, id))
  revalidatePath(`/children/${childId}`)
}

// ─── Accident forms ───────────────────────────────────────────────────────────

export async function addAccidentForm(childId: string, reportedById: string, data: {
  incidentDate: string
  incidentType: string
  incidentLocation?: string
  description: string
  injury: string
  actionTaken: string
  isHeadInjury: boolean
  headInjuryAdviceGiven: boolean
  headInjuryMonitoringFollowed: boolean
  firstAidPersonId?: string
  firstAidAdministered?: string
  reporterJobRole?: string
  reporterSignature?: string
  firstAiderSignature?: string
  bodyLocation?: string
  parentNotified: boolean
  parentNotifiedAt?: string
  parentCarerName?: string
  parentSignature?: string
  previousConcerns?: string
  previousConcernsOther?: string
  dslInformedAt?: string
}) {
  await db.insert(accidentForms).values({
    childId,
    reportedById,
    incidentDate: new Date(data.incidentDate),
    incidentType: data.incidentType,
    incidentLocation: data.incidentLocation ?? null,
    description: data.description,
    injury: data.injury,
    actionTaken: data.actionTaken,
    isHeadInjury: data.isHeadInjury,
    headInjuryAdviceGiven: data.headInjuryAdviceGiven,
    headInjuryMonitoringFollowed: data.headInjuryMonitoringFollowed,
    firstAidPersonId: data.firstAidPersonId ?? null,
    firstAidAdministered: data.firstAidAdministered ?? null,
    reporterJobRole: data.reporterJobRole ?? null,
    reporterSignature: data.reporterSignature ?? null,
    firstAiderSignature: data.firstAiderSignature ?? null,
    bodyLocation: data.bodyLocation ?? null,
    parentNotified: data.parentNotified,
    parentNotifiedAt: data.parentNotifiedAt ? new Date(data.parentNotifiedAt) : null,
    parentCarerName: data.parentCarerName ?? null,
    parentSignature: data.parentSignature || null,
    parentSignedAt: data.parentSignature ? new Date() : null,
    previousConcerns: data.previousConcerns ?? null,
    previousConcernsOther: data.previousConcernsOther ?? null,
    dslInformedAt: data.dslInformedAt ? new Date(data.dslInformedAt) : null,
  })
  revalidatePath(`/children/${childId}`)
}

export async function signAccidentForm(formId: string, childId: string, signature: string, parentCarerName?: string) {
  await db.update(accidentForms)
    .set({ parentSignature: signature, parentSignedAt: new Date(), ...(parentCarerName ? { parentCarerName } : {}) })
    .where(eq(accidentForms.id, formId))
  revalidatePath(`/children/${childId}`)
}

export async function updateAccidentDsl(formId: string, childId: string, data: {
  previousConcerns?: string
  previousConcernsOther?: string
  dslInformedAt?: string
}) {
  await db.update(accidentForms)
    .set({
      previousConcerns: data.previousConcerns ?? null,
      previousConcernsOther: data.previousConcernsOther ?? null,
      dslInformedAt: data.dslInformedAt ? new Date(data.dslInformedAt) : null,
    })
    .where(eq(accidentForms.id, formId))
  revalidatePath(`/children/${childId}`)
}

// ─── Promote from waiting list ────────────────────────────────────────────────

export async function promoteFromWaitingList(waitlistId: string, data: {
  firstName: string
  lastName: string
  dateOfBirth?: string
}) {
  const [child] = await db.insert(children).values({
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth || '2020-01-01',
    archived: false,
  }).returning()

  await db.update(waitingList).set({
    status: 'accepted',
    promotedAt: new Date(),
    promotedChildId: child.id,
  }).where(eq(waitingList.id, waitlistId))

  revalidatePath('/waiting-list')
  revalidatePath('/children')
  redirect(`/children/${child.id}`)
}

// ─── Siblings ─────────────────────────────────────────────────────────────────

export async function addSibling(childId: string, siblingId: string) {
  // Insert both directions so each child sees the other as a sibling
  await db.insert(childSiblings).values([
    { childId, siblingId },
    { childId: siblingId, siblingId: childId },
  ])
  revalidatePath(`/children/${childId}`)
  revalidatePath(`/children/${siblingId}`)
}

export async function removeSibling(childId: string, siblingId: string) {
  await db.delete(childSiblings).where(
    or(
      and(eq(childSiblings.childId, childId), eq(childSiblings.siblingId, siblingId)),
      and(eq(childSiblings.childId, siblingId), eq(childSiblings.siblingId, childId)),
    )
  )
  revalidatePath(`/children/${childId}`)
  revalidatePath(`/children/${siblingId}`)
}

export async function addMedicineAdmin(
  childId: string,
  data: {
    medicationName: string
    dose: string
    givenAt: string
    givenById: string
    givenByName: string
    witnessedById: string
    witnessedByName: string
    parentInformed: boolean
    notes: string
  }
) {
  await db.insert(medicineAdministrations).values({
    childId,
    medicationName: data.medicationName,
    dose: data.dose,
    givenAt: new Date(data.givenAt),
    givenById: data.givenById || null,
    givenByName: data.givenByName || null,
    witnessedById: data.witnessedById || null,
    witnessedByName: data.witnessedByName || null,
    parentInformed: data.parentInformed,
    notes: data.notes || null,
  })
  revalidatePath(`/children/${childId}`)
}

export async function deleteMedicineAdmin(id: string, childId: string) {
  await db.delete(medicineAdministrations).where(eq(medicineAdministrations.id, id))
  revalidatePath(`/children/${childId}`)
}

// ─── Holiday actions ──────────────────────────────────────────────────────────

const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export async function addChildHoliday(
  childId: string,
  startDate: string,
  endDate: string,
  notes: string,
) {
  // Get this child's enrolled sessions (day + sessionType)
  const sessions = await db
    .select({ day: childSessions.day, sessionType: childSessions.sessionType })
    .from(childSessions)
    .where(eq(childSessions.childId, childId))

  // Build map: day name -> session types
  const daySessionMap = new Map<string, string[]>()
  for (const s of sessions) {
    const list = daySessionMap.get(s.day) ?? []
    list.push(s.sessionType)
    daySessionMap.set(s.day, list)
  }

  // Enumerate every enrolled date in the range
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  const enrolledDates: { date: string; sessionTypes: string[] }[] = []
  const cur = new Date(start)
  while (cur <= end) {
    const dayName = WEEK_DAYS[cur.getDay()]
    const sessionTypes = daySessionMap.get(dayName)
    if (sessionTypes && sessionTypes.length > 0) {
      enrolledDates.push({
        date: cur.toISOString().slice(0, 10),
        sessionTypes,
      })
    }
    cur.setDate(cur.getDate() + 1)
  }

  const daysUsed = enrolledDates.length

  // Insert holiday record
  await db.insert(childHolidays).values({
    childId,
    startDate,
    endDate,
    notes: notes || null,
    daysUsed,
  })

  // Create register entries for enrolled days (skip dates that already have an entry)
  if (enrolledDates.length > 0) {
    const allDates = enrolledDates.map(d => d.date)
    const existing = await db
      .select({ date: registerEntries.date, sessionType: registerEntries.sessionType })
      .from(registerEntries)
      .where(and(
        eq(registerEntries.childId, childId),
        inArray(registerEntries.date, allDates),
      ))
    const existingKeys = new Set(existing.map(e => `${e.date}-${e.sessionType}`))

    const toInsert = enrolledDates.flatMap(({ date, sessionTypes }) =>
      sessionTypes
        .filter(st => !existingKeys.has(`${date}-${st}`))
        .map(st => ({
          childId,
          date,
          sessionType: st as 'morning' | 'afternoon' | 'full_day',
          status: 'absent' as const,
          absenceReason: 'Holiday',
        }))
    )
    if (toInsert.length > 0) {
      await db.insert(registerEntries).values(toInsert)
    }
  }

  revalidatePath(`/children/${childId}`)
  revalidatePath('/register')
}

export async function deleteChildHoliday(id: string, childId: string) {
  // Fetch the holiday to get the date range
  const [holiday] = await db
    .select({ startDate: childHolidays.startDate, endDate: childHolidays.endDate })
    .from(childHolidays)
    .where(eq(childHolidays.id, id))
    .limit(1)

  if (holiday) {
    // Remove auto-created holiday register entries in that range
    await db.delete(registerEntries).where(and(
      eq(registerEntries.childId, childId),
      gte(registerEntries.date, holiday.startDate),
      lte(registerEntries.date, holiday.endDate),
      eq(registerEntries.status, 'absent'),
      eq(registerEntries.absenceReason, 'Holiday'),
    ))
  }

  await db.delete(childHolidays).where(eq(childHolidays.id, id))
  revalidatePath(`/children/${childId}`)
  revalidatePath('/register')
}

// ─── Termly register funding flags ───────────────────────────────────────────

export async function updateChildFundingFlag(childId: string, field: 'dep' | 'eypp' | 'sen', value: boolean) {
  await db.update(children).set({ [field]: value }).where(eq(children.id, childId))
}

export async function updateParentContact(childId: string, data: {
  parentName: string | null
  parentEmail: string | null
  parentPhone: string | null
}) {
  await db.update(children).set(data).where(eq(children.id, childId))
  revalidatePath(`/children/${childId}`)
}

export async function updateChildFunding(childId: string, data: {
  twoYearFunding: boolean
  extendedHours: boolean
  eypp: boolean
  sen: boolean
  senTier: string | null
  daf: boolean
  dep: boolean
}) {
  await db.update(children).set({
    twoYearFunding: data.twoYearFunding,
    extendedHours: data.extendedHours,
    eypp: data.eypp,
    sen: data.sen,
    senTier: data.senTier || null,
    daf: data.daf,
    dep: data.dep,
  }).where(eq(children.id, childId))
  revalidatePath(`/children/${childId}`)
}
