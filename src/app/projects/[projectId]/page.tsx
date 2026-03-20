'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { RoadmapView } from '@/components/roadmap/RoadmapView'
import { PlanningView } from '@/components/planning/PlanningView'
import { api, type ProjectDetail, type ActivityData } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2, LayoutGrid, ChevronRight } from 'lucide-react'
import type { Project, Activity, ActivityDependency } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'

function toActivity(a: ActivityData): Activity {
  return {
    ...a,
    description: a.description ?? undefined,
    startDate: a.startDate ? new Date(a.startDate) : null,
    deliveryDate: a.deliveryDate ? new Date(a.deliveryDate) : null,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
    quarter: a.quarter,
    planStatus: a.planStatus,
    team: a.team,
    sizeLabel: a.sizeLabel,
    origin: a.origin,
    clients: a.clients,
    jiraRef: a.jiraRef,
    planningNote: a.planningNote,
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

type ActiveTab = 'planning' | 'gantt'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const projectId = params.projectId as string

  const { setProject } = useRoadmapStore()
  const [project, setLocalProject] = useState<Project | null>(null)
  const [dependencies, setDependencies] = useState<ActivityDependency[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('planning')

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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-4 h-12 border-b flex-shrink-0 z-40 backdrop-blur-md"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
      >
        {/* Logo + breadcrumb */}
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <LayoutGrid className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium hidden sm:block">Projects</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-border flex-shrink-0" />

        <span className="text-sm font-semibold truncate max-w-[200px]">{project.name}</span>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Tabs */}
        <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
          {(['planning', 'gantt'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'planning' ? 'Planejamento' : 'Gantt'}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        <ThemeToggle />
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'planning' && <PlanningView project={project} />}
        {activeTab === 'gantt' && <RoadmapView project={project} dependencies={dependencies} />}
      </div>
    </div>
  )
}
