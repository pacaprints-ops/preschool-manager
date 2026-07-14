import { db } from '@/lib/db'
import { enrolments, enrolmentPolicySignatures, policies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditEnrolmentForm from './EditEnrolmentForm'

export default async function EditEnrolmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [enrolment] = await db.select().from(enrolments).where(eq(enrolments.id, id)).limit(1)
  if (!enrolment) notFound()

  const signedPolicies = await db.select({
    policyName: policies.name,
    parentPrintName: enrolmentPolicySignatures.parentPrintName,
    parentSignedAt: enrolmentPolicySignatures.parentSignedAt,
  }).from(enrolmentPolicySignatures)
    .innerJoin(policies, eq(enrolmentPolicySignatures.policyId, policies.id))
    .where(eq(enrolmentPolicySignatures.enrolmentId, id))

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/enrolments" className="text-xs text-gray-400 hover:text-gray-600 mb-2 block">← Back to Enrolments</Link>
        <h1 className="text-xl font-bold text-gray-800">
          Edit enrolment — {enrolment.childFirstName} {enrolment.childLastName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">September {enrolment.intakeYear} intake</p>
        {enrolment.promotedChildId && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            This child&apos;s profile has already been created. Changes here update the enrolment record only — edit the{' '}
            <Link href={`/children/${enrolment.promotedChildId}`} className="underline font-medium">child profile</Link> directly for anything that should change there too.
          </div>
        )}
      </div>

      <EditEnrolmentForm enrolment={enrolment} signedPolicies={signedPolicies} />
    </div>
  )
}
