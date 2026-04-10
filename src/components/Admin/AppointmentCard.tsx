'use client'

import { useState } from 'react'
import { SERVICES } from '@/utils/constants'
import { formatDateSpanish, formatTime12h } from '@/lib/utils/dates'
import PaymentModal from './PaymentModal'
import TimeSlotModal from './TimeSlotModal'
import type { Appointment, AppointmentStatus, PaymentMethod } from '@/types'

const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  yappy: 'Yappy',
}

interface AppointmentCardProps {
  appointment: Appointment
  onStatusChange: (id: string, status: AppointmentStatus) => void
  onComplete: (id: string, amount: number, method: PaymentMethod) => void
  onChangeSlot: (id: string, newSlotId: string) => void
  onDelete: (id: string) => void
  isUpdating: boolean
}

const statusConfig: Record<AppointmentStatus, { badge: string; border: string; label: string; dot: string }> = {
  pendiente: { badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/20', border: 'border-l-amber-500', label: 'Pendiente', dot: 'bg-amber-400' },
  confirmada: { badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', border: 'border-l-emerald-500', label: 'Confirmada', dot: 'bg-emerald-400' },
  cancelada: { badge: 'bg-zinc-500/10 text-zinc-500 ring-zinc-500/20', border: 'border-l-zinc-600', label: 'Cancelada', dot: 'bg-zinc-500' },
  completada: { badge: 'bg-blue-500/10 text-blue-400 ring-blue-500/20', border: 'border-l-blue-500', label: 'Completada', dot: 'bg-blue-400' },
}

export default function AppointmentCard({ appointment, onStatusChange, onComplete, onChangeSlot, onDelete, isUpdating }: AppointmentCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [timeSlotOpen, setTimeSlotOpen] = useState(false)
  const slot = appointment.time_slot
  const serviceNames = appointment.services.map(id =>
    SERVICES.find(s => s.id === id)?.name || id
  )

  const phoneClean = appointment.client_phone.replace(/[\s-+]/g, '')
  const whatsappUrl = `https://wa.me/${phoneClean}`
  const status = statusConfig[appointment.status]

  return (
    <div className={`bg-zinc-900/60 border border-white/[0.06] rounded-xl border-l-[3px] ${status.border} overflow-hidden transition-all hover:border-white/[0.1] hover:bg-zinc-900/80`}>
      {/* Main content */}
      <div className="p-4 space-y-3">
        {/* Header: name + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-semibold text-[15px]">{appointment.client_name}</h3>
              {appointment.appointment_type === 'delivery' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20">
                  Delivery
                </span>
              )}
              {appointment.barber && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20">
                  {appointment.barber.name}
                </span>
              )}
              {appointment.branch && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
                  {appointment.branch.name}
                </span>
              )}
            </div>
            <a href={`tel:${appointment.client_phone}`} className="text-zinc-500 text-sm hover:text-pink-400 transition-colors">
              {appointment.client_phone}
            </a>
          </div>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${status.badge} whitespace-nowrap`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Date & time row */}
        {slot && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="capitalize">{formatDateSpanish(slot.date)}</span>
            </div>
            {(appointment.status === 'pendiente' || appointment.status === 'confirmada') ? (
              <button
                onClick={() => setTimeSlotOpen(true)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-pink-400 transition-colors group"
              >
                <svg className="w-3.5 h-3.5 text-zinc-600 group-hover:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}</span>
                <svg className="w-3 h-3 text-zinc-700 group-hover:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}</span>
              </div>
            )}
          </div>
        )}

        {/* Services */}
        <div className="flex flex-wrap gap-1.5">
          {serviceNames.map(name => (
            <span key={name} className="bg-pink-500/8 text-pink-400/90 text-[11px] font-medium px-2 py-0.5 rounded-md">
              {name}
            </span>
          ))}
        </div>

        {/* Delivery location */}
        {appointment.appointment_type === 'delivery' && appointment.delivery_location && (
          <div className="flex items-start gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 text-pink-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-sm flex-1">
              <div className="flex items-center gap-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${appointment.delivery_location.lat},${appointment.delivery_location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:underline font-medium text-xs"
                >
                  Google Maps
                </a>
                <a
                  href={`https://waze.com/ul?ll=${appointment.delivery_location.lat},${appointment.delivery_location.lng}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline font-medium text-xs"
                >
                  Waze
                </a>
                <button
                  onClick={() => {
                    const loc = appointment.delivery_location!
                    const text = loc.description
                      ? `${loc.description} — https://www.google.com/maps?q=${loc.lat},${loc.lng}`
                      : `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
                    navigator.clipboard.writeText(text)
                  }}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  title="Copiar dirección"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
              {appointment.delivery_location.description && (
                <p className="text-zinc-500 text-xs mt-0.5">{appointment.delivery_location.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Payment info for completed appointments */}
        {appointment.status === 'completada' && appointment.payment_amount != null && appointment.payment_method && (
          <div className="flex items-center gap-2 text-sm bg-blue-500/5 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-blue-400">${appointment.payment_amount.toFixed(2)}</span>
            <span className="text-zinc-600">—</span>
            <span className="text-zinc-400">{paymentMethodLabels[appointment.payment_method]}</span>
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.04]">
        {appointment.status === 'pendiente' && (
          <>
            <button
              onClick={() => onStatusChange(appointment.id, 'confirmada')}
              disabled={isUpdating}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium transition-all disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              onClick={() => onStatusChange(appointment.id, 'cancelada')}
              disabled={isUpdating}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 font-medium transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </>
        )}
        {appointment.status === 'confirmada' && (
          <>
            <button
              onClick={() => setPaymentOpen(true)}
              disabled={isUpdating}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium transition-all disabled:opacity-50"
            >
              Completar
            </button>
            <button
              onClick={() => onStatusChange(appointment.id, 'cancelada')}
              disabled={isUpdating}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 font-medium transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </>
        )}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-white/[0.04] text-zinc-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
          title="WhatsApp"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
        <button
          onClick={() => {
            if (confirm('¿Estás seguro de eliminar esta cita? Esta acción no se puede deshacer.')) {
              onDelete(appointment.id)
            }
          }}
          disabled={isUpdating}
          className="p-1.5 rounded-lg bg-white/[0.04] text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 ml-auto"
          title="Eliminar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {slot && (
        <TimeSlotModal
          isOpen={timeSlotOpen}
          onClose={() => setTimeSlotOpen(false)}
          onSelect={(newSlotId) => {
            setTimeSlotOpen(false)
            onChangeSlot(appointment.id, newSlotId)
          }}
          currentDate={slot.date}
          currentSlotId={slot.id}
          clientName={appointment.client_name}
          isSubmitting={isUpdating}
        />
      )}

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSubmit={(amount, method) => {
          setPaymentOpen(false)
          onComplete(appointment.id, amount, method)
        }}
        clientName={appointment.client_name}
        serviceNames={serviceNames}
        isSubmitting={isUpdating}
      />
    </div>
  )
}
