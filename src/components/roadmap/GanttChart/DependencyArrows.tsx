'use client'

import { Activity, ActivityDependency } from '@/types'
import { TimeView } from '@/lib/gantt/columnConfig'
import { dateToPixel, activityWidthPx } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'
import { ROW_HEIGHT } from './GanttGrid'

interface DependencyArrowsProps {
  activities: Activity[]
  dependencies: ActivityDependency[]
  sprintDays: number
  timeView: TimeView
}

export function DependencyArrows({
  activities,
  dependencies,
  sprintDays,
  timeView,
}: DependencyArrowsProps) {
  const chartStart = getChartStartDate()
  const actMap = new Map(activities.map((a) => [a.id, a]))

  const arrows = dependencies.flatMap((dep) => {
    const from = actMap.get(dep.fromId)
    const to = actMap.get(dep.toId)
    if (!from?.startDate || !to?.startDate) return []

    const fromLeft = dateToPixel(new Date(from.startDate), chartStart, timeView)
    const fromWidth = activityWidthPx(from.durationSprints, sprintDays, timeView)
    const fromX = fromLeft + fromWidth
    const fromY = (from.rowIndex ?? 0) * ROW_HEIGHT + ROW_HEIGHT / 2

    const toLeft = dateToPixel(new Date(to.startDate), chartStart, timeView)
    const toX = toLeft
    const toY = (to.rowIndex ?? 0) * ROW_HEIGHT + ROW_HEIGHT / 2

    return [{ id: dep.id, fromX, fromY, toX, toY }]
  })

  if (arrows.length === 0) return null

  const maxX = Math.max(...arrows.flatMap((a) => [a.fromX, a.toX])) + 50
  const maxY = Math.max(...arrows.flatMap((a) => [a.fromY, a.toY])) + 50

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-10"
      style={{ width: maxX, height: maxY }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
        </marker>
      </defs>
      {arrows.map((arrow) => {
        const midX = (arrow.fromX + arrow.toX) / 2
        const path = `M ${arrow.fromX} ${arrow.fromY} C ${midX} ${arrow.fromY}, ${midX} ${arrow.toY}, ${arrow.toX} ${arrow.toY}`
        return (
          <path
            key={arrow.id}
            d={path}
            stroke="#94a3b8"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />
        )
      })}
    </svg>
  )
}
