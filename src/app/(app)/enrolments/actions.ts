'use server'

import { db } from '@/lib/db'
import { enrolments, children, childSessions, emergencyContacts, medications, enrolmentPolicySignatures } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { buildEnrolmentInvoiceEmail, sendEmail } from '@/lib/email'

export type AddEnrolmentData = {
  intakeYear: number
  // Child's details
  childFirstName: string
  childLastName: string
  childGender?: string
  dateOfBirth?: string
  childAddress?: string
  childPostcode?: string
  birthCertificateSeen?: boolean
  startDate?: string
  // Family details
  parent1Name: string
  parent1DaytimePhone?: string
  parent1Mobile?: string
  parent1Email?: string
  parent1Relationship?: string
  parent1ParentalResponsibility?: boolean
  parent2Name?: string
  parent2DaytimePhone?: string
  parent2Mobile?: string
  parent2Email?: string
  parent2Relationship?: string
  parent2ParentalResponsibility?: boolean
  // Emergency contacts
  ec1Name?: string
  ec1DaytimePhone?: string
  ec1Mobile?: string
  ec1Relationship?: string
  ec1CanCollect?: boolean
  ec2Name?: string
  ec2DaytimePhone?: string
  ec2Mobile?: string
  ec2Relationship?: string
  ec2CanCollect?: boolean
  collectionPassword?: string
  // Funding & sessions
  fundingType?: string
  fundingCode?: string
  fundingCodeDate?: string
  fundingNotes?: string
  fundingApplicantName?: string
  fundingApplicantDob?: string
  fundingApplicantNi?: string
  daysSessions: Record<string, string>
  // About your child
  childInterests?: string
  attendsOtherSetting?: boolean
  attendsOtherSettingDetails?: string
  parentConcerns?: boolean
  parentConcernsDetails?: string
  // Health questions
  immunisationsUpToDate?: boolean
  immunisationsSignature?: string
  doctorName?: string
  doctorPracticeName?: string
  doctorPracticeAddress?: string
  doctorPhone?: string
  dentistName?: string
  dentistPhone?: string
  otherProfessionalsInvolved?: boolean
  otherProfessionalsDetails?: string
  hasMedicalConditions?: boolean
  medicalConditionsDetails?: string
  takesMedication?: boolean
  medicationFormData?: string
  // Ethnicity, culture & language
  ethnicity?: string
  religion?: string
  culturalCelebrations?: string
  languagesSpokenAtHome?: string
  mainLanguage?: string
  hearAboutUs?: string
  notes?: string
  policySignatures?: { policyId: string; parentPrintName: string; parentSignature: string; notes?: string }[]
  policiesManagerName?: string
  welcomePackGivenAt?: string
  tshirtGivenAt?: string
  settlingSession1?: string
  settlingSession2?: string
  settlingSession3?: string
}

