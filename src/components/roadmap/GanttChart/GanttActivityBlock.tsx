'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Activity } from '@/types'
import { TimeView } from '@/lib/gantt/columnConfig'
import { dateToPixel, activityWidthPx } from '@/lib/gantt/positionUtils'
import { getChartStartDate } from '@/lib/gantt/timeEngine'
import { DeliveryMarker } from './DeliveryMarker'
import { ROW_HEIGHT } from './GanttGrid'
import { cn } from '@/lib/utils'
import { DragData } from '@/hooks/useDragActivity'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface GanttActivityBlockProps {
  activity: Activity
  sprintDays: number
  timeView: TimeView
  onEdit?: (activity: Activity) => void
  onMarkDelivered?: (activity: Activity) => void
  onDelete?: (activityId: string) => void
}

const BLOCK_PADDING = 4

export function GanttActivityBlock({
  activity,
  sprintDays,
  timeView,
  onEdit,
  onMarkDelivered,
  onDelete,
}: GanttActivityBlockProps) {
  const chartStart = getChartStartDate()
  const startDate = activity.startDate ? new Date(activity.startDate) : null
  const leftPx = startDate ? dateToPixel(startDate, chartStart, timeView) : 0
  const widthPx = activityWidthPx(activity.durationSprints, sprintDays, timeView)
  const topPx = (activity.rowIndex ?? 0) * ROW_HEIGHT + BLOCK_PADDING

  const dragData: DragData = {
    source: 'chart',
    activityId: activity.id,
    originalStartDate: startDate ?? undefined,
    originalRow: activity.rowIndex ?? 0,
    originalOffsetPx: leftPx,
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `activity-${activity.id}`,
    data: dragData,
  })

  if (!startDate) return null

  const style = {
    left: leftPx,
    top: topPx,
    width: widthPx,
    height: ROW_HEIGHT - BLOCK_PADDING * 2,
    backgroundColor: activity.color,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            'absolute rounded-md cursor-grab active:cursor-grabbing select-none overflow-hidden',
            'flex items-center px-2 text-white text-xs font-medium',
            'shadow-sm hover:shadow-md transition-shadow',
            isDragging && 'z-50'
          )}
          style={style}
        >
          <span className="truncate flex-1">{activity.name}</span>

          {/* Tags */}
          {activity.tags.length > 0 && (
            <div className="flex gap-0.5 ml-1 flex-shrink-0">
              {activity.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1 py-0.5 rounded text-white/90 text-[10px]"
                  style={{ backgroundColor: tag.color + '99' }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Delivery marker */}
          {activity.isDelivered && activity.deliveryDate && (
            <DeliveryMarker
              activity={activity}
              sprintDays={sprintDays}
              timeView={timeView}
            />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit?.(activity)}>
          Edit Activity
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMarkDelivered?.(activity)}>
          {activity.isDelivered ? 'Update Delivery' : 'Mark as Delivered'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete?.(activity.id)}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
