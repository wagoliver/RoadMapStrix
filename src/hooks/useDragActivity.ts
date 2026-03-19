'use client'

import { useCallback } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { useRoadmapStore } from '@/store/roadmapStore'
import { pixelToDate, snapDateToView } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'
import { TimeView } from '@/lib/gantt/columnConfig'

export interface DragData {
  source: 'sidebar' | 'chart'
  activityId: string
  originalStartDate?: Date
  originalRow?: number
  originalOffsetPx?: number
}

export function useDragActivity(
  timeView: TimeView,
  scrollLeft: number,
  onPersist?: (id: string, updates: { startDate: Date | null; rowIndex: number | null }) => void
) {
  const { scheduleActivity, unscheduleActivity, setDragPreview } = useRoadmapStore()

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event
      setDragPreview(null)

      if (!over) return

      const dragData = active.data.current as DragData | undefined
      if (!dragData) return

      const overId = String(over.id)

      // Drop on sidebar -> unschedule
      if (overId === 'activity-sidebar') {
        unscheduleActivity(dragData.activityId)
        onPersist?.(dragData.activityId, { startDate: null, rowIndex: null })
        return
      }

      // Drop on chart row
      const chartStart = getChartStartDate()

      if (overId === 'gantt-chart' || overId.startsWith('row-')) {
        const rowIndex = overId.startsWith('row-')
          ? parseInt(overId.replace('row-', ''))
          : 0

        let newStartDate: Date

        if (dragData.source === 'sidebar') {
          // The drop position is relative to the chart - we need the pointer position
          // Use over's rect and the delta from the drag
          const overRect = over.rect
          const pointerX = (overRect?.left ?? 0) + (overRect?.width ?? 0) / 2 + delta.x + scrollLeft
          newStartDate = pixelToDate(pointerX, chartStart, timeView)
        } else {
          // Chart to chart: delta based repositioning
          const originalPx = dragData.originalOffsetPx ?? 0
          newStartDate = pixelToDate(originalPx + delta.x, chartStart, timeView)
        }

        const snapped = snapDateToView(newStartDate, timeView)
        scheduleActivity(dragData.activityId, snapped, rowIndex)
        onPersist?.(dragData.activityId, { startDate: snapped, rowIndex })
      }
    },
    [timeView, scrollLeft, scheduleActivity, unscheduleActivity, setDragPreview, onPersist]
  )

  return { handleDragEnd }
}
