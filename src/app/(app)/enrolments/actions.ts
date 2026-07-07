'use server'

import { db } from '@/lib/db'
import { enrolments, children, childSessions, emergencyContacts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function addEnrolment(data: {
  intakeYear: number
  childFirstName: string
  childLastName: string
  dateOfBirth?: string
  parentCarerName: string
  contactPhone?: string
  contactEmail?: string
  daysSessions: Record<string, string>
  notes?: string
}) {
  await db.insert(enrolments).values({
    intakeYear: data.intakeYear,
    childFirstName: data.childFirstName,
    childLastName: data.childLastName,
    dateOfBirth: data.dateOfBirth || null,
    parentCarerName: data.parentCarerName,
    contactPhone: data.contactPhone || null,
    contactEmail: data.contactEmail || null,
    daysSessions: JSON.stringify(data.daysSessions),
    notes: data.notes || null,
  })
  revalidatePath('/enrolments')
}

export async function removeEnrolment(id: string) {
  await db.delete(enrolments).where(eq(enrolments.id, id))
  revalidatePath('/enrolments')
}

export async function updateEnrolmentFee(id: string, field: 'depositPaid' | 'welcomeFeePaid', value: boolean) {
  const update = field === 'depositPaid' ? { depositPaid: value } : { welcomeFeePaid: value }
  await db.update(enrolments).set(update).where(eq(enrolments.id, id))
  revalidatePath('/enrolments')
}

export async function confirmEnrolmentKeyworker(enrolmentId: string, staffId: string | null) {
  await db.update(enrolments).set({ confirmedKeyworkerId: staffId }).where(eq(enrolments.id, enrolmentId))
  revalidatePath('/enrolments')
  revalidatePath('/admin/keyworkers')
}

export async function promoteEnrolmentToChild(
  enrolmentId: string,
  depositPaid: boolean,
  data: {
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
    sessions: { day: string; sessionType: string; isFunded: boolean }[]
    contactName: string
    contactRelationship: string
    contactPhone: string
    contactEmail?: string
  }
): Promise<string> {
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
    depositPaid,
  }).returning()

  if (data.sessions.length > 0) {
    await db.insert(childSessions).values(
      data.sessions.map(s => ({
        childId: child.id,
        day: s.day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
        sessionType: s.sessionType as 'morning' | 'afternoon' | 'full_day',
        isFunded: s.isFunded,
      }))
    )
  }

  if (data.contactName.trim()) {
    await db.insert(emergencyContacts).values({
      childId: child.id,
      name: data.contactName,
      relationship: data.contactRelationship || 'Parent/Carer',
      phone: data.contactPhone,
      email: data.contactEmail || null,
      isAuthorisedCollector: true,
    })
  }

  await db.update(enrolments).set({ promotedChildId: child.id }).where(eq(enrolments.id, enrolmentId))

  revalidatePath('/enrolments')
  revalidatePath('/children')
  revalidatePath('/admin/keyworkers')

  return child.id
}
