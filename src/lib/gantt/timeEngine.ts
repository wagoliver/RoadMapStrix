import {
  addDays,
  addMonths,
  startOfDay,
  startOfISOWeek,
  startOfQuarter,
  startOfYear,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  differenceInCalendarDays,
  isSameDay,
  isSameMonth,
  isSameYear,
} from 'date-fns'
import { TimeView, COLUMN_CONFIG } from './columnConfig'
import { GANTT_CHART_SPAN_DAYS } from '../constants'

export interface TimeColumn {
  date: Date
  label: string
  widthPx: number
  isToday: boolean
  isCurrent: boolean
}

export interface TimeHeaderRow {
  columns: TimeColumn[]
  totalWidthPx: number
}

export function getChartStartDate(): Date {
  return addDays(startOfDay(new Date()), -365)
}

export function getChartEndDate(chartStart: Date): Date {
  return addDays(chartStart, GANTT_CHART_SPAN_DAYS)
}

export function generateTimeHeader(
  chartStart: Date,
  chartEnd: Date,
  view: TimeView
): TimeHeaderRow {
  const config = COLUMN_CONFIG[view]
  const today = startOfDay(new Date())
  const columns: TimeColumn[] = []

  let intervals: Date[] = []

  switch (view) {
    case 'day':
      intervals = eachDayOfInterval({ start: chartStart, end: chartEnd })
      break
    case 'week':
      intervals = eachWeekOfInterval(
        { start: chartStart, end: chartEnd },
        { weekStartsOn: 1 }
      )
      break
    case 'month':
      intervals = eachMonthOfInterval({ start: chartStart, end: chartEnd })
      break
    case 'quarter':
      intervals = eachQuarterOfInterval({ start: chartStart, end: chartEnd })
      break
    case 'semester': {
      // Every 6 months starting from the beginning of the year
      const semStart = startOfYear(chartStart)
      let cur = semStart
      while (cur <= chartEnd) {
        if (cur >= chartStart) intervals.push(cur)
        cur = addMonths(cur, 6)
      }
      break
    }
    case 'year':
      intervals = eachYearOfInterval({ start: chartStart, end: chartEnd })
      break
  }

  let totalWidthPx = 0

  for (let i = 0; i < intervals.length; i++) {
    const date = intervals[i]
    const next = intervals[i + 1] ?? addDays(chartEnd, 1)
    const daysInUnit = differenceInCalendarDays(next, date)
    const widthPx = daysInUnit * (config.columnWidthPx / config.unitDays)

    let label = ''
    switch (view) {
      case 'day':
        label = format(date, 'd')
        break
      case 'week':
        label = `W${format(date, 'w')} ${format(date, 'MMM d')}`
        break
      case 'month':
        label = format(date, 'MMM yyyy')
        break
      case 'quarter':
        label = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`
        break
      case 'semester':
        label = `S${date.getMonth() < 6 ? 1 : 2} ${date.getFullYear()}`
        break
      case 'year':
        label = format(date, 'yyyy')
        break
    }

    const isToday = isSameDay(date, today)
    let isCurrent = false
    switch (view) {
      case 'day':
        isCurrent = isSameDay(date, today)
        break
      case 'week':
        isCurrent = isSameDay(startOfISOWeek(today), date)
        break
      case 'month':
        isCurrent = isSameMonth(date, today)
        break
      case 'quarter':
        isCurrent = isSameMonth(startOfQuarter(today), date)
        break
      case 'semester':
        isCurrent = isSameYear(date, today) && date.getMonth() === (today.getMonth() < 6 ? 0 : 6)
        break
      case 'year':
        isCurrent = isSameYear(date, today)
        break
    }

    columns.push({ date, label, widthPx, isToday, isCurrent })
    totalWidthPx += widthPx
  }

  return { columns, totalWidthPx }
}

export function msUntilMidnight(): number {
  const now = new Date()
  const midnight = startOfDay(addDays(now, 1))
  return midnight.getTime() - now.getTime()
}
