'use server'

import { db } from '@/lib/db'
import {
  children, childSessions, emergencyContacts, medications,
  childNotes, accidentForms, waitingList, childSiblings, medicineAdministrations,
} from '@/lib/db/schema'
import { eq, or, and } from 'drizzle-orm'
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
}) {
  await db.insert(medications).values({ childId, ...data, notes: data.notes || null })
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
  description: string
  injury: string
  actionTaken: string
  parentNotified: boolean
}) {
  await db.insert(accidentForms).values({
    childId,
    reportedById,
    incidentDate: new Date(data.incidentDate),
    description: data.description,
    injury: data.injury,
    actionTaken: data.actionTaken,
    parentNotified: data.parentNotified,
  })
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
