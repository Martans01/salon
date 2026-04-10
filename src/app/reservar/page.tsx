'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatDateSpanish } from '@/lib/utils/dates'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from '@/components/Booking/DatePicker'
import TimeSlotGrid from '@/components/Booking/TimeSlotGrid'
import ServiceSelector from '@/components/Booking/ServiceSelector'
import ClientInfoForm from '@/components/Booking/ClientInfoForm'
import BookingSummary from '@/components/Booking/BookingSummary'
import BarberSelector from '@/components/Booking/BarberSelector'
import BranchSelector from '@/components/Booking/BranchSelector'
import { BUSINESS_INFO } from '@/utils/constants'
import { hasMultipleBarbers, hasMultipleBranches } from '@/config/plan'
import type { TimeSlot, Barber, Branch } from '@/types'

type Step = 'type' | 'branch' | 'barber' | 'date' | 'time' | 'services' | 'info' | 'summary'

interface DateInfo {
  date: string
  available: number
  total: number
}

export default function ReservarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const dateParamHandled = useRef(false)

  // Settings
  const [advanceDays, setAdvanceDays] = useState(14)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Step state — if URL has a date param, skip type selection
  const [step, setStep] = useState<Step>(dateParam ? 'date' : 'type')

  // Branch state (multi plan)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)

  // Barber state (local/multi plans)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false)

  // Selection state
  const [availableDates, setAvailableDates] = useState<DateInfo[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  // Load saved client info from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('bs_client_name')
    const savedPhone = localStorage.getItem('bs_client_phone')
    if (savedName) setClientName(savedName)
    if (savedPhone) setClientPhone(savedPhone)
  }, [])

  // UI state
  const [isLoadingDates, setIsLoadingDates] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load settings and available dates
  useEffect(() => {
    async function init() {
      try {
        const settingsRes = await fetch('/api/admin/settings')
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          setAdvanceDays(settings.advance_booking_days || 14)
        }
      } catch {
        // Use defaults
      } finally {
        setSettingsLoaded(true)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!settingsLoaded) return
    // Calculate date range based on Panama time
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const panama = new Date(utc - 5 * 3600000)

    const start = panama.toISOString().split('T')[0]
    let end = new Date(panama.getTime() + advanceDays * 86400000).toISOString().split('T')[0]

    // Extend range to include shared date if beyond advance days
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam > end) {
      end = dateParam
    }

    setDateRange({ start, end })
  }, [advanceDays, settingsLoaded, dateParam])

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return

    async function loadDates() {
      setIsLoadingDates(true)
      try {
        let url = `/api/slots?from=${dateRange.start}&to=${dateRange.end}`
        if (selectedBarberId) url += `&barber_id=${selectedBarberId}`
        const res = await fetch(url)
        if (res.ok) {
          setAvailableDates(await res.json())
        }
      } catch {
        setError('Error cargando disponibilidad')
      } finally {
        setIsLoadingDates(false)
      }
    }
    loadDates()
  }, [dateRange, selectedBarberId])

  // Auto-select date from URL parameter
  useEffect(() => {
    if (!dateParam || dateParamHandled.current || isLoadingDates || availableDates.length === 0) return
    dateParamHandled.current = true

    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return

    const dateHasSlots = availableDates.some(d => d.date === dateParam && d.available > 0)
    if (dateHasSlots) {
      handleDateSelect(dateParam)
    } else {
      setError('La fecha compartida no tiene horarios disponibles. Elige otra fecha.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParam, isLoadingDates, availableDates])

  // Load branches (for multi plan)
  const handleGoToBranchStep = async () => {
    setStep('branch')
    if (branches.length > 0) return
    setIsLoadingBranches(true)
    try {
      const res = await fetch('/api/branches')
      if (res.ok) setBranches(await res.json())
    } catch {
      setError('Error cargando sucursales')
    } finally {
      setIsLoadingBranches(false)
    }
  }

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId)
    // Reset downstream (barber, date, etc)
    setBarbers([])
    setSelectedBarberId(null)
    setSelectedDate(null)
    setSelectedSlotId(null)
    setAvailableDates([])
    setSlots([])
    setStep('barber')
    // Load barbers for this branch
    setIsLoadingBarbers(true)
    fetch(`/api/barbers?branch_id=${branchId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBarbers(Array.isArray(data) ? data : []))
      .catch(() => setError('Error cargando estilistas'))
      .finally(() => setIsLoadingBarbers(false))
  }

  // Load barbers (for local/multi plans)
  const handleGoToBarberStep = async () => {
    setStep('barber')
    if (barbers.length > 0) return
    setIsLoadingBarbers(true)
    try {
      const url = selectedBranchId ? `/api/barbers?branch_id=${selectedBranchId}` : '/api/barbers'
      const res = await fetch(url)
      if (res.ok) setBarbers(await res.json())
    } catch {
      setError('Error cargando estilistas')
    } finally {
      setIsLoadingBarbers(false)
    }
  }

  const handleBarberSelect = (barberId: string) => {
    setSelectedBarberId(barberId)
    // Reset downstream selections since availability depends on barber
    setSelectedDate(null)
    setSelectedSlotId(null)
    setAvailableDates([])
    setSlots([])
    setStep('date')
  }

  // Load slots when date is selected
  const loadSlots = useCallback(async (date: string) => {
    setIsLoadingSlots(true)
    setSelectedSlotId(null)
    try {
      let url = `/api/slots?date=${date}`
      if (selectedBarberId) url += `&barber_id=${selectedBarberId}`
      const res = await fetch(url)
      if (res.ok) {
        setSlots(await res.json())
      }
    } catch {
      setError('Error cargando horarios')
    } finally {
      setIsLoadingSlots(false)
    }
  }, [selectedBarberId])

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
    setStep('info')
  }

  const handleInfoNext = () => {
    if (!clientName.trim() || clientPhone.replace(/\D/g, '').length < 7) return
    setStep('summary')
  }

  const handleConfirm = async () => {
    if (!selectedSlotId || !clientName.trim() || !clientPhone) return

    setIsSubmitting(true)
    setError(null)

    try {
      localStorage.setItem('bs_client_name', clientName.trim())
      localStorage.setItem('bs_client_phone', clientPhone)

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_slot_id: selectedSlotId,
          client_name: clientName.trim(),
          client_phone: `+507${clientPhone.replace(/\D/g, '')}`,
          services: selectedServices,
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

      // Store confirmation in sessionStorage for the confirmation page
      sessionStorage.setItem('bookingConfirmation', JSON.stringify(confirmation))
      router.push('/reservar/confirmacion')
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
    ...(hasMultipleBarbers ? [{ key: 'barber' as Step, label: 'Estilista' }] : []),
    { key: 'date', label: 'Fecha' },
    { key: 'time', label: 'Hora' },
    { key: 'services', label: 'Servicios' },
    { key: 'info', label: 'Datos' },
    { key: 'summary', label: 'Confirmar' },
  ]
  const currentStepIndex = steps.findIndex(s => s.key === step)
  const showStepBar = step !== 'type' && step !== 'branch' && step !== 'barber'

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
          {/* Step 0: Type selection */}
          {step === 'type' && (
            <motion.div key="type" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
              <div className="w-full">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.5}/>
                      <line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.5}/>
                      <line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.5}/>
                      <line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.5}/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Agendar cita</h2>
                  <p className="text-zinc-400 text-sm">Selecciona cómo prefieres tu servicio</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if (hasMultipleBranches) {
                        handleGoToBranchStep()
                      } else if (hasMultipleBarbers) {
                        handleGoToBarberStep()
                      } else {
                        setStep('date')
                      }
                    }}
                    className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:border-pink-500/50 hover:shadow-[0_0_24px_rgba(236,72,153,0.1)] transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 group-hover:scale-110 transition-all">
                      <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg">En el local</p>
                      <p className="text-zinc-500 text-sm mt-1">Visita nuestro salón</p>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/reservar/delivery')}
                    className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:border-pink-500/50 hover:shadow-[0_0_24px_rgba(236,72,153,0.1)] transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 group-hover:scale-110 transition-all">
                      <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg">A domicilio</p>
                      <p className="text-zinc-500 text-sm mt-1">Te atendemos en tu casa</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Branch (multi plan) */}
          {step === 'branch' && (
            <motion.div key="branch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep('type')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Cambiar modalidad
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Elige una sucursal</h2>
              <p className="text-zinc-400 text-sm mb-4">¿En cuál de nuestras sedes deseas tu cita?</p>
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
              <button onClick={() => setStep(hasMultipleBranches ? 'branch' : 'type')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                {hasMultipleBranches ? 'Cambiar sucursal' : 'Cambiar modalidad'}
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Elige tu estilista</h2>
              <p className="text-zinc-400 text-sm mb-4">Selecciona con quién deseas tu cita</p>
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
              <button onClick={() => setStep(hasMultipleBarbers ? 'barber' : 'type')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                {hasMultipleBarbers ? 'Cambiar estilista' : 'Cambiar modalidad'}
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Selecciona una fecha</h2>
              <p className="text-zinc-400 text-sm mb-4">Los días con punto rosa tienen horarios disponibles</p>
              {isLoadingDates ? (
                <div className="bg-zinc-900 rounded-xl p-4 h-80 animate-pulse" />
              ) : availableDates.length === 0 ? (
                <div className="bg-zinc-900 rounded-xl p-8 text-center">
                  <p className="text-zinc-400">No hay horarios disponibles en este momento.</p>
                  <p className="text-zinc-500 text-sm mt-2">Contáctanos por WhatsApp para más información.</p>
                  <a
                    href={`https://wa.me/${BUSINESS_INFO.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola! Me gustaría agendar una cita pero no veo horarios disponibles. ¿Cuándo tienes disponibilidad?')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
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
                <p className="text-pink-400 text-sm font-medium mb-3 capitalize">
                  {formatDateSpanish(selectedDate)}
                </p>
              )}
              <h2 className="text-xl font-bold text-white mb-1">Selecciona un horario</h2>
              <p className="text-zinc-400 text-sm mb-4">Horarios disponibles para el día seleccionado</p>
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

          {/* Step 4: Client info */}
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep('services')} className="text-pink-500 text-sm mb-3 flex items-center gap-1 hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Cambiar servicios
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Tus datos</h2>
              <p className="text-zinc-400 text-sm mb-4">Para confirmar tu cita necesitamos tu nombre y teléfono</p>
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

          {/* Step 5: Summary */}
          {step === 'summary' && selectedDate && selectedSlot && (
            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <BookingSummary
                date={selectedDate}
                slot={selectedSlot}
                services={selectedServices}
                clientName={clientName}
                clientPhone={clientPhone}
                onConfirm={handleConfirm}
                onBack={() => setStep('info')}
                isSubmitting={isSubmitting}
                barberName={selectedBarber?.name}
                branchName={selectedBranch?.name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
