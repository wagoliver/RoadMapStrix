'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2, UserPlus, Crown, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { api, type MemberData } from '@/lib/api-client'

interface MembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  ownerId: string
  currentUserId: string
}

export function MembersDialog({
  open,
  onOpenChange,
  projectId,
  ownerId,
  currentUserId,
}: MembersDialogProps) {
  const [members, setMembers] = useState<MemberData[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER')
  const [adding, setAdding] = useState(false)

  const isOwner = currentUserId === ownerId

  const loadMembers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.members.list(projectId)
      setMembers(data)
    } catch {
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open) loadMembers()
  }, [open, loadMembers])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    try {
      const member = await api.members.add(projectId, email.trim(), role)
      setMembers((prev) => [...prev, member])
      setEmail('')
      toast.success('Member added')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add member'
      toast.error(message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (memberId: string, memberName: string | null) => {
    if (!confirm(`Remove "${memberName ?? 'this user'}" from the project?`)) return
    try {
      await api.members.remove(projectId, memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    }
  }

  const handleRoleChange = async (memberId: string, newRole: 'EDITOR' | 'VIEWER') => {
    try {
      const updated = await api.members.updateRole(projectId, memberId, newRole)
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)))
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Project Members</DialogTitle>
        </DialogHeader>

        {/* Add member form - only for owner */}
        {isOwner && (
          <form onSubmit={handleAdd} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="member-email">Add by email</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-role">Role</Label>
              <select
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
            <Button type="submit" size="sm" disabled={!email.trim() || adding} className="h-9 gap-1.5">
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Add
            </Button>
          </form>
        )}

        {/* Members list */}
        <div className="border rounded-lg divide-y max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No members yet. Add someone by email.
            </div>
          ) : (
            members.map((m) => {
              const initial = (m.user.name ?? m.user.email ?? 'U')[0].toUpperCase()
              const isSelf = m.userId === currentUserId

              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {m.user.name ?? '—'}
                      {isSelf && (
                        <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                          you
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {m.user.email}
                    </div>
                  </div>

                  {/* Role badge/selector */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as 'EDITOR' | 'VIEWER')}
                        className="h-7 rounded-md border border-input bg-transparent px-2 text-xs"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="EDITOR">Editor</option>
                      </select>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                        {m.role === 'EDITOR' ? 'Editor' : 'Viewer'}
                      </span>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(m.id, m.user.name)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Owner info */}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Only the project owner can manage members.
        </p>
      </DialogContent>
    </Dialog>
  )
}
