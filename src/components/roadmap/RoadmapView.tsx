'use client'

import { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Activity, Project, CreateActivityInput, ActivityDependency } from '@/types'
import { useRoadmapStore } from '@/store/roadmapStore'
import { useTimeView, scrollToToday } from '@/hooks/useTimeView'
import { GanttChart } from './GanttChart/GanttChart'
import { ActivitySidebar } from './ActivitySidebar/ActivitySidebar'
import { RoadmapToolbar } from './RoadmapToolbar'
import { MarkDeliveredDialog } from './ActivitySidebar/MarkDeliveredDialog'
import { EditActivityDialog, type EditActivityValues } from '@/components/planning/EditActivityDialog'
import { TimeView } from '@/lib/gantt/columnConfig'
import { activityWidthPx, pixelToDate, snapDateToView, dateToQuarter, quarterToStartDate } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import type { DragData } from '@/hooks/useDragActivity'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { useActivityFilters, STATUS_OPTIONS, AREA_OPTIONS, TEAM_OPTIONS, SIZE_OPTIONS, ORIGIN_OPTIONS } from '@/hooks/useActivityFilters'
import { Search, X } from 'lucide-react'

interface RoadmapViewProps {
  project: Project
  dependencies?: ActivityDependency[]
}

export function RoadmapView({ project, dependencies: initialDeps = [] }: RoadmapViewProps) {
  const {
    activities,
    addActivity,
    updateActivity,
    scheduleActivity,
    unscheduleActivity,
    getFilteredActivities,
    setActivities,
    timeView,
  } = useRoadmapStore()

  const [scrollLeft, setScrollLeft] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const data = await api.activities.list(project.id)

      const QUARTER_KEYS = ['Q1', 'Q2', 'Q3', 'Q4']

      // Map all activities
      const mapped: Activity[] = data.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description ?? undefined,
        color: a.color,
        durationSprints: a.durationSprints,
        startDate: a.startDate ? new Date(a.startDate) : null,
        rowIndex: a.rowIndex ?? null,
        isDelivered: a.isDelivered,
        deliveryDate: a.deliveryDate ? new Date(a.deliveryDate) : null,
        deliveryLabel: a.deliveryLabel ?? null,
        projectId: a.projectId,
        tags: a.tags,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
        quarter: a.quarter ?? undefined,
        planStatus: a.planStatus ?? undefined,
        team: a.team ?? undefined,
        sizeLabel: a.sizeLabel ?? undefined,
        origin: a.origin ?? undefined,
        clients: a.clients ?? [],
        jiraRef: a.jiraRef ?? undefined,
        planningNote: a.planningNote ?? undefined,
        area: a.area ?? undefined,
      }))

      // Find activities with a real quarter but no startDate — auto-schedule them
      const needsScheduling = mapped.filter(
        (a) => a.quarter && QUARTER_KEYS.includes(a.quarter) && !a.startDate
      )

      if (needsScheduling.length > 0) {
        // Find the lowest row with no time overlap for the given activity
        const findFreeRow = (startDate: Date, durationSprints: number, alreadyScheduled: Activity[]): number => {
          const sprintMs = project.sprintDuration * 24 * 60 * 60 * 1000
          const endDate = new Date(startDate.getTime() + durationSprints * sprintMs)
          let row = 0
          while (alreadyScheduled.some((a) => {
            if (a.rowIndex !== row || !a.startDate) return false
            const aEnd = new Date(a.startDate.getTime() + a.durationSprints * sprintMs)
            return a.startDate < endDate && startDate < aEnd
          })) row++
          return row
        }

        // Build a mutable list of already-scheduled activities (grows as we assign new ones)
        const scheduled = mapped.filter((a) => a.startDate != null)

        const updates = needsScheduling.map((a) => {
          const startDate = quarterToStartDate(a.quarter!)
          const rowIndex = findFreeRow(startDate, a.durationSprints, scheduled)
          // Register this assignment so subsequent cards respect it
          scheduled.push({ ...a, startDate, rowIndex })
          return { id: a.id, startDate, rowIndex }
        })

        // Apply to mapped list
        updates.forEach(({ id, startDate, rowIndex }) => {
          const a = mapped.find((x) => x.id === id)
          if (a) { a.startDate = startDate; a.rowIndex = rowIndex }
        })

        // Persist to DB (fire-and-forget per item)
        await Promise.all(
          updates.map(({ id, startDate, rowIndex }) =>
            api.activities.update(project.id, id, {
              startDate: startDate.toISOString(),
              rowIndex,
            })
          )
        )

        toast.success(`Dados atualizados — ${updates.length} card(s) posicionados no Gantt`)
      } else {
        toast.success('Dados atualizados')
      }

      setActivities(mapped)
    } catch {
      toast.error('Falha ao atualizar dados')
    } finally {
      setIsRefreshing(false)
    }
  }
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [deliveredActivity, setDeliveredActivity] = useState<Activity | null>(null)
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null)
  const [dependencies, setDependencies] = useState<ActivityDependency[]>(initialDeps)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { changeView, cycleView } = useTimeView()

  const handleViewChange = (view: TimeView) => {
    changeView(view, scrollContainerRef as React.RefObject<HTMLElement>)
  }

  const handleScrollToToday = () => {
    if (!scrollContainerRef.current) return
    scrollToToday(timeView, scrollContainerRef.current)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    if (data) setActiveDragData(data)
  }

  const persistSchedule = useCallback(async (activityId: string, startDate: Date | null, rowIndex: number | null) => {
    try {
      await api.activities.update(project.id, activityId, {
        startDate: startDate?.toISOString() ?? null,
        rowIndex,
      })
    } catch {
      toast.error('Failed to save schedule')
    }
  }, [project.id])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    setActiveDragData(null)

    if (!over) return
    const dragData = active.data.current as DragData | undefined
    if (!dragData) return

    const overId = String(over.id)

    if (overId === 'activity-sidebar') {
      unscheduleActivity(dragData.activityId)
      persistSchedule(dragData.activityId, null, null)
      return
    }

    if (!overId.startsWith('row-') && overId !== 'gantt-chart') {
      return
    }

    const chartStart = getChartStartDate()
    let newStartDate: Date

    if (dragData.source === 'sidebar') {
      const overRect = over.rect as DOMRectReadOnly | null
      if (!overRect) return
      const ganttContainerRect = scrollContainerRef.current?.getBoundingClientRect()
      if (!ganttContainerRect) return
      const pointerXInGantt =
        overRect.left - ganttContainerRect.left + overRect.width / 2 + delta.x + scrollLeft
      newStartDate = pixelToDate(pointerXInGantt, chartStart, timeView)
    } else {
      const originalPx = dragData.originalOffsetPx ?? 0
      newStartDate = pixelToDate(originalPx + delta.x, chartStart, timeView)
    }

    const snapped = snapDateToView(newStartDate, timeView)
    const newQuarter = dateToQuarter(snapped)

    // Find the first row (starting from target) with no time overlap
    const draggedActivity = activities.find((a) => a.id === dragData.activityId)
    const sprintMs = project.sprintDuration * 24 * 60 * 60 * 1000
    const draggedDuration = (draggedActivity?.durationSprints ?? 1) * sprintMs
    const draggedEnd = new Date(snapped.getTime() + draggedDuration)

    const isRowOccupied = (row: number) =>
      activities.some((a) => {
        if (a.id === dragData.activityId || a.rowIndex !== row || !a.startDate) return false
        const aEnd = new Date(a.startDate.getTime() + a.durationSprints * sprintMs)
        return a.startDate < draggedEnd && snapped < aEnd
      })

    // Find the topmost free row (row 0 first, then 1, 2, ...)
    let finalRow = 0
    while (isRowOccupied(finalRow)) finalRow++

    scheduleActivity(dragData.activityId, snapped, finalRow)
    updateActivity(dragData.activityId, { quarter: newQuarter })

    persistSchedule(dragData.activityId, snapped, finalRow)
    api.activities.update(project.id, dragData.activityId, { quarter: newQuarter }).catch(() => {})
  }

  const handleCreateActivity = async (input: CreateActivityInput) => {
    try {
      const created = await api.activities.create(project.id, {
        name: input.name,
        description: input.description,
        color: input.color,
        durationSprints: input.durationSprints,
        tags: input.tags,
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
      }
      addActivity(newActivity)
      toast.success('Activity created')
    } catch {
      toast.error('Failed to create activity')
    }
  }

  const handleEditActivitySubmit = async (input: EditActivityValues) => {
    if (!editActivity) return
    try {
      const quarter = input.quarter || null
      await api.activities.update(project.id, editActivity.id, {
        name: input.name,
        description: input.description,
        color: input.color,
        durationSprints: input.durationSprints,
        quarter,
        area: input.area || null,
        planStatus: input.planStatus,
        team: input.team || null,
        sizeLabel: input.sizeLabel || null,
        origin: input.origin || null,
        clients: input.clients,
        jiraRef: input.jiraRef || null,
        planningNote: input.planningNote || null,
      })
      updateActivity(editActivity.id, {
        name: input.name,
        description: input.description,
        color: input.color,
        durationSprints: input.durationSprints,
        quarter,
        area: input.area || null,
        planStatus: input.planStatus,
        team: input.team || null,
        sizeLabel: input.sizeLabel || null,
        origin: input.origin || null,
        clients: input.clients,
        jiraRef: input.jiraRef || null,
        planningNote: input.planningNote || null,
      })
      setEditActivity(null)
      toast.success('Activity updated')
    } catch {
      toast.error('Failed to update activity')
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await api.activities.update(project.id, activityId, {
        quarter: 'wishlist',
        startDate: null,
        rowIndex: null,
      })
      updateActivity(activityId, { quarter: 'wishlist', startDate: null, rowIndex: null })
      toast.success('Card movido para Lista de Desejos')
    } catch {
      toast.error('Falha ao mover card')
    }
  }

  const handleMarkDelivered = async (activityId: string, deliveryDate: Date, label: string) => {
    try {
      await api.activities.update(project.id, activityId, {
        isDelivered: true,
        deliveryDate: deliveryDate.toISOString(),
        deliveryLabel: label || null,
      })
      updateActivity(activityId, {
        isDelivered: true,
        deliveryDate,
        deliveryLabel: label || undefined,
      })
      toast.success('Activity marked as delivered')
    } catch {
      toast.error('Failed to mark as delivered')
    }
  }

  const handleAddDependency = async (fromId: string, toId: string) => {
    try {
      const dep = await api.dependencies.create(project.id, fromId, toId)
      setDependencies((prev) => [...prev, dep])
      toast.success('Dependency added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add dependency')
    }
  }

  const handleRemoveDependency = async (depId: string) => {
    try {
      await api.dependencies.delete(project.id, depId)
      setDependencies((prev) => prev.filter((d) => d.id !== depId))
      toast.success('Dependency removed')
    } catch {
      toast.error('Failed to remove dependency')
    }
  }

  const handleExport = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const jspdfModule = await import('jspdf')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JsPDF = (jspdfModule as any).jsPDF ?? (jspdfModule as any).default
      const el = document.getElementById('gantt-export-target')
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new JsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`${project.name}-roadmap.pdf`)
      toast.success('PDF exported')
    } catch {
      toast.error('Failed to export PDF')
    }
  }

  const {
    filterOpen, setFilterOpen,
    filterSearch, setFilterSearch,
    selectedStatuses, setSelectedStatuses,
    selectedAreas,    setSelectedAreas,
    selectedTeams,    setSelectedTeams,
    selectedSizes,    setSelectedSizes,
    selectedOrigins,  setSelectedOrigins,
    selectedClients,  setSelectedClients,
    clearSelectedStatuses, clearSelectedAreas, clearSelectedTeams,
    clearSelectedSizes, clearSelectedOrigins, clearSelectedClients,
    activeFilterCount,
    clearFilters,
    clientOptions,
    applyFilters,
  } = useActivityFilters(activities)

  const QUARTER_KEYS = ['Q1', 'Q2', 'Q3', 'Q4']
  const ganttActivities = activities.filter(
    (a) => a.quarter && QUARTER_KEYS.includes(a.quarter)
  )
  const wishlistActivities = activities.filter((a) => a.quarter === 'wishlist')
  const scheduledFiltered = applyFilters(
    getFilteredActivities().filter((a) => a.startDate != null)
  )


  const activeDragActivity = activeDragData
    ? activities.find((a) => a.id === activeDragData.activityId)
    : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        <RoadmapToolbar
          projectName={project.name}
          timeView={timeView}
          onViewChange={handleViewChange}
          onScrollToToday={handleScrollToToday}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          filterOpen={filterOpen}
          activeFilterCount={activeFilterCount}
          onToggleFilter={() => setFilterOpen((v) => !v)}
        />

        {/* Filter panel */}
        {filterOpen && (
          <div className="border-b border-border bg-card px-4 py-3 flex flex-col gap-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                className="w-full bg-background border border-border rounded-lg text-xs pl-8 pr-8 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/60 transition-colors"
                placeholder="Buscar por nome, Jira ID..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
              {filterSearch && (
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setFilterSearch('')}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown label="Status"  options={STATUS_OPTIONS}  selected={selectedStatuses} onToggle={setSelectedStatuses} onClear={clearSelectedStatuses} />
              <FilterDropdown label="Área"    options={AREA_OPTIONS}    selected={selectedAreas}    onToggle={setSelectedAreas}    onClear={clearSelectedAreas} />
              <FilterDropdown label="Time"    options={TEAM_OPTIONS}    selected={selectedTeams}    onToggle={setSelectedTeams}    onClear={clearSelectedTeams} />
              <FilterDropdown label="Tamanho" options={SIZE_OPTIONS}    selected={selectedSizes}    onToggle={setSelectedSizes}    onClear={clearSelectedSizes} />
              <FilterDropdown label="Origem"  options={ORIGIN_OPTIONS}  selected={selectedOrigins}  onToggle={setSelectedOrigins}  onClear={clearSelectedOrigins} />
              {clientOptions.length > 0 && (
                <FilterDropdown label="Cliente" options={clientOptions} selected={selectedClients} onToggle={setSelectedClients} onClear={clearSelectedClients} />
              )}
            </div>
            {activeFilterCount > 0 && (
              <div className="flex justify-end border-t border-border pt-2">
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3 h-3" /> Limpar todos
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <ActivitySidebar
            ganttActivities={ganttActivities}
            wishlistActivities={wishlistActivities}
            onCreateActivity={handleCreateActivity}
            onEditActivity={(a) => setEditActivity(a)}
            onDeleteActivity={handleDeleteActivity}
          />

          <div id="gantt-export-target" className="flex-1 overflow-hidden flex flex-col">
            <GanttChart
              activities={scheduledFiltered}
              dependencies={dependencies}
              sprintDays={project.sprintDuration}
              timeView={timeView}
              onEdit={(a) => setEditActivity(a)}
              onMarkDelivered={(a) => setDeliveredActivity(a)}
              onDelete={handleDeleteActivity}
              onAddDependency={handleAddDependency}
              onRemoveDependency={handleRemoveDependency}
              onScrollChange={setScrollLeft}
              onZoom={(dir) => cycleView(dir)}
              scrollContainerRef={scrollContainerRef}
            />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDragActivity && (
          <div
            className="rounded-md px-3 py-2 text-white text-xs font-medium shadow-lg pointer-events-none"
            style={{
              backgroundColor: activeDragActivity.color,
              width: Math.max(
                activityWidthPx(
                  activeDragActivity.durationSprints,
                  project.sprintDuration,
                  timeView
                ),
                80
              ),
            }}
          >
            {activeDragActivity.name}
          </div>
        )}
      </DragOverlay>

      {editActivity && (
        <EditActivityDialog
          open={!!editActivity}
          onOpenChange={(open) => !open && setEditActivity(null)}
          activity={editActivity}
          onSubmit={handleEditActivitySubmit}
        />
      )}

      <MarkDeliveredDialog
        open={!!deliveredActivity}
        onOpenChange={(open) => !open && setDeliveredActivity(null)}
        activity={deliveredActivity}
        onSubmit={handleMarkDelivered}
      />
    </DndContext>
  )
}
