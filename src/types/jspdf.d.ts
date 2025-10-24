declare module 'jspdf' {
  interface JsPDFConstructor {
    new (options?: any): jsPDF
  }

  export class jsPDF {
    constructor(options?: any)
    text(text: string, x: number, y: number, options?: any): void
    setFontSize(size: number): void
    save(filename: string, options?: any): void
  }

  const ctor: JsPDFConstructor
  export default ctor
}

declare module 'jspdf-autotable' {
  import type { jsPDF } from 'jspdf'

  type AutoTableOptions = Record<string, unknown>

  const autoTable: (doc: jsPDF, options: AutoTableOptions) => jsPDF

  export default autoTable
}
