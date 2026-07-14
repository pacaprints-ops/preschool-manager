'use client'

import { useState } from 'react'
import EnrolmentPrintView, { type EnrolmentRecord, type SignedPolicy } from './EnrolmentPrintView'

export default function DocumentsSection({
  childName,
  enrolment,
  policies,
}: {
  childName: string
  enrolment: EnrolmentRecord | null
  policies: SignedPolicy[]
}) {
  const [sectionOpen, setSectionOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <button onClick={() => setSectionOpen(o => !o)} className="w-full flex items-center justify-between text-left">
        <h2 className="text-sm font-semibold text-gray-700">Documents</h2>
        <span className={`text-gray-400 transition-transform shrink-0 ml-2 ${sectionOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {sectionOpen && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          {!enrolment ? (
            <p className="text-sm text-gray-400">No enrolment record on file — this profile wasn&apos;t created via the enrolments flow.</p>
          ) : (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Enrolment record</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  September {enrolment.intakeYear} intake
                  {policies.length > 0 && ` · ${policies.length} polic${policies.length !== 1 ? 'ies' : 'y'} signed`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrintOpen(true)}
                className="text-xs text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors shrink-0"
              >
                🖨 View / Print
              </button>
            </div>
          )}
        </div>
      )}

      {printOpen && enrolment && (
        <EnrolmentPrintView
          enrolment={enrolment}
          policies={policies}
          childName={childName}
          onClose={() => setPrintOpen(false)}
        />
      )}
    </div>
  )
}
