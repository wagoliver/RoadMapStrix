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

const QUARTER_META: Record<Quarter, { label: string; period: string; color: string; gradient: string }> = {
  Q1:      { label: 'Q1', period: 'Jan – Mar', color: '#6366f1', gradient: 'from-indigo-500/10 to-transparent' },
  Q2:      { label: 'Q2', period: 'Abr – Jun', color: '#06b6d4', gradient: 'from-cyan-500/10 to-transparent' },
  Q3:      { label: 'Q3', period: 'Jul – Set', color: '#f97316', gradient: 'from-orange-500/10 to-transparent' },
  Q4:      { label: 'Q4', period: 'Out – Dez', color: '#a855f7', gradient: 'from-purple-500/10 to-transparent' },
  wishlist:{ label: '✦',  period: 'Lista de Desejos', color: '#ec4899', gradient: 'from-pink-500/10 to-transparent' },
}

const STATUS_COLOR: Record<string, string> = {
  'Backlog':      '#8b8fa3',
  'Planejado':    '#06b6d4',
  'Em Andamento': '#818cf8',
  'Em Review':    '#eab308',
  'Em Produção':  '#16a34a',
  'Concluído':    '#4ade80',
}

const STATUS_ORDER = ['Concluído', 'Em Produção', 'Em Review', 'Em Andamento', 'Planejado', 'Backlog']

const SIZE_COLOR: Record<string, string> = {
  S: '#22c55e', M: '#eab308', L: '#f97316', XL: '#ef4444',
}

// ─── Summary bar ────────────────────────────────────────────────────────────

