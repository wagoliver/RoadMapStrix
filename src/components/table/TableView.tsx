'use client'

import { useMemo, useState } from 'react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { Activity } from '@/types'
import { AREA_COLORS, TEAM_COLORS } from '@/components/planning/EditActivityDialog'
import { Search, X, Download, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Backlog:        '#8b8fa3',
  Planejado:      '#06b6d4',
  'Em Andamento': '#818cf8',
  'Em Review':    '#eab308',
  'Em Produção':  '#f97316',
  Concluído:      '#22c55e',
}

const SIZE_COLOR: Record<string, string> = {
  S: '#22c55e', M: '#eab308', L: '#f97316', XL: '#ef4444',
}

const QUARTER_LABEL: Record<string, string> = {
  Q1: 'Q1', Q2: 'Q2', Q3: 'Q3', Q4: 'Q4', wishlist: 'Desejos',
}

const QUARTER_COLOR: Record<string, string> = {
  Q1: '#6366f1', Q2: '#06b6d4', Q3: '#f97316', Q4: '#a855f7', wishlist: '#ec4899',
}

// ─── CSV export ──────────────────────────────────────────────────────────────

function exportCSV(activities: Activity[]) {
  const headers = ['Jira', 'Quarter', 'Status', 'Nome', 'Estimativa', 'Sprints', 'Time', 'Área', 'Origem', 'Clientes', 'Nota']
  const rows = activities.map((a) => [
    a.jiraRef ?? '',
    a.quarter ? (QUARTER_LABEL[a.quarter] ?? a.quarter) : '',
    a.planStatus ?? 'Backlog',
    a.name,
    a.sizeLabel ?? '',
    String(a.durationSprints),
    a.team ?? '',
    a.area ?? '',
    a.origin ?? '',
    (a.clients ?? []).join(' | '),
    a.planningNote ?? '',
  ])

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `roadmap-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({
  label, active, color, onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 h-7 px-3 text-xs border rounded-lg transition-colors whitespace-nowrap',
        active
          ? 'border-transparent text-white font-semibold'
          : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40 bg-transparent'
      )}
      style={active ? { background: color ?? 'var(--primary)', borderColor: color ?? 'var(--primary)' } : {}}
    >
      {label}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TableView() {
  const { activities } = useRoadmapStore()

  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterTeam, setFilterTeam]   = useState<string | null>(null)
  const [filterQuarter, setFilterQuarter] = useState<string | null>(null)
  const [filterArea, setFilterArea]   = useState<string | null>(null)
  const [filterOpen, setFilterOpen]   = useState(false)

  // ── Unique values for filter chips ──
  const teams    = useMemo(() => Array.from(new Set(activities.map((a) => a.team).filter(Boolean))) as string[], [activities])
  const areas    = useMemo(() => Array.from(new Set(activities.map((a) => a.area).filter(Boolean))) as string[], [activities])
  const statuses = ['Backlog', 'Planejado', 'Em Andamento', 'Em Review', 'Em Produção', 'Concluído']
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'wishlist']

  // ── Filtered rows ──
  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (filterStatus  && (a.planStatus ?? 'Backlog') !== filterStatus) return false
      if (filterTeam    && a.team !== filterTeam)    return false
      if (filterQuarter && a.quarter !== filterQuarter) return false
      if (filterArea    && a.area !== filterArea)    return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !a.name.toLowerCase().includes(q) &&
          !(a.jiraRef ?? '').toLowerCase().includes(q) &&
          !(a.team ?? '').toLowerCase().includes(q) &&
          !(a.planningNote ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [activities, filterStatus, filterTeam, filterQuarter, filterArea, search])

  const activeFilterCount = [filterStatus, filterTeam, filterQuarter, filterArea].filter(Boolean).length

  // ── KPI summary ──
  const total   = activities.length
  const done    = activities.filter((a) => a.planStatus === 'Concluído').length
  const active  = activities.filter((a) => ['Em Andamento', 'Em Review', 'Em Produção'].includes(a.planStatus ?? '')).length
  const sprints = activities.reduce((s, a) => s + a.durationSprints, 0)
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── Toolbar ── */}
      <div className="h-12 border-b bg-background flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <h1 className="font-semibold text-sm">Tabela</h1>
        <div className="w-px h-5 bg-border" />
        <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} de {total}</span>
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

        {/* CSV export */}
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 h-7 px-3 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          title="Exportar CSV"
        >
          <Download className="w-3 h-3" />
          CSV
        </button>
      </div>

      {/* ── Filter panel ── */}
      {filterOpen && (
        <div className="border-b border-border bg-card px-4 py-3 flex flex-col gap-3 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              className="w-full bg-background border border-border rounded-lg text-xs pl-8 pr-8 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/60 transition-colors"
              placeholder="Buscar por nome, Jira ID, time, nota…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quarter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold w-12 flex-shrink-0">Quarter</span>
            <FilterChip label="Todos" active={!filterQuarter} color="#6366f1" onClick={() => setFilterQuarter(null)} />
            {quarters.map((q) => (
              <FilterChip
                key={q} label={QUARTER_LABEL[q]} active={filterQuarter === q}
                color={QUARTER_COLOR[q]} onClick={() => setFilterQuarter(filterQuarter === q ? null : q)}
              />
            ))}
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold w-12 flex-shrink-0">Status</span>
            <FilterChip label="Todos" active={!filterStatus} color="#6366f1" onClick={() => setFilterStatus(null)} />
            {statuses.map((s) => (
              <FilterChip
                key={s} label={s} active={filterStatus === s}
                color={STATUS_COLOR[s]} onClick={() => setFilterStatus(filterStatus === s ? null : s)}
              />
            ))}
          </div>

          {/* Team chips */}
          {teams.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold w-12 flex-shrink-0">Time</span>
              <FilterChip label="Todos" active={!filterTeam} color="#6366f1" onClick={() => setFilterTeam(null)} />
              {teams.map((t) => (
                <FilterChip
                  key={t} label={t} active={filterTeam === t}
                  color={TEAM_COLORS[t] ?? '#555'} onClick={() => setFilterTeam(filterTeam === t ? null : t)}
                />
              ))}
            </div>
          )}

          {/* Area chips */}
          {areas.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold w-12 flex-shrink-0">Área</span>
              <FilterChip label="Todos" active={!filterArea} color="#6366f1" onClick={() => setFilterArea(null)} />
              {areas.map((a) => (
                <FilterChip
                  key={a} label={a} active={filterArea === a}
                  color={AREA_COLORS[a] ?? '#6366f1'} onClick={() => setFilterArea(filterArea === a ? null : a)}
                />
              ))}
            </div>
          )}

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <div className="flex justify-end border-t border-border pt-2">
              <button
                onClick={() => { setFilterStatus(null); setFilterTeam(null); setFilterQuarter(null); setFilterArea(null); setSearch('') }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" /> Limpar todos
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── KPI bar ── */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border bg-card/60 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Progresso</span>
            <span className="text-xl font-bold tabular-nums leading-none">{pct}%</span>
          </div>
          <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="w-px h-8 bg-border hidden sm:block" />

        {[
          { label: 'Total',      value: total,   color: 'text-foreground' },
          { label: 'Sprints',    value: sprints, color: 'text-foreground' },
          { label: 'Ativos',     value: active,  color: 'text-indigo-400' },
          { label: 'Concluídos', value: done,    color: 'text-green-400'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
            <span className={cn('text-xl font-bold tabular-nums leading-none', color)}>{value}</span>
          </div>
        ))}

        <div className="w-px h-8 bg-border hidden sm:block" />

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(STATUS_COLOR)
            .map(([s, color]) => {
              const count = activities.filter((a) => (a.planStatus ?? 'Backlog') === s).length
              if (count === 0) return null
              return (
                <span
                  key={s}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full cursor-pointer transition-opacity"
                  style={{ background: color + '18', color }}
                  onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                  title={`Filtrar por ${s}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  {s} · {count}
                </span>
              )
            })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-card border-b border-border">
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap w-20">Jira</th>
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap w-16">Q</th>
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap w-32">Status</th>
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Nome</th>
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap w-24">Est.</th>
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap w-28">Time</th>
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap w-28">Área</th>
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap w-36">Origem</th>
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] w-52">Nota</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-muted-foreground text-sm">
                  Nenhum card encontrado
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <TableRow key={a.id} activity={a} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────

