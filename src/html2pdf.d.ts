declare module "html2canvas" {
  interface Html2CanvasOptions {
    scale?: number
    useCORS?: boolean
    backgroundColor?: string
  }
  function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>
  export default html2canvas
}

declare module "jspdf" {
  interface JsPDFOptions {
    unit?: string
    format?: string
    orientation?: string
  }
  class jsPDF {
    constructor(options?: JsPDFOptions)
    internal: {
      pageSize: { getWidth(): number; getHeight(): number }
    }
    addImage(
      data: string,
      format: string,
      x: number,
      y: number,
      w: number,
      h: number
    ): void
    addPage(): void
    save(filename: string): void
  }
  export { jsPDF }
}
