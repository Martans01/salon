'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { formatDateSpanish, formatTime12h } from '@/lib/utils/dates'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from '@/components/Booking/DatePicker'
import TimeSlotGrid from '@/components/Booking/TimeSlotGrid'
import ServiceSelector from '@/components/Booking/ServiceSelector'
import ClientInfoForm from '@/components/Booking/ClientInfoForm'
import BarberSelector from '@/components/Booking/BarberSelector'
import BranchSelector from '@/components/Booking/BranchSelector'
import { BUSINESS_INFO, SERVICES } from '@/utils/constants'
import { hasMultipleBarbers, hasMultipleBranches } from '@/config/plan'
import type { TimeSlot, DeliveryLocation, Barber, Branch } from '@/types'

const MapPicker = dynamic(() => import('@/components/Booking/MapPicker'), { ssr: false })

type Step = 'branch' | 'barber' | 'date' | 'time' | 'services' | 'location' | 'info' | 'summary'

interface DateInfo {
  date: string
  available: number
  total: number
}

export default function DeliveryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const dateParamHandled = useRef(false)

  const [advanceDays, setAdvanceDays] = useState(14)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const [step, setStep] = useState<Step>(hasMultipleBranches ? 'branch' : hasMultipleBarbers ? 'barber' : 'date')

  // Branch state (multi plan)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)

  // Barber state (local/multi plans)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false)

  const [availableDates, setAvailableDates] = useState<DateInfo[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null)
  const [locationDescription, setLocationDescription] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  const [isLoadingDates, setIsLoadingDates] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedName = localStorage.getItem('jd_client_name')
    const savedPhone = localStorage.getItem('jd_client_phone')
    if (savedName) setClientName(savedName)
    if (savedPhone) setClientPhone(savedPhone)
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const settings = await res.json()
          setAdvanceDays(settings.advance_booking_days || 14)
        }
      } catch {
        // use defaults
      } finally {
        setSettingsLoaded(true)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!settingsLoaded) return
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const panama = new Date(utc - 5 * 3600000)
    const start = panama.toISOString().split('T')[0]
    let end = new Date(panama.getTime() + advanceDays * 86400000).toISOString().split('T')[0]
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam > end) {
      end = dateParam
    }
    setDateRange({ start, end })
  }, [advanceDays, settingsLoaded, dateParam])

  // Load branches on mount if multi plan
  useEffect(() => {
    if (!hasMultipleBranches) return
    setIsLoadingBranches(true)
    fetch('/api/branches')
      .then(r => r.ok ? r.json() : [])
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setError('Error cargando sucursales'))
      .finally(() => setIsLoadingBranches(false))
  }, [])

  // Load barbers on mount if plan requires it (non-multi)
  useEffect(() => {
    if (!hasMultipleBarbers || hasMultipleBranches) return
    async function loadBarbers() {
      setIsLoadingBarbers(true)
      try {
        const res = await fetch('/api/barbers')
        if (res.ok) setBarbers(await res.json())
      } catch {
        setError('Error cargando barberos')
      } finally {
        setIsLoadingBarbers(false)
      }
    }
    loadBarbers()
  }, [])

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return
    // For local/multi plans, wait until a barber is selected
    if (hasMultipleBarbers && !selectedBarberId) return
    async function loadDates() {
      setIsLoadingDates(true)
      try {
        let url = `/api/slots?from=${dateRange.start}&to=${dateRange.end}&type=delivery`
        if (selectedBarberId) url += `&barber_id=${selectedBarberId}`
        const res = await fetch(url)
        if (res.ok) setAvailableDates(await res.json())
      } catch {
        setError('Error cargando disponibilidad')
      } finally {
        setIsLoadingDates(false)
      }
    }
    loadDates()
  }, [dateRange, selectedBarberId])

  useEffect(() => {
    if (!dateParam || dateParamHandled.current || isLoadingDates || availableDates.length === 0) return
    dateParamHandled.current = true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return
    const dateHasSlots = availableDates.some(d => d.date === dateParam && d.available > 0)
    if (dateHasSlots) {
      handleDateSelect(dateParam)
    } else {
      setError('La fecha compartida no tiene horarios delivery disponibles. Elige otra fecha.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParam, isLoadingDates, availableDates])

  const loadSlots = useCallback(async (date: string) => {
    setIsLoadingSlots(true)
    setSelectedSlotId(null)
    try {
      let url = `/api/slots?date=${date}&type=delivery`
      if (selectedBarberId) url += `&barber_id=${selectedBarberId}`
      const res = await fetch(url)
      if (res.ok) setSlots(await res.json())
    } catch {
      setError('Error cargando horarios')
    } finally {
      setIsLoadingSlots(false)
    }
  }, [selectedBarberId])

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId)
    setBarbers([])
    setSelectedBarberId(null)
    setSelectedDate(null)
    setSelectedSlotId(null)
    setAvailableDates([])
    setSlots([])
    setStep('barber')
    setIsLoadingBarbers(true)
    fetch(`/api/barbers?branch_id=${branchId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBarbers(Array.isArray(data) ? data : []))
      .catch(() => setError('Error cargando barberos'))
      .finally(() => setIsLoadingBarbers(false))
  }

  const handleBarberSelect = (barberId: string) => {
    setSelectedBarberId(barberId)
    setSelectedDate(null)
    setSelectedSlotId(null)
    setAvailableDates([])
    setSlots([])
    setStep('date')
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    loadSlots(date)
    setStep('time')
  }

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId)
    setStep('services')
  }

  const handleServicesNext = () => {
    if (selectedServices.length === 0) return
    setStep('location')
  }

  const handleLocationNext = () => {
    if (!deliveryLocation) return
    const loc = { ...deliveryLocation, description: locationDescription.trim() }
    setDeliveryLocation(loc)
    setStep('info')
  }

  const handleInfoNext = () => {
    if (!clientName.trim() || clientPhone.replace(/\D/g, '').length < 7) return
    setStep('summary')
  }

  const handleConfirm = async () => {
    if (!selectedSlotId || !clientName.trim() || !clientPhone || !deliveryLocation) return

    setIsSubmitting(true)
    setError(null)

    try {
      localStorage.setItem('jd_client_name', clientName.trim())
      localStorage.setItem('jd_client_phone', clientPhone)

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_slot_id: selectedSlotId,
          client_name: clientName.trim(),
          client_phone: `+507${clientPhone.replace(/\D/g, '')}`,
          services: selectedServices,
          appointment_type: 'delivery',
          delivery_location: { ...deliveryLocation, description: locationDescription.trim() },
          ...(selectedBarberId && { barber_id: selectedBarberId }),
          ...(selectedBranchId && { branch_id: selectedBranchId }),
        }),
      })

      if (res.status === 409) {
        setError('Este horario ya fue reservado. Por favor selecciona otro.')
        setStep('time')
        loadSlots(selectedDate!)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al reservar')
      }

      const confirmation = await res.json()
      sessionStorage.setItem('bookingConfirmation', JSON.stringify(confirmation))
      router.push('/reservar/delivery/confirmacion')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la reserva')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedSlot = slots.find(s => s.id === selectedSlotId)
  const selectedBarber = barbers.find(b => b.id === selectedBarberId)
  const selectedBranch = branches.find(b => b.id === selectedBranchId)

  const steps: { key: Step; label: string }[] = [
    ...(hasMultipleBranches ? [{ key: 'branch' as Step, label: 'Sucursal' }] : []),
    ...(hasMultipleBarbers ? [{ key: 'barber' as Step, label: 'Barbero' }] : []),
    { key: 'date', label: 'Fecha' },
    { key: 'time', label: 'Hora' },
    { key: 'services', label: 'Servicios' },
    { key: 'location', label: 'Ubicación' },
    { key: 'info', label: 'Datos' },
    { key: 'summary', label: 'Confirmar' },
  ]
  const currentStepIndex = steps.findIndex(s => s.key === step)
  const showStepBar = step !== 'branch' && step !== 'barber'

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {BUSINESS_INFO.name}
          </Link>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">A Domicilio</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step indicator */}
        {showStepBar && (
          <div className="flex items-center gap-1 mb-6">
            {steps.map((s, i) => (
              <div key={s.key} className="flex-1">
                <div className={`h-1 rounded-full transition-colors ${i <= currentStepIndex ? 'bg-pink-500' : 'bg-zinc-800'}`} />
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm"
            >
              {error}
              <button onClick={() => setError(null)} className="float-right text-red-400 hover:text-red-300">&times;</button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Step: Branch (multi plan) */}
          {step === 'branch' && (
            <motion.div key="branch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold text-white mb-1">Elige una sucursal</h2>
              <p className="text-zinc-400 text-sm mb-4">¿En cuál de nuestras sedes deseas el servicio delivery?</p>
              <BranchSelector
                branches={branches}
                selectedBranchId={selectedBranchId}
                onSelect={handleBranchSelect}
                isLoading={isLoadingBranches}
              />
            </motion.div>
          )}

          {/* Step: Barber (local/multi plans) */}
          {step === 'barber' && (
            <motion.div key="barber" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {hasMultipleBranches && (
                <button onClick={() => setStep('branch')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Cambiar sucursal
                </button>
              )}
              <h2 className="text-xl font-bold text-white mb-1">Elige tu barbero</h2>
              <p className="text-zinc-400 text-sm mb-4">Selecciona con quién deseas tu cita a domicilio</p>
              <BarberSelector
                barbers={barbers}
                selectedBarberId={selectedBarberId}
                onSelect={handleBarberSelect}
                isLoading={isLoadingBarbers}
              />
            </motion.div>
          )}

          {/* Step 1: Date */}
          {step === 'date' && (
            <motion.div key="date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {hasMultipleBarbers && (
                <button onClick={() => setStep('barber')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Cambiar barbero
                </button>
              )}
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">Selecciona una fecha</h2>
              </div>
              <p className="text-zinc-400 text-sm mb-4">Días disponibles para servicio a domicilio</p>
              {isLoadingDates ? (
                <div className="bg-zinc-900 rounded-xl p-4 h-80 animate-pulse" />
              ) : availableDates.length === 0 ? (
                <div className="bg-zinc-900 rounded-xl p-8 text-center">
                  <p className="text-zinc-400">No hay horarios delivery disponibles por el momento.</p>
                  <p className="text-zinc-500 text-sm mt-2">Contacta al barbero por WhatsApp.</p>
                  <a
                    href={`https://wa.me/${BUSINESS_INFO.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola! Me gustaría agendar un corte a domicilio. ¿Tienes disponibilidad?')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Escribir por WhatsApp
                  </a>
                </div>
              ) : (
                <DatePicker
                  availableDates={availableDates}
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                  minDate={dateRange.start}
                  maxDate={dateRange.end}
                />
              )}
            </motion.div>
          )}

          {/* Step 2: Time */}
          {step === 'time' && (
            <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep('date')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Cambiar fecha
              </button>
              {selectedDate && (
                <p className="text-pink-400 text-sm font-medium mb-3 capitalize">{formatDateSpanish(selectedDate)}</p>
              )}
              <h2 className="text-xl font-bold text-white mb-1">Selecciona un horario</h2>
              <p className="text-zinc-400 text-sm mb-4">Horarios delivery disponibles para el día seleccionado</p>
              <TimeSlotGrid
                slots={slots}
                selectedSlot={selectedSlotId}
                onSelectSlot={handleSlotSelect}
                isLoading={isLoadingSlots}
              />
            </motion.div>
          )}

          {/* Step 3: Services */}
          {step === 'services' && (
            <motion.div key="services" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep('time')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Cambiar horario
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Selecciona los servicios</h2>
              <p className="text-zinc-400 text-sm mb-4">Puedes seleccionar uno o varios servicios</p>
              <ServiceSelector selected={selectedServices} onChange={setSelectedServices} />
              <button
                onClick={handleServicesNext}
                disabled={selectedServices.length === 0}
                className="w-full mt-4 py-3 rounded-lg bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </motion.div>
          )}

          {/* Step 4: Location */}
          {step === 'location' && (
            <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep('services')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Cambiar servicios
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Tu ubicación</h2>
              <p className="text-zinc-400 text-sm mb-4">Toca el mapa para marcar dónde estás</p>

              <MapPicker
                value={deliveryLocation}
                onChange={(loc) => setDeliveryLocation({ ...loc, description: locationDescription })}
              />

              {deliveryLocation && (
                <p className="text-zinc-500 text-xs mt-2 text-center">
                  {deliveryLocation.lat.toFixed(5)}, {deliveryLocation.lng.toFixed(5)}
                </p>
              )}

              <div className="mt-4">
                <label className="block text-sm text-zinc-400 mb-2">
                  Descripción de la ubicación <span className="text-zinc-600">(opcional)</span>
                </label>
                <textarea
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  placeholder="Ej: Casa azul esquinera, frente al parque, puerta verde..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <button
                onClick={handleLocationNext}
                disabled={!deliveryLocation}
                className="w-full mt-4 py-3 rounded-lg bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deliveryLocation ? 'Continuar' : 'Marca tu ubicación en el mapa'}
              </button>
            </motion.div>
          )}

          {/* Step 5: Client info */}
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep('location')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Cambiar ubicación
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Tus datos</h2>
              <p className="text-zinc-400 text-sm mb-4">Para confirmar tu cita delivery necesitamos tu nombre y teléfono</p>
              <ClientInfoForm
                name={clientName}
                phone={clientPhone}
                onNameChange={setClientName}
                onPhoneChange={setClientPhone}
              />
              <button
                onClick={handleInfoNext}
                disabled={!clientName.trim() || clientPhone.replace(/\D/g, '').length < 7}
                className="w-full mt-4 py-3 rounded-lg bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revisar Resumen
              </button>
            </motion.div>
          )}

          {/* Step 6: Summary */}
          {step === 'summary' && selectedDate && selectedSlot && deliveryLocation && (
            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep('info')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Editar datos
              </button>
              <h2 className="text-xl font-bold text-white mb-4">Resumen de tu cita</h2>

              <div className="bg-zinc-900 rounded-xl p-5 space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Tipo</span>
                  <span className="text-pink-400 font-medium">A Domicilio</span>
                </div>
                {selectedBranch && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Sucursal</span>
                    <span className="text-white">{selectedBranch.name}</span>
                  </div>
                )}
                {selectedBarber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Barbero</span>
                    <span className="text-white">{selectedBarber.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Fecha</span>
                  <span className="text-white capitalize">{formatDateSpanish(selectedDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Hora</span>
                  <span className="text-white">{formatTime12h(selectedSlot.start_time)} - {formatTime12h(selectedSlot.end_time)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Servicios</span>
                  <span className="text-white text-right">
                    {selectedServices.map(id => SERVICES.find(s => s.id === id)?.name || id).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Nombre</span>
                  <span className="text-white">{clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Teléfono</span>
                  <span className="text-white">+507 {clientPhone}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-1">Ubicación</p>
                  <a
                    href={`https://www.google.com/maps?q=${deliveryLocation.lat},${deliveryLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 text-sm hover:underline"
                  >
                    Ver en mapa
                  </a>
                  {locationDescription && (
                    <p className="text-zinc-400 text-sm mt-1">{locationDescription}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Reservando...' : 'Confirmar Cita Delivery'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
