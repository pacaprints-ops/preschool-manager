import { db } from '@/lib/db'
import { accidentForms, children, terms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AccidentLogClient from './AccidentLogClient'

export default async function AccidentLogPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/')

  const [allAccidents, allTerms] = await Promise.all([
    db
      .select({ accident: accidentForms, child: children })
      .from(accidentForms)
      .innerJoin(children, eq(accidentForms.childId, children.id))
      .orderBy(accidentForms.incidentDate),
    db.select().from(terms).orderBy(terms.startDate),
  ])

  const accidentList = allAccidents.map(({ accident, child }) => ({
    id: accident.id,
    childId: child.id,
    childName: `${child.firstName} ${child.lastName}`,
    incidentDate: accident.incidentDate,
    incidentType: accident.incidentType,
    incidentLocation: accident.incidentLocation,
    injury: accident.injury,
  }))

  return <AccidentLogClient accidents={accidentList} terms={allTerms} />
}
