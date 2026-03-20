'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Map, Calendar, Settings, Trash2, LogOut, Loader2, Users, LayoutList } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { api, type ProjectListItem } from '@/lib/api-client'
import {
  PRESET_COLORS,
  DEFAULT_ACTIVITY_COLOR,
  DEFAULT_SPRINT_DURATION,
  SPRINT_DURATION_MIN,
  SPRINT_DURATION_MAX,
} from '@/lib/constants'

export default function ProjectsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(DEFAULT_ACTIVITY_COLOR)
  const [sprintDuration, setSprintDuration] = useState(DEFAULT_SPRINT_DURATION)

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.projects.list()
      setProjects(data)
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      loadProjects()
    }
  }, [status, router, loadProjects])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)

    try {
      const project = await api.projects.create({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        sprintDuration,
      })

      setName('')
      setDescription('')
      setColor(DEFAULT_ACTIVITY_COLOR)
      setSprintDuration(DEFAULT_SPRINT_DURATION)
      setCreateOpen(false)
      toast.success('Project created')
      router.push(`/projects/${project.id}`)
    } catch {
      toast.error('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return

    try {
      await api.projects.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">RoadMapStrix</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session?.user?.name ?? session?.user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Projects</h2>
          <p className="text-muted-foreground mt-1">Select a project to open its roadmap</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Map className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-sm mb-4">Create your first project to start planning</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <CardTitle className="text-base mt-2">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      {project.sprintDuration}d sprints
                    </span>
                    <span className="flex items-center gap-1">
                      <LayoutList className="w-3 h-3" />
                      {project._count.activities}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project._count.members}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name">Name *</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Product Roadmap"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-dur">Sprint Duration (days)</Label>
              <Input
                id="sprint-dur"
                type="number"
                min={SPRINT_DURATION_MIN}
                max={SPRINT_DURATION_MAX}
                value={sprintDuration}
                onChange={(e) => setSprintDuration(Math.max(SPRINT_DURATION_MIN, parseInt(e.target.value) || DEFAULT_SPRINT_DURATION))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? 'white' : 'transparent',
                      boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || creating}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
