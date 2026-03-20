'use client'

import { useEffect, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Activity, ActivityDependency } from '@/types'
import { TIME_VIEWS, TimeView } from '@/lib/gantt/columnConfig'
import { generateTimeHeader, getChartStartDate, getChartEndDate } from '@/lib/gantt/timeEngine'
import { dateToPixel, pixelToDate } from '@/lib/gantt/positionUtils'
import { GanttHeader } from './GanttHeader'
import { GanttGrid, ROW_HEIGHT } from './GanttGrid'
import { GanttRow } from './GanttRow'
import { GanttActivityBlock } from './GanttActivityBlock'
import { TodayMarker } from './TodayMarker'
import { DependencyArrows } from './DependencyArrows'
import { ZoomIn, ZoomOut } from 'lucide-react'

const VIEW_LABELS: Record<TimeView, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
  quarter: 'Quarter',
  semester: 'Semestre',
  year: 'Ano',
}

interface GanttChartProps {
  activities: Activity[]
  dependencies?: ActivityDependency[]
  sprintDays: number
  timeView: TimeView
  onEdit?: (activity: Activity) => void
  onMarkDelivered?: (activity: Activity) => void
  onDelete?: (activityId: string) => void
  onAddDependency?: (fromId: string, toId: string) => void
  onRemoveDependency?: (depId: string) => void
  onScrollChange?: (scrollLeft: number) => void
  onZoom?: (direction: 1 | -1) => void
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
  onAddDependency,
  onRemoveDependency,
  onScrollChange,
  onZoom,
  scrollContainerRef,
}: GanttChartProps) {
  const chartStart = getChartStartDate()
  const chartEnd = getChartEndDate(chartStart)
  const { totalWidthPx } = generateTimeHeader(chartStart, chartEnd, timeView)

  const [containerHeight, setContainerHeight] = useState(600)

  const scheduledActivities = activities.filter((a) => a.startDate != null)
  const maxRow = scheduledActivities.reduce((max, a) => Math.max(max, (a.rowIndex ?? 0) + 1), 5)
  const minRowsForHeight = Math.ceil(containerHeight / ROW_HEIGHT) + 1
  const rowCount = Math.max(maxRow + 2, minRowsForHeight, 10)
  const totalHeight = rowCount * ROW_HEIGHT

  const { setNodeRef: setDroppableRef } = useDroppable({ id: 'gantt-chart' })

  // Preserves the date at the viewport center across zoom changes
  const zoomCenterDateRef = useRef<Date | null>(null)

  // Pan state
  const isPanningRef = useRef(false)
  const panStartXRef = useRef(0)
  const panStartYRef = useRef(0)
  const panStartScrollRef = useRef(0)
  const panStartScrollTopRef = useRef(0)

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      onScrollChange?.(scrollContainerRef.current.scrollLeft)
    }
  }

  // Scroll to center date (or today) when timeView changes
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const current = getChartStartDate()
    const target = zoomCenterDateRef.current ?? new Date()
    zoomCenterDateRef.current = null
    const px = dateToPixel(target, current, timeView)
    el.scrollLeft = Math.max(0, px - el.clientWidth / 2)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeView])

  // Measure container height to fill grid rows
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height)
    })
    ro.observe(el)
    setContainerHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [scrollContainerRef])

  // Pan + wheel-zoom event listeners
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      // Don't pan if clicking on an activity block
      if ((e.target as Element).closest('[data-activity-block]')) return
      isPanningRef.current = true
      panStartXRef.current = e.clientX
      panStartYRef.current = e.clientY
      panStartScrollRef.current = el.scrollLeft
      panStartScrollTopRef.current = el.scrollTop
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return
      el.scrollLeft = panStartScrollRef.current - (e.clientX - panStartXRef.current)
      el.scrollTop = panStartScrollTopRef.current - (e.clientY - panStartYRef.current)
    }

    const stopPan = () => {
      if (!isPanningRef.current) return
      isPanningRef.current = false
      el.style.cursor = ''
      el.style.userSelect = ''
    }

    const onWheel = (e: WheelEvent) => {
      // Ctrl+Wheel = zoom, plain wheel = native scroll (vertical/horizontal)
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const direction = e.deltaY > 0 ? 1 : -1
      const rect = el.getBoundingClientRect()
      const mouseXInChart = e.clientX - rect.left + el.scrollLeft
      const current = getChartStartDate()
      zoomCenterDateRef.current = pixelToDate(mouseXInChart, current, timeView)
      onZoom?.(direction)
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseup', stopPan)
    el.addEventListener('mouseleave', stopPan)
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseup', stopPan)
      el.removeEventListener('mouseleave', stopPan)
      el.removeEventListener('wheel', onWheel)
    }
  }, [scrollContainerRef, timeView, onZoom])

  const currentViewIdx = TIME_VIEWS.indexOf(timeView)
  const canZoomIn = currentViewIdx > 0
  const canZoomOut = currentViewIdx < TIME_VIEWS.length - 1

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative cursor-grab active:cursor-grabbing"
        onScroll={handleScroll}
      >
        <div style={{ width: totalWidthPx, minHeight: totalHeight + 40 }} className="relative">
          <GanttHeader timeView={timeView} totalWidthPx={totalWidthPx} />

          <div
            ref={setDroppableRef}
            className="relative"
            style={{ width: totalWidthPx, height: totalHeight }}
          >
            <GanttGrid timeView={timeView} rowCount={rowCount} totalWidthPx={totalWidthPx} />

            {Array.from({ length: rowCount }).map((_, i) => (
              <GanttRow key={i} rowIndex={i} totalWidthPx={totalWidthPx} />
            ))}

            <TodayMarker timeView={timeView} />

            <DependencyArrows
              activities={scheduledActivities}
              dependencies={dependencies}
              sprintDays={sprintDays}
              timeView={timeView}
            />

            {scheduledActivities.map((activity) => (
              <GanttActivityBlock
                key={activity.id}
                activity={activity}
                allActivities={scheduledActivities}
                dependencies={dependencies}
                sprintDays={sprintDays}
                timeView={timeView}
                onEdit={onEdit}
                onMarkDelivered={onMarkDelivered}
                onDelete={onDelete}
                onAddDependency={onAddDependency}
                onRemoveDependency={onRemoveDependency}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating zoom controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-card/95 border border-border rounded-lg px-1.5 py-1 shadow-lg backdrop-blur-sm">
        <button
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => onZoom?.(-1)}
          disabled={!canZoomIn}
          title="Mais detalhe"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-semibold text-foreground w-14 text-center tabular-nums">
          {VIEW_LABELS[timeView]}
        </span>
        <button
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => onZoom?.(1)}
          disabled={!canZoomOut}
          title="Menos detalhe"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
