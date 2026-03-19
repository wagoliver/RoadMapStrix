'use client'

import { useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Activity, ActivityDependency } from '@/types'
import { TimeView } from '@/lib/gantt/columnConfig'
import { generateTimeHeader, getChartStartDate, getChartEndDate } from '@/lib/gantt/timeEngine'
import { dateToPixel } from '@/lib/gantt/positionUtils'
import { GanttHeader } from './GanttHeader'
import { GanttGrid, ROW_HEIGHT } from './GanttGrid'
import { GanttRow } from './GanttRow'
import { GanttActivityBlock } from './GanttActivityBlock'
import { TodayMarker } from './TodayMarker'
import { DependencyArrows } from './DependencyArrows'

interface GanttChartProps {
  activities: Activity[]
  dependencies?: ActivityDependency[]
  sprintDays: number
  timeView: TimeView
  onEdit?: (activity: Activity) => void
  onMarkDelivered?: (activity: Activity) => void
  onDelete?: (activityId: string) => void
  onScrollChange?: (scrollLeft: number) => void
  scrollContainerRef: React.RefObject<HTMLDivElement>
}

export function GanttChart({
  activities,
  dependencies = [],
  sprintDays,
  timeView,
  onEdit,
  onMarkDelivered,
  onDelete,
  onScrollChange,
  scrollContainerRef,
}: GanttChartProps) {
  const chartStart = getChartStartDate()
  const chartEnd = getChartEndDate(chartStart)
  const { totalWidthPx } = generateTimeHeader(chartStart, chartEnd, timeView)

  const scheduledActivities = activities.filter((a) => a.startDate != null)
  const maxRow = scheduledActivities.reduce((max, a) => Math.max(max, (a.rowIndex ?? 0) + 1), 5)
  const rowCount = Math.max(maxRow + 2, 10)
  const totalHeight = rowCount * ROW_HEIGHT

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: 'gantt-chart',
  })

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      onScrollChange?.(scrollContainerRef.current.scrollLeft)
    }
  }

  // Auto-scroll to today on mount and view change
  useEffect(() => {
    if (!scrollContainerRef.current) return
    const today = new Date()
    const currentChartStart = getChartStartDate()
    const leftPx = dateToPixel(today, currentChartStart, timeView)
    const containerWidth = scrollContainerRef.current.clientWidth
    scrollContainerRef.current.scrollLeft = Math.max(0, leftPx - containerWidth / 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeView])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative"
        onScroll={handleScroll}
      >
        <div style={{ width: totalWidthPx, minHeight: totalHeight + 40 }} className="relative">
          {/* Sticky header */}
          <GanttHeader timeView={timeView} totalWidthPx={totalWidthPx} />

          {/* Chart body */}
          <div
            ref={setDroppableRef}
            className="relative"
            style={{ width: totalWidthPx, height: totalHeight }}
          >
            <GanttGrid timeView={timeView} rowCount={rowCount} totalWidthPx={totalWidthPx} />

            {/* Drop rows */}
            {Array.from({ length: rowCount }).map((_, i) => (
              <GanttRow key={i} rowIndex={i} totalWidthPx={totalWidthPx} />
            ))}

            {/* Today marker */}
            <TodayMarker timeView={timeView} />

            {/* Dependency arrows */}
            <DependencyArrows
              activities={scheduledActivities}
              dependencies={dependencies}
              sprintDays={sprintDays}
              timeView={timeView}
            />

            {/* Activity blocks */}
            {scheduledActivities.map((activity) => (
              <GanttActivityBlock
                key={activity.id}
                activity={activity}
                sprintDays={sprintDays}
                timeView={timeView}
                onEdit={onEdit}
                onMarkDelivered={onMarkDelivered}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
