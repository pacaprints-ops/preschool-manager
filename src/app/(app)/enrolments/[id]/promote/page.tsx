import { db } from '@/lib/db'
import { enrolments, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import PromoteForm from './PromoteForm'

export default async function PromotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [enrolment, allStaff] = await Promise.all([
    db.select().from(enrolments).where(eq(enrolments.id, id)).then(r => r[0] ?? null),
    db.select({ id: users.id, name: users.name }).from(users).orderBy(users.name),
  ])

  if (!enrolment) notFound()

  // Already promoted — redirect to the child profile
  if (enrolment.promotedChildId) {
    redirect(`/children/${enrolment.promotedChildId}`)
  }

  const daysSessions = enrolment.daysSessions
    ? (JSON.parse(enrolment.daysSessions) as Record<string, string>)
    : {}

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/enrolments" className="text-xs text-gray-400 hover:text-gray-600 mb-2 block">← Back to Enrolments</a>
        <h1 className="text-xl font-bold text-gray-800">
          Create profile — {enrolment.childFirstName} {enrolment.childLastName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Details from the enrolment are pre-filled. Complete any missing information below.
        </p>
      </div>

      <PromoteForm
        enrolmentId={id}
        defaultValues={{
          firstName: enrolment.childFirstName,
          lastName: enrolment.childLastName,
          dateOfBirth: enrolment.dateOfBirth ?? '',
          keyWorkerId: enrolment.confirmedKeyworkerId ?? '',
          contactName: enrolment.parentCarerName,
          contactPhone: enrolment.contactPhone ?? '',
          contactEmail: enrolment.contactEmail ?? '',
          daysSessions,
          depositPaid: enrolment.depositPaid ?? false,
        }}
        allStaff={allStaff}
      />
    </div>
  )
}
