import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Activity, Project, UpdateActivityInput } from '@/types'

interface RoadmapState {
  project: Project | null
  activities: Activity[]
  activeTagFilter: string | null

  // Actions
  setProject: (project: Project) => void
  setActivities: (activities: Activity[]) => void
  setTagFilter: (tag: string | null) => void

  addActivity: (activity: Activity) => void
  updateActivity: (id: string, updates: UpdateActivityInput) => void
  removeActivity: (id: string) => void

  setActivityQuarter: (id: string, quarter: string | null, startDate?: Date | null, rowIndex?: number | null) => void
  getFilteredActivities: () => Activity[]
}

export const useRoadmapStore = create<RoadmapState>()(
  immer((set, get) => ({
    project: null,
    activities: [],
    activeTagFilter: null,

    setProject: (project) =>
      set((state) => {
        state.project = project
        state.activities = project.activities
      }),

    setActivities: (activities) =>
      set((state) => {
        state.activities = activities
      }),

    setTagFilter: (tag) =>
      set((state) => {
        state.activeTagFilter = tag
      }),

    addActivity: (activity) =>
      set((state) => {
        state.activities.push(activity)
      }),

    updateActivity: (id, updates) =>
      set((state) => {
        const idx = state.activities.findIndex((a) => a.id === id)
        if (idx !== -1) {
          Object.assign(state.activities[idx], updates)
        }
      }),

    removeActivity: (id) =>
      set((state) => {
        state.activities = state.activities.filter((a) => a.id !== id)
      }),

    setActivityQuarter: (id, quarter, startDate, rowIndex) =>
      set((state) => {
        const idx = state.activities.findIndex((a) => a.id === id)
        if (idx !== -1) {
          state.activities[idx].quarter = quarter
          if (startDate !== undefined) state.activities[idx].startDate = startDate
          if (rowIndex !== undefined) state.activities[idx].rowIndex = rowIndex
        }
      }),

    getFilteredActivities: () => {
      const { activities, activeTagFilter } = get()
      if (!activeTagFilter) return activities
      return activities.filter((a) =>
        a.tags.some((t) => t.name === activeTagFilter)
      )
    },
  }))
)
