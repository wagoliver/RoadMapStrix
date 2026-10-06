const QUARTER_MONTHS: Record<string, number> = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 }

export function quarterToStartDate(quarter: string, year = 2026): Date {
  const month = QUARTER_MONTHS[quarter]
  if (month === undefined) return new Date(year, 0, 1)
  return new Date(year, month, 1)
}
