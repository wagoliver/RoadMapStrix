export type TimeView = 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year'

export interface ColumnConfig {
  columnWidthPx: number
  unitDays: number
  label: string
}

export const COLUMN_CONFIG: Record<TimeView, ColumnConfig> = {
  day: { columnWidthPx: 60, unitDays: 1, label: 'Day' },
  week: { columnWidthPx: 120, unitDays: 7, label: 'Week' },
  month: { columnWidthPx: 160, unitDays: 30, label: 'Month' },
  quarter: { columnWidthPx: 180, unitDays: 91, label: 'Quarter' },
  semester: { columnWidthPx: 200, unitDays: 182, label: 'Semester' },
  year: { columnWidthPx: 240, unitDays: 365, label: 'Year' },
}

export function dayWidthPx(view: TimeView): number {
  const config = COLUMN_CONFIG[view]
  return config.columnWidthPx / config.unitDays
}

export const TIME_VIEWS: TimeView[] = ['day', 'week', 'month', 'quarter', 'semester', 'year']
