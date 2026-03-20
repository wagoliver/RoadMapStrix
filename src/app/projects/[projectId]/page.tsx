'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { RoadmapView } from '@/components/roadmap/RoadmapView'
import { api, type ProjectDetail, type ActivityData } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Project, Activity, ActivityDependency } from '@/types'

function toActivity(a: ActivityData): Activity {
  return {
    ...a,
    description: a.description ?? undefined,
    startDate: a.startDate ? new Date(a.startDate) : null,
    deliveryDate: a.deliveryDate ? new Date(a.deliveryDate) : null,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
  }
}

function toProject(p: ProjectDetail): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    sprintDuration: p.sprintDuration,
    startDate: new Date(p.startDate),
    ownerId: p.ownerId,
    activities: p.activities.map(toActivity),
    members: p.members.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      userId: m.userId,
      role: m.role as 'OWNER' | 'EDITOR' | 'VIEWER',
      user: m.user,
    })),
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }
}

function extractDependencies(activities: ActivityData[]): ActivityDependency[] {
  const deps = new Map<string, ActivityDependency>()
  for (const a of activities) {
    for (const d of a.dependsOn ?? []) {
      deps.set(d.id, d)
    }
    for (const d of a.blockedBy ?? []) {
      deps.set(d.id, d)
    }
  }
  return Array.from(deps.values())
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const projectId = params.projectId as string

  const { setProject } = useRoadmapStore()
  const [project, setLocalProject] = useState<Project | null>(null)
  const [dependencies, setDependencies] = useState<ActivityDependency[]>([])
  const [loading, setLoading] = useState(true)

  const loadProject = useCallback(async () => {
    try {
      const data = await api.projects.get(projectId)
      const proj = toProject(data)
      setLocalProject(proj)
      setProject(proj)
      setDependencies(extractDependencies(data.activities))
    } catch {
      toast.error('Failed to load project')
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }, [projectId, router, setProject])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      loadProject()
    }
  }, [status, router, loadProject])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="flex flex-col h-screen">
      <div className="absolute top-2 left-2 z-50">
        <button
          onClick={() => router.push('/projects')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-accent"
        >
          &larr; Projects
        </button>
      </div>
      <RoadmapView project={project} dependencies={dependencies} />
    </div>
  )
}
