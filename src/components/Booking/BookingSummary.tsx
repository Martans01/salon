'use client'

import { SERVICES } from '@/utils/constants'
import { formatDateSpanish, formatTime12h } from '@/lib/utils/dates'
import type { TimeSlot } from '@/types'

interface BookingSummaryProps {
  date: string
  slot: TimeSlot
  services: string[]
  clientName: string
  clientPhone: string
  onConfirm: () => void
  onBack: () => void
  isSubmitting: boolean
  barberName?: string
  branchName?: string
}

export default function BookingSummary({
  date, slot, services, clientName, clientPhone, onConfirm, onBack, isSubmitting, barberName, branchName
}: BookingSummaryProps) {
  const serviceNames = services.map(id =>
    SERVICES.find(s => s.id === id)?.name || id
  )

  return (
    <div className="bg-zinc-900 rounded-xl p-5 space-y-4">
      <h3 className="text-lg font-bold text-white">Resumen de tu cita</h3>

      <div className="space-y-3">
        {branchName && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Sucursal</span>
            <span className="text-white">{branchName}</span>
          </div>
        )}
        {barberName && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Barbero</span>
            <span className="text-white">{barberName}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Fecha</span>
          <span className="text-white capitalize">{formatDateSpanish(date)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Hora</span>
          <span className="text-white">{formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Servicios</span>
          <span className="text-white text-right">{serviceNames.join(', ')}</span>
        </div>
        <div className="border-t border-zinc-800 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Nombre</span>
            <span className="text-white">{clientName}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-zinc-400">Teléfono</span>
            <span className="text-white">+507 {clientPhone}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-lg border border-zinc-700 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          Volver
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-lg bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Reservando...
            </>
          ) : 'Confirmar Cita'}
        </button>
      </div>
    </div>
  )
}
