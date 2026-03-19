'use client'

import { useCallback } from 'react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { TIME_VIEWS, TimeView } from '@/lib/gantt/columnConfig'
import { dateToPixel } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'

export function useTimeView() {
  const { timeView, setTimeView } = useRoadmapStore()

  const changeView = useCallback(
    (view: TimeView, scrollContainerRef?: React.RefObject<HTMLElement>) => {
      setTimeView(view)
      if (scrollContainerRef?.current) {
        const chartStart = getChartStartDate()
        const today = new Date()
        const px = dateToPixel(today, chartStart, view)
        const containerWidth = scrollContainerRef.current.clientWidth
        scrollContainerRef.current.scrollLeft = Math.max(0, px - containerWidth / 2)
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
