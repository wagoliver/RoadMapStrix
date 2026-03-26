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
import {
  LayoutGrid,
  LogOut,
  Loader2,
  UserPlus,
  Trash2,
  Users,
  Mail,
  Calendar,
  FolderOpen,
  ArrowLeft,
  Settings,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { api, type UserListItem } from '@/lib/api-client'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function AdminUsersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.users.list()
      setUsers(data)
    } catch {
      toast.error('Failed to load users')
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
      loadUsers()
    }
  }, [status, router, loadUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) return
    setCreating(true)
    try {
      await api.users.create({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      })
      setName('')
      setEmail('')
      setPassword('')
      setCreateOpen(false)
      toast.success('User created successfully')
      loadUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user'
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (userId: string, userName: string | null) => {
    if (userId === session?.user?.id) {
      toast.error('You cannot delete your own account')
      return
    }
    if (!confirm(`Delete user "${userName ?? 'Unknown'}"? This cannot be undone.`)) return
    try {
      await api.users.delete(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast.success('User deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      toast.error(message)
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
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">RoadMapStrix</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => router.push('/settings')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
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
        {/* Back + Page header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6" />
                User Management
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {users.length} user{users.length !== 1 ? 's' : ''} registered
              </p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="gap-2 shadow-sm"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <UserPlus className="w-4 h-4" />
              New User
            </Button>
          </div>
        </div>

        {/* Users table */}
        <div className="border rounded-xl overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Email</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Projects</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Created</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCurrentUser = u.id === session?.user?.id
                const initial = (u.name ?? u.email ?? 'U')[0].toUpperCase()

                return (
                  <tr key={u.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                          {initial}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{u.name ?? '—'}</span>
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                              you
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {u.email}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" />
                        {u._count.ownedProjects}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(u.createdAt), 'dd/MM/yyyy')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="w-8 h-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Name *</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-password">Password *</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || !email.trim() || !password.trim() || creating}>
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
