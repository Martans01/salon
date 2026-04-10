'use client'

import { motion } from 'framer-motion'
import type { Barber } from '@/types'

interface BarberSelectorProps {
  barbers: Barber[]
  selectedBarberId: string | null
  onSelect: (barberId: string) => void
  isLoading: boolean
}

export default function BarberSelector({ barbers, selectedBarberId, onSelect, isLoading }: BarberSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-zinc-900 rounded-xl p-4 h-40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (barbers.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-8 text-center">
        <p className="text-zinc-400">No hay barberos disponibles en este momento.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {barbers.map((barber) => {
        const isSelected = selectedBarberId === barber.id
        return (
          <motion.button
            key={barber.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(barber.id)}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-center ${
              isSelected
                ? 'border-pink-500 bg-pink-500/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            {barber.image_url ? (
              <img
                src={barber.image_url}
                alt={barber.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div>
              <p className={`font-semibold text-sm ${isSelected ? 'text-pink-400' : 'text-white'}`}>
                {barber.name}
              </p>
              {barber.title && (
                <p className="text-zinc-500 text-xs mt-0.5">{barber.title}</p>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
