import { createProjectSchema, createActivitySchema, tagSchema } from '../validation'

describe('validation schemas', () => {
  describe('createProjectSchema', () => {
    it('should accept valid project input', () => {
      const input = {
        name: 'My Project',
        description: 'A description',
        color: '#6366f1',
        sprintDuration: 14,
      }
      const result = createProjectSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const input = { name: '', color: '#6366f1', sprintDuration: 14 }
      const result = createProjectSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject whitespace-only name', () => {
      const input = { name: '   ', color: '#6366f1', sprintDuration: 14 }
      const result = createProjectSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid hex color', () => {
      const input = { name: 'Test', color: 'red', sprintDuration: 14 }
      const result = createProjectSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject sprint duration below minimum', () => {
      const input = { name: 'Test', color: '#6366f1', sprintDuration: 0 }
      const result = createProjectSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject sprint duration above maximum', () => {
      const input = { name: 'Test', color: '#6366f1', sprintDuration: 91 }
      const result = createProjectSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should allow optional description', () => {
      const input = { name: 'Test', color: '#6366f1', sprintDuration: 14 }
      const result = createProjectSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should trim name', () => {
      const input = { name: '  My Project  ', color: '#6366f1', sprintDuration: 14 }
      const result = createProjectSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('My Project')
      }
    })
  })

  describe('createActivitySchema', () => {
    it('should accept valid activity input', () => {
      const input = {
        name: 'Activity 1',
        color: '#ef4444',
        durationSprints: 2,
        tags: [{ name: 'frontend', color: '#3b82f6' }],
      }
      const result = createActivitySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should use defaults for missing optional fields', () => {
      const input = { name: 'Activity 1' }
      const result = createActivitySchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.color).toBe('#6366f1')
        expect(result.data.durationSprints).toBe(1)
        expect(result.data.tags).toEqual([])
      }
    })

    it('should reject empty name', () => {
      const input = { name: '' }
      const result = createActivitySchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject duration above max', () => {
      const input = { name: 'Test', durationSprints: 53 }
      const result = createActivitySchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject more than 20 tags', () => {
      const tags = Array.from({ length: 21 }, (_, i) => ({
        name: `tag-${i}`,
        color: '#6366f1',
      }))
      const input = { name: 'Test', tags }
      const result = createActivitySchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('tagSchema', () => {
    it('should accept valid tag', () => {
      const result = tagSchema.safeParse({ name: 'frontend', color: '#3b82f6' })
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = tagSchema.safeParse({ name: '', color: '#3b82f6' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid color', () => {
      const result = tagSchema.safeParse({ name: 'test', color: 'not-a-color' })
      expect(result.success).toBe(false)
    })
  })
})
