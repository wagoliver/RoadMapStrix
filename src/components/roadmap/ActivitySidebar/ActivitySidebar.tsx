'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Activity, CreateActivityInput } from '@/types'
import { ActivityCard } from './ActivityCard'
import { CreateActivityDialog } from './CreateActivityDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRoadmapStore } from '@/store/roadmapStore'

interface ActivitySidebarProps {
  activities: Activity[]
  allTags: { name: string; color: string }[]
  onCreateActivity: (input: CreateActivityInput) => void
  onEditActivity: (activity: Activity) => void
  onDeleteActivity: (id: string) => void
}

export function ActivitySidebar({
  activities,
  allTags,
  onCreateActivity,
  onEditActivity,
  onDeleteActivity,
}: ActivitySidebarProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { activeTagFilter, setTagFilter } = useRoadmapStore()

  const { setNodeRef, isOver } = useDroppable({ id: 'activity-sidebar' })

  const filtered = activities.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) &&
      (activeTagFilter ? a.tags.some((t) => t.name === activeTagFilter) : true)
  )

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-72 flex-shrink-0 border-r bg-card flex flex-col',
        isOver && 'bg-primary/5'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Activities</h2>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge
              variant={activeTagFilter === null ? 'default' : 'outline'}
              className="cursor-pointer text-xs h-5"
              onClick={() => setTagFilter(null)}
            >
              All
            </Badge>
            {allTags.map((tag) => (
              <Badge
                key={tag.name}
                variant={activeTagFilter === tag.name ? 'default' : 'outline'}
                className="cursor-pointer text-xs h-5"
                style={
                  activeTagFilter === tag.name
                    ? { backgroundColor: tag.color, borderColor: tag.color }
                    : { borderColor: tag.color, color: tag.color }
                }
                onClick={() => setTagFilter(activeTagFilter === tag.name ? null : tag.name)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Unscheduled activity list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {activities.length === 0
                ? 'No activities yet'
                : 'No unscheduled activities'}
            </p>
            <p className="text-xs mt-1 opacity-70">
              {activities.length === 0
                ? 'Click "New" to create one'
                : 'Drag from chart to unschedule'}
            </p>
          </div>
        ) : (
          filtered.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
            />
          ))
        )}
      </div>

      {/* Drop zone indicator */}
      {isOver && (
        <div className="p-3 border-t bg-primary/10 text-center text-sm text-primary font-medium">
          Drop to unschedule
        </div>
      )}

      <CreateActivityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={onCreateActivity}
      />
    </div>
  )
}
