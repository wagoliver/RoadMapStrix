'use client'

import { useState } from 'react'
import type { Activity, Project, CreateActivityInput } from '@/types'
import { useRoadmapStore } from '@/store/roadmapStore'
import { CreateActivityDialog } from '@/components/roadmap/ActivitySidebar/CreateActivityDialog'
import { PlanningCard } from './PlanningCard'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { ChevronDown, Plus, Maximize2, Minimize2 } from 'lucide-react'

const QUARTERS = [
  { key: 'Q1', label: 'Q1 — Janeiro a Março', color: '#06b6d4' },
  { key: 'Q2', label: 'Q2 — Abril a Junho', color: '#6366f1' },
  { key: 'Q3', label: 'Q3 — Julho a Setembro', color: '#22c55e' },
  { key: 'Q4', label: 'Q4 — Outubro a Dezembro', color: '#f97316' },
]

interface PlanningViewProps {
  project: Project
}

export function PlanningView({ project }: PlanningViewProps) {
  const { activities, addActivity, removeActivity, setActivityQuarter, updateActivity } = useRoadmapStore()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [createDialogQuarter, setCreateDialogQuarter] = useState<string | null>(null)
  const [dragOverQuarter, setDragOverQuarter] = useState<string | null>(null)

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => setCollapsed(new Set([...QUARTERS.map((q) => q.key), 'wishlist']))

  const activitiesForQuarter = (quarter: string) =>
    activities.filter((a) => a.quarter === quarter)

  const handleDrop = async (e: React.DragEvent, targetQuarter: string) => {
    e.preventDefault()
    setDragOverQuarter(null)
    const activityId = e.dataTransfer.getData('activityId')
    if (!activityId) return

    const activity = activities.find((a) => a.id === activityId)
    if (!activity || activity.quarter === targetQuarter) return

    setActivityQuarter(activityId, targetQuarter)
    try {
      await api.activities.update(project.id, activityId, { quarter: targetQuarter })
    } catch {
      setActivityQuarter(activityId, activity.quarter ?? null)
      toast.error('Failed to move activity')
    }
  }

  const handleCreateActivity = async (input: CreateActivityInput, quarter: string) => {
    try {
      const created = await api.activities.create(project.id, {
        name: input.name,
        description: input.description,
        color: input.color,
        durationSprints: input.durationSprints,
        tags: input.tags,
        quarter,
        planStatus: 'Backlog',
      })

      const newActivity: Activity = {
        id: created.id,
        name: created.name,
        description: created.description ?? undefined,
        color: created.color,
        durationSprints: created.durationSprints,
        startDate: null,
        rowIndex: null,
        isDelivered: false,
        deliveryDate: null,
        deliveryLabel: null,
        projectId: project.id,
        tags: created.tags,
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
        quarter: created.quarter,
        planStatus: created.planStatus,
        team: created.team,
        sizeLabel: created.sizeLabel,
        origin: created.origin,
        clients: created.clients,
        jiraRef: created.jiraRef,
        planningNote: created.planningNote,
      }
      addActivity(newActivity)
      toast.success('Activity created')
    } catch {
      toast.error('Failed to create activity')
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await api.activities.delete(project.id, activityId)
      removeActivity(activityId)
      toast.success('Activity deleted')
    } catch {
      toast.error('Failed to delete activity')
    }
  }

  const totalCount = activities.filter((a) => a.quarter && a.quarter !== 'wishlist').length
  const wishlistCount = activitiesForQuarter('wishlist').length

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalCount}</span> atividades planejadas
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Maximize2 className="w-3 h-3" /> Expandir
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Minimize2 className="w-3 h-3" /> Recolher
            </button>
          </div>
        </div>

        {/* Year group */}
        <div className="border border-border rounded-xl overflow-hidden mb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-card cursor-default select-none">
            <span className="w-2 h-2 rounded-full bg-primary/70 flex-shrink-0" />
            <span className="font-bold text-base">2026</span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground font-semibold">
              {totalCount}
            </span>
          </div>

          {QUARTERS.map((q) => {
            const qActivities = activitiesForQuarter(q.key)
            const isCollapsed = collapsed.has(q.key)
            const isDragOver = dragOverQuarter === q.key

            return (
              <div key={q.key} className="border-t border-border">
                {/* Quarter header */}
                <div
                  className="flex items-center gap-2 px-5 py-2 cursor-pointer select-none hover:bg-white/[0.03] transition-colors"
                  onClick={() => toggleCollapse(q.key)}
                >
                  <ChevronDown
                    className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform"
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : undefined }}
                  />
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: q.color }} />
                  <span className="font-bold text-sm">{q.label}</span>
                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground font-semibold">
                    {qActivities.length}
                  </span>
                  <button
                    className="ml-1 p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={(e) => { e.stopPropagation(); setCreateDialogQuarter(q.key) }}
                    title="Nova atividade"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Drop zone */}
                {!isCollapsed && (
                  <div
                    className={`px-2 pb-2 flex flex-col gap-1.5 min-h-3 transition-all ${
                      isDragOver
                        ? 'bg-primary/[0.04] border-2 border-dashed border-primary rounded-lg mx-2 mb-2 min-h-12'
                        : ''
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverQuarter(q.key) }}
                    onDragLeave={() => setDragOverQuarter(null)}
                    onDrop={(e) => handleDrop(e, q.key)}
                  >
                    {isDragOver && qActivities.length === 0 && (
                      <div className="text-center text-xs text-primary/60 italic py-3">
                        Solte aqui
                      </div>
                    )}
                    {qActivities.map((activity) => (
                      <PlanningCard
                        key={activity.id}
                        activity={activity}
                        projectId={project.id}
                        onDelete={handleDeleteActivity}
                      />
                    ))}
                    {qActivities.length === 0 && !isDragOver && (
                      <div className="text-center text-[11px] text-muted-foreground italic py-2">
                        Nenhuma atividade neste trimestre
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Unassigned */}
        {activities.filter((a) => !a.quarter).length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden mb-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-card">
              <span className="font-semibold text-sm text-muted-foreground">Sem trimestre</span>
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground font-semibold">
                {activities.filter((a) => !a.quarter).length}
              </span>
            </div>
            <div className="px-2 pb-2 flex flex-col gap-1.5">
              {activities
                .filter((a) => !a.quarter)
                .map((activity) => (
                  <PlanningCard
                    key={activity.id}
                    activity={activity}
                    projectId={project.id}
                    onDelete={handleDeleteActivity}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Wishlist sidebar */}
      <div
        className={`w-72 flex-shrink-0 border-l border-border flex flex-col transition-colors ${
          dragOverQuarter === 'wishlist' ? 'bg-pink-500/[0.04] border-pink-500/40' : ''
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOverQuarter('wishlist') }}
        onDragLeave={() => setDragOverQuarter(null)}
        onDrop={(e) => handleDrop(e, 'wishlist')}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>⭐</span>
            <span>Lista de Desejos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 font-semibold">
              {wishlistCount}
            </span>
            <button
              className="p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setCreateDialogQuarter('wishlist')}
              title="Nova atividade na wishlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-12">
          {wishlistCount === 0 ? (
            <div className="text-center text-[11px] text-muted-foreground italic py-4">
              Arraste cards aqui
            </div>
          ) : (
            activitiesForQuarter('wishlist').map((activity) => (
              <PlanningCard
                key={activity.id}
                activity={activity}
                projectId={project.id}
                onDelete={handleDeleteActivity}
              />
            ))
          )}
        </div>
      </div>

      {/* Create dialog */}
      {createDialogQuarter && (
        <CreateActivityDialog
          open
          onOpenChange={(open) => { if (!open) setCreateDialogQuarter(null) }}
          onSubmit={(input) => {
            handleCreateActivity(input, createDialogQuarter)
            setCreateDialogQuarter(null)
          }}
          defaultQuarter={createDialogQuarter}
          mode="create"
        />
      )}
    </div>
  )
}
