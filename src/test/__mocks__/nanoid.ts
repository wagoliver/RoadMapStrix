let counter = 0

export function nanoid(): string {
  counter++
  return `test-id-${counter}-${Date.now().toString(36)}`
}