export async function addEnrolment(data: AddEnrolmentData): Promise<string> {
  const [row] = await db.insert(enrolments).values({
    intakeYear: data.intakeYear,
    childFirstName: data.childFirstName,
    childLastName: data.childLastName,
    childGender: data.childGender || null,
    dateOfBirth: data.dateOfBirth || null,
    childAddress: data.childAddress || null,
    childPostcode: data.childPostcode || null,
    birthCertificateSeen: data.birthCertificateSeen ?? false,
    startDate: data.startDate || null,
    // Legacy single-contact fields, kept in sync from Parent 1
    parentCarerName: data.parent1Name,
    contactPhone: data.parent1Mobile || data.parent1DaytimePhone || null,
    contactEmail: data.parent1Email || null,
    parent1Name: data.parent1Name || null,
    parent1DaytimePhone: data.parent1DaytimePhone || null,
    parent1Mobile: data.parent1Mobile || null,
    parent1Email: data.parent1Email || null,
    parent1Relationship: data.parent1Relationship || null,
    parent1ParentalResponsibility: data.parent1ParentalResponsibility ?? false,
    parent2Name: data.parent2Name || null,
    parent2DaytimePhone: data.parent2DaytimePhone || null,
    parent2Mobile: data.parent2Mobile || null,
    parent2Email: data.parent2Email || null,
    parent2Relationship: data.parent2Relationship || null,
    parent2ParentalResponsibility: data.parent2ParentalResponsibility ?? false,
    ec1Name: data.ec1Name || null,
    ec1DaytimePhone: data.ec1DaytimePhone || null,
    ec1Mobile: data.ec1Mobile || null,
    ec1Relationship: data.ec1Relationship || null,
    ec1CanCollect: data.ec1CanCollect ?? false,
    ec2Name: data.ec2Name || null,
    ec2DaytimePhone: data.ec2DaytimePhone || null,
    ec2Mobile: data.ec2Mobile || null,
    ec2Relationship: data.ec2Relationship || null,
    ec2CanCollect: data.ec2CanCollect ?? false,
    collectionPassword: data.collectionPassword || null,
    fundingType: data.fundingType || null,
    fundingCode: data.fundingCode || null,
    fundingCodeDate: data.fundingCodeDate || null,
    fundingNotes: data.fundingNotes || null,
    fundingApplicantName: data.fundingApplicantName || null,
    fundingApplicantDob: data.fundingApplicantDob || null,
    fundingApplicantNi: data.fundingApplicantNi || null,
    daysSessions: JSON.stringify(data.daysSessions),
    childInterests: data.childInterests || null,
    attendsOtherSetting: data.attendsOtherSetting ?? false,
    attendsOtherSettingDetails: data.attendsOtherSettingDetails || null,
    parentConcerns: data.parentConcerns ?? false,
    parentConcernsDetails: data.parentConcernsDetails || null,
    immunisationsUpToDate: data.immunisationsUpToDate ?? null,
    immunisationsSignature: data.immunisationsSignature || null,
    doctorName: data.doctorName || null,
    doctorPracticeName: data.doctorPracticeName || null,
    doctorPracticeAddress: data.doctorPracticeAddress || null,
    doctorPhone: data.doctorPhone || null,
    dentistName: data.dentistName || null,
    dentistPhone: data.dentistPhone || null,
    otherProfessionalsInvolved: data.otherProfessionalsInvolved ?? false,
    otherProfessionalsDetails: data.otherProfessionalsDetails || null,
    hasMedicalConditions: data.hasMedicalConditions ?? false,
    medicalConditionsDetails: data.medicalConditionsDetails || null,
    takesMedication: data.takesMedication ?? false,
    medicationFormData: data.medicationFormData || null,
    ethnicity: data.ethnicity || null,
    religion: data.religion || null,
    culturalCelebrations: data.culturalCelebrations || null,
    languagesSpokenAtHome: data.languagesSpokenAtHome || null,
    mainLanguage: data.mainLanguage || null,
    hearAboutUs: data.hearAboutUs || null,
    notes: data.notes || null,
    policiesManagerName: data.policiesManagerName || null,
    policiesManagerSignedAt: data.policiesManagerName ? new Date() : null,
    welcomePackGivenAt: data.welcomePackGivenAt || null,
    tshirtGivenAt: data.tshirtGivenAt || null,
    settlingSession1: data.settlingSession1 || null,
    settlingSession2: data.settlingSession2 || null,
    settlingSession3: data.settlingSession3 || null,
  }).returning()

  if (data.policySignatures && data.policySignatures.length > 0) {
    await db.insert(enrolmentPolicySignatures).values(
      data.policySignatures.map(s => ({
        enrolmentId: row.id,
        policyId: s.policyId,
        parentPrintName: s.parentPrintName,
        parentSignature: s.parentSignature,
        parentSignedAt: new Date(),
        notes: s.notes || null,
      }))
    )
  }

  revalidatePath('/enrolments')
  return row.id
}

export type UpdateEnrolmentData = Omit<
  AddEnrolmentData,
  'intakeYear' | 'policySignatures' | 'policiesManagerName' | 'welcomePackGivenAt' | 'tshirtGivenAt' | 'settlingSession1' | 'settlingSession2' | 'settlingSession3'
>

