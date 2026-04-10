import { format, parse, addDays, isBefore, isAfter, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

// Panama timezone: UTC-5 (no daylight saving)
const PANAMA_OFFSET = -5

export function nowInPanama(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + PANAMA_OFFSET * 3600000)
}

export function todayInPanama(): string {
  return format(nowInPanama(), 'yyyy-MM-dd')
}

export function formatDateSpanish(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date())
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
}

export function formatTime12h(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function getBookingDateRange(advanceDays: number): { start: string; end: string } {
  const today = nowInPanama()
  const start = format(today, 'yyyy-MM-dd')
  const end = format(addDays(today, advanceDays), 'yyyy-MM-dd')
  return { start, end }
}

export function isDateInRange(dateStr: string, startStr: string, endStr: string): boolean {
  const date = startOfDay(parse(dateStr, 'yyyy-MM-dd', new Date()))
  const start = startOfDay(parse(startStr, 'yyyy-MM-dd', new Date()))
  const end = startOfDay(parse(endStr, 'yyyy-MM-dd', new Date()))
  return !isBefore(date, start) && !isAfter(date, end)
}

export function getDaysInRange(startStr: string, endStr: string): string[] {
  const days: string[] = []
  let current = parse(startStr, 'yyyy-MM-dd', new Date())
  const end = parse(endStr, 'yyyy-MM-dd', new Date())
  while (!isAfter(current, end)) {
    days.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }
  return days
}
