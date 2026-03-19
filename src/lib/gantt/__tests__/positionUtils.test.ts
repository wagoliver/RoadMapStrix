import {
  dateToPixel,
  pixelToDate,
  activityWidthPx,
  snapDateToView,
  getActivityEndDate,
} from '../positionUtils'
import { dayWidthPx } from '../columnConfig'
import { addDays, startOfDay, startOfMonth, startOfISOWeek, startOfQuarter, startOfYear } from 'date-fns'

describe('positionUtils', () => {
  const chartStart = new Date(2025, 0, 1) // Jan 1, 2025

  describe('dateToPixel', () => {
    it('should return 0 for chart start date', () => {
      expect(dateToPixel(chartStart, chartStart, 'month')).toBe(0)
    })

    it('should return positive pixels for dates after chart start', () => {
      const date = addDays(chartStart, 30)
      const result = dateToPixel(date, chartStart, 'month')
      expect(result).toBeCloseTo(30 * dayWidthPx('month'))
    })

    it('should return negative pixels for dates before chart start', () => {
      const date = addDays(chartStart, -10)
      const result = dateToPixel(date, chartStart, 'day')
      expect(result).toBeLessThan(0)
    })

    it('should scale with time view', () => {
      const date = addDays(chartStart, 10)
      const dayResult = dateToPixel(date, chartStart, 'day')
      const monthResult = dateToPixel(date, chartStart, 'month')
      // Day view has larger px per day than month
      expect(dayResult).toBeGreaterThan(monthResult)
    })
  })

  describe('pixelToDate', () => {
    it('should return chart start date for 0 pixels', () => {
      const result = pixelToDate(0, chartStart, 'month')
      expect(result.getTime()).toBe(chartStart.getTime())
    })

    it('should be inverse of dateToPixel (approximately)', () => {
      const originalDate = addDays(chartStart, 15)
      const px = dateToPixel(originalDate, chartStart, 'month')
      const result = pixelToDate(px, chartStart, 'month')
      // Within 1 day of rounding
      expect(Math.abs(result.getTime() - originalDate.getTime())).toBeLessThan(86400000 * 1.5)
    })
  })

  describe('activityWidthPx', () => {
    it('should return correct width for 1 sprint of 14 days', () => {
      const result = activityWidthPx(1, 14, 'month')
      expect(result).toBeCloseTo(14 * dayWidthPx('month'))
    })

    it('should scale linearly with sprint count', () => {
      const w1 = activityWidthPx(1, 14, 'month')
      const w3 = activityWidthPx(3, 14, 'month')
      expect(w3).toBeCloseTo(w1 * 3)
    })

    it('should scale with sprint duration', () => {
      const w7 = activityWidthPx(1, 7, 'month')
      const w14 = activityWidthPx(1, 14, 'month')
      expect(w14).toBeCloseTo(w7 * 2)
    })
  })

  describe('snapDateToView', () => {
    const testDate = new Date(2025, 3, 15, 12, 30) // Apr 15, 2025 12:30

    it('should snap to start of day for day view', () => {
      const result = snapDateToView(testDate, 'day')
      expect(result).toEqual(startOfDay(testDate))
    })

    it('should snap to Monday for week view', () => {
      const result = snapDateToView(testDate, 'week')
      expect(result).toEqual(startOfISOWeek(testDate))
    })

    it('should snap to start of month for month view', () => {
      const result = snapDateToView(testDate, 'month')
      expect(result).toEqual(startOfMonth(testDate))
    })

    it('should snap to start of quarter for quarter view', () => {
      const result = snapDateToView(testDate, 'quarter')
      expect(result).toEqual(startOfQuarter(testDate))
    })

    it('should snap to Jan 1 for semester view (first half)', () => {
      const result = snapDateToView(new Date(2025, 2, 15), 'semester')
      expect(result).toEqual(new Date(2025, 0, 1))
    })

    it('should snap to Jul 1 for semester view (second half)', () => {
      const result = snapDateToView(new Date(2025, 8, 15), 'semester')
      expect(result).toEqual(new Date(2025, 6, 1))
    })

    it('should snap to start of year for year view', () => {
      const result = snapDateToView(testDate, 'year')
      expect(result).toEqual(startOfYear(testDate))
    })
  })

  describe('getActivityEndDate', () => {
    it('should add correct number of days', () => {
      const start = new Date(2025, 0, 1)
      const result = getActivityEndDate(start, 2, 14)
      expect(result).toEqual(addDays(start, 28))
    })

    it('should handle 1 sprint of 1 day', () => {
      const start = new Date(2025, 0, 1)
      const result = getActivityEndDate(start, 1, 1)
      expect(result).toEqual(addDays(start, 1))
    })
  })
})
