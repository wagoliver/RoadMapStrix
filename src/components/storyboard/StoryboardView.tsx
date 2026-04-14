'use client'

import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { Activity } from '@/types'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Plus, Trash2, X, Search, Check, Type, Image, Lock, Unlock, Code, PanelTop, PanelTopOpen, Maximize2, Minimize2, Pencil, ChevronDown, FileCode } from 'lucide-react'
import { AREA_COLORS } from '@/components/planning/EditActivityDialog'
import { cn } from '@/lib/utils'
import { ElementWrapper, TextElementComp, ImageElementComp, HtmlElementComp } from './CanvasElements'
import type { CanvasElement } from './canvasTypes'
import { HtmlBoardDialog } from './HtmlBoardDialog'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LinkedActivity {
  id: string
  activity: {
    id: string
    name: string
    jiraRef: string | null
    quarter: string | null
    planStatus: string
    area: string | null
    sizeLabel: string | null
    durationSprints: number
    color: string
  }
}

interface FeatureGroup {
  id: string
  projectId: string
  title: string
  color: string
  x: number
  y: number
  width: number
  height: number
  elements: CanvasElement[]
  locked: boolean
  headerHidden: boolean
  activities: LinkedActivity[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_W = 320
const MIN_H = 240
const CANVAS_W = 4000
const CANVAS_H = 3000
const QUARTER_KEYS = ['Q1', 'Q2', 'Q3', 'Q4']

const GROUP_COLORS = [
  '#6366f1', '#06b6d4', '#f97316', '#a855f7',
  '#ec4899', '#22c55e', '#eab308', '#3b82f6',
]

const STATUS_COLOR: Record<string, string> = {
  'Backlog': '#8b8fa3', 'Planejado': '#06b6d4', 'Em Andamento': '#818cf8',
  'Em Review': '#eab308', 'Em Produção': '#16a34a', 'Concluído': '#4ade80',
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function isHtmlBoard(group: FeatureGroup): boolean {
  return group.elements.length === 1 && group.elements[0].type === 'html' && group.elements[0].isFullBoard === true
}

// ─── Activity Picker ──────────────────────────────────────────────────────────

function ActivityPicker({
  group,
  onClose,
  onToggle,
}: {
  group: FeatureGroup
  onClose: () => void
  onToggle: (activityId: string, linked: boolean) => Promise<void>
}) {
  const { activities } = useRoadmapStore()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const eligible = activities.filter(
    (a) => a.quarter && QUARTER_KEYS.includes(a.quarter)
  )

  const filtered = eligible.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      (a.jiraRef ?? '').toLowerCase().includes(q) ||
      (a.quarter ?? '').toLowerCase().includes(q)
    )
  })

  const linkedIds = new Set(group.activities.map((la) => la.activity.id))

