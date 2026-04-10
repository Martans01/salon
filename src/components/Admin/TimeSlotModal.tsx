'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTime12h } from '@/lib/utils/dates'
import type { TimeSlot } from '@/types'

interface TimeSlotModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (newSlotId: string) => void
  currentDate: string
  currentSlotId: string
  clientName: string
  isSubmitting: boolean
}

export default function TimeSlotModal({ isOpen, onClose, onSelect, currentDate, currentSlotId, clientName, isSubmitting }: TimeSlotModalProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/slots?date=${currentDate}`)
      .then(res => res.json())
      .then((data: TimeSlot[]) => {
        setSlots(data.filter(s => !s.is_booked && s.id !== currentSlotId))
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [isOpen, currentDate, currentSlotId])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="bg-zinc-900 rounded-xl w-full max-w-sm border border-zinc-700"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            <div className="flex justify-between items-center p-5 border-b border-zinc-700">
              <h3 className="text-lg font-bold text-white">Cambiar horario</h3>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-400">{clientName}</p>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-8 h-8 border-2 border-zinc-700 border-t-pink-500 rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">No hay otros horarios disponibles para este día</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => onSelect(slot.id)}
                      disabled={isSubmitting}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-pink-500/50 hover:text-pink-400 transition-all disabled:opacity-50"
                    >
                      {formatTime12h(slot.start_time)}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2.5 border border-zinc-700 text-zinc-400 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
