import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Activity, Project, UpdateActivityInput } from '@/types'
import type { TimeView } from '@/lib/gantt/columnConfig'

interface RoadmapState {
  project: Project | null
  activities: Activity[]
  timeView: TimeView
  activeTagFilter: string | null
  dragPreview: {
    activityId: string
    previewStartDate: Date | null
    previewRowIndex: number | null
  } | null

  // Actions
  setProject: (project: Project) => void
  setActivities: (activities: Activity[]) => void
  setTimeView: (view: TimeView) => void
  setTagFilter: (tag: string | null) => void
  setDragPreview: (preview: RoadmapState['dragPreview']) => void

  addActivity: (activity: Activity) => void
  updateActivity: (id: string, updates: UpdateActivityInput) => void
  removeActivity: (id: string) => void

  scheduleActivity: (id: string, startDate: Date, rowIndex: number) => void
  unscheduleActivity: (id: string) => void

  getScheduledActivities: () => Activity[]
  getUnscheduledActivities: () => Activity[]
  getFilteredActivities: () => Activity[]
}

export const useRoadmapStore = create<RoadmapState>()(
  immer((set, get) => ({
    project: null,
    activities: [],
    timeView: 'month',
    activeTagFilter: null,
    dragPreview: null,

    setProject: (project) =>
      set((state) => {
        state.project = project
        state.activities = project.activities
      }),

    setActivities: (activities) =>
      set((state) => {
        state.activities = activities
      }),

    setTimeView: (view) =>
      set((state) => {
        state.timeView = view
      }),

    setTagFilter: (tag) =>
      set((state) => {
        state.activeTagFilter = tag
      }),

    setDragPreview: (preview) =>
      set((state) => {
        state.dragPreview = preview
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

    scheduleActivity: (id, startDate, rowIndex) =>
      set((state) => {
        const idx = state.activities.findIndex((a) => a.id === id)
        if (idx !== -1) {
          state.activities[idx].startDate = startDate
          state.activities[idx].rowIndex = rowIndex
        }
      }),

    unscheduleActivity: (id) =>
      set((state) => {
        const idx = state.activities.findIndex((a) => a.id === id)
        if (idx !== -1) {
          state.activities[idx].startDate = null
          state.activities[idx].rowIndex = null
        }
      }),

    getScheduledActivities: () =>
      get().activities.filter((a) => a.startDate != null),

    getUnscheduledActivities: () =>
      get().activities.filter((a) => a.startDate == null),

    getFilteredActivities: () => {
      const { activities, activeTagFilter } = get()
      if (!activeTagFilter) return activities
      return activities.filter((a) =>
        a.tags.some((t) => t.name === activeTagFilter)
      )
    },
  }))
)
