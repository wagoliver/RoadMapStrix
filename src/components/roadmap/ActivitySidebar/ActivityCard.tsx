'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Activity } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { DragData } from '@/hooks/useDragActivity'

interface ActivityCardProps {
  activity: Activity
  onEdit?: (activity: Activity) => void
  onDelete?: (id: string) => void
  showQuarter?: boolean
}

export function ActivityCard({ activity, onEdit, onDelete, showQuarter }: ActivityCardProps) {
  const dragData: DragData = {
    source: 'sidebar',
    activityId: activity.id,
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-activity-${activity.id}`,
    data: dragData,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing',
        isDragging && 'z-50'
      )}
    >
      {/* Drag handle */}
      <div {...listeners} {...attributes} className="mt-0.5 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Color indicator */}
      <div
        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
        style={{ backgroundColor: activity.color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.name}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.description}</p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">
            {activity.durationSprints} sprint{activity.durationSprints !== 1 ? 's' : ''}
          </span>
          {showQuarter && activity.quarter && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${activity.color}25`, color: activity.color }}
            >
              {activity.quarter}
            </span>
          )}
          {activity.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-[10px] h-4 px-1"
              style={{ backgroundColor: tag.color + '33', color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={(e) => { e.stopPropagation(); onEdit?.(activity) }}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete?.(activity.id) }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
