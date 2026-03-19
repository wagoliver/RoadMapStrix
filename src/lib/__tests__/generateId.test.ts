import { generateId } from '../generateId'

describe('generateId', () => {
  it('should return a non-empty string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('should return unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })

  it('should return a string of reasonable length', () => {
    const id = generateId()
    expect(id.length).toBeGreaterThanOrEqual(10)
    expect(id.length).toBeLessThanOrEqual(30)
  })
})