function TableRow({ activity: a }: { activity: Activity }) {
  const statusColor = STATUS_COLOR[a.planStatus ?? 'Backlog'] ?? '#8b8fa3'
  const sizeColor   = SIZE_COLOR[a.sizeLabel ?? ''] ?? '#94a3b8'
  const teamColor   = TEAM_COLORS[a.team ?? ''] ?? '#94a3b8'
  const areaColor   = AREA_COLORS[a.area ?? ''] ?? '#6366f1'
  const qColor      = QUARTER_COLOR[a.quarter ?? ''] ?? '#8b8fa3'
  const qLabel      = a.quarter ? (QUARTER_LABEL[a.quarter] ?? a.quarter) : '—'

  return (
    <tr className="border-b border-border/40 hover:bg-accent/30 transition-colors group">
      {/* Jira */}
      <td className="px-3 py-2 align-middle">
        {a.jiraRef ? (
          <span className="font-mono font-bold text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
            {a.jiraRef}
          </span>
        ) : (
          <span className="text-muted-foreground/30 text-[10px]">—</span>
        )}
      </td>

      {/* Quarter */}
      <td className="px-3 py-2 align-middle">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: qColor + '18', color: qColor }}
        >
          {qLabel}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-2 align-middle">
        <span
          className="flex items-center gap-1 text-[10px] font-semibold w-fit"
          style={{ color: statusColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
          {a.planStatus ?? 'Backlog'}
        </span>
      </td>

      {/* Nome */}
      <td className="px-3 py-2 align-middle">
        <span className="font-semibold text-foreground leading-snug">{a.name}</span>
        {a.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
        )}
      </td>

      {/* Estimativa */}
      <td className="px-3 py-2 align-middle whitespace-nowrap">
        {a.sizeLabel ? (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: sizeColor + '22', color: sizeColor }}
          >
            {a.sizeLabel} · {a.durationSprints}sp
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">
            {a.durationSprints > 0 ? `${a.durationSprints}sp` : '—'}
          </span>
        )}
      </td>

      {/* Time */}
      <td className="px-3 py-2 align-middle">
        {a.team ? (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{ background: teamColor + '18', color: teamColor }}
          >
            {a.team}
          </span>
        ) : (
          <span className="text-muted-foreground/30 text-[10px]">—</span>
        )}
      </td>

      {/* Área */}
      <td className="px-3 py-2 align-middle">
        {a.area ? (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: areaColor + '15', color: areaColor }}
          >
            {a.area}
          </span>
        ) : (
          <span className="text-muted-foreground/30 text-[10px]">—</span>
        )}
      </td>

      {/* Origem */}
      <td className="px-3 py-2 align-middle">
        {a.origin === 'cliente' ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded w-fit">
              Cliente
            </span>
            {(a.clients ?? []).map((c) => (
              <span key={c} className="text-[10px] text-yellow-400/80 pl-0.5">{c}</span>
            ))}
          </div>
        ) : a.origin === 'interno' ? (
          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
            Interno
          </span>
        ) : (
          <span className="text-muted-foreground/30 text-[10px]">—</span>
        )}
      </td>

      {/* Nota */}
      <td className="px-3 py-2 align-middle max-w-[200px]">
        {a.planningNote ? (
          <span className="text-[10px] text-muted-foreground italic line-clamp-2 leading-snug">
            {a.planningNote}
          </span>
        ) : (
          <span className="text-muted-foreground/30 text-[10px]">—</span>
        )}
      </td>
    </tr>
  )
}
