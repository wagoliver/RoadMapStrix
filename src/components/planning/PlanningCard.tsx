'use client'

import { useState, useRef, useCallback } from 'react'
import type { Activity } from '@/types'
import { PopupSelector, type PopupOption } from './PopupSelector'
import { EditActivityDialog, type EditActivityValues } from './EditActivityDialog'
import { api } from '@/lib/api-client'
import { useRoadmapStore } from '@/store/roadmapStore'
import { toast } from 'sonner'
import { Trash2, Pencil } from 'lucide-react'

export const TEAM_COLORS: Record<string, string> = {
  'Feature':        '#22c55e',
  'Melhoria':       '#3b82f6',
  'Bug':            '#ef4444',
  'Débito Técnico': '#f97316',
  'Pesquisa':       '#a855f7',
  'Integração':     '#06b6d4',
}

export const AREA_COLORS: Record<string, string> = {
  'Core Platform': '#6366f1',
  'Agentes':       '#a855f7',
  'Marketplace':   '#06b6d4',
  'Analytics':     '#3b82f6',
  'Integrações':   '#eab308',
  'Backoffice':    '#64748b',
}

const SIZE_COLORS: Record<string, string> = {
  S: '#22c55e',
  M: '#eab308',
  L: '#f97316',
  XL: '#ef4444',
}

const STATUSES: PopupOption[] = [
  { key: 'Backlog', label: 'Backlog', color: '#8b8fa3' },
  { key: 'Planejado', label: 'Planejado', color: '#06b6d4' },
  { key: 'Em Andamento', label: 'Em Andamento', color: '#818cf8' },
  { key: 'Em Review', label: 'Em Review', color: '#eab308' },
  { key: 'Em Produção', label: 'Em Produção', color: '#16a34a' },
  { key: 'Concluído', label: 'Concluído', color: '#4ade80' },
]

const SIZES: PopupOption[] = [
  { key: 'S', label: 'S (1 sprint)', color: '#22c55e' },
  { key: 'M', label: 'M (2 sprints)', color: '#eab308' },
  { key: 'L', label: 'L (3 sprints)', color: '#f97316' },
  { key: 'XL', label: 'XL (4+ sprints)', color: '#ef4444' },
]

function getTeamOptions(): PopupOption[] {
  return Object.entries(TEAM_COLORS).map(([key, color]) => ({ key, label: key, color }))
}

const STATUS_COLORS: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.key, s.color ?? '#8b8fa3'])
)

interface PopupState {
  type: 'status' | 'size' | 'team' | 'area'
  anchor: HTMLElement
}

interface PlanningCardProps {
  activity: Activity
  projectId: string
  onDelete: (id: string) => void
  compact?: boolean
}

