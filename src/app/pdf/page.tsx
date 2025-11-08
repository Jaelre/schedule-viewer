import { PasswordGate } from '@/app/_components/PasswordGate'
import { RuntimeConfigProvider } from '@/lib/config/runtime-config'
import { PdfExportApp } from './_components/PdfExportApp'

export default function PdfPage() {
  return (
    <PasswordGate>
      <RuntimeConfigProvider>
        <PdfExportApp />
      </RuntimeConfigProvider>
    </PasswordGate>
  )
}
