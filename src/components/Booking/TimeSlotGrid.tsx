'use client'

import { formatTime12h } from '@/lib/utils/dates'
import type { TimeSlot } from '@/types'

interface TimeSlotGridProps {
  slots: TimeSlot[]
  selectedSlot: string | null
  onSelectSlot: (slotId: string) => void
  isLoading: boolean
}

export default function TimeSlotGrid({ slots, selectedSlot, onSelectSlot, isLoading }: TimeSlotGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const available = slots.filter(s => !s.is_booked)

  if (available.length === 0) {
    return (
      <p className="text-zinc-500 text-center py-4">No hay horarios disponibles para esta fecha</p>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {available.map(slot => {
        const isSelected = selectedSlot === slot.id
        return (
          <button
            key={slot.id}
            onClick={() => onSelectSlot(slot.id)}
            className={`
              py-3 px-2 rounded-lg text-sm font-medium transition-all
              ${isSelected
                ? 'bg-pink-500 text-white scale-105'
                : 'bg-zinc-800 text-white hover:bg-zinc-700 hover:scale-[1.02]'
              }
            `}
          >
            {formatTime12h(slot.start_time)}
          </button>
        )
      })}
    </div>
  )
}
