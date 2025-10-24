import { ScheduleAppWithSuspense } from '../_components/ScheduleApp'
import { PasswordGate } from '@/app/_components/PasswordGate'
import { PdfExportApp } from './_components/PdfExportApp'

export default function PdfPage() {
  return (
    <PasswordGate>
      <ScheduleAppWithSuspense basePath="/pdf" />
      <PdfExportApp />
    </PasswordGate>
  )
}
