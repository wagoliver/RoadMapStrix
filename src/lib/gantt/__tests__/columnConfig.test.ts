import { COLUMN_CONFIG, dayWidthPx, TIME_VIEWS, type TimeView } from '../columnConfig'

describe('columnConfig', () => {
  describe('COLUMN_CONFIG', () => {
    it('should have config for all time views', () => {
      const views: TimeView[] = ['day', 'week', 'month', 'quarter', 'semester', 'year']
      views.forEach((view) => {
        expect(COLUMN_CONFIG[view]).toBeDefined()
        expect(COLUMN_CONFIG[view].columnWidthPx).toBeGreaterThan(0)
        expect(COLUMN_CONFIG[view].unitDays).toBeGreaterThan(0)
        expect(COLUMN_CONFIG[view].label).toBeTruthy()
      })
    })

    it('should have increasing column widths for larger views', () => {
      expect(COLUMN_CONFIG.day.columnWidthPx).toBeLessThan(COLUMN_CONFIG.week.columnWidthPx)
      expect(COLUMN_CONFIG.week.columnWidthPx).toBeLessThan(COLUMN_CONFIG.month.columnWidthPx)
      expect(COLUMN_CONFIG.month.columnWidthPx).toBeLessThan(COLUMN_CONFIG.quarter.columnWidthPx)
    })
  })

  describe('dayWidthPx', () => {
    it('should return columnWidthPx / unitDays for each view', () => {
      TIME_VIEWS.forEach((view) => {
        const config = COLUMN_CONFIG[view]
        const expected = config.columnWidthPx / config.unitDays
        expect(dayWidthPx(view)).toBeCloseTo(expected)
      })
    })

    it('should return 60 for day view (60px / 1 day)', () => {
      expect(dayWidthPx('day')).toBe(60)
    })

    it('should return ~17.14 for week view (120px / 7 days)', () => {
      expect(dayWidthPx('week')).toBeCloseTo(120 / 7)
    })
  })

  describe('TIME_VIEWS', () => {
    it('should contain all 6 views in order', () => {
      expect(TIME_VIEWS).toEqual(['day', 'week', 'month', 'quarter', 'semester', 'year'])
    })
  })
})
