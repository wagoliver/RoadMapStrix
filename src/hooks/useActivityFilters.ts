'use client'

import { useState, useMemo } from 'react'
import type { Activity } from '@/types'
import type { FilterOption } from '@/components/ui/FilterDropdown'
import { TEAM_COLORS, AREA_COLORS } from '@/components/planning/EditActivityDialog'

export const STATUS_OPTIONS: FilterOption[] = [
  { key: 'Backlog',      color: '#8b8fa3' },
  { key: 'Planejado',    color: '#06b6d4' },
  { key: 'Em Andamento', color: '#818cf8' },
  { key: 'Em Review',    color: '#eab308' },
  { key: 'Em Produção',  color: '#16a34a' },
  { key: 'Concluído',    color: '#4ade80' },
]

export const AREA_OPTIONS: FilterOption[] = Object.entries(AREA_COLORS).map(([key, color]) => ({ key, color }))

export const TEAM_OPTIONS: FilterOption[] = Object.entries(TEAM_COLORS).map(([key, color]) => ({ key, color }))

export const SIZE_OPTIONS: FilterOption[] = [
  { key: 'S',  color: '#22c55e' },
  { key: 'M',  color: '#eab308' },
  { key: 'L',  color: '#f97316' },
  { key: 'XL', color: '#ef4444' },
]

export const ORIGIN_OPTIONS: FilterOption[] = [
  { key: 'interno', label: 'Interno', color: '#6366f1' },
  { key: 'cliente', label: 'Cliente', color: '#eab308' },
]

function toggleSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(Array.from(set))
  if (next.has(value)) { next.delete(value) } else { next.add(value) }
  return next
}

export function useActivityFilters(activities: Activity[]) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSearch, setFilterSearch] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set())
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set())
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())
  const [selectedOrigins, setSelectedOrigins] = useState<Set<string>>(new Set())
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())

  const activeFilterCount =
    (filterSearch ? 1 : 0) +
    selectedStatuses.size + selectedAreas.size + selectedTeams.size +
    selectedSizes.size + selectedOrigins.size + selectedClients.size

  const clearFilters = () => {
    setFilterSearch('')
    setSelectedStatuses(new Set())
    setSelectedAreas(new Set())
    setSelectedTeams(new Set())
    setSelectedSizes(new Set())
    setSelectedOrigins(new Set())
    setSelectedClients(new Set())
  }

  const clientOptions = useMemo<FilterOption[]>(() => {
    const s = new Set<string>()
    activities.forEach((a) => a.clients?.forEach((c) => s.add(c)))
    return Array.from(s).sort().map((c) => ({ key: c }))
  }, [activities])

  const applyFilters = (list: Activity[]): Activity[] => {
    return list.filter((a) => {
      if (filterSearch) {
        const q = filterSearch.toLowerCase()
        if (
          !a.name.toLowerCase().includes(q) &&
          !(a.description ?? '').toLowerCase().includes(q) &&
          !(a.jiraRef ?? '').toLowerCase().includes(q)
        ) return false
      }
      if (selectedStatuses.size > 0 && !selectedStatuses.has(a.planStatus ?? '')) return false
      if (selectedAreas.size > 0 && !selectedAreas.has(a.area ?? '')) return false
      if (selectedTeams.size > 0 && !selectedTeams.has(a.team ?? '')) return false
      if (selectedSizes.size > 0 && !selectedSizes.has(a.sizeLabel ?? '')) return false
      if (selectedOrigins.size > 0 && !selectedOrigins.has(a.origin ?? '')) return false
      if (selectedClients.size > 0 && !a.clients?.some((c) => selectedClients.has(c))) return false
      return true
    })
  }

  return {
    filterOpen, setFilterOpen,
    filterSearch, setFilterSearch,
    selectedStatuses, setSelectedStatuses: (k: string) => setSelectedStatuses((p) => toggleSet(p, k)),
    selectedAreas,    setSelectedAreas:    (k: string) => setSelectedAreas((p) => toggleSet(p, k)),
    selectedTeams,    setSelectedTeams:    (k: string) => setSelectedTeams((p) => toggleSet(p, k)),
    selectedSizes,    setSelectedSizes:    (k: string) => setSelectedSizes((p) => toggleSet(p, k)),
    selectedOrigins,  setSelectedOrigins:  (k: string) => setSelectedOrigins((p) => toggleSet(p, k)),
    selectedClients,  setSelectedClients:  (k: string) => setSelectedClients((p) => toggleSet(p, k)),
    clearSelectedStatuses: () => setSelectedStatuses(new Set()),
    clearSelectedAreas:    () => setSelectedAreas(new Set()),
    clearSelectedTeams:    () => setSelectedTeams(new Set()),
    clearSelectedSizes:    () => setSelectedSizes(new Set()),
    clearSelectedOrigins:  () => setSelectedOrigins(new Set()),
    clearSelectedClients:  () => setSelectedClients(new Set()),
    activeFilterCount,
    clearFilters,
    clientOptions,
    applyFilters,
  }
}
