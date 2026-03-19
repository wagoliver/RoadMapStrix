import {
  differenceInCalendarDays,
  addDays,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns'
import { TimeView, dayWidthPx } from './columnConfig'

export function dateToPixel(date: Date, chartStart: Date, view: TimeView): number {
  const days = differenceInCalendarDays(date, chartStart)
  return days * dayWidthPx(view)
}

export function pixelToDate(px: number, chartStart: Date, view: TimeView): Date {
  const days = Math.round(px / dayWidthPx(view))
  return addDays(chartStart, days)
}

export function activityWidthPx(
  durationSprints: number,
  sprintDays: number,
  view: TimeView
): number {
  return durationSprints * sprintDays * dayWidthPx(view)
}

export function snapDateToView(date: Date, view: TimeView): Date {
  switch (view) {
    case 'day':
      return startOfDay(date)
    case 'week':
      return startOfISOWeek(date)
    case 'month':
      return startOfMonth(date)
    case 'quarter':
      return startOfQuarter(date)
    case 'semester':
      // snap to Jan 1 or Jul 1
      const d = startOfMonth(date)
      if (d.getMonth() >= 6) {
        return new Date(d.getFullYear(), 6, 1)
      }
      return new Date(d.getFullYear(), 0, 1)
    case 'year':
      return startOfYear(date)
  }
}

export function getActivityEndDate(
  startDate: Date,
  durationSprints: number,
  sprintDays: number
): Date {
  return addDays(startDate, durationSprints * sprintDays)
}
