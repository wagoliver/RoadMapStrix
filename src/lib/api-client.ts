const BASE = ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? 'Request failed')
  }

  return res.json()
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// Projects
export const api = {
  projects: {
    list: () => request<ProjectListItem[]>('/api/projects'),
    get: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),
    create: (data: CreateProjectData) =>
      request<ProjectDetail>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreateProjectData>) =>
      request<ProjectDetail>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
  },

  activities: {
    list: (projectId: string) =>
      request<ActivityData[]>(`/api/projects/${projectId}/activities`),
    create: (projectId: string, data: CreateActivityData) =>
      request<ActivityData>(`/api/projects/${projectId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (projectId: string, activityId: string, data: UpdateActivityData) =>
      request<ActivityData>(`/api/projects/${projectId}/activities/${activityId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (projectId: string, activityId: string) =>
      request<{ success: boolean }>(`/api/projects/${projectId}/activities/${activityId}`, {
        method: 'DELETE',
      }),
  },

  dependencies: {
    list: (projectId: string) =>
      request<DependencyData[]>(`/api/projects/${projectId}/dependencies`),
    create: (projectId: string, fromId: string, toId: string) =>
      request<DependencyData>(`/api/projects/${projectId}/dependencies`, {
        method: 'POST',
        body: JSON.stringify({ fromId, toId }),
      }),
    delete: (projectId: string, id: string) =>
      request<{ success: boolean }>(`/api/projects/${projectId}/dependencies`, {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
  },

  featureGroups: {
    list: (projectId: string) =>
      request<FeatureGroupData[]>(`/api/projects/${projectId}/feature-groups`),
    create: (projectId: string, data?: Partial<FeatureGroupData>) =>
      request<FeatureGroupData>(`/api/projects/${projectId}/feature-groups`, {
        method: 'POST',
        body: JSON.stringify(data ?? {}),
      }),
    update: (projectId: string, groupId: string, data: Partial<FeatureGroupData>) =>
      request<FeatureGroupData>(`/api/projects/${projectId}/feature-groups/${groupId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (projectId: string, groupId: string) =>
      request<{ ok: boolean }>(`/api/projects/${projectId}/feature-groups/${groupId}`, {
        method: 'DELETE',
      }),
    addActivity: (projectId: string, groupId: string, activityId: string) =>
      request<{ id: string }>(`/api/projects/${projectId}/feature-groups/${groupId}/activities`, {
        method: 'POST',
        body: JSON.stringify({ activityId }),
      }),
    removeActivity: (projectId: string, groupId: string, activityId: string) =>
      request<{ ok: boolean }>(`/api/projects/${projectId}/feature-groups/${groupId}/activities`, {
        method: 'DELETE',
        body: JSON.stringify({ activityId }),
      }),
  },

  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      request<{ id: string; name: string; email: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}

// API Types
export interface ProjectListItem {
  id: string
  name: string
  description: string | null
  color: string
  sprintDuration: number
  ownerId: string
  createdAt: string
  updatedAt: string
  _count: { activities: number; members: number }
}

export interface ProjectDetail {
  id: string
  name: string
  description: string | null
  color: string
  sprintDuration: number
  startDate: string
  ownerId: string
  createdAt: string
  updatedAt: string
  activities: ActivityData[]
  members: MemberData[]
}

export interface ActivityData {
  id: string
  name: string
  description: string | null
  color: string
  durationSprints: number
  startDate: string | null
  rowIndex: number | null
  isDelivered: boolean
  deliveryDate: string | null
  deliveryLabel: string | null
  projectId: string
  createdAt: string
  updatedAt: string
  tags: TagData[]
  dependsOn: DependencyData[]
  blockedBy: DependencyData[]
  quarter: string | null
  area: string | null
  planStatus: string
  team: string | null
  sizeLabel: string | null
  origin: string | null
  clients: string[]
  jiraRef: string | null
  planningNote: string | null
}

export interface TagData {
  id: string
  name: string
  color: string
  activityId: string
}

export interface DependencyData {
  id: string
  fromId: string
  toId: string
}

export interface MemberData {
  id: string
  projectId: string
  userId: string
  role: string
  user: { id: string; name: string | null; email: string; image: string | null }
}

export interface CreateProjectData {
  name: string
  description?: string
  color: string
  sprintDuration: number
}

export interface CreateActivityData {
  name: string
  description?: string
  color?: string
  durationSprints?: number
  tags?: { name: string; color: string }[]
  quarter?: string
  area?: string
  planStatus?: string
  team?: string
  sizeLabel?: string
  origin?: string
  clients?: string[]
  jiraRef?: string
  planningNote?: string
}

export interface UpdateActivityData {
  name?: string
  description?: string | null
  color?: string
  durationSprints?: number
  startDate?: string | null
  rowIndex?: number | null
  isDelivered?: boolean
  deliveryDate?: string | null
  deliveryLabel?: string | null
  quarter?: string | null
  area?: string | null
  planStatus?: string
  team?: string | null
  sizeLabel?: string | null
  origin?: string | null
  clients?: string[]
  jiraRef?: string | null
  planningNote?: string | null
}

export interface FeatureGroupData {
  id: string
  projectId: string
  title: string
  description: string | null
  color: string
  x: number
  y: number
  width: number
  height: number
  createdAt: string
  updatedAt: string
  activities: {
    id: string
    activity: {
      id: string
      name: string
      jiraRef: string | null
      quarter: string | null
      planStatus: string
      area: string | null
      sizeLabel: string | null
      durationSprints: number
      color: string
    }
  }[]
}