export function PlanningCard({ activity, projectId, onDelete, compact = false }: PlanningCardProps) {
  const { updateActivity } = useRoadmapStore()
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [note, setNote] = useState(activity.planningNote ?? '')
  const [noteSaved, setNoteSaved] = useState(false)
  const [clients, setClients] = useState<string[]>(activity.clients ?? [])
  const [clientInput, setClientInput] = useState('')
  const [showClientInput, setShowClientInput] = useState(false)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEdit = async (values: EditActivityValues) => {
    try {
      await api.activities.update(projectId, activity.id, {
        name: values.name,
        description: values.description || null,
        color: values.color,
        durationSprints: values.durationSprints,
        quarter: values.quarter || null,
        area: values.area || null,
        planStatus: values.planStatus,
        team: values.team || null,
        sizeLabel: values.sizeLabel || null,
        origin: values.origin || null,
        clients: values.clients,
        jiraRef: values.jiraRef || null,
        planningNote: values.planningNote || null,
      })
      updateActivity(activity.id, {
        name: values.name,
        description: values.description || undefined,
        color: values.color,
        durationSprints: values.durationSprints,
        quarter: values.quarter || null,
        area: values.area || null,
        planStatus: values.planStatus,
        team: values.team || null,
        sizeLabel: (values.sizeLabel as Activity['sizeLabel']) || null,
        origin: values.origin || null,
        clients: values.clients,
        jiraRef: values.jiraRef || null,
        planningNote: values.planningNote || null,
      })
      // Also update tags via store if changed
      toast.success('Atividade atualizada')
    } catch {
      toast.error('Falha ao salvar')
    }
  }

  const persist = useCallback(
    async (updates: Parameters<typeof api.activities.update>[2]) => {
      try {
        await api.activities.update(projectId, activity.id, updates)
        updateActivity(activity.id, updates as Parameters<typeof updateActivity>[1])
      } catch {
        toast.error('Failed to save')
      }
    },
    [projectId, activity.id, updateActivity]
  )

  const handleStatusSelect = (key: string) => {
    persist({ planStatus: key })
  }

  const handleAreaSelect = (key: string) => {
    persist({ area: key || null })
  }

  const handleSizeSelect = (key: string) => {
    const sprintMap: Record<string, number> = { S: 1, M: 2, L: 3 }
    const updates: Parameters<typeof persist>[0] = { sizeLabel: key as Activity['sizeLabel'] }
    if (sprintMap[key]) updates.durationSprints = sprintMap[key]
    persist(updates)
  }

  const handleTeamSelect = (key: string) => {
    const color = TEAM_COLORS[key] ?? '#6366f1'
    persist({ team: key, color })
  }

  const handleNoteChange = (value: string) => {
    setNote(value)
    setNoteSaved(false)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(async () => {
      await persist({ planningNote: value })
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 1500)
    }, 500)
  }

  const handleAddClient = () => {
    const trimmed = clientInput.trim()
    if (!trimmed || clients.includes(trimmed)) return
    const newClients = [...clients, trimmed]
    setClients(newClients)
    setClientInput('')
    setShowClientInput(false)
    persist({ clients: newClients })
  }

  const handleRemoveClient = (c: string) => {
    const newClients = clients.filter((x) => x !== c)
    setClients(newClients)
    persist({ clients: newClients })
  }

  const status = activity.planStatus ?? 'Backlog'
  const statusColor = STATUS_COLORS[status] ?? '#8b8fa3'
  const sizeColor = activity.sizeLabel ? SIZE_COLORS[activity.sizeLabel] : undefined
  const teamColor = activity.team ? (TEAM_COLORS[activity.team] ?? '#64748b') : undefined

  return (
    <div
      className="bg-card border rounded-xl p-2.5 cursor-grab hover:brightness-105 transition-all group"
      style={{ borderColor: `${activity.color}45` }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('activityId', activity.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-1.5 mb-0.5">
        {activity.id && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-bold flex-shrink-0">
            #{activity.id.slice(-4)}
          </span>
        )}
        <span className="text-[13px] font-semibold leading-snug flex-1">{activity.name}</span>
        {/* Client pills */}
        {clients.length > 0 && (
          <div className="flex gap-1 items-center ml-auto flex-shrink-0">
            {compact ? (
              /* Wishlist: só o contador */
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 text-[10px] font-semibold border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/25"
                onClick={() => setEditOpen(true)}
                title={clients.join(', ')}
              >
                👥 {clients.length}
              </span>
            ) : (
              /* Quarters: até 2 nomes + +N */
              <>
                {clients.slice(0, 2).map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 text-[10px] font-semibold border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/25 max-w-[80px] truncate"
                    onClick={() => handleRemoveClient(c)}
                    title={`${c} — clique para remover`}
                  >
                    {c}
                  </span>
                ))}
                {clients.length > 2 && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-semibold border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/20"
                    onClick={() => setEditOpen(true)}
                    title={clients.slice(2).join(', ')}
                  >
                    +{clients.length - 2}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {activity.description && (
        <p className="text-[11px] text-muted-foreground leading-snug mb-1.5">
          {activity.description}
        </p>
      )}

      {/* Tags row */}
      <div className="flex gap-1 flex-wrap mt-1">
        {/* Status */}
        <button
          className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide cursor-pointer hover:brightness-125 transition-all"
          style={{ background: `${statusColor}22`, color: statusColor }}
          onClick={(e) => setPopup({ type: 'status', anchor: e.currentTarget })}
        >
          {status}
        </button>

        {/* Size */}
        <button
          className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide cursor-pointer hover:brightness-125 transition-all"
          style={
            sizeColor
              ? { background: `${sizeColor}22`, color: sizeColor }
              : { background: 'rgba(255,255,255,0.06)', color: '#8b8fa3' }
          }
          onClick={(e) => setPopup({ type: 'size', anchor: e.currentTarget })}
        >
          {activity.sizeLabel ? `${activity.sizeLabel} · ${activity.durationSprints}sp` : `${activity.durationSprints}sp`}
        </button>

        {/* Team */}
        <button
          className="text-[10px] px-1.5 py-0.5 rounded font-semibold border border-white/10 cursor-pointer hover:brightness-125 transition-all"
          style={{ color: teamColor ?? '#8b8fa3' }}
          onClick={(e) => setPopup({ type: 'team', anchor: e.currentTarget })}
        >
          {activity.team ?? 'time'}
        </button>

        {/* Area */}
        {activity.area && (() => {
          const areaColor = AREA_COLORS[activity.area] ?? '#64748b'
          return (
            <button
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold cursor-pointer hover:brightness-125 transition-all"
              style={{ background: `${areaColor}22`, color: areaColor }}
              onClick={(e) => setPopup({ type: 'area', anchor: e.currentTarget })}
            >
              {activity.area}
            </button>
          )
        })()}

        {/* Jira ref */}
        {activity.jiraRef && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
            {activity.jiraRef}
          </span>
        )}

        {/* Add client */}
        <button
          className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-yellow-500/30 text-muted-foreground hover:border-yellow-500 hover:text-yellow-300 transition-colors font-semibold"
          onClick={() => setShowClientInput(!showClientInput)}
        >
          + cliente
        </button>

        {/* Edit + Delete */}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={() => setEditOpen(true)}
            title="Editar"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => onDelete(activity.id)}
            title="Excluir"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Client input */}
      {showClientInput && (
        <div className="mt-1.5 flex gap-1">
          <input
            className="flex-1 bg-muted/40 border border-border rounded text-[12px] px-2 py-0.5 text-foreground outline-none focus:border-yellow-500/50 placeholder:text-muted-foreground/40 placeholder:italic"
            placeholder="Nome do cliente..."
            value={clientInput}
            onChange={(e) => setClientInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddClient()
              if (e.key === 'Escape') setShowClientInput(false)
            }}
            autoFocus
          />
          <button
            className="text-[11px] px-2 rounded bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/25 transition-colors"
            onClick={handleAddClient}
          >
            OK
          </button>
        </div>
      )}

      {/* Note */}
      <div className="mt-1.5 border-t border-dashed border-white/[0.08] pt-1">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[9px] uppercase tracking-wider text-primary/70 font-semibold">Nota</span>
          {noteSaved && <span className="text-[9px] text-green-400 ml-auto">salvo</span>}
        </div>
        <textarea
          className="w-full bg-muted/40 border border-border rounded text-[11px] px-1.5 py-1 text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40 placeholder:italic resize-none min-h-6 max-h-20"
          placeholder="Nota de planejamento..."
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          rows={1}
        />
      </div>

      {/* Edit dialog */}
      <EditActivityDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        activity={activity}
        onSubmit={handleEdit}
      />

      {/* Popups */}
      {popup?.type === 'status' && (
        <PopupSelector
          anchorEl={popup.anchor}
          title="Status"
          options={STATUSES}
          activeKey={status}
          onSelect={handleStatusSelect}
          onClose={() => setPopup(null)}
        />
      )}
      {popup?.type === 'size' && (
        <PopupSelector
          anchorEl={popup.anchor}
          title="Estimativa"
          options={SIZES}
          activeKey={activity.sizeLabel ?? null}
          onSelect={handleSizeSelect}
          onClose={() => setPopup(null)}
        />
      )}
      {popup?.type === 'team' && (
        <PopupSelector
          anchorEl={popup.anchor}
          title="Tipo"
          options={getTeamOptions()}
          activeKey={activity.team ?? null}
          onSelect={handleTeamSelect}
          onClose={() => setPopup(null)}
        />
      )}
      {popup?.type === 'area' && (
        <PopupSelector
          anchorEl={popup.anchor}
          title="Área de Produto"
          options={Object.entries(AREA_COLORS).map(([key, color]) => ({ key, label: key, color }))}
          activeKey={activity.area ?? null}
          onSelect={handleAreaSelect}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
