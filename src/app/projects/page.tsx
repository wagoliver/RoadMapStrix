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
import { Plus, LayoutGrid, Calendar, Trash2, LogOut, Loader2, Users, LayoutList, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { api, type ProjectListItem } from '@/lib/api-client'
import { ThemeToggle } from '@/components/ThemeToggle'
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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const userInitial = (session?.user?.name ?? session?.user?.email ?? 'U')[0].toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">RoadMapStrix</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-px h-5 bg-border mx-1" />
            {/* User avatar */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                {userInitial}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session?.user?.name ?? session?.user?.email}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-1"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {projects.length > 0
                ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                : 'Create your first project to start planning'}
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 shadow-sm"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          /* Empty state */
          <div className="border border-dashed rounded-2xl py-24 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="w-7 h-7 text-primary/60" />
            </div>
            <div>
              <h3 className="font-semibold text-base">No projects yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Create your first roadmap to get started</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-2 gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-card rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden card-elevated"
                style={{ boxShadow: 'var(--card-shadow)' }}
                onClick={() => router.push(`/projects/${project.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--card-shadow)' }}
              >
                {/* Color accent bar */}
                <div className="h-1 w-full" style={{ backgroundColor: project.color }} />

                <div className="p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-snug flex-1">{project.name}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <LayoutList className="w-3 h-3" />
                      {project._count.activities} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project._count.members}
                    </span>
                  </div>
                </div>

                {/* Hover arrow */}
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}

            {/* Add project card */}
            <button
              onClick={() => setCreateOpen(true)}
              className="group border border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/[0.03] transition-all min-h-[120px]"
            >
              <div className="w-8 h-8 rounded-lg border border-dashed border-current flex items-center justify-center group-hover:border-primary/50 group-hover:text-primary transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">New Project</span>
            </button>
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
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? `3px solid ${c}` : undefined,
                      outlineOffset: color === c ? '2px' : undefined,
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
