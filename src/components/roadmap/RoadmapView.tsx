'use client'

import { useState, useRef, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Activity, Project, CreateActivityInput } from '@/types'
import { useRoadmapStore } from '@/store/roadmapStore'
import { useTimeView } from '@/hooks/useTimeView'
import { GanttChart } from './GanttChart/GanttChart'
import { ActivitySidebar } from './ActivitySidebar/ActivitySidebar'
import { RoadmapToolbar } from './RoadmapToolbar'
import { CreateActivityDialog } from './ActivitySidebar/CreateActivityDialog'
import { MarkDeliveredDialog } from './ActivitySidebar/MarkDeliveredDialog'
import { TimeView } from '@/lib/gantt/columnConfig'
import { dateToPixel, activityWidthPx, pixelToDate, snapDateToView } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'
import { generateId } from '@/lib/generateId'
import { DEFAULT_ACTIVITY_COLOR } from '@/lib/constants'
import type { DragData } from '@/hooks/useDragActivity'

interface RoadmapViewProps {
  project: Project
}

export function RoadmapView({ project }: RoadmapViewProps) {
  const {
    activities,
    addActivity,
    updateActivity,
    removeActivity,
    scheduleActivity,
    unscheduleActivity,
    getUnscheduledActivities,
    getFilteredActivities,
    timeView,
  } = useRoadmapStore()

  const [scrollLeft, setScrollLeft] = useState(0)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [deliveredActivity, setDeliveredActivity] = useState<Activity | null>(null)
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { changeView } = useTimeView()

  const handleViewChange = (view: TimeView) => {
    changeView(view, scrollContainerRef as React.RefObject<HTMLElement>)
  }

  const handleScrollToToday = () => {
    if (!scrollContainerRef.current) return
    const chartStart = getChartStartDate()
    const px = dateToPixel(new Date(), chartStart, timeView)
    const width = scrollContainerRef.current.clientWidth
    scrollContainerRef.current.scrollLeft = Math.max(0, px - width / 2)
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    setActiveDragData(null)

    if (!over) return
    const dragData = active.data.current as DragData | undefined
    if (!dragData) return

    const overId = String(over.id)

    // Drop on sidebar -> unschedule
    if (overId === 'activity-sidebar') {
      unscheduleActivity(dragData.activityId)
      return
    }

    // Determine row
    let rowIndex = 0
    if (overId.startsWith('row-')) {
      rowIndex = parseInt(overId.replace('row-', ''), 10)
    } else if (overId !== 'gantt-chart') {
      return
    }

    const chartStart = getChartStartDate()
    let newStartDate: Date

    if (dragData.source === 'sidebar') {
      // Use the drop target rect center + pointer delta
      const overRect = over.rect as DOMRectReadOnly | null
      if (!overRect) return
      const ganttContainerRect = scrollContainerRef.current?.getBoundingClientRect()
      if (!ganttContainerRect) return
      const pointerXInGantt =
        overRect.left - ganttContainerRect.left + overRect.width / 2 + delta.x + scrollLeft
      newStartDate = pixelToDate(pointerXInGantt, chartStart, timeView)
    } else {
      // Chart to chart: original pixel offset + horizontal delta
      const originalPx = dragData.originalOffsetPx ?? 0
      newStartDate = pixelToDate(originalPx + delta.x, chartStart, timeView)
    }

    const snapped = snapDateToView(newStartDate, timeView)
    scheduleActivity(dragData.activityId, snapped, rowIndex)
  }

  const handleCreateActivity = (input: CreateActivityInput) => {
    const now = new Date()
    const activityId = generateId()
    const newActivity: Activity = {
      id: activityId,
      name: input.name,
      description: input.description,
      color: input.color ?? DEFAULT_ACTIVITY_COLOR,
      durationSprints: input.durationSprints ?? 1,
      startDate: null,
      rowIndex: null,
      isDelivered: false,
      deliveryDate: null,
      deliveryLabel: null,
      projectId: project.id,
      tags: (input.tags ?? []).map((t) => ({
        id: generateId(),
        name: t.name,
        color: t.color,
        activityId: activityId,
      })),
      createdAt: now,
      updatedAt: now,
    }
    addActivity(newActivity)
  }

  const handleEditActivitySubmit = (input: CreateActivityInput) => {
    if (!editActivity) return
    updateActivity(editActivity.id, {
      name: input.name,
      description: input.description,
      color: input.color,
      durationSprints: input.durationSprints,
    })
    setEditActivity(null)
  }

  const handleMarkDelivered = (activityId: string, deliveryDate: Date, label: string) => {
    updateActivity(activityId, {
      isDelivered: true,
      deliveryDate,
      deliveryLabel: label || undefined,
    })
  }

  const handleExport = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const jspdfModule = await import('jspdf')
      const JsPDF = jspdfModule.jsPDF ?? (jspdfModule as unknown as { default: typeof import('jspdf').jsPDF }).default
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
    } catch (error) {
      console.error('Failed to export PDF:', error)
    }
  }

  const unscheduled = getUnscheduledActivities()
  const allActivitiesFiltered = getFilteredActivities()
  const scheduledFiltered = allActivitiesFiltered.filter((a) => a.startDate != null)

  const allTags = useMemo(
    () =>
      Array.from(
        new Map(
          activities.flatMap((a) => a.tags).map((t) => [t.name, { name: t.name, color: t.color }])
        ).values()
      ),
    [activities]
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
        />

        <div className="flex flex-1 overflow-hidden">
          <ActivitySidebar
            activities={unscheduled}
            allTags={allTags}
            onCreateActivity={handleCreateActivity}
            onEditActivity={(a) => setEditActivity(a)}
            onDeleteActivity={removeActivity}
          />

          <div id="gantt-export-target" className="flex-1 overflow-hidden flex flex-col">
            <GanttChart
              activities={scheduledFiltered}
              sprintDays={project.sprintDuration}
              timeView={timeView}
              onEdit={(a) => setEditActivity(a)}
              onMarkDelivered={(a) => setDeliveredActivity(a)}
              onDelete={removeActivity}
              onScrollChange={setScrollLeft}
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
        <CreateActivityDialog
          open={!!editActivity}
          onOpenChange={(open) => !open && setEditActivity(null)}
          onSubmit={handleEditActivitySubmit}
          initialValues={editActivity}
          mode="edit"
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