export async function updateEnrolmentFull(id: string, data: UpdateEnrolmentData) {
  await db.update(enrolments).set({
    childFirstName: data.childFirstName,
    childLastName: data.childLastName,
    childGender: data.childGender || null,
    dateOfBirth: data.dateOfBirth || null,
    childAddress: data.childAddress || null,
    childPostcode: data.childPostcode || null,
    birthCertificateSeen: data.birthCertificateSeen ?? false,
    startDate: data.startDate || null,
    parentCarerName: data.parent1Name,
    contactPhone: data.parent1Mobile || data.parent1DaytimePhone || null,
    contactEmail: data.parent1Email || null,
    parent1Name: data.parent1Name || null,
    parent1DaytimePhone: data.parent1DaytimePhone || null,
    parent1Mobile: data.parent1Mobile || null,
    parent1Email: data.parent1Email || null,
    parent1Relationship: data.parent1Relationship || null,
    parent1ParentalResponsibility: data.parent1ParentalResponsibility ?? false,
    parent2Name: data.parent2Name || null,
    parent2DaytimePhone: data.parent2DaytimePhone || null,
    parent2Mobile: data.parent2Mobile || null,
    parent2Email: data.parent2Email || null,
    parent2Relationship: data.parent2Relationship || null,
    parent2ParentalResponsibility: data.parent2ParentalResponsibility ?? false,
    ec1Name: data.ec1Name || null,
    ec1DaytimePhone: data.ec1DaytimePhone || null,
    ec1Mobile: data.ec1Mobile || null,
    ec1Relationship: data.ec1Relationship || null,
    ec1CanCollect: data.ec1CanCollect ?? false,
    ec2Name: data.ec2Name || null,
    ec2DaytimePhone: data.ec2DaytimePhone || null,
    ec2Mobile: data.ec2Mobile || null,
    ec2Relationship: data.ec2Relationship || null,
    ec2CanCollect: data.ec2CanCollect ?? false,
    collectionPassword: data.collectionPassword || null,
    fundingType: data.fundingType || null,
    fundingCode: data.fundingCode || null,
    fundingCodeDate: data.fundingCodeDate || null,
    fundingNotes: data.fundingNotes || null,
    fundingApplicantName: data.fundingApplicantName || null,
    fundingApplicantDob: data.fundingApplicantDob || null,
    fundingApplicantNi: data.fundingApplicantNi || null,
    daysSessions: JSON.stringify(data.daysSessions),
    childInterests: data.childInterests || null,
    attendsOtherSetting: data.attendsOtherSetting ?? false,
    attendsOtherSettingDetails: data.attendsOtherSettingDetails || null,
    parentConcerns: data.parentConcerns ?? false,
    parentConcernsDetails: data.parentConcernsDetails || null,
    immunisationsUpToDate: data.immunisationsUpToDate ?? null,
    immunisationsSignature: data.immunisationsSignature || null,
    doctorName: data.doctorName || null,
    doctorPracticeName: data.doctorPracticeName || null,
    doctorPracticeAddress: data.doctorPracticeAddress || null,
    doctorPhone: data.doctorPhone || null,
    dentistName: data.dentistName || null,
    dentistPhone: data.dentistPhone || null,
    otherProfessionalsInvolved: data.otherProfessionalsInvolved ?? false,
    otherProfessionalsDetails: data.otherProfessionalsDetails || null,
    hasMedicalConditions: data.hasMedicalConditions ?? false,
    medicalConditionsDetails: data.medicalConditionsDetails || null,
    takesMedication: data.takesMedication ?? false,
    medicationFormData: data.medicationFormData || null,
    ethnicity: data.ethnicity || null,
    religion: data.religion || null,
    culturalCelebrations: data.culturalCelebrations || null,
    languagesSpokenAtHome: data.languagesSpokenAtHome || null,
    mainLanguage: data.mainLanguage || null,
    hearAboutUs: data.hearAboutUs || null,
    notes: data.notes || null,
  }).where(eq(enrolments.id, id))
  revalidatePath('/enrolments')
  revalidatePath(`/enrolments/${id}/edit`)
}

