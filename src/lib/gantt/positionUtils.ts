import {
  differenceInCalendarDays,
  addDays,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  startOfQuarter,
  endOfQuarter,
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

const QUARTER_MONTHS: Record<string, number> = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 }

export function quarterToStartDate(quarter: string, year = 2026): Date {
  const month = QUARTER_MONTHS[quarter]
  if (month === undefined) return new Date(year, 0, 1)
  return new Date(year, month, 1)
}

export function dateToQuarter(date: Date): string {
  const m = date.getMonth()
  if (m < 3) return 'Q1'
  if (m < 6) return 'Q2'
  if (m < 9) return 'Q3'
  return 'Q4'
}

export function isQuarterAnchored(date: Date, quarter: string): boolean {
  const qs = quarterToStartDate(quarter, date.getFullYear())
  return date.getFullYear() === qs.getFullYear() &&
    date.getMonth() === qs.getMonth() &&
    date.getDate() === qs.getDate()
}

export function quarterFillWidthPx(startDate: Date, view: TimeView): number {
  const qEnd = endOfQuarter(startDate)
  const days = differenceInCalendarDays(qEnd, startDate) + 1
  return days * dayWidthPx(view)
}
