'use client'

import { format } from 'date-fns'
import { getActivityEndDate } from '@/lib/gantt/positionUtils'
import { dateToPixel } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'
import { TimeView } from '@/lib/gantt/columnConfig'
import { Activity } from '@/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface DeliveryMarkerProps {
  activity: Activity
  sprintDays: number
  timeView: TimeView
}

export function DeliveryMarker({ activity, sprintDays, timeView }: DeliveryMarkerProps) {
  if (!activity.deliveryDate || !activity.startDate) return null

  const chartStart = getChartStartDate()
  const plannedEnd = getActivityEndDate(
    new Date(activity.startDate),
    activity.durationSprints,
    sprintDays
  )
  const deliveryDate = new Date(activity.deliveryDate)
  const isLate = deliveryDate > plannedEnd
  const color = isLate ? '#f59e0b' : '#22c55e'

  const leftPx = dateToPixel(deliveryDate, chartStart, timeView)
  const activityLeftPx = dateToPixel(new Date(activity.startDate), chartStart, timeView)
  const relativeLeft = leftPx - activityLeftPx

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className="absolute top-0 h-full pointer-events-auto cursor-default"
          style={{ left: relativeLeft }}
        >
          {/* Dashed vertical line */}
          <div
            className="absolute top-0 h-full w-px border-l-2 border-dashed"
            style={{ borderColor: color }}
          />
          {/* Diamond icon */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45"
            style={{ backgroundColor: color }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{isLate ? '⚠️ Late Delivery' : '✅ On-time Delivery'}</p>
        <p className="text-xs text-muted-foreground">
          {activity.deliveryLabel || format(deliveryDate, 'MMM d, yyyy')}
        </p>
        {isLate && (
          <p className="text-xs text-amber-500">
            Planned: {format(plannedEnd, 'MMM d, yyyy')}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
