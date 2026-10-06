export const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#64748b',
] as const

export const DEFAULT_ACTIVITY_COLOR = '#6366f1'
export const DEFAULT_TAG_COLOR = '#94a3b8'
export const DEFAULT_SPRINT_DURATION = 14

export const SPRINT_DURATION_MIN = 1
export const SPRINT_DURATION_MAX = 90
export const ACTIVITY_DURATION_MIN = 1
export const ACTIVITY_DURATION_MAX = 52

export const LOCAL_STORAGE_KEYS = {
  projects: 'roadmapstrix_projects',
  activities: (projectId: string) => `roadmapstrix_activities_${projectId}`,
} as const
