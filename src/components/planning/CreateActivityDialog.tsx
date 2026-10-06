'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import type { Activity, CreateActivityInput } from '@/types'
import {
  PRESET_COLORS,
  DEFAULT_ACTIVITY_COLOR,
  DEFAULT_TAG_COLOR,
  ACTIVITY_DURATION_MIN,
  ACTIVITY_DURATION_MAX,
} from '@/lib/constants'

interface CreateActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateActivityInput) => void
  initialValues?: Partial<Activity>
  mode?: 'create' | 'edit'
  defaultQuarter?: string
}

export function CreateActivityDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  mode = 'create',
  defaultQuarter,
}: CreateActivityDialogProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [color, setColor] = useState(initialValues?.color ?? DEFAULT_ACTIVITY_COLOR)
  const [durationSprints, setDurationSprints] = useState(initialValues?.durationSprints ?? 1)
  const [tags, setTags] = useState<{ name: string; color: string }[]>(
    initialValues?.tags?.map((t) => ({ name: t.name, color: t.color })) ?? []
  )
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.find((t) => t.name === trimmed)) {
      setTags([...tags, { name: trimmed, color: DEFAULT_TAG_COLOR }])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagName: string) => {
    setTags(tags.filter((t) => t.name !== tagName))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      durationSprints,
      tags,
      quarter: initialValues?.quarter ?? defaultQuarter,
    })
    if (mode === 'create') {
      setName('')
      setDescription('')
      setColor(DEFAULT_ACTIVITY_COLOR)
      setDurationSprints(1)
      setTags([])
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Activity' : 'Edit Activity'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="act-name">Name *</Label>
            <Input
              id="act-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Activity name"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="act-description">Description</Label>
            <Textarea
              id="act-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="act-duration">Duration (sprints)</Label>
            <Input
              id="act-duration"
              type="number"
              min={ACTIVITY_DURATION_MIN}
              max={ACTIVITY_DURATION_MAX}
              value={durationSprints}
              onChange={(e) => setDurationSprints(Math.max(ACTIVITY_DURATION_MIN, parseInt(e.target.value) || 1))}
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
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 p-0 rounded-full cursor-pointer border-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddTag() }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <Badge key={tag.name} variant="secondary" className="gap-1">
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.name)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
