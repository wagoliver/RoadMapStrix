import {
  PRESET_COLORS,
  DEFAULT_ACTIVITY_COLOR,
  DEFAULT_TAG_COLOR,
  DEFAULT_SPRINT_DURATION,
  SPRINT_DURATION_MIN,
  SPRINT_DURATION_MAX,
  ACTIVITY_DURATION_MIN,
  ACTIVITY_DURATION_MAX,
  GANTT_MIN_ROW_COUNT,
  GANTT_CHART_SPAN_DAYS,
  LOCAL_STORAGE_KEYS,
} from '../constants'

describe('constants', () => {
  describe('PRESET_COLORS', () => {
    it('should contain valid hex colors', () => {
      PRESET_COLORS.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
      })
    })

    it('should have at least 8 colors', () => {
      expect(PRESET_COLORS.length).toBeGreaterThanOrEqual(8)
    })

    it('should include the default color', () => {
      expect(PRESET_COLORS).toContain(DEFAULT_ACTIVITY_COLOR)
    })
  })

  describe('duration limits', () => {
    it('should have valid sprint duration range', () => {
      expect(SPRINT_DURATION_MIN).toBe(1)
      expect(SPRINT_DURATION_MAX).toBeGreaterThan(SPRINT_DURATION_MIN)
      expect(DEFAULT_SPRINT_DURATION).toBeGreaterThanOrEqual(SPRINT_DURATION_MIN)
      expect(DEFAULT_SPRINT_DURATION).toBeLessThanOrEqual(SPRINT_DURATION_MAX)
    })

    it('should have valid activity duration range', () => {
      expect(ACTIVITY_DURATION_MIN).toBe(1)
      expect(ACTIVITY_DURATION_MAX).toBeGreaterThan(ACTIVITY_DURATION_MIN)
    })
  })

  describe('gantt constants', () => {
    it('should have reasonable row count', () => {
      expect(GANTT_MIN_ROW_COUNT).toBeGreaterThanOrEqual(5)
    })

    it('should span about 3 years', () => {
      expect(GANTT_CHART_SPAN_DAYS).toBe(365 * 3)
    })
  })

  describe('LOCAL_STORAGE_KEYS', () => {
    it('should have projects key', () => {
      expect(LOCAL_STORAGE_KEYS.projects).toBe('roadmapstrix_projects')
    })

    it('should generate activities key with project id', () => {
      expect(LOCAL_STORAGE_KEYS.activities('abc123')).toBe('roadmapstrix_activities_abc123')
    })
  })

  describe('default colors', () => {
    it('should have valid hex format', () => {
      expect(DEFAULT_ACTIVITY_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(DEFAULT_TAG_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })
})