  const handleToggle = async (a: Activity) => {
    setLoading(a.id)
    await onToggle(a.id, linkedIds.has(a.id))
    setLoading(null)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
      <div className="bg-popover border border-border rounded-xl shadow-2xl w-80 flex flex-col overflow-hidden max-h-[70%]">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
          <span className="text-xs font-semibold">Vincular cards</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-3 py-2 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            <input
              autoFocus
              className="w-full bg-background border border-border rounded-lg text-xs pl-7 pr-3 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/60"
              placeholder="Buscar por nome ou Jira ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 py-1">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum card encontrado</p>
          )}
          {filtered.map((a) => {
            const isLinked = linkedIds.has(a.id)
            const isLoading = loading === a.id
            const areaColor = AREA_COLORS[a.area ?? ''] ?? '#6366f1'
            return (
              <button
                key={a.id}
                onClick={() => handleToggle(a)}
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent',
                  isLinked && 'bg-primary/5'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                  isLinked ? 'bg-primary border-primary' : 'border-border'
                )}>
                  {isLinked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {a.jiraRef && (
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/70 bg-muted px-1 py-0.5 rounded flex-shrink-0">
                        {a.jiraRef}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: areaColor + '18', color: areaColor }}
                    >
                      {a.quarter}
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-snug line-clamp-1">{a.name}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-3 py-2 border-t border-border flex-shrink-0">
          <p className="text-[10px] text-muted-foreground">{linkedIds.size} card(s) vinculado(s)</p>
        </div>
      </div>
    </div>
  )
}

// ─── Group Tile ───────────────────────────────────────────────────────────────

function GroupTile({
  group,
  projectId,
  onUpdate,
  onDelete,
  onActivityToggle,
  onFullscreen,
  onEditHtml,
}: {
  group: FeatureGroup
  projectId: string
  onUpdate: (id: string, patch: Partial<FeatureGroup>) => void
  onDelete: (id: string) => void
  onActivityToggle: (groupId: string, activityId: string, linked: boolean) => Promise<void>
  onFullscreen: (id: string) => void
  onEditHtml: (id: string) => void
}) {
  const htmlBoard = isHtmlBoard(group)
  const [showPicker, setShowPicker] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(group.title)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const groupDragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 })
  const resizeRef    = useRef({ active: false, startX: 0, startY: 0, origW: 0, origH: 0 })
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback((patch: Partial<FeatureGroup>) => {
    onUpdate(group.id, patch)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.featureGroups.update(projectId, group.id, patch).catch(() => toast.error('Erro ao salvar'))
    }, 600)
  }, [group.id, projectId, onUpdate])

  // ── Group drag to move ──
  const onGroupDragStart = (e: React.MouseEvent) => {
    if (group.locked) return
    if ((e.target as Element).closest('[data-no-drag]')) return
    e.preventDefault()
    groupDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: group.x, origY: group.y }
    const onMove = (ev: MouseEvent) => {
      if (!groupDragRef.current.active) return
      onUpdate(group.id, {
        x: Math.max(0, groupDragRef.current.origX + ev.clientX - groupDragRef.current.startX),
        y: Math.max(0, groupDragRef.current.origY + ev.clientY - groupDragRef.current.startY),
      })
    }
    const onUp = (ev: MouseEvent) => {
      if (!groupDragRef.current.active) return
      groupDragRef.current.active = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const dx = ev.clientX - groupDragRef.current.startX
      const dy = ev.clientY - groupDragRef.current.startY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        api.featureGroups.update(projectId, group.id, {
          x: Math.max(0, groupDragRef.current.origX + dx),
          y: Math.max(0, groupDragRef.current.origY + dy),
        }).catch(() => {})
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Group resize ──
  const onGroupResizeStart = (e: React.MouseEvent) => {
    if (group.locked) return
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { active: true, startX: e.clientX, startY: e.clientY, origW: group.width, origH: group.height }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current.active) return
      onUpdate(group.id, {
        width:  Math.max(MIN_W, resizeRef.current.origW + ev.clientX - resizeRef.current.startX),
        height: Math.max(MIN_H, resizeRef.current.origH + ev.clientY - resizeRef.current.startY),
      })
    }
    const onUp = (ev: MouseEvent) => {
      if (!resizeRef.current.active) return
      resizeRef.current.active = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      api.featureGroups.update(projectId, group.id, {
        width:  Math.max(MIN_W, resizeRef.current.origW + ev.clientX - resizeRef.current.startX),
        height: Math.max(MIN_H, resizeRef.current.origH + ev.clientY - resizeRef.current.startY),
      }).catch(() => {})
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Element helpers ──
  const updateElement = useCallback((elId: string, patch: Partial<CanvasElement>) => {
    const next = group.elements.map((el) => el.id === elId ? { ...el, ...patch } : el)
    scheduleSave({ elements: next })
  }, [group.elements, scheduleSave])

  const deleteElement = useCallback((elId: string) => {
    const next = group.elements.filter((el) => el.id !== elId)
    scheduleSave({ elements: next })
    setSelectedElementId(null)
  }, [group.elements, scheduleSave])

  const addTextElement = () => {
    const offset = group.elements.length * 20
    const el: CanvasElement = {
      id: uid(), type: 'text',
      x: 20 + offset, y: 20 + offset,
      width: 220, height: 100,
      content: '<p>Texto</p>',
    }
    const next = [...group.elements, el]
    scheduleSave({ elements: next })
    setSelectedElementId(el.id)
  }

  const addImageElement = (src: string) => {
    const offset = group.elements.length * 20
    const el: CanvasElement = {
      id: uid(), type: 'image',
      x: 20 + offset, y: 20 + offset,
      width: 200, height: 150,
      src, objectFit: 'cover',
    }
    const next = [...group.elements, el]
    scheduleSave({ elements: next })
    setSelectedElementId(el.id)
  }

  const addHtmlElement = () => {
    const offset = group.elements.length * 20
    const el: CanvasElement = {
      id: uid(), type: 'html',
      x: 20 + offset, y: 20 + offset,
      width: 300, height: 200,
      htmlContent: '<h1>Hello</h1>',
    }
    const next = [...group.elements, el]
    scheduleSave({ elements: next })
    setSelectedElementId(el.id)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      if (src) addImageElement(src)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalSprints = group.activities.reduce((s, la) => s + la.activity.durationSprints, 0)
  const quarters     = Array.from(new Set(group.activities.map((la) => la.activity.quarter).filter(Boolean))).sort()

  return (
    <div
      className="absolute select-none"
      style={{ left: group.x, top: group.y, width: group.width, height: group.height }}
    >
      <div
        className="w-full h-full rounded-2xl border border-border bg-card/95 backdrop-blur-sm shadow-xl flex flex-col overflow-hidden"
        style={{ borderTop: `3px solid ${group.color}` }}
      >
        {/* ── Header ── */}
        {group.headerHidden ? (
          <div
            className={cn('group/header flex items-center gap-1 px-2 py-0.5 flex-shrink-0', group.locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing')}
            style={{ background: group.color + '08' }}
            onMouseDown={onGroupDragStart}
          >
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-40" style={{ background: group.color }} />
            <div className="flex-1" />
            <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity" data-no-drag>
              {!group.locked && !htmlBoard && (
                <>
                  <button onClick={addTextElement} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Adicionar texto"><Type className="w-3 h-3" /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Adicionar imagem"><Image className="w-3 h-3" /></button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <button onClick={addHtmlElement} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Adicionar HTML"><Code className="w-3 h-3" /></button>
                </>
              )}
              {htmlBoard && !group.locked && (
                <button onClick={() => onEditHtml(group.id)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Editar HTML"><Pencil className="w-3 h-3" /></button>
              )}
              {htmlBoard && (
                <button onClick={() => onFullscreen(group.id)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Tela cheia"><Maximize2 className="w-3 h-3" /></button>
              )}
              <button
                onClick={() => scheduleSave({ headerHidden: false })}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Mostrar cabeçalho"
              >
                <PanelTopOpen className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn('flex items-center gap-2 px-3 py-2 flex-shrink-0', group.locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing')}
            style={{ background: group.color + '12' }}
            onMouseDown={onGroupDragStart}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color }} />

            {/* Title */}
            <div className="flex-1 min-w-0" data-no-drag>
              {editingTitle ? (
                <input
                  autoFocus
                  className="w-full bg-transparent text-sm font-bold outline-none border-b border-primary/40 pb-0.5"
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onBlur={() => { setEditingTitle(false); scheduleSave({ title: titleVal || 'Novo Grupo' }) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setEditingTitle(false); scheduleSave({ title: titleVal || 'Novo Grupo' }) } }}
                />
              ) : (
                <h3
                  className="text-sm font-bold truncate cursor-text hover:text-primary transition-colors"
                  onDoubleClick={() => setEditingTitle(true)}
                  title="Duplo clique para editar"
                >
                  {group.title}
                </h3>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0" data-no-drag>
              {!group.locked && !htmlBoard && (
                <>
                  {/* Add text */}
                  <button
                    onClick={addTextElement}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Adicionar texto"
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                  {/* Add image */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Adicionar imagem"
                  >
                    <Image className="w-3.5 h-3.5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {/* Add HTML */}
                  <button
                    onClick={addHtmlElement}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Adicionar HTML"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  {/* Link activities */}
                  <button
                    onClick={() => setShowPicker(true)}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Vincular cards"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* HTML Board actions */}
              {htmlBoard && !group.locked && (
                <button
                  onClick={() => onEditHtml(group.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Editar HTML"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {htmlBoard && (
                <button
                  onClick={() => onFullscreen(group.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Tela cheia"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Hide header */}
              <button
                onClick={() => scheduleSave({ headerHidden: true })}
                className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Ocultar cabeçalho"
              >
                <PanelTop className="w-3.5 h-3.5" />
              </button>

              {/* Lock / unlock */}
              <button
                onClick={() => scheduleSave({ locked: !group.locked })}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center transition-colors',
                  group.locked
                    ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                    : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10'
                )}
                title={group.locked ? 'Desbloquear grupo' : 'Travar grupo'}
              >
                {group.locked
                  ? <Lock className="w-3.5 h-3.5" />
                  : <Unlock className="w-3.5 h-3.5" />
                }
              </button>

              {/* Delete group — hidden when locked */}
              {!group.locked && (
                <button
                  onClick={() => onDelete(group.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Excluir grupo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Free canvas area ── */}
        {htmlBoard ? (
          <div className="flex-1 relative overflow-hidden min-h-0">
            <iframe
              srcDoc={group.elements[0].htmlContent ?? ''}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
              title={group.title}
            />
          </div>
        ) : (
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden min-h-0"
          style={{ background: 'transparent' }}
          onClick={() => setSelectedElementId(null)}
        >
          {group.elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none opacity-25">
              <div className="flex gap-2">
                <Type className="w-4 h-4" />
                <Image className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-muted-foreground">Use T e 📷 para adicionar conteúdo</p>
            </div>
          )}

          {group.elements.map((el) => (
            <ElementWrapper
              key={el.id}
              element={el}
              selected={selectedElementId === el.id}
              locked={group.locked}
              canvasRef={canvasRef}
              onSelect={() => setSelectedElementId(el.id)}
              onDeselect={() => setSelectedElementId(null)}
              onUpdate={(patch) => updateElement(el.id, patch)}
              onDelete={() => deleteElement(el.id)}
            >
              {el.type === 'text' ? (
                <TextElementComp
                  element={el}
                  selected={selectedElementId === el.id}
                  onUpdate={(patch) => updateElement(el.id, patch)}
                />
              ) : el.type === 'html' ? (
                <HtmlElementComp
                  element={el}
                  selected={selectedElementId === el.id}
                  onUpdate={(patch) => updateElement(el.id, patch)}
                />
              ) : (
                <ImageElementComp
                  element={el}
                  selected={selectedElementId === el.id}
                  onUpdate={(patch) => updateElement(el.id, patch)}
                />
              )}
            </ElementWrapper>
          ))}
        </div>
        )}

        {/* ── Activities footer ── */}
        {!htmlBoard && group.activities.length > 0 && (
          <>
            <div className="mx-3 border-t border-dashed border-border/60 flex-shrink-0" />
            <div className="px-3 py-2 flex flex-wrap gap-1.5 content-start flex-shrink-0 max-h-28 overflow-y-auto" data-no-drag>
              {group.activities.map((la) => {
                const a = la.activity
                const statusColor = STATUS_COLOR[a.planStatus] ?? '#8b8fa3'
                const areaColor   = AREA_COLORS[a.area ?? ''] ?? '#6366f1'
                return (
                  <div
                    key={la.id}
                    className="group/chip flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
                    {a.jiraRef && (
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/60">{a.jiraRef}</span>
                    )}
                    <span
                      className="text-[10px] font-semibold px-1 rounded"
                      style={{ background: areaColor + '18', color: areaColor }}
                    >
                      {a.quarter}
                    </span>
                    <span className="text-[10px] max-w-[120px] truncate">{a.name}</span>
                    <button
                      onClick={() => onActivityToggle(group.id, a.id, true)}
                      className="ml-0.5 opacity-0 group-hover/chip:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="px-3 pb-2 flex items-center gap-2 flex-shrink-0 flex-wrap" data-no-drag>
              {quarters.map((q) => (
                <span key={q} className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{q}</span>
              ))}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {group.activities.length} cards · {totalSprints} sprints
              </span>
            </div>
          </>
        )}

        {/* ── Group resize handle ── */}
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end pr-1 pb-1 opacity-30 hover:opacity-70 transition-opacity"
          onMouseDown={onGroupResizeStart}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-muted-foreground">
            <path d="M8 0L8 8L0 8Z" />
          </svg>
        </div>
      </div>

      {/* Activity picker overlay */}
      {showPicker && (
        <ActivityPicker
          group={group}
          onClose={() => setShowPicker(false)}
          onToggle={async (activityId, linked) => {
            await onActivityToggle(group.id, activityId, linked)
          }}
        />
      )}
    </div>
  )
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function StoryboardView({ projectId }: { projectId: string }) {
  const [groups, setGroups] = useState<FeatureGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false)
  const [editingHtmlGroupId, setEditingHtmlGroupId] = useState<string | null>(null)
  const [fullscreenGroupId, setFullscreenGroupId] = useState<string | null>(null)
  const colorIdx = useRef(0)

  useEffect(() => {
    api.featureGroups.list(projectId)
      .then((data) => setGroups(data.map((g) => ({
        ...g,
        elements: (g.elements as CanvasElement[] | null) ?? [],
        locked: g.locked ?? false,
        headerHidden: g.headerHidden ?? false,
      }))))
      .catch(() => toast.error('Erro ao carregar storyboard'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleCreate = async () => {
    const color  = GROUP_COLORS[colorIdx.current % GROUP_COLORS.length]
    colorIdx.current++
    const offset = groups.length * 30
    try {
      const g = await api.featureGroups.create(projectId, { color, x: 40 + offset, y: 40 + offset })
      setGroups((prev) => [...prev, { ...g, elements: [], locked: false, headerHidden: false }])
    } catch {
      toast.error('Erro ao criar grupo')
    }
  }

  const handleCreateHtmlBoard = async (htmlContent: string) => {
    const color = GROUP_COLORS[colorIdx.current % GROUP_COLORS.length]
    colorIdx.current++
    const offset = groups.length * 30
    const fullBoardEl: CanvasElement = {
      id: uid(), type: 'html',
      x: 0, y: 0, width: 0, height: 0,
      htmlContent, isFullBoard: true,
    }
    try {
      const g = await api.featureGroups.create(projectId, {
        color, x: 40 + offset, y: 40 + offset,
        width: 600, height: 450,
        title: 'HTML Board',
        elements: [fullBoardEl] as unknown as undefined,
      })
      setGroups((prev) => [...prev, { ...g, elements: [fullBoardEl], locked: false, headerHidden: false }])
      setHtmlDialogOpen(false)
    } catch {
      toast.error('Erro ao criar HTML Board')
    }
  }

  const handleEditHtml = useCallback((groupId: string) => {
    setEditingHtmlGroupId(groupId)
    setHtmlDialogOpen(true)
  }, [])

  const handleSaveEditedHtml = useCallback((htmlContent: string) => {
    if (!editingHtmlGroupId) return
    const group = groups.find((g) => g.id === editingHtmlGroupId)
    if (!group || !isHtmlBoard(group)) return
    const updatedEl: CanvasElement = { ...group.elements[0], htmlContent }
    const patch = { elements: [updatedEl] }
    setGroups((prev) => prev.map((g) => g.id === editingHtmlGroupId ? { ...g, ...patch } : g))
    api.featureGroups.update(projectId, editingHtmlGroupId, patch).catch(() => toast.error('Erro ao salvar'))
    setHtmlDialogOpen(false)
    setEditingHtmlGroupId(null)
  }, [editingHtmlGroupId, groups, projectId])

  const handleFullscreen = useCallback((groupId: string) => {
    setFullscreenGroupId(groupId)
  }, [])

  const handleUpdate = useCallback((id: string, patch: Partial<FeatureGroup>) => {
    setGroups((prev) => prev.map((g) => g.id === id ? { ...g, ...patch } : g))
  }, [])

  const handleDelete = async (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
    await api.featureGroups.delete(projectId, id).catch(() => toast.error('Erro ao excluir'))
  }

  const handleActivityToggle = useCallback(async (groupId: string, activityId: string, linked: boolean) => {
    if (linked) {
      await api.featureGroups.removeActivity(projectId, groupId, activityId)
      setGroups((prev) => prev.map((g) =>
        g.id === groupId
          ? { ...g, activities: g.activities.filter((la) => la.activity.id !== activityId) }
          : g
      ))
    } else {
      await api.featureGroups.addActivity(projectId, groupId, activityId)
      const updated = await api.featureGroups.list(projectId)
      setGroups(updated.map((g) => ({ ...g, elements: (g.elements as CanvasElement[] | null) ?? [], locked: g.locked ?? false })))
    }
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="h-12 border-b bg-background flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <h1 className="font-semibold text-sm">Storyboard</h1>
        <div className="w-px h-5 bg-border" />
        <span className="text-xs text-muted-foreground">{groups.length} grupo(s)</span>
        <div className="flex-1" />
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 h-7 px-3 text-xs bg-primary text-primary-foreground rounded-l-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Grupo
            </button>
            <button
              onClick={() => setShowCreateMenu((p) => !p)}
              className="flex items-center h-7 px-1.5 text-xs bg-primary text-primary-foreground rounded-r-lg hover:bg-primary/90 transition-colors border-l border-primary-foreground/20"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          {showCreateMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowCreateMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-30 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[160px]">
                <button
                  onClick={() => { setShowCreateMenu(false); handleCreate() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  Novo Grupo
                </button>
                <button
                  onClick={() => { setShowCreateMenu(false); setEditingHtmlGroupId(null); setHtmlDialogOpen(true) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                  HTML Board
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <div
          className="relative"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {groups.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <div className="text-4xl opacity-20">✦</div>
              <p className="text-sm text-muted-foreground/50 font-medium">Canvas vazio</p>
              <p className="text-xs text-muted-foreground/40">Clique em &quot;Novo Grupo&quot; para começar</p>
            </div>
          )}

          {groups.map((group) => (
            <GroupTile
              key={group.id}
              group={group}
              projectId={projectId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onActivityToggle={handleActivityToggle}
              onFullscreen={handleFullscreen}
              onEditHtml={handleEditHtml}
            />
          ))}
        </div>
      </div>

      {/* HTML Board Dialog */}
      <HtmlBoardDialog
        open={htmlDialogOpen}
        initialHtml={editingHtmlGroupId ? groups.find((g) => g.id === editingHtmlGroupId)?.elements[0]?.htmlContent : undefined}
        onSave={editingHtmlGroupId ? handleSaveEditedHtml : handleCreateHtmlBoard}
        onClose={() => { setHtmlDialogOpen(false); setEditingHtmlGroupId(null) }}
      />

      {/* Fullscreen overlay */}
      {fullscreenGroupId && (() => {
        const fsGroup = groups.find((g) => g.id === fullscreenGroupId)
        if (!fsGroup || !isHtmlBoard(fsGroup)) return null
        return (
          <div
            className="fixed inset-0 z-[9999] bg-background flex flex-col"
            onKeyDown={(e) => { if (e.key === 'Escape') setFullscreenGroupId(null) }}
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            <iframe
              srcDoc={fsGroup.elements[0].htmlContent ?? ''}
              sandbox="allow-scripts allow-same-origin"
              className="flex-1 w-full border-0"
              title={fsGroup.title}
            />
            <button
              onClick={() => setFullscreenGroupId(null)}
              className="fixed top-4 right-4 z-[10000] flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-background/80 backdrop-blur border border-border rounded-lg shadow-lg hover:bg-background transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        )
      })()}
    </div>
  )
}