export async function updateEnrolmentStartDate(id: string, startDate: string) {
  await db.update(enrolments).set({ startDate: startDate || null }).where(eq(enrolments.id, id))
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

type AdminTrackingField = 'welcomePackGivenAt' | 'tshirtGivenAt' | 'settlingSession1' | 'settlingSession2' | 'settlingSession3'

export async function updateEnrolmentAdminField(id: string, field: AdminTrackingField, value: string) {
  await db.update(enrolments).set({ [field]: value || null }).where(eq(enrolments.id, id))
  revalidatePath('/enrolments')
}

export async function emailEnrolmentInvoice(id: string): Promise<{ ok: boolean; error?: string }> {
  const [e] = await db.select().from(enrolments).where(eq(enrolments.id, id))
  if (!e) return { ok: false, error: 'Enrolment not found' }

  const email = e.parent1Email || e.contactEmail
  if (!email) return { ok: false, error: 'No parent email on file for this enrolment' }

  const html = buildEnrolmentInvoiceEmail({
    childName: `${e.childFirstName} ${e.childLastName}`,
    intakeYear: e.intakeYear,
    welcomeFeePaid: e.welcomeFeePaid,
    depositPaid: e.depositPaid,
  })

  try {
    await sendEmail(email, `Winton Pre-School — Enrolment Invoice for ${e.childFirstName} ${e.childLastName}`, html)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to send email' }
  }
}

export async function confirmEnrolmentKeyworker(enrolmentId: string, staffId: string | null) {
  await db.update(enrolments).set({ confirmedKeyworkerId: staffId }).where(eq(enrolments.id, enrolmentId))
  revalidatePath('/enrolments')
  revalidatePath('/admin/keyworkers')
}

export async function signEnrolmentPolicy(
  enrolmentId: string,
  policyId: string,
  parentPrintName: string,
  parentSignature: string
) {
  await db.insert(enrolmentPolicySignatures).values({
    enrolmentId,
    policyId,
    parentPrintName,
    parentSignature,
    parentSignedAt: new Date(),
  })
  revalidatePath('/enrolments')
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
    sessions: { day: string; sessionType: string; fundingType: string }[]
    contactName: string
    contactRelationship: string
    contactPhone: string
    contactEmail?: string
    // Extra contacts from the enrolment (Parent 2, Emergency contact 1 & 2) —
    // added alongside the primary contact above, not replacing it.
    additionalContacts?: { name: string; relationship: string; phone: string; email?: string; isAuthorisedCollector: boolean }[]
    // Prescribed Medicine form captured at enrolment (JSON matching the medications table fields)
    medicationFormData?: string
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
    // Parent 1 becomes the profile's Parent / Billing Contact, not a
    // duplicate entry in Emergency Contacts.
    parentName: data.contactName || null,
    parentEmail: data.contactEmail || null,
    parentPhone: data.contactPhone || null,
  }).returning()

  if (data.sessions.length > 0) {
    await db.insert(childSessions).values(
      data.sessions.map(s => ({
        childId: child.id,
        day: s.day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
        sessionType: s.sessionType as 'morning' | 'afternoon' | 'full_day',
        fundingType: s.fundingType,
      }))
    )
  }

  if (data.additionalContacts && data.additionalContacts.length > 0) {
    await db.insert(emergencyContacts).values(
      data.additionalContacts
        .filter(c => c.name.trim())
        .map(c => ({
          childId: child.id,
          name: c.name,
          relationship: c.relationship || 'Emergency contact',
          phone: c.phone,
          email: c.email || null,
          isAuthorisedCollector: c.isAuthorisedCollector,
        }))
    )
  }

  if (data.medicationFormData) {
    const med = JSON.parse(data.medicationFormData) as {
      name: string; dosage: string; frequency: string; formDate?: string
      conditionDiagnosis?: string; conditionSymptoms?: string
      hospitalContactName?: string; hospitalContactPhone?: string
      doctorContactName?: string; doctorContactPhone?: string
      administeredAtHome?: string; durationOfTreatment?: string
      dateDispensed?: string; storage?: string; expiryDate?: string
      specialPrecautions?: string; possibleSideEffects?: string; emergencyProcedures?: string
      parentSignature?: string; parentPrintName?: string
    }
    if (med.name) {
      await db.insert(medications).values({
        childId: child.id,
        name: med.name,
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        formDate: med.formDate || null,
        conditionDiagnosis: med.conditionDiagnosis || null,
        conditionSymptoms: med.conditionSymptoms || null,
        hospitalContactName: med.hospitalContactName || null,
        hospitalContactPhone: med.hospitalContactPhone || null,
        doctorContactName: med.doctorContactName || null,
        doctorContactPhone: med.doctorContactPhone || null,
        administeredAtHome: med.administeredAtHome || null,
        durationOfTreatment: med.durationOfTreatment || null,
        dateDispensed: med.dateDispensed || null,
        storage: med.storage || null,
        expiryDate: med.expiryDate || null,
        specialPrecautions: med.specialPrecautions || null,
        possibleSideEffects: med.possibleSideEffects || null,
        emergencyProcedures: med.emergencyProcedures || null,
        parentSignature: med.parentSignature || null,
        parentPrintName: med.parentPrintName || null,
      })
    }
  }

  await db.update(enrolments).set({ promotedChildId: child.id }).where(eq(enrolments.id, enrolmentId))

  revalidatePath('/enrolments')
  revalidatePath('/children')
  revalidatePath('/admin/keyworkers')

  return child.id
}