function SummaryBar({ activities }: { activities: Activity[] }) {
  const total   = activities.length
  const sprints = activities.reduce((s, a) => s + a.durationSprints, 0)
  const done    = activities.filter((a) => a.planStatus === 'Concluído').length
  const active  = activities.filter((a) => ['Em Andamento', 'Em Review', 'Em Produção'].includes(a.planStatus ?? '')).length
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0

  const statCounts = STATUS_ORDER.map((s) => ({
    label: s,
    color: STATUS_COLOR[s],
    count: activities.filter((a) => (a.planStatus ?? 'Backlog') === s).length,
  })).filter((s) => s.count > 0)

  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-card/60 flex-shrink-0 flex-wrap">
      {/* Progress */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Progresso</span>
          <span className="text-xl font-bold tabular-nums leading-none">{pct}%</span>
        </div>
        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="w-px h-8 bg-border hidden sm:block" />

      {/* KPIs */}
      {[
        { label: 'Cards',       value: total,   color: 'text-foreground' },
        { label: 'Sprints',     value: sprints, color: 'text-foreground' },
        { label: 'Ativos',      value: active,  color: 'text-indigo-400' },
        { label: 'Concluídos',  value: done,    color: 'text-green-400'  },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
          <span className={cn('text-xl font-bold tabular-nums leading-none', color)}>{value}</span>
        </div>
      ))}

      <div className="w-px h-8 bg-border hidden sm:block" />

      {/* Status pills */}
      <div className="flex flex-wrap gap-1.5">
        {statCounts.map(({ label, color, count }) => (
          <span
            key={label}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{ background: color + '18', color }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            {label} · {count}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Status distribution bar ─────────────────────────────────────────────────

function StatusBar({ activities }: { activities: Activity[] }) {
  const total = activities.length
  if (total === 0) return null

  const segments = STATUS_ORDER.map((s) => ({
    color: STATUS_COLOR[s],
    pct: (activities.filter((a) => (a.planStatus ?? 'Backlog') === s).length / total) * 100,
  })).filter((s) => s.pct > 0)

  return (
    <div className="flex h-1 rounded-full overflow-hidden gap-px">
      {segments.map(({ color, pct }, i) => (
        <div key={i} className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      ))}
    </div>
  )
}

// ─── Activity card ───────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  const statusColor = STATUS_COLOR[activity.planStatus ?? 'Backlog'] ?? '#8b8fa3'
  const areaColor   = AREA_COLORS[activity.area ?? '']   ?? '#6366f1'
  const teamColor   = TEAM_COLORS[activity.team ?? '']   ?? '#94a3b8'
  const sizeColor   = SIZE_COLOR[activity.sizeLabel ?? ''] ?? '#94a3b8'

  return (
    <div
      className="group relative border border-border rounded-xl p-3 flex flex-col gap-2.5
                 hover:border-primary/25 hover:shadow-md hover:-translate-y-px transition-all duration-150 cursor-default"
      style={{ background: areaColor + '0a' }}
    >
      {/* Status + size */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: statusColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
          {activity.planStatus ?? 'Backlog'}
        </span>
        <div className="flex items-center gap-1">
          {activity.sizeLabel && (
            <span
              className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: sizeColor + '22', color: sizeColor }}
            >
              {activity.sizeLabel}
            </span>
          )}
          {activity.jiraRef && (
            <span className="text-[10px] font-mono font-bold text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
              {activity.jiraRef}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <p className="text-xs font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
        {activity.name}
      </p>

      {/* Note */}
      {activity.planningNote && (
        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1 italic border-t border-dashed border-border/60 pt-1.5">
          {activity.planningNote}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {activity.area && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ background: areaColor + '15', color: areaColor }}>
              {activity.area}
            </span>
          )}
          {activity.team && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ background: teamColor + '15', color: teamColor }}>
              {activity.team}
            </span>
          )}
          {(activity.clients?.length ?? 0) > 0 && activity.clients!.map((c) => (
            <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              {c}
            </span>
          ))}
        </div>
        {activity.durationSprints > 0 && (
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums ml-auto">
            {activity.durationSprints}<span className="font-normal opacity-60">sp</span>
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Quarter column ──────────────────────────────────────────────────────────

function QuarterColumn({ quarter, activities }: { quarter: Quarter; activities: Activity[] }) {
  const { label, period, color, gradient } = QUARTER_META[quarter]
  const totalSprints = activities.reduce((s, a) => s + a.durationSprints, 0)
  const doneCount    = activities.filter((a) => a.planStatus === 'Concluído').length

  return (
    <div className="flex flex-col w-72 flex-shrink-0 rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
      {/* Column header */}
      <div className={cn('px-4 pt-4 pb-3 bg-gradient-to-b', gradient)}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black leading-none" style={{ color }}>{label}</span>
              <span className="text-xs text-muted-foreground font-medium">{period}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full">
                {activities.length} cards
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: color + '18', color }}>
                {totalSprints} sprints
              </span>
              {doneCount > 0 && (
                <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                  {doneCount} ✓
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status distribution bar */}
        <StatusBar activities={activities} />
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 min-h-0"
           style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-40">
            <div className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center"
                 style={{ borderColor: color }}>
              <span className="text-sm" style={{ color }}>·</span>
            </div>
            <p className="text-xs text-muted-foreground">Nenhum card</p>
          </div>
        ) : (
          activities.map((a) => <ActivityCard key={a.id} activity={a} />)
        )}
      </div>
    </div>
  )
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function QuarterView() {
  const { activities } = useRoadmapStore()
  const [filterOpen, setFilterOpen] = useState(false)

  const {
    filterSearch, setFilterSearch,
    selectedStatuses, setSelectedStatuses, clearSelectedStatuses,
    selectedAreas,    setSelectedAreas,    clearSelectedAreas,
    selectedTeams,    setSelectedTeams,    clearSelectedTeams,
    selectedSizes,    setSelectedSizes,    clearSelectedSizes,
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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="h-12 border-b bg-background flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <h1 className="font-semibold text-sm">Por Quarter</h1>
        <div className="w-px h-5 bg-border" />
        <div className="flex-1" />
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

      {/* Summary bar */}
      <SummaryBar activities={filtered} />

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-5 h-full">
          {QUARTERS.map((q) => (
            <QuarterColumn key={q} quarter={q} activities={byQuarter[q]} />
          ))}
        </div>
      </div>
    </div>
  )
}
