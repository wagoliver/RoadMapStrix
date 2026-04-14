export interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'html'
  x: number
  y: number
  width: number
  height: number
  // text
  content?: string   // Tiptap HTML
  // image
  src?: string       // base64 data URL
  objectFit?: 'cover' | 'contain'
  // html
  htmlContent?: string  // Raw HTML rendered in sandboxed iframe
  isFullBoard?: boolean // Marks this as the sole element of an HTML Board
}
