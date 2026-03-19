'use client'

import { TimeView } from '@/lib/gantt/columnConfig'
import { generateTimeHeader, getChartStartDate, getChartEndDate } from '@/lib/gantt/timeEngine'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface GanttHeaderProps {
  timeView: TimeView
  totalWidthPx: number
}

export function GanttHeader({ timeView, totalWidthPx }: GanttHeaderProps) {
  const chartStart = getChartStartDate()
  const chartEnd = getChartEndDate(chartStart)
  const { columns } = generateTimeHeader(chartStart, chartEnd, timeView)

  // For day view, show month labels above
  const showMonthRow = timeView === 'day' || timeView === 'week'

  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border" style={{ width: totalWidthPx }}>
      {showMonthRow && (
        <div className="flex border-b border-border/50 h-6">
          {/* month grouping for day/week views */}
          {(() => {
            const groups: { label: string; widthPx: number }[] = []
            let curMonth = ''
            let curWidth = 0
            for (const col of columns) {
              const monthLabel = format(col.date, 'MMM yyyy')
              if (monthLabel !== curMonth) {
                if (curMonth) groups.push({ label: curMonth, widthPx: curWidth })
                curMonth = monthLabel
                curWidth = col.widthPx
              } else {
                curWidth += col.widthPx
              }
            }
            if (curMonth) groups.push({ label: curMonth, widthPx: curWidth })
            return groups.map((g, i) => (
              <div
                key={i}
                className="flex-shrink-0 border-r border-border/50 text-xs text-muted-foreground px-2 flex items-center overflow-hidden"
                style={{ width: g.widthPx }}
              >
                {g.label}
              </div>
            ))
          })()}
        </div>
      )}
      <div className="flex h-8">
        {columns.map((col, i) => (
          <div
            key={i}
            className={cn(
              'flex-shrink-0 border-r border-border/50 text-xs flex items-center justify-center overflow-hidden select-none',
              col.isCurrent ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
            )}
            style={{ width: col.widthPx }}
          >
            {col.widthPx > 20 ? col.label : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
