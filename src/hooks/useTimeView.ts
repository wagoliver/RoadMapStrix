'use client'

import { useCallback } from 'react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { TIME_VIEWS, TimeView, COLUMN_CONFIG } from '@/lib/gantt/columnConfig'
import { dateToPixel } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'
import { differenceInCalendarDays } from 'date-fns'

// For wide views (quarter+), center the column that contains today rather than
// the exact today pixel — gives a better overview of the current period.
const WIDE_VIEWS: TimeView[] = ['quarter', 'semester', 'year']

export function scrollToToday(
  view: TimeView,
  scrollEl: HTMLElement,
) {
  const chartStart = getChartStartDate()
  const today = new Date()
  const { columnWidthPx, unitDays } = COLUMN_CONFIG[view]

  let targetPx: number
  if (WIDE_VIEWS.includes(view)) {
    const days = differenceInCalendarDays(today, chartStart)
    const colIndex = Math.floor(days / unitDays)
    targetPx = (colIndex + 0.5) * columnWidthPx          // midpoint of column
  } else {
    targetPx = dateToPixel(today, chartStart, view)       // exact today
  }

  scrollEl.scrollLeft = Math.max(0, targetPx - scrollEl.clientWidth / 2)
}

export function useTimeView() {
  const { timeView, setTimeView } = useRoadmapStore()

  const changeView = useCallback(
    (view: TimeView, scrollContainerRef?: React.RefObject<HTMLElement>) => {
      setTimeView(view)
      if (scrollContainerRef?.current) {
        // Use rAF so the DOM has updated column widths before we scroll
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) scrollToToday(view, scrollContainerRef.current)
        })
      }
    },
    [setTimeView]
  )

  const cycleView = useCallback(
    (direction: 1 | -1, scrollContainerRef?: React.RefObject<HTMLElement>) => {
      const idx = TIME_VIEWS.indexOf(timeView)
      const next = TIME_VIEWS[Math.max(0, Math.min(TIME_VIEWS.length - 1, idx + direction))]
      changeView(next, scrollContainerRef)
    },
    [timeView, changeView]
  )

  return { timeView, changeView, cycleView, views: TIME_VIEWS }
}
