'use client'

import { useState, useMemo } from 'react'
import type { Activity, Project, CreateActivityInput } from '@/types'
import { useRoadmapStore } from '@/store/roadmapStore'
import { CreateActivityDialog } from '@/components/roadmap/ActivitySidebar/CreateActivityDialog'
import { PlanningCard } from './PlanningCard'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Maximize2, Minimize2, Search, X, SlidersHorizontal } from 'lucide-react'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { useActivityFilters, STATUS_OPTIONS, AREA_OPTIONS, TEAM_OPTIONS, SIZE_OPTIONS, ORIGIN_OPTIONS } from '@/hooks/useActivityFilters'
import { quarterToStartDate } from '@/lib/gantt/positionUtils'

const QUARTERS = [
  { key: 'Q1', label: 'Q1', year: '2026', color: '#06b6d4' },
  { key: 'Q2', label: 'Q2', year: '2026', color: '#6366f1' },
  { key: 'Q3', label: 'Q3', year: '2026', color: '#22c55e' },
  { key: 'Q4', label: 'Q4', year: '2026', color: '#f97316' },
]

interface PlanningViewProps {
  project: Project
}

export function PlanningView({ project }: PlanningViewProps) {
  const { activities, addActivity, removeActivity, setActivityQuarter } = useRoadmapStore()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [createDialogQuarter, setCreateDialogQuarter] = useState<string | null>(null)
  const [dragOverQuarter, setDragOverQuarter] = useState<string | null>(null)
  const [wishlistSearch, setWishlistSearch] = useState('')
  const [wishlistCollapsed, setWishlistCollapsed] = useState(false)

  // ── Filters (main area only) ──
  const {
    filterOpen, setFilterOpen,
    filterSearch, setFilterSearch,
    selectedStatuses, setSelectedStatuses,
    selectedAreas,    setSelectedAreas,
    selectedTeams,    setSelectedTeams,
    selectedSizes,    setSelectedSizes,
    selectedOrigins,  setSelectedOrigins,
    selectedClients,  setSelectedClients,
    clearSelectedStatuses, clearSelectedAreas, clearSelectedTeams,
    clearSelectedSizes, clearSelectedOrigins, clearSelectedClients,
    activeFilterCount,
    clearFilters,
    clientOptions,
    applyFilters,
  } = useActivityFilters(activities)

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => setCollapsed(new Set([...QUARTERS.map((q) => q.key), 'wishlist']))

  const activitiesForQuarter = (quarter: string) => {
    const base = activities.filter((a) => a.quarter === quarter)
    return quarter === 'wishlist' ? base : applyFilters(base)
  }

  const filteredWishlist = useMemo(() => {
    const base = activities.filter((a) => a.quarter === 'wishlist')
    if (!wishlistSearch.trim()) return base
    const q = wishlistSearch.toLowerCase()
    return base.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q) ||
        (a.team ?? '').toLowerCase().includes(q) ||
        (a.area ?? '').toLowerCase().includes(q) ||
        (a.jiraRef ?? '').toLowerCase().includes(q)
    )
  }, [activities, wishlistSearch])

  const QUARTER_KEYS = ['Q1', 'Q2', 'Q3', 'Q4']

  const nextRowForQuarter = (quarter: string, excludeId?: string) => {
    const inQuarter = activities.filter(
      (a) => a.quarter === quarter && a.rowIndex !== null && a.id !== excludeId
    )
    return inQuarter.length
  }

  const handleDrop = async (e: React.DragEvent, targetQuarter: string) => {
    e.preventDefault()
    setDragOverQuarter(null)
    const activityId = e.dataTransfer.getData('activityId')
    if (!activityId) return

    const activity = activities.find((a) => a.id === activityId)
    if (!activity || activity.quarter === targetQuarter) return

    const isRealQuarter = QUARTER_KEYS.includes(targetQuarter)
    const startDate = isRealQuarter ? quarterToStartDate(targetQuarter) : null
    const rowIndex = isRealQuarter ? nextRowForQuarter(targetQuarter, activityId) : null

    setActivityQuarter(activityId, targetQuarter, startDate, rowIndex)
    try {
      await api.activities.update(project.id, activityId, {
        quarter: targetQuarter,
        startDate: startDate?.toISOString() ?? null,
        rowIndex,
      })
    } catch {
      setActivityQuarter(activityId, activity.quarter ?? null, activity.startDate, activity.rowIndex)
      toast.error('Failed to move activity')
    }
  }

  const handleCreateActivity = async (input: CreateActivityInput, quarter: string) => {
    try {
      const created = await api.activities.create(project.id, {
        name: input.name,
        description: input.description,
        color: input.color,
        durationSprints: input.durationSprints,
        tags: input.tags,
        quarter,
        planStatus: 'Backlog',
      })

      const newActivity: Activity = {
        id: created.id,
        name: created.name,
        description: created.description ?? undefined,
        color: created.color,
        durationSprints: created.durationSprints,
        startDate: null,
        rowIndex: null,
        isDelivered: false,
        deliveryDate: null,
        deliveryLabel: null,
        projectId: project.id,
        tags: created.tags,
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
        quarter: created.quarter,
        planStatus: created.planStatus,
        team: created.team,
        sizeLabel: created.sizeLabel,
        origin: created.origin,
        clients: created.clients,
        jiraRef: created.jiraRef,
        planningNote: created.planningNote,
      }
      addActivity(newActivity)
      toast.success('Activity created')
    } catch {
      toast.error('Failed to create activity')
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await api.activities.delete(project.id, activityId)
      removeActivity(activityId)
      toast.success('Activity deleted')
    } catch {
      toast.error('Failed to delete activity')
    }
  }

  const totalCount = activities.filter((a) => a.quarter && a.quarter !== 'wishlist').length
  const wishlistCount = activitiesForQuarter('wishlist').length

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Wishlist sidebar — left ── */}
      {wishlistCollapsed ? (
        /* Collapsed strip */
        <div
          className="w-10 flex-shrink-0 border-r border-border flex flex-col items-center py-3 gap-3 cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors"
          onClick={() => setWishlistCollapsed(false)}
          title="Expandir Lista de Desejos"
          onDragOver={(e) => { e.preventDefault(); setDragOverQuarter('wishlist') }}
          onDragLeave={() => setDragOverQuarter(null)}
          onDrop={(e) => { setWishlistCollapsed(false); handleDrop(e, 'wishlist') }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground select-none"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Lista de Desejos
          </span>
          {wishlistCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold tabular-nums">
              {wishlistCount}
            </span>
          )}
        </div>
      ) : (
        /* Expanded sidebar */
        <div
          className={`w-64 flex-shrink-0 border-r border-border flex flex-col transition-colors bg-muted/20 ${
            dragOverQuarter === 'wishlist' ? 'bg-primary/[0.05] border-primary/30' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOverQuarter('wishlist') }}
          onDragLeave={() => setDragOverQuarter(null)}
          onDrop={(e) => handleDrop(e, 'wishlist')}
        >
          {/* Header */}
          <div className="px-3 pt-3 pb-2 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Lista de Desejos
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold tabular-nums">
                  {wishlistCount}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  className="p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                  onClick={() => setCreateDialogQuarter('wishlist')}
                  title="Nova atividade na wishlist"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
                  onClick={() => setWishlistCollapsed(true)}
                  title="Recolher wishlist"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <input
                className="w-full bg-background/60 border border-border rounded-md text-[12px] pl-6 pr-6 py-1 text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/60 transition-colors"
                placeholder="Pesquisar..."
                value={wishlistSearch}
                onChange={(e) => setWishlistSearch(e.target.value)}
              />
              {wishlistSearch && (
                <button
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setWishlistSearch('')}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-12">
            {wishlistCount === 0 ? (
              <div className="text-center text-[11px] text-muted-foreground italic py-6">
                Arraste cards aqui
              </div>
            ) : filteredWishlist.length === 0 ? (
              <div className="text-center text-[11px] text-muted-foreground italic py-6">
                Nenhum resultado para &quot;{wishlistSearch}&quot;
              </div>
            ) : (
              filteredWishlist.map((activity) => (
                <PlanningCard
                  key={activity.id}
                  activity={activity}
                  projectId={project.id}
                  onDelete={handleDeleteActivity}
                  compact
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalCount}</span> atividades planejadas
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`relative flex items-center gap-1 px-2.5 py-1 text-xs border rounded-lg transition-colors ${
                filterOpen || activeFilterCount > 0
                  ? 'border-primary/60 text-primary bg-primary/5'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" /> Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={expandAll}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Maximize2 className="w-3 h-3" /> Expandir
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Minimize2 className="w-3 h-3" /> Recolher
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div className="mb-4 border border-border rounded-xl bg-card p-3 flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                className="w-full bg-background border border-border rounded-lg text-xs pl-8 pr-8 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/60 transition-colors"
                placeholder="Buscar por nome, Jira ID..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
              {filterSearch && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setFilterSearch('')}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap gap-2">
              <FilterDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={selectedStatuses}
                onToggle={setSelectedStatuses}
                onClear={clearSelectedStatuses}
              />
              <FilterDropdown
                label="Área"
                options={AREA_OPTIONS}
                selected={selectedAreas}
                onToggle={setSelectedAreas}
                onClear={clearSelectedAreas}
              />
              <FilterDropdown
                label="Time"
                options={TEAM_OPTIONS}
                selected={selectedTeams}
                onToggle={setSelectedTeams}
                onClear={clearSelectedTeams}
              />
              <FilterDropdown
                label="Tamanho"
                options={SIZE_OPTIONS}
                selected={selectedSizes}
                onToggle={setSelectedSizes}
                onClear={clearSelectedSizes}
              />
              <FilterDropdown
                label="Origem"
                options={ORIGIN_OPTIONS}
                selected={selectedOrigins}
                onToggle={setSelectedOrigins}
                onClear={clearSelectedOrigins}
              />
              {clientOptions.length > 0 && (
                <FilterDropdown
                  label="Cliente"
                  options={clientOptions}
                  selected={selectedClients}
                  onToggle={setSelectedClients}
                  onClear={clearSelectedClients}
                />
              )}
            </div>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <div className="flex justify-end border-t border-border pt-2">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" /> Limpar todos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Year group */}
        <div className="border border-border rounded-xl overflow-hidden mb-2">
          {/* Year header */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-card cursor-default select-none border-b border-border">
            <span className="text-base font-extrabold tracking-tight text-foreground">2026</span>
            <span className="text-xs font-medium text-muted-foreground">Roadmap anual</span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold tabular-nums">
              {totalCount}
            </span>
          </div>

          {QUARTERS.map((q) => {
            const qActivities = activitiesForQuarter(q.key)
            const isCollapsed = collapsed.has(q.key)
            const isDragOver = dragOverQuarter === q.key

            return (
              <div key={q.key} className="border-t border-border">
                {/* Quarter header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleCollapse(q.key)}
                  style={{ borderLeft: `3px solid ${q.color}` }}
                >
                  <ChevronDown
                    className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-150"
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : undefined }}
                  />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold tracking-tight" style={{ color: q.color }}>
                      {q.label}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{q.year}</span>
                  </div>
                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold tabular-nums">
                    {qActivities.length}
                  </span>
                  <button
                    className="p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                    onClick={(e) => { e.stopPropagation(); setCreateDialogQuarter(q.key) }}
                    title="Nova atividade"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Drop zone */}
                {!isCollapsed && (
                  <div
                    className={`px-2 pb-2 flex flex-col gap-1.5 min-h-3 transition-all ${
                      isDragOver
                        ? 'bg-primary/[0.04] border-2 border-dashed border-primary rounded-lg mx-2 mb-2 min-h-12'
                        : ''
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverQuarter(q.key) }}
                    onDragLeave={() => setDragOverQuarter(null)}
                    onDrop={(e) => handleDrop(e, q.key)}
                  >
                    {isDragOver && qActivities.length === 0 && (
                      <div className="text-center text-xs text-primary/60 italic py-3">
                        Solte aqui
                      </div>
                    )}
                    {qActivities.map((activity) => (
                      <PlanningCard
                        key={activity.id}
                        activity={activity}
                        projectId={project.id}
                        onDelete={handleDeleteActivity}
                      />
                    ))}
                    {qActivities.length === 0 && !isDragOver && (
                      <div className="text-center text-[11px] text-muted-foreground italic py-2">
                        Nenhuma atividade neste trimestre
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Unassigned */}
        {activities.filter((a) => !a.quarter).length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden mb-2">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-card border-b border-border">
              <span className="font-semibold text-sm text-muted-foreground">Sem trimestre</span>
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold tabular-nums">
                {activities.filter((a) => !a.quarter).length}
              </span>
            </div>
            <div className="px-2 pb-2 flex flex-col gap-1.5">
              {activities
                .filter((a) => !a.quarter)
                .map((activity) => (
                  <PlanningCard
                    key={activity.id}
                    activity={activity}
                    projectId={project.id}
                    onDelete={handleDeleteActivity}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Create dialog */}
      {createDialogQuarter && (
        <CreateActivityDialog
          open
          onOpenChange={(open) => { if (!open) setCreateDialogQuarter(null) }}
          onSubmit={(input) => {
            handleCreateActivity(input, createDialogQuarter)
            setCreateDialogQuarter(null)
          }}
          defaultQuarter={createDialogQuarter}
          mode="create"
        />
      )}
    </div>
  )
}
