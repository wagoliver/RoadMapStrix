'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Calendar, Download, RefreshCw, SlidersHorizontal, Users } from 'lucide-react'
import { TimeView, COLUMN_CONFIG, TIME_VIEWS } from '@/lib/gantt/columnConfig'
import { cn } from '@/lib/utils'

interface RoadmapToolbarProps {
  projectName: string
  timeView: TimeView
  onViewChange: (view: TimeView) => void
  onScrollToToday: () => void
  onExport?: () => void
  onRefresh?: () => Promise<void>
  isRefreshing?: boolean
  filterOpen?: boolean
  activeFilterCount?: number
  onToggleFilter?: () => void
  onOpenMembers?: () => void
  memberCount?: number
}

export function RoadmapToolbar({
  projectName,
  timeView,
  onViewChange,
  onScrollToToday,
  onExport,
  onRefresh,
  isRefreshing = false,
  filterOpen = false,
  activeFilterCount = 0,
  onToggleFilter,
  onOpenMembers,
  memberCount = 0,
}: RoadmapToolbarProps) {
  return (
    <div className="h-12 border-b bg-background flex items-center px-4 gap-3 flex-shrink-0">
      {/* Project name */}
      <h1 className="font-semibold text-sm truncate max-w-48">{projectName}</h1>

      <Separator orientation="vertical" className="h-5" />

      {/* View selector */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
        {TIME_VIEWS.map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={cn(
              'px-3 py-1 text-xs rounded-md transition-colors capitalize',
              timeView === view
                ? 'bg-background text-foreground shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {COLUMN_CONFIG[view].label}
          </button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-5" />

      {/* Today button */}
      <Button variant="outline" size="sm" onClick={onScrollToToday} className="h-7 text-xs gap-1">
        <Calendar className="w-3 h-3" />
        Today
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Members */}
      {onOpenMembers && (
        <Button variant="outline" size="sm" onClick={onOpenMembers} className="h-7 text-xs gap-1">
          <Users className="w-3 h-3" />
          Members
          {memberCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold leading-none">
              {memberCount}
            </span>
          )}
        </Button>
      )}

      {/* Filter toggle */}
      {onToggleFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilter}
          className={cn('h-7 text-xs gap-1 relative', filterOpen || activeFilterCount > 0 ? 'border-primary/60 text-primary bg-primary/5' : '')}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>
      )}

      {/* Refresh */}
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing} className="h-7 text-xs gap-1">
          <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Atualizando...' : 'Refresh'}
        </Button>
      )}

      {/* Export */}
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="h-7 text-xs gap-1">
          <Download className="w-3 h-3" />
          Export
        </Button>
      )}
    </div>
  )
}
