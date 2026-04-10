'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SERVICES, BUSINESS_INFO } from '@/utils/constants'
import { formatDateSpanish, formatTime12h } from '@/lib/utils/dates'
import type { BookingConfirmation } from '@/types'

export default function DeliveryConfirmacionPage() {
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('bookingConfirmation')
    if (stored) {
      setConfirmation(JSON.parse(stored))
    }
  }, [])

  if (!confirmation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No se encontró información de reserva</p>
          <Link href="/reservar/delivery" className="text-pink-500 hover:underline">
            Hacer una reserva delivery
          </Link>
        </div>
      </div>
    )
  }

  const serviceNames = confirmation.services.map(id =>
    SERVICES.find(s => s.id === id)?.name || id
  )

  const whatsappMessage = encodeURIComponent(
    `Hola! Acabo de reservar una cita a domicilio en ${BUSINESS_INFO.name}.\n\n` +
    `Nombre: ${confirmation.client_name}\n` +
    (confirmation.branch_name ? `Sucursal: ${confirmation.branch_name}\n` : '') +
    (confirmation.barber_name ? `Estilista: ${confirmation.barber_name}\n` : '') +
    `Fecha: ${formatDateSpanish(confirmation.date)}\n` +
    `Hora: ${formatTime12h(confirmation.start_time)} - ${formatTime12h(confirmation.end_time)}\n` +
    `Servicios: ${serviceNames.join(', ')}\n` +
    (confirmation.delivery_location?.description
      ? `Ubicación: ${confirmation.delivery_location.description}\n`
      : '') +
    `\nQuedo atento a la confirmación!`
  )

  const phoneClean = BUSINESS_INFO.phone.replace(/[\s-]/g, '').replace('+', '')
  const whatsappUrl = `https://wa.me/${phoneClean}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-pink-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Cita Delivery Reservada</h1>
          <p className="text-zinc-400">Tu cita a domicilio ha sido registrada exitosamente</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 rounded-xl p-5 space-y-3 mb-6"
        >
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Tipo</span>
            <span className="text-pink-400 font-medium">A Domicilio</span>
          </div>
          {confirmation.branch_name && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Sucursal</span>
              <span className="text-white">{confirmation.branch_name}</span>
            </div>
          )}
          {confirmation.barber_name && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Estilista</span>
              <span className="text-white">{confirmation.barber_name}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Fecha</span>
            <span className="text-white capitalize">{formatDateSpanish(confirmation.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Hora</span>
            <span className="text-white">{formatTime12h(confirmation.start_time)} - {formatTime12h(confirmation.end_time)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Servicios</span>
            <span className="text-white text-right">{serviceNames.join(', ')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Estado</span>
            <span className="text-yellow-400 font-medium">Pendiente de confirmación</span>
          </div>
          {confirmation.delivery_location && (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-zinc-400 text-sm mb-1">Ubicación registrada</p>
              <a
                href={`https://www.google.com/maps?q=${confirmation.delivery_location.lat},${confirmation.delivery_location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 text-sm hover:underline"
              >
                Ver en Google Maps
              </a>
              {confirmation.delivery_location.description && (
                <p className="text-zinc-500 text-sm mt-1">{confirmation.delivery_location.description}</p>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar WhatsApp al salón
          </a>

          <Link
            href="/"
            className="w-full py-3 rounded-lg border border-zinc-700 text-white font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center"
          >
            Volver al inicio
          </Link>
        </motion.div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          La estilista confirmará tu cita y dirección por WhatsApp
        </p>
      </div>
    </div>
  )
}
