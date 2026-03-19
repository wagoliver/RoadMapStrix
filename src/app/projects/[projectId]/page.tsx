'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoadmapStore } from '@/store/roadmapStore'
import { RoadmapView } from '@/components/roadmap/RoadmapView'
import { LOCAL_STORAGE_KEYS } from '@/lib/constants'
import type { Project, Activity } from '@/types'

interface StoredProject {
  id: string
  name: string
  description?: string
  color: string
  sprintDuration: number
  createdAt: string
}

function getLocalProjects(): StoredProject[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.projects) ?? '[]')
  } catch {
    return []
  }
}

function getLocalActivities(projectId: string): Activity[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.activities(projectId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return parsed.map((a: Record<string, unknown>) => ({
      ...a,
      startDate: a.startDate ? new Date(a.startDate as string) : null,
      deliveryDate: a.deliveryDate ? new Date(a.deliveryDate as string) : null,
      createdAt: a.createdAt ? new Date(a.createdAt as string) : new Date(),
      updatedAt: a.updatedAt ? new Date(a.updatedAt as string) : new Date(),
    }))
  } catch {
    return []
  }
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const { setProject, activities } = useRoadmapStore()
  const [project, setLocalProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const projects = getLocalProjects()
    const found = projects.find((p) => p.id === projectId)
    if (!found) {
      router.push('/projects')
      return
    }

    const savedActivities = getLocalActivities(projectId)

    const fullProject: Project = {
      id: found.id,
      name: found.name,
      description: found.description ?? null,
      color: found.color,
      sprintDuration: found.sprintDuration,
      startDate: new Date(found.createdAt),
      ownerId: 'local',
      activities: savedActivities,
      createdAt: new Date(found.createdAt),
      updatedAt: new Date(found.createdAt),
    }

    setLocalProject(fullProject)
    setProject(fullProject)
    setLoading(false)
  }, [projectId, router, setProject])

  // Persist activities to localStorage whenever they change
  useEffect(() => {
    if (!project || loading) return
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.activities(projectId),
      JSON.stringify(activities)
    )
  }, [activities, projectId, project, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="flex flex-col h-screen">
      {/* Back button */}
      <div className="absolute top-2 left-2 z-50">
        <button
          onClick={() => router.push('/projects')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-accent"
        >
          ← Projects
        </button>
      </div>
      <RoadmapView project={project} />
    </div>
  )
}
