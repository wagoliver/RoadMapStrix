'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useRoadmapStore } from '@/store/roadmapStore'
import { RoadmapView } from '@/components/roadmap/RoadmapView'
import { PlanningView } from '@/components/planning/PlanningView'
import { QuarterView } from '@/components/quarter/QuarterView'
import { StoryboardView } from '@/components/storyboard/StoryboardView'
import { api, type ProjectDetail, type ActivityData } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Calendar,
  BarChart2,
  Layers,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
} from 'lucide-react'
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
    area: a.area,
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
    for (const d of a.dependsOn ?? []) deps.set(d.id, d)
    for (const d of a.blockedBy ?? []) deps.set(d.id, d)
  }
  return Array.from(deps.values())
}

type ActiveTab = 'planning' | 'gantt' | 'quarter' | 'storyboard'

const NAV_ITEMS = [
  { key: 'planning'   as const, label: 'Planejamento', icon: Calendar },
  { key: 'gantt'      as const, label: 'Gantt',        icon: BarChart2 },
  { key: 'quarter'    as const, label: 'Por Quarter',  icon: Layers },
  { key: 'storyboard' as const, label: 'Storyboard',   icon: LayoutTemplate },
]

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const projectId = params.projectId as string

  const { setProject } = useRoadmapStore()
  const [project, setLocalProject] = useState<Project | null>(null)
  const [dependencies, setDependencies] = useState<ActivityDependency[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('planning')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!project) return null

  const userName = session?.user?.name ?? session?.user?.email ?? 'Usuário'
  const userInitial = userName[0].toUpperCase()

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Top header ── */}
      <header
        className="h-12 border-b flex items-center px-4 gap-3 flex-shrink-0 z-40"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
      >
        {/* Logo */}
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-0 select-none flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-sm font-extrabold tracking-tight text-foreground">RoadMap</span>
          <span className="text-sm font-extrabold tracking-tight text-primary">Strix</span>
        </button>

        {/* Separator + project name */}
        <div className="w-px h-4 bg-border flex-shrink-0" />
        <span className="text-sm text-muted-foreground truncate max-w-[220px] font-medium">
          {project.name}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <div className="relative">
          <button
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setUserMenuOpen((v) => !v)}
          >
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
              {userInitial}
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-[130px] truncate leading-none">
              {userName}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-xs font-semibold text-foreground truncate">{session?.user?.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{session?.user?.email}</p>
                </div>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar nav */}
        <nav
          className={`flex-shrink-0 border-r border-border flex flex-col transition-all duration-200 ${
            sidebarCollapsed ? 'w-12' : 'w-44'
          }`}
          style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
        >
          <div className="flex-1 py-2 space-y-0.5">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors rounded-none ${
                  activeTab === key
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                onClick={() => setActiveTab(key)}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </button>
            ))}
          </div>

          {/* Collapse toggle */}
          <button
            className="flex items-center justify-center w-full h-9 border-t border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {activeTab === 'planning'   && <PlanningView project={project} />}
          {activeTab === 'gantt'      && <RoadmapView project={project} dependencies={dependencies} />}
          {activeTab === 'quarter'    && <QuarterView />}
          {activeTab === 'storyboard' && <StoryboardView projectId={project.id} />}
        </div>
      </div>
    </div>
  )
}
