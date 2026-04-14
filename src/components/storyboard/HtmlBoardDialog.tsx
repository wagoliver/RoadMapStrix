'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, Code, Eye } from 'lucide-react'
import { toast } from 'sonner'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

interface HtmlBoardDialogProps {
  open: boolean
  initialHtml?: string
  onSave: (html: string) => void
  onClose: () => void
}

export function HtmlBoardDialog({ open, initialHtml, onSave, onClose }: HtmlBoardDialogProps) {
  const [tab, setTab] = useState<'paste' | 'upload'>('paste')
  const [html, setHtml] = useState(initialHtml ?? '')
  const [showPreview, setShowPreview] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      toast.error('Arquivo muito grande (max 5MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setHtml(reader.result as string)
      setTab('paste')
      toast.success('Arquivo carregado')
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleSave = () => {
    const trimmed = html.trim()
    if (!trimmed) {
      toast.error('Cole ou carregue um HTML primeiro')
      return
    }
    if (new Blob([trimmed]).size > MAX_SIZE) {
      toast.error('Conteudo muito grande (max 5MB)')
      return
    }
    onSave(trimmed)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex flex-col w-[90vw] max-w-3xl max-h-[85vh] rounded-2xl border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <Code className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold flex-1">{initialHtml ? 'Editar HTML Board' : 'Novo HTML Board'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4">
          <button
            onClick={() => setTab('paste')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'paste' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Code className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Colar HTML
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <Upload className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Upload .html
          </button>
          <input ref={fileRef} type="file" accept=".html,.htm" onChange={handleFile} className="hidden" />
          <div className="flex-1" />
          <button
            onClick={() => setShowPreview((p) => !p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showPreview ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Preview
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0 px-5 py-4 gap-4">
          {/* Editor */}
          <div className={`flex flex-col min-h-0 ${showPreview ? 'w-1/2' : 'w-full'}`}>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Cole o codigo HTML aqui..."
              spellCheck={false}
              className="flex-1 min-h-[200px] p-4 rounded-xl border bg-muted/30 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 flex flex-col min-h-0">
              <div className="flex-1 rounded-xl border overflow-hidden bg-white">
                <iframe
                  srcDoc={html}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border-0"
                  title="Preview HTML"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t">
          <span className="text-[10px] text-muted-foreground">
            {html.length > 0 ? `${(new Blob([html]).size / 1024).toFixed(1)} KB` : 'Nenhum conteudo'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-8 px-4 text-xs font-medium rounded-lg border hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="h-8 px-4 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {initialHtml ? 'Salvar' : 'Criar Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
