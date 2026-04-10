'use client'

import { useState, useMemo } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, parse } from 'date-fns'
import { es } from 'date-fns/locale'

interface DateInfo {
  date: string
  available: number
  total: number
}

interface DatePickerProps {
  availableDates: DateInfo[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
  minDate: string
  maxDate: string
}

export default function DatePicker({ availableDates, selectedDate, onSelectDate, minDate, maxDate }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return parse(minDate, 'yyyy-MM-dd', new Date())
  })

  const availableSet = useMemo(() => {
    const map = new Map<string, DateInfo>()
    availableDates.forEach(d => map.set(d.date, d))
    return map
  }, [availableDates])

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const result: Date[] = []
    let day = calStart
    while (day <= calEnd) {
      result.push(day)
      day = addDays(day, 1)
    }
    return result
  }, [currentMonth])

  const min = parse(minDate, 'yyyy-MM-dd', new Date())
  const max = parse(maxDate, 'yyyy-MM-dd', new Date())

  const canGoBack = startOfMonth(currentMonth) > startOfMonth(min)
  const canGoForward = startOfMonth(currentMonth) < startOfMonth(max)

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => canGoBack && setCurrentMonth(subMonths(currentMonth, 1))}
          className={`p-2 rounded-lg transition-colors ${canGoBack ? 'hover:bg-zinc-800 text-white' : 'text-zinc-700 cursor-not-allowed'}`}
          disabled={!canGoBack}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h3 className="text-white font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          onClick={() => canGoForward && setCurrentMonth(addMonths(currentMonth, 1))}
          className={`p-2 rounded-lg transition-colors ${canGoForward ? 'hover:bg-zinc-800 text-white' : 'text-zinc-700 cursor-not-allowed'}`}
          disabled={!canGoForward}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs text-zinc-500 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const dateInfo = availableSet.get(dateStr)
          const isAvailable = !!dateInfo && dateInfo.available > 0
          const isSelected = selectedDate === dateStr

          return (
            <button
              key={i}
              onClick={() => isAvailable && onSelectDate(dateStr)}
              disabled={!isAvailable}
              className={`
                relative aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                ${!isCurrentMonth ? 'text-zinc-800' : ''}
                ${isCurrentMonth && !isAvailable ? 'text-zinc-600 cursor-not-allowed' : ''}
                ${isAvailable && !isSelected ? 'text-white hover:bg-pink-500/20 cursor-pointer' : ''}
                ${isSelected ? 'bg-pink-500 text-white font-bold' : ''}
              `}
            >
              {format(day, 'd')}
              {isAvailable && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-pink-500'}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
