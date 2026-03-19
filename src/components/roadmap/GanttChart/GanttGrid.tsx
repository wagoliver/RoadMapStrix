'use client'

import { TimeView } from '@/lib/gantt/columnConfig'
import { generateTimeHeader, getChartStartDate, getChartEndDate } from '@/lib/gantt/timeEngine'
import { cn } from '@/lib/utils'

const ROW_HEIGHT = 56

interface GanttGridProps {
  timeView: TimeView
  rowCount: number
  totalWidthPx: number
}

export function GanttGrid({ timeView, rowCount, totalWidthPx }: GanttGridProps) {
  const chartStart = getChartStartDate()
  const chartEnd = getChartEndDate(chartStart)
  const { columns } = generateTimeHeader(chartStart, chartEnd, timeView)

  const totalHeight = Math.max(rowCount, 10) * ROW_HEIGHT

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: totalWidthPx, height: totalHeight }}
    >
      {/* Vertical column lines */}
      {columns.map((col, i) => {
        const left = columns.slice(0, i).reduce((acc, c) => acc + c.widthPx, 0)
        return (
          <div
            key={i}
            className={cn(
              'absolute top-0 h-full border-r',
              col.isCurrent ? 'border-primary/20 bg-primary/5' : 'border-border/30'
            )}
            style={{ left, width: col.widthPx }}
          />
        )
      })}

      {/* Horizontal row lines */}
      {Array.from({ length: Math.max(rowCount, 10) }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 w-full border-b border-border/20"
          style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
        />
      ))}
    </div>
  )
}

export { ROW_HEIGHT }
