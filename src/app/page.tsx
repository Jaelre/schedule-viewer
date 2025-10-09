import { cookies } from 'next/headers'
import { PasswordGate } from './_components/PasswordGate'
import { ScheduleAppWithSuspense } from './_components/ScheduleApp'
import { ACCESS_COOKIE } from '@/lib/auth'

export default async function Page() {
  const cookieStore = await cookies()
  const hasAccess = cookieStore.has(ACCESS_COOKIE)

  return (
    <PasswordGate hasAccess={hasAccess}>
      <ScheduleAppWithSuspense />
    </PasswordGate>
  )
}
