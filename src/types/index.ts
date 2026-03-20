export interface ActivityTag {
  id: string
  name: string
  color: string
  activityId: string
}

export interface ActivityDependency {
  id: string
  fromId: string
  toId: string
}

export interface Activity {
  id: string
  name: string
  description?: string
  color: string
  durationSprints: number
  startDate?: Date | null
  rowIndex?: number | null
  isDelivered: boolean
  deliveryDate?: Date | null
  deliveryLabel?: string | null
  projectId: string
  tags: ActivityTag[]
  createdAt: Date
  updatedAt: Date
  // Planning fields
  quarter?: string | null
  planStatus?: string
  team?: string | null
  sizeLabel?: string | null
  origin?: string | null
  clients?: string[]
  jiraRef?: string | null
  planningNote?: string | null
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  user?: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export interface Project {
  id: string
  name: string
  description?: string | null
  sprintDuration: number
  startDate: Date
  color: string
  ownerId: string
  activities: Activity[]
  members?: ProjectMember[]
  createdAt: Date
  updatedAt: Date
}

export type CreateActivityInput = {
  name: string
  description?: string
  color?: string
  durationSprints?: number
  tags?: { name: string; color: string }[]
  quarter?: string
  planStatus?: string
  team?: string
  sizeLabel?: string
  origin?: string
  clients?: string[]
  jiraRef?: string
  planningNote?: string
}

export type UpdateActivityInput = Partial<{
  name: string
  description: string
  color: string
  durationSprints: number
  startDate: Date | null
  rowIndex: number | null
  isDelivered: boolean
  deliveryDate: Date | null
  deliveryLabel: string | null
  quarter: string | null
  planStatus: string
  team: string | null
  sizeLabel: string | null
  origin: string | null
  clients: string[]
  jiraRef: string | null
  planningNote: string | null
}>
