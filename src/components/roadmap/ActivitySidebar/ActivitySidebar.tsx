'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Activity, CreateActivityInput } from '@/types'
import { ActivityCard } from './ActivityCard'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivitySidebarProps {
  ganttActivities: Activity[]
  wishlistActivities: Activity[]
  onCreateActivity: (input: CreateActivityInput) => void
  onEditActivity: (activity: Activity) => void
  onDeleteActivity: (id: string) => void
}

export function ActivitySidebar({
  ganttActivities,
  wishlistActivities,
  onEditActivity,
  onDeleteActivity,
}: ActivitySidebarProps) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [ganttOpen, setGanttOpen] = useState(true)
  const [wishlistOpen, setWishlistOpen] = useState(true)

  const { setNodeRef, isOver } = useDroppable({ id: 'activity-sidebar' })

  const q = search.toLowerCase()
  const filterFn = (a: Activity) =>
    !q ||
    a.name.toLowerCase().includes(q) ||
    (a.description ?? '').toLowerCase().includes(q) ||
    (a.quarter ?? '').toLowerCase().includes(q)

  const filteredGantt = ganttActivities.filter(filterFn)
  const filteredWishlist = wishlistActivities.filter(filterFn)

  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        className="w-10 flex-shrink-0 border-r border-border bg-card flex flex-col items-center py-3 gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setCollapsed(false)}
        title="Expandir Activities"
      >
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground select-none"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Activities
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold tabular-nums">
          {ganttActivities.length + wishlistActivities.length}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-72 flex-shrink-0 border-r bg-card flex flex-col',
        isOver && 'bg-primary/5'
      )}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">Activities</span>
          <button
            className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
            onClick={() => setCollapsed(true)}
            title="Recolher"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── Section: No Gantt ── */}
        <div className="border-b border-border">
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent/50 transition-colors"
            onClick={() => setGanttOpen((v) => !v)}
          >
            <ChevronDown
              className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 flex-shrink-0"
              style={{ transform: ganttOpen ? undefined : 'rotate(-90deg)' }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex-1 text-left">
              No Gantt
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold tabular-nums">
              {ganttActivities.length}
            </span>
          </button>

          {ganttOpen && (
            <div className="px-3 pb-3 space-y-2">
              {filteredGantt.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 italic">
                  {ganttActivities.length === 0 ? 'Nenhuma atividade no Gantt' : 'Sem resultados'}
                </p>
              ) : (
                filteredGantt.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onEdit={onEditActivity}
                    onDelete={onDeleteActivity}
                    showQuarter
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Section: Lista de Desejos ── */}
        <div>
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent/50 transition-colors"
            onClick={() => setWishlistOpen((v) => !v)}
          >
            <ChevronDown
              className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 flex-shrink-0"
              style={{ transform: wishlistOpen ? undefined : 'rotate(-90deg)' }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex-1 text-left">
              Lista de Desejos
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold tabular-nums">
              {wishlistActivities.length}
            </span>
          </button>

          {wishlistOpen && (
            <div className="px-3 pb-3 space-y-2">
              {filteredWishlist.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 italic">
                  {wishlistActivities.length === 0 ? 'Lista de desejos vazia' : 'Sem resultados'}
                </p>
              ) : (
                filteredWishlist.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onEdit={onEditActivity}
                    onDelete={onDeleteActivity}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drop zone indicator */}
      {isOver && (
        <div className="p-3 border-t bg-primary/10 text-center text-sm text-primary font-medium flex-shrink-0">
          Solte para mover para wishlist
        </div>
      )}
    </div>
  )
}
