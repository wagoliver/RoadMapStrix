'use client'

import { useEffect, useState } from 'react'
import { startOfDay } from 'date-fns'
import { dateToPixel } from '@/lib/gantt/positionUtils'
import { getChartStartDate, msUntilMidnight } from '@/lib/gantt/timeEngine'
import { TimeView } from '@/lib/gantt/columnConfig'

interface TodayMarkerProps {
  timeView: TimeView
}

export function TodayMarker({ timeView }: TodayMarkerProps) {
  const [today, setToday] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    const schedule = () => {
      const ms = msUntilMidnight()
      const t = setTimeout(() => {
        setToday(startOfDay(new Date()))
        schedule()
      }, ms)
      return t
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  const chartStart = getChartStartDate()
  const leftPx = dateToPixel(today, chartStart, timeView)

  return (
    <div
      className="absolute top-0 h-full w-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ left: leftPx }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
    </div>
  )
}
