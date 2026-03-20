'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Activity, ActivityDependency } from '@/types'
import { TimeView } from '@/lib/gantt/columnConfig'
import { dateToPixel, activityWidthPx, isQuarterAnchored, quarterFillWidthPx } from '@/lib/gantt/positionUtils'
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
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface GanttActivityBlockProps {
  activity: Activity
  allActivities?: Activity[]
  dependencies?: ActivityDependency[]
  sprintDays: number
  timeView: TimeView
  onEdit?: (activity: Activity) => void
  onMarkDelivered?: (activity: Activity) => void
  onDelete?: (activityId: string) => void
  onAddDependency?: (fromId: string, toId: string) => void
  onRemoveDependency?: (depId: string) => void
}

const BLOCK_PADDING = 4

export function GanttActivityBlock({
  activity,
  allActivities = [],
  dependencies = [],
  sprintDays,
  timeView,
  onEdit,
  onMarkDelivered,
  onDelete,
  onAddDependency,
  onRemoveDependency,
}: GanttActivityBlockProps) {
  const chartStart = getChartStartDate()
  const startDate = activity.startDate ? new Date(activity.startDate) : null
  const leftPx = startDate ? dateToPixel(startDate, chartStart, timeView) : 0

  const FILL_VIEWS = ['quarter', 'semester', 'year']
  const shouldFill =
    startDate &&
    activity.quarter &&
    FILL_VIEWS.includes(timeView) &&
    isQuarterAnchored(startDate, activity.quarter)

  const widthPx = shouldFill
    ? quarterFillWidthPx(startDate!, timeView)
    : activityWidthPx(activity.durationSprints, sprintDays, timeView)

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

  // Dependencies this activity already has
  const existingDepIds = new Set([
    ...dependencies.filter((d) => d.fromId === activity.id).map((d) => d.toId),
    ...dependencies.filter((d) => d.toId === activity.id).map((d) => d.fromId),
  ])

  const availableTargets = allActivities.filter(
    (a) => a.id !== activity.id && !existingDepIds.has(a.id)
  )

  const currentDeps = dependencies.filter(
    (d) => d.fromId === activity.id || d.toId === activity.id
  )

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

        {/* Add dependency */}
        {onAddDependency && availableTargets.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Add Dependency</ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-h-60 overflow-y-auto">
              {availableTargets.map((target) => (
                <ContextMenuItem
                  key={target.id}
                  onClick={() => onAddDependency(activity.id, target.id)}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: target.color }}
                  />
                  {target.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {/* Remove dependency */}
        {onRemoveDependency && currentDeps.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Remove Dependency</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {currentDeps.map((dep) => {
                const otherId = dep.fromId === activity.id ? dep.toId : dep.fromId
                const other = allActivities.find((a) => a.id === otherId)
                return (
                  <ContextMenuItem
                    key={dep.id}
                    onClick={() => onRemoveDependency(dep.id)}
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: other?.color ?? '#94a3b8' }}
                    />
                    {other?.name ?? otherId}
                  </ContextMenuItem>
                )
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

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
