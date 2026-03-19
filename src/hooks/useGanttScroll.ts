'use client'

import { useRef, useCallback, useEffect } from 'react'
import { dateToPixel } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'
import { TimeView } from '@/lib/gantt/columnConfig'

export function useGanttScroll(timeView: TimeView) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToDate = useCallback(
    (date: Date, center = true) => {
      if (!scrollRef.current) return
      const chartStart = getChartStartDate()
      const px = dateToPixel(date, chartStart, timeView)
      const containerWidth = scrollRef.current.clientWidth
      scrollRef.current.scrollLeft = center
        ? Math.max(0, px - containerWidth / 2)
        : Math.max(0, px - 100)
    },
    [timeView]
  )

  const scrollToToday = useCallback(() => {
    scrollToDate(new Date(), true)
  }, [scrollToDate])

  // Auto-scroll to today on mount and view change
  useEffect(() => {
    scrollToToday()
  }, [timeView, scrollToToday])

  return { scrollRef, scrollToDate, scrollToToday }
}
