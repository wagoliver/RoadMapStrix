'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { ROW_HEIGHT } from './GanttGrid'

interface GanttRowProps {
  rowIndex: number
  totalWidthPx: number
  isOver?: boolean
}

export function GanttRow({ rowIndex, totalWidthPx, isOver }: GanttRowProps) {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id: `row-${rowIndex}`,
    data: { rowIndex },
  })

  const over = isOver || dndIsOver

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-0 transition-colors',
        over && 'bg-primary/5'
      )}
      style={{
        top: rowIndex * ROW_HEIGHT,
        width: totalWidthPx,
        height: ROW_HEIGHT,
      }}
    />
  )
}
