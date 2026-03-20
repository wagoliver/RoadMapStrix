export interface CanvasElement {
  id: string
  type: 'text' | 'image'
  x: number
  y: number
  width: number
  height: number
  // text
  content?: string   // Tiptap HTML
  // image
  src?: string       // base64 data URL
  objectFit?: 'cover' | 'contain'
}
