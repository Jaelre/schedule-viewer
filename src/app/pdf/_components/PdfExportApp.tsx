'use client'

export function PdfExportApp() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Esporta calendario in PDF</h1>
        <p className="text-muted-foreground">
          Questa pagina ospiterà gli strumenti per generare un PDF del calendario dei turni.
          Utilizza lo stesso token di accesso dell&apos;app principale per mantenere i dati protetti.
        </p>
      </div>
    </div>
  )
}
