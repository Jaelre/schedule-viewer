import { PasswordGate } from '../_components/PasswordGate'
import { ScheduleAppWithSuspense } from '../_components/ScheduleApp'

export default function PdfPage() {
  return (
    <PasswordGate>
      <ScheduleAppWithSuspense basePath="/pdf" />
    </PasswordGate>
  )
}
