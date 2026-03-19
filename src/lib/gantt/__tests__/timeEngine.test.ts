import {
  getChartStartDate,
  getChartEndDate,
  generateTimeHeader,
  msUntilMidnight,
} from '../timeEngine'
import { addDays, startOfDay, differenceInCalendarDays } from 'date-fns'
import { GANTT_CHART_SPAN_DAYS } from '../../constants'

describe('timeEngine', () => {
  describe('getChartStartDate', () => {
    it('should return a date 365 days before today', () => {
      const result = getChartStartDate()
      const expected = addDays(startOfDay(new Date()), -365)
      expect(result.getTime()).toBe(expected.getTime())
    })

    it('should return start of day', () => {
      const result = getChartStartDate()
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })
  })

  describe('getChartEndDate', () => {
    it('should return chartStart + CHART_SPAN_DAYS', () => {
      const chartStart = new Date(2025, 0, 1)
      const result = getChartEndDate(chartStart)
      const diff = differenceInCalendarDays(result, chartStart)
      expect(diff).toBe(GANTT_CHART_SPAN_DAYS)
    })
  })

  describe('generateTimeHeader', () => {
    const chartStart = new Date(2025, 0, 1)
    const chartEnd = addDays(chartStart, 365)

    it('should generate columns for month view', () => {
      const result = generateTimeHeader(chartStart, chartEnd, 'month')
      expect(result.columns.length).toBeGreaterThan(0)
      expect(result.totalWidthPx).toBeGreaterThan(0)
    })

    it('should generate columns for day view', () => {
      const shortEnd = addDays(chartStart, 30)
      const result = generateTimeHeader(chartStart, shortEnd, 'day')
      // ~30 days
      expect(result.columns.length).toBeGreaterThanOrEqual(30)
    })

    it('should generate columns for week view', () => {
      const result = generateTimeHeader(chartStart, chartEnd, 'week')
      // ~52 weeks in a year
      expect(result.columns.length).toBeGreaterThanOrEqual(50)
    })

    it('should generate columns for quarter view', () => {
      const result = generateTimeHeader(chartStart, chartEnd, 'quarter')
      expect(result.columns.length).toBeGreaterThanOrEqual(4)
    })

    it('should generate columns for semester view', () => {
      const result = generateTimeHeader(chartStart, chartEnd, 'semester')
      expect(result.columns.length).toBeGreaterThanOrEqual(2)
    })

    it('should generate columns for year view', () => {
      const longEnd = addDays(chartStart, 365 * 3)
      const result = generateTimeHeader(chartStart, longEnd, 'year')
      expect(result.columns.length).toBeGreaterThanOrEqual(3)
    })

    it('should mark current period as isCurrent', () => {
      const now = new Date()
      const start = addDays(now, -180)
      const end = addDays(now, 180)
      const result = generateTimeHeader(start, end, 'month')
      const currentCols = result.columns.filter((c) => c.isCurrent)
      expect(currentCols.length).toBeGreaterThanOrEqual(1)
    })

    it('should have totalWidthPx equal to sum of column widths', () => {
      const result = generateTimeHeader(chartStart, chartEnd, 'month')
      const sumWidth = result.columns.reduce((acc, c) => acc + c.widthPx, 0)
      expect(result.totalWidthPx).toBeCloseTo(sumWidth, 0)
    })

    it('should have correct labels for month view', () => {
      const result = generateTimeHeader(chartStart, chartEnd, 'month')
      // First column should be Jan 2025
      expect(result.columns[0].label).toContain('Jan')
      expect(result.columns[0].label).toContain('2025')
    })

    it('should have correct labels for quarter view', () => {
      const result = generateTimeHeader(chartStart, chartEnd, 'quarter')
      expect(result.columns[0].label).toContain('Q1')
    })
  })

  describe('msUntilMidnight', () => {
    it('should return a positive number', () => {
      const result = msUntilMidnight()
      expect(result).toBeGreaterThan(0)
    })

    it('should be less than or equal to 24 hours', () => {
      const result = msUntilMidnight()
      expect(result).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
    })
  })
})
