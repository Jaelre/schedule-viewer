import { PasswordGate } from '../_components/PasswordGate'
import { PdfExportApp } from './_components/PdfExportApp'

export default function Page() {
  return (
    <PasswordGate>
      <PdfExportApp />
    </PasswordGate>
  )
}
