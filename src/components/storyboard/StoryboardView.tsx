'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { Activity } from '@/types'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Plus, Trash2, X, Search, Check } from 'lucide-react'
import { AREA_COLORS } from '@/components/planning/EditActivityDialog'
import { cn } from '@/lib/utils'

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
  description: string | null
  color: string
  x: number
  y: number
  width: number
  height: number
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
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
          <span className="text-xs font-semibold">Vincular cards</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
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

        {/* List */}
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
                {/* Checkbox */}
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

// ─── Feature Group Tile ───────────────────────────────────────────────────────

function GroupTile({
  group,
  projectId,
  onUpdate,
  onDelete,
  onActivityToggle,
}: {
  group: FeatureGroup
  projectId: string
  onUpdate: (id: string, patch: Partial<FeatureGroup>) => void
  onDelete: (id: string) => void
  onActivityToggle: (groupId: string, activityId: string, linked: boolean) => Promise<void>
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [titleVal, setTitleVal] = useState(group.title)
  const [descVal, setDescVal] = useState(group.description ?? '')

  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 })
  const resizeRef = useRef({ active: false, startX: 0, startY: 0, origW: 0, origH: 0 })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback((patch: Partial<FeatureGroup>) => {
    onUpdate(group.id, patch)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.featureGroups.update(projectId, group.id, patch).catch(() => toast.error('Erro ao salvar'))
    }, 600)
  }, [group.id, projectId, onUpdate])

  // ── Drag to move ──
  const onDragStart = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-no-drag]')) return
    e.preventDefault()
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: group.x, origY: group.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      const nx = Math.max(0, dragRef.current.origX + dx)
      const ny = Math.max(0, dragRef.current.origY + dy)
      onUpdate(group.id, { x: nx, y: ny })
    }
    const onUp = (ev: MouseEvent) => {
      if (!dragRef.current.active) return
      dragRef.current.active = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        const nx = Math.max(0, dragRef.current.origX + dx)
        const ny = Math.max(0, dragRef.current.origY + dy)
        api.featureGroups.update(projectId, group.id, { x: nx, y: ny }).catch(() => {})
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Resize ──
  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { active: true, startX: e.clientX, startY: e.clientY, origW: group.width, origH: group.height }

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current.active) return
      const nw = Math.max(MIN_W, resizeRef.current.origW + ev.clientX - resizeRef.current.startX)
      const nh = Math.max(MIN_H, resizeRef.current.origH + ev.clientY - resizeRef.current.startY)
      onUpdate(group.id, { width: nw, height: nh })
    }
    const onUp = (ev: MouseEvent) => {
      if (!resizeRef.current.active) return
      resizeRef.current.active = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const nw = Math.max(MIN_W, resizeRef.current.origW + ev.clientX - resizeRef.current.startX)
      const nh = Math.max(MIN_H, resizeRef.current.origH + ev.clientY - resizeRef.current.startY)
      api.featureGroups.update(projectId, group.id, { width: nw, height: nh }).catch(() => {})
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const totalSprints = group.activities.reduce((s, la) => s + la.activity.durationSprints, 0)
  const quarters = Array.from(new Set(group.activities.map((la) => la.activity.quarter).filter(Boolean))).sort()

  return (
    <div
      className="absolute select-none"
      style={{ left: group.x, top: group.y, width: group.width, height: group.height }}
    >
      <div
        className="w-full h-full rounded-2xl border border-border bg-card/95 backdrop-blur-sm shadow-xl flex flex-col overflow-hidden"
        style={{ borderTop: `3px solid ${group.color}` }}
      >
        {/* Header — drag handle */}
        <div
          className="flex items-start gap-2 px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
          onMouseDown={onDragStart}
          style={{ background: group.color + '10' }}
        >
          {/* Color dot */}
          <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: group.color }} />

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
                className="text-sm font-bold leading-snug cursor-text hover:text-primary transition-colors line-clamp-2"
                onDoubleClick={() => setEditingTitle(true)}
                title="Duplo clique para editar"
              >
                {group.title}
              </h3>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0" data-no-drag>
            <button
              onClick={() => setShowPicker(true)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Vincular cards"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(group.id)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Excluir grupo"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 pb-2 flex-shrink-0" data-no-drag>
          {editingDesc ? (
            <textarea
              autoFocus
              rows={3}
              className="w-full bg-transparent text-xs text-muted-foreground outline-none border border-border/50 rounded-lg p-1.5 resize-none focus:border-primary/40"
              value={descVal}
              onChange={(e) => setDescVal(e.target.value)}
              onBlur={() => { setEditingDesc(false); scheduleSave({ description: descVal || null }) }}
            />
          ) : (
            <p
              className={cn(
                'text-xs leading-relaxed cursor-text',
                group.description ? 'text-muted-foreground' : 'text-muted-foreground/40 italic'
              )}
              onDoubleClick={() => setEditingDesc(true)}
              title="Duplo clique para editar"
            >
              {group.description || 'Duplo clique para adicionar descrição...'}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-dashed border-border/60 flex-shrink-0" />

        {/* Linked activity chips */}
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-wrap gap-1.5 content-start" data-no-drag>
          {group.activities.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/50 italic w-full text-center pt-3">
              Clique em + para vincular cards
            </p>
          ) : (
            group.activities.map((la) => {
              const a = la.activity
              const statusColor = STATUS_COLOR[a.planStatus] ?? '#8b8fa3'
              const areaColor = AREA_COLORS[a.area ?? ''] ?? '#6366f1'
              return (
                <div
                  key={la.id}
                  className="group/chip flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
                  {a.jiraRef && (
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/60 flex-shrink-0">{a.jiraRef}</span>
                  )}
                  <span
                    className="text-[10px] font-semibold flex-shrink-0 px-1 rounded"
                    style={{ background: areaColor + '18', color: areaColor }}
                  >
                    {a.quarter}
                  </span>
                  <span className="text-[10px] max-w-[140px] truncate text-foreground">{a.name}</span>
                  <button
                    onClick={() => onActivityToggle(group.id, a.id, true)}
                    className="ml-0.5 opacity-0 group-hover/chip:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer meta */}
        {group.activities.length > 0 && (
          <div className="px-4 py-2 border-t border-border/60 flex items-center gap-2 flex-shrink-0 flex-wrap">
            {quarters.map((q) => (
              <span key={q} className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{q}</span>
            ))}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {group.activities.length} cards · {totalSprints} sprints
            </span>
          </div>
        )}

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end pr-1 pb-1 opacity-30 hover:opacity-70 transition-opacity"
          onMouseDown={onResizeStart}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-muted-foreground">
            <path d="M8 0L8 8L0 8Z" />
          </svg>
        </div>
      </div>

      {/* Activity Picker overlay */}
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
  const colorIdx = useRef(0)

  useEffect(() => {
    api.featureGroups.list(projectId)
      .then(setGroups)
      .catch(() => toast.error('Erro ao carregar storyboard'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleCreate = async () => {
    const color = GROUP_COLORS[colorIdx.current % GROUP_COLORS.length]
    colorIdx.current++
    // Offset each new group so they don't stack
    const offset = groups.length * 30
    try {
      const group = await api.featureGroups.create(projectId, {
        color,
        x: 40 + offset,
        y: 40 + offset,
      })
      setGroups((prev) => [...prev, group])
    } catch {
      toast.error('Erro ao criar grupo')
    }
  }

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
      // Reload group to get full activity data
      const updated = await api.featureGroups.list(projectId)
      setGroups(updated)
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
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 h-7 px-3 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Grupo
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-muted/30">
        {/* Dot grid background */}
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
            />
          ))}
        </div>
      </div>
    </div>
  )
}
