'use client'

import { useMemo, useState } from 'react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { Activity } from '@/types'
import { AREA_COLORS, TEAM_COLORS } from '@/components/planning/EditActivityDialog'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { useActivityFilters, STATUS_OPTIONS, AREA_OPTIONS, TEAM_OPTIONS, SIZE_OPTIONS } from '@/hooks/useActivityFilters'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'wishlist'] as const
type Quarter = typeof QUARTERS[number]

const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: 'Q1 — Jan · Mar',
  Q2: 'Q2 — Abr · Jun',
  Q3: 'Q3 — Jul · Set',
  Q4: 'Q4 — Out · Dez',
  wishlist: 'Lista de Desejos',
}

const QUARTER_COLORS: Record<Quarter, string> = {
  Q1: '#6366f1',
  Q2: '#06b6d4',
  Q3: '#f97316',
  Q4: '#a855f7',
  wishlist: '#ec4899',
}

const STATUS_COLOR: Record<string, string> = {
  'Backlog':       '#8b8fa3',
  'Planejado':     '#06b6d4',
  'Em Andamento':  '#818cf8',
  'Em Review':     '#eab308',
  'Em Produção':   '#16a34a',
  'Concluído':     '#4ade80',
}

const SIZE_COLOR: Record<string, string> = {
  S:  '#22c55e',
  M:  '#eab308',
  L:  '#f97316',
  XL: '#ef4444',
}

function ActivityCard({ activity }: { activity: Activity }) {
  const statusColor = STATUS_COLOR[activity.planStatus ?? ''] ?? '#8b8fa3'
  const areaColor   = AREA_COLORS[activity.area ?? '']   ?? '#6366f1'
  const teamColor   = TEAM_COLORS[activity.team ?? '']   ?? '#94a3b8'
  const sizeColor   = SIZE_COLOR[activity.sizeLabel ?? ''] ?? '#94a3b8'

  return (
    <div className="bg-background border border-border rounded-lg p-3 flex flex-col gap-2 hover:border-primary/30 hover:shadow-sm transition-all">
      {/* Top row: jiraRef + status */}
      <div className="flex items-center justify-between gap-2">
        {activity.jiraRef ? (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
            {activity.jiraRef}
          </span>
        ) : <span />}
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: statusColor + '22', color: statusColor }}
        >
          {activity.planStatus ?? 'Backlog'}
        </span>
      </div>

      {/* Name */}
      <p className="text-xs font-medium leading-snug line-clamp-2">{activity.name}</p>

      {/* Note */}
      {activity.planningNote && (
        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 italic">
          {activity.planningNote}
        </p>
      )}

      {/* Bottom meta */}
      <div className="flex flex-wrap items-center gap-1 mt-0.5">
        {activity.area && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: areaColor + '18', color: areaColor }}
          >
            {activity.area}
          </span>
        )}
        {activity.team && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: teamColor + '18', color: teamColor }}
          >
            {activity.team}
          </span>
        )}
        {activity.sizeLabel && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: sizeColor + '22', color: sizeColor }}
          >
            {activity.sizeLabel}
          </span>
        )}
        {activity.durationSprints > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
            {activity.durationSprints}sp
          </span>
        )}
      </div>

      {/* Clients */}
      {(activity.clients?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1">
          {activity.clients!.map((c) => (
            <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function QuarterColumn({ quarter, activities }: { quarter: Quarter; activities: Activity[] }) {
  const color = QUARTER_COLORS[quarter]
  const totalSprints = activities.reduce((s, a) => s + a.durationSprints, 0)

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] bg-card border border-border rounded-xl overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2 flex-shrink-0"
           style={{ borderTop: `3px solid ${color}` }}>
        <span className="text-sm font-bold" style={{ color }}>{QUARTER_LABELS[quarter]}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-semibold">
            {activities.length} cards
          </span>
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-semibold">
            {totalSprints}sp
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 italic">Nenhum card</p>
        ) : (
          activities.map((a) => <ActivityCard key={a.id} activity={a} />)
        )}
      </div>
    </div>
  )
}

export function QuarterView() {
  const { activities } = useRoadmapStore()
  const [filterOpen, setFilterOpen] = useState(false)

  const {
    filterSearch, setFilterSearch,
    selectedStatuses, setSelectedStatuses, clearSelectedStatuses,
    selectedAreas,    setSelectedAreas,    clearSelectedAreas,
    selectedTeams,    setSelectedTeams,    clearSelectedTeams,
    selectedSizes,    setSelectedSizes,    clearSelectedSizes,
    selectedOrigins,  setSelectedOrigins,  clearSelectedOrigins,
    selectedClients,  setSelectedClients,  clearSelectedClients,
    activeFilterCount, clearFilters, clientOptions, applyFilters,
  } = useActivityFilters(activities)

  const filtered = useMemo(() => applyFilters(activities), [activities, applyFilters])

  const byQuarter = useMemo(() => {
    const map: Record<Quarter, Activity[]> = { Q1: [], Q2: [], Q3: [], Q4: [], wishlist: [] }
    filtered.forEach((a) => {
      const q = (a.quarter ?? 'wishlist') as Quarter
      if (q in map) map[q].push(a)
      else map.wishlist.push(a)
    })
    return map
  }, [filtered])

  const totalCards   = filtered.length
  const totalSprints = filtered.reduce((s, a) => s + a.durationSprints, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 border-b bg-background flex items-center px-4 gap-3 flex-shrink-0">
        <h1 className="font-semibold text-sm">Por Quarter</h1>
        <div className="w-px h-5 bg-border" />
        <span className="text-xs text-muted-foreground">{totalCards} cards · {totalSprints} sprints</span>
        <div className="flex-1" />

        {/* Filter toggle */}
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 h-7 px-3 text-xs border rounded-lg transition-colors',
            filterOpen || activeFilterCount > 0
              ? 'border-primary/60 text-primary bg-primary/5'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
          )}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="border-b border-border bg-card px-4 py-3 flex flex-col gap-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              className="w-full bg-background border border-border rounded-lg text-xs pl-8 pr-8 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/60 transition-colors"
              placeholder="Buscar por nome, Jira ID..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
            {filterSearch && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setFilterSearch('')}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterDropdown label="Status"  options={STATUS_OPTIONS}  selected={selectedStatuses} onToggle={setSelectedStatuses} onClear={clearSelectedStatuses} />
            <FilterDropdown label="Área"    options={AREA_OPTIONS}    selected={selectedAreas}    onToggle={setSelectedAreas}    onClear={clearSelectedAreas} />
            <FilterDropdown label="Tipo"    options={TEAM_OPTIONS}    selected={selectedTeams}    onToggle={setSelectedTeams}    onClear={clearSelectedTeams} />
            <FilterDropdown label="Tamanho" options={SIZE_OPTIONS}    selected={selectedSizes}    onToggle={setSelectedSizes}    onClear={clearSelectedSizes} />
            {clientOptions.length > 0 && (
              <FilterDropdown label="Cliente" options={clientOptions} selected={selectedClients} onToggle={setSelectedClients} onClear={clearSelectedClients} />
            )}
          </div>
          {activeFilterCount > 0 && (
            <div className="flex justify-end border-t border-border pt-2">
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3 h-3" /> Limpar todos
              </button>
            </div>
          )}
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full items-start">
          {QUARTERS.map((q) => (
            <QuarterColumn key={q} quarter={q} activities={byQuarter[q]} />
          ))}
        </div>
      </div>
    </div>
  )
}
