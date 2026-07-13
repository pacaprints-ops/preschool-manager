'use server'

import { db } from '@/lib/db'
import { children, enrolments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function confirmKeyworker(
  targetId: string,
  targetType: 'current' | 'new_starter',
  staffId: string,
) {
  if (targetType === 'current') {
    await db.update(children).set({ keyWorkerId: staffId }).where(eq(children.id, targetId))
    revalidatePath(`/children/${targetId}`)
    revalidatePath('/children')
  } else {
    await db.update(enrolments).set({ confirmedKeyworkerId: staffId }).where(eq(enrolments.id, targetId))
    revalidatePath('/enrolments')
  }
  revalidatePath('/admin/keyworkers')
}
