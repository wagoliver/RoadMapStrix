'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Activity } from '@/types'

interface MarkDeliveredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity | null
  onSubmit: (activityId: string, deliveryDate: Date, label: string) => void
}

export function MarkDeliveredDialog({
  open,
  onOpenChange,
  activity,
  onSubmit,
}: MarkDeliveredDialogProps) {
  const [date, setDate] = useState<Date>(
    activity?.deliveryDate ? new Date(activity.deliveryDate) : new Date()
  )
  const [label, setLabel] = useState(activity?.deliveryLabel ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activity) return
    onSubmit(activity.id, date, label)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as Delivered</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {activity && (
            <p className="text-sm text-muted-foreground">
              Activity: <span className="font-medium text-foreground">{activity.name}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Delivery Date</Label>
            <Popover>
              <PopoverTrigger>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delivery-label">Label (optional)</Label>
            <Input
              id="delivery-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. v1.0 Release"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
