'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Download, Upload, CheckCircle2, AlertCircle, FileJson,
  ChevronRight, Loader2, X, FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BackupFile } from '@/app/api/backup/route'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function fetchBackup(projectId?: string): Promise<BackupFile> {
  const url = projectId ? `/api/backup?projectId=${projectId}` : '/api/backup'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Falha ao gerar backup')
  return res.json()
}

function downloadJson(data: BackupFile, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

interface ProjectOption { id: string; name: string; _count: { activities: number } }

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <h2 className="font-semibold text-sm">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Export section ───────────────────────────────────────────────────────────

function ExportSection({ projects }: { projects: ProjectOption[] }) {
  const [loadingAll, setLoadingAll] = useState(false)
  const [loadingSingle, setLoadingSingle] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [doneAll, setDoneAll]       = useState(false)
  const [doneSingle, setDoneSingle] = useState(false)

  const handleExportAll = async () => {
    setLoadingAll(true)
    setDoneAll(false)
    try {
      const backup = await fetchBackup()
      const date = new Date().toISOString().slice(0, 10)
      downloadJson(backup, `roadmap-backup-${date}.json`)
      setDoneAll(true)
      setTimeout(() => setDoneAll(false), 3000)
    } finally {
      setLoadingAll(false)
    }
  }

  const handleExportSingle = async () => {
    if (!selectedProject) return
    setLoadingSingle(true)
    setDoneSingle(false)
    try {
      const backup = await fetchBackup(selectedProject)
      const proj = projects.find((p) => p.id === selectedProject)
      const date = new Date().toISOString().slice(0, 10)
      const safe = (proj?.name ?? 'projeto').replace(/[^a-z0-9]/gi, '-').toLowerCase()
      downloadJson(backup, `roadmap-${safe}-${date}.json`)
      setDoneSingle(true)
      setTimeout(() => setDoneSingle(false), 3000)
    } finally {
      setLoadingSingle(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Full export */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Backup completo</p>
            <p className="text-xs text-muted-foreground">
              Todos os projetos · {projects.length} projeto{projects.length !== 1 ? 's' : ''} ·
              {' '}{projects.reduce((s, p) => s + p._count.activities, 0)} atividades
            </p>
          </div>
        </div>
        <button
          onClick={handleExportAll}
          disabled={loadingAll}
          className={cn(
            'flex items-center gap-2 h-8 px-4 text-xs font-semibold rounded-lg transition-colors flex-shrink-0',
            doneAll
              ? 'bg-green-500/15 text-green-500 border border-green-500/30'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {loadingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
           doneAll    ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                        <Download className="w-3.5 h-3.5" />}
          {doneAll ? 'Baixado!' : 'Exportar'}
        </button>
      </div>

      {/* Single project export */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-4 h-4 text-cyan-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Exportar projeto específico</p>
            <p className="text-xs text-muted-foreground">Selecione um projeto para baixar individualmente</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1 bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none focus:border-primary/50 transition-colors text-foreground"
          >
            <option value="">Selecione um projeto…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p._count.activities} atividades)
              </option>
            ))}
          </select>
          <button
            onClick={handleExportSingle}
            disabled={!selectedProject || loadingSingle}
            className={cn(
              'flex items-center gap-2 h-8 px-4 text-xs font-semibold rounded-lg transition-colors flex-shrink-0',
              doneSingle
                ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                : selectedProject
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {loadingSingle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             doneSingle    ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                             <Download className="w-3.5 h-3.5" />}
            {doneSingle ? 'Baixado!' : 'Exportar'}
          </button>
        </div>
      </div>

      {/* Info */}
      <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
        O arquivo <code className="bg-muted px-1 py-0.5 rounded text-[10px]">.json</code> inclui
        projetos, atividades, tags, dependências e grupos do Storyboard (incluindo posições no canvas e imagens).
        Credenciais de usuário não são incluídas.
      </p>
    </div>
  )
}

// ─── Import section ───────────────────────────────────────────────────────────

interface ImportPreview {
  valid: boolean
  file: BackupFile | null
  error?: string
}

function ImportSection() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]       = useState(false)
  const [preview, setPreview]         = useState<ImportPreview | null>(null)
  const [importing, setImporting]     = useState(false)
  const [result, setResult]           = useState<{ name: string; activities: number; groups: number }[] | null>(null)
  const router = useRouter()

  const parseFile = useCallback((file: File) => {
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data: BackupFile = JSON.parse(e.target?.result as string)
        if (data.version !== '1.0' || !Array.isArray(data.projects)) {
          setPreview({ valid: false, file: null, error: 'Arquivo inválido ou versão não suportada.' })
        } else {
          setPreview({ valid: true, file: data })
        }
      } catch {
        setPreview({ valid: false, file: null, error: 'Não foi possível ler o arquivo. Verifique se é um JSON válido.' })
      }
    }
    reader.readAsText(file)
  }, [])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/json' || file?.name.endsWith('.json')) {
      parseFile(file)
    } else {
      setPreview({ valid: false, file: null, error: 'Selecione um arquivo .json' })
    }
  }, [parseFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const handleImport = async () => {
    if (!preview?.file) return
    setImporting(true)
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview.file),
      })
      if (!res.ok) throw new Error('Falha na importação')
      const data = await res.json()
      setResult(data.imported)
      setPreview(null)
    } catch {
      setPreview({ valid: false, file: null, error: 'Erro durante a importação. Tente novamente.' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Success result */}
      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-500">Importação concluída!</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {result.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <ChevronRight className="w-3 h-3 flex-shrink-0 text-green-500" />
                <span className="font-medium text-foreground">{r.name}</span>
                <span>·</span>
                <span>{r.activities} atividades</span>
                {r.groups > 0 && <><span>·</span><span>{r.groups} grupos</span></>}
              </div>
            ))}
          </div>
          <button
            onClick={() => { setResult(null); router.push('/projects') }}
            className="self-start flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mt-1"
          >
            Ver projetos importados <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-accent/30'
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
            dragging ? 'bg-primary/15' : 'bg-muted'
          )}>
            <Upload className={cn('w-5 h-5', dragging ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Arraste o arquivo aqui</p>
            <p className="text-xs text-muted-foreground mt-0.5">ou clique para selecionar · <span className="font-mono">.json</span></p>
          </div>
        </div>
      )}

      {/* Error */}
      {preview && !preview.valid && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{preview.error}</p>
          <button onClick={() => setPreview(null)} className="ml-auto text-destructive/60 hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Preview */}
      {preview?.valid && preview.file && (
        <div className="rounded-xl border border-border bg-background/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">Preview da importação</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground">
                Exportado em {new Date(preview.file.exportedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
              <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {preview.file.projects.map((p, i) => {
              const totalTags = p.activities.reduce((s, a) => s + (a.tags?.length ?? 0), 0)
              return (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-[11px] text-muted-foreground">{p.activities.length} atividades</span>
                      {p.dependencies.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">{p.dependencies.length} dependências</span>
                      )}
                      {p.featureGroups.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">{p.featureGroups.length} grupos Storyboard</span>
                      )}
                      {totalTags > 0 && (
                        <span className="text-[11px] text-muted-foreground">{totalTags} tags</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-border bg-card/30 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              Projetos importados terão o sufixo <span className="font-semibold text-foreground">(Importado)</span> no nome e não afetarão dados existentes.
            </p>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 h-8 px-4 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {importing ? 'Importando…' : `Importar ${preview.file.projects.length} projeto${preview.file.projects.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
        A importação <strong className="font-semibold text-muted-foreground">nunca apaga</strong> dados existentes.
        Cada projeto do arquivo será criado como um projeto novo e independente.
      </p>
    </div>
  )
}

// ─── Main settings view ───────────────────────────────────────────────────────

export function SettingsView({ projects }: { projects: ProjectOption[] }) {
  const { data: session } = useSession()
  const userName  = session?.user?.name ?? session?.user?.email ?? 'Usuário'
  const userEmail = session?.user?.email ?? ''
  const initial   = userName[0].toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seus dados e preferências</p>
      </div>

      {/* Account card */}
      <div className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-base font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
            {projects.length} projeto{projects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Export */}
      <Section
        title="Exportar backup"
        description="Baixe todos os seus dados em um arquivo JSON para guardar ou migrar."
      >
        <ExportSection projects={projects} />
      </Section>

      {/* Import */}
      <Section
        title="Importar backup"
        description="Restaure projetos a partir de um arquivo de backup gerado por este sistema."
      >
        <ImportSection />
      </Section>
    </div>
  )
}