// Parent 2 + both emergency contacts from an enrolment row, ready to insert
// as extra emergencyContacts rows alongside the primary contact.
function additionalContactsFromEnrolment(e: typeof enrolments.$inferSelect) {
  const contacts: { name: string; relationship: string; phone: string; email?: string; isAuthorisedCollector: boolean }[] = []
  if (e.parent2Name?.trim()) {
    contacts.push({
      name: e.parent2Name,
      relationship: e.parent2Relationship || 'Parent',
      phone: e.parent2Mobile || e.parent2DaytimePhone || '',
      email: e.parent2Email ?? undefined,
      isAuthorisedCollector: true,
    })
  }
  if (e.ec1Name?.trim()) {
    contacts.push({
      name: e.ec1Name,
      relationship: e.ec1Relationship || 'Emergency contact',
      phone: e.ec1Mobile || e.ec1DaytimePhone || '',
      isAuthorisedCollector: e.ec1CanCollect ?? false,
    })
  }
  if (e.ec2Name?.trim()) {
    contacts.push({
      name: e.ec2Name,
      relationship: e.ec2Relationship || 'Emergency contact',
      phone: e.ec2Mobile || e.ec2DaytimePhone || '',
      isAuthorisedCollector: e.ec2CanCollect ?? false,
    })
  }
  return contacts
}

export async function bulkPromoteEnrolments(intakeYear: number): Promise<{
  promoted: number
  skipped: { name: string; reason: string }[]
}> {
  const todayStr = new Date().toISOString().slice(0, 10)

  const candidates = await db
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.intakeYear, intakeYear), isNull(enrolments.promotedChildId)))

  let promoted = 0
  const skipped: { name: string; reason: string }[] = []

  for (const e of candidates) {
    const name = `${e.childFirstName} ${e.childLastName}`

    if (e.startDate && e.startDate > todayStr) {
      skipped.push({ name, reason: `not due to start until ${e.startDate}` })
      continue
    }
    if (!e.dateOfBirth) {
      skipped.push({ name, reason: 'missing date of birth — promote individually' })
      continue
    }

    const daysSessions = e.daysSessions ? (JSON.parse(e.daysSessions) as Record<string, string>) : {}
    const sessions = Object.entries(daysSessions).map(([day, sessionType]) => ({
      day, sessionType, fundingType: 'paid',
    }))

    await promoteEnrolmentToChild(e.id, e.depositPaid, {
      firstName: e.childFirstName,
      lastName: e.childLastName,
      dateOfBirth: e.dateOfBirth,
      address: e.childAddress ?? undefined,
      keyWorkerId: e.confirmedKeyworkerId ?? undefined,
      hasAllergies: e.hasMedicalConditions ?? false,
      allergies: e.medicalConditionsDetails ?? undefined,
      medicalNotes: e.medicalConditionsDetails ?? undefined,
      collectionPassword: e.collectionPassword ?? undefined,
      photoConsent: false,
      consumableConsent: false,
      needs1to1: false,
      sessions,
      contactName: e.parent1Name || e.parentCarerName,
      contactRelationship: e.parent1Relationship || 'Parent/Carer',
      contactPhone: e.parent1Mobile || e.parent1DaytimePhone || e.contactPhone || '',
      contactEmail: e.parent1Email || e.contactEmail || undefined,
      additionalContacts: additionalContactsFromEnrolment(e),
      medicationFormData: e.takesMedication ? (e.medicationFormData ?? undefined) : undefined,
    })
    promoted++
  }

  revalidatePath('/enrolments')
  revalidatePath('/children')
  revalidatePath('/admin/keyworkers')

  return { promoted, skipped }
}
