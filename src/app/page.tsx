import { PasswordGate } from './_components/PasswordGate'
import { ScheduleAppWithSuspense } from './_components/ScheduleApp'

export default function Page() {
  return (
    <PasswordGate>
      <ScheduleAppWithSuspense />
    </PasswordGate>
  )
}
