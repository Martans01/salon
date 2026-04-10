'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import AdminLayout from '@/components/Admin/AdminLayout'
import { formatTime12h, todayInPanama } from '@/lib/utils/dates'
import { hasMultipleBarbers, hasMultipleBranches } from '@/config/plan'
import type { Availability, Barber, Branch } from '@/types'

type AvailabilityType = 'en_tienda' | 'delivery'

export default function DisponibilidadPage() {
  const [activeType, setActiveType] = useState<AvailabilityType>('en_tienda')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string>('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')

  // New availability form
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('22:00')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generalLinkCopied, setGeneralLinkCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generalCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadAvailabilities = useCallback(async () => {
    const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    try {
      const params = new URLSearchParams({ from, to, type: activeType })
      if (hasMultipleBarbers && selectedBarberId) params.set('barber_id', selectedBarberId)
      if (hasMultipleBranches && selectedBranchId) params.set('branch_id', selectedBranchId)
      const res = await fetch(`/api/admin/availability?${params}`)
      if (res.ok) {
        setAvailabilities(await res.json())
      }
    } catch (err) {
      console.error('Error loading availability:', err)
    }
  }, [currentMonth, activeType, selectedBarberId, selectedBranchId])

  useEffect(() => {
    if (hasMultipleBarbers && !selectedBarberId) return
    loadAvailabilities()
  }, [loadAvailabilities, selectedBarberId])

  // Load branches for multi plan
  useEffect(() => {
    if (!hasMultipleBranches) return
    fetch('/api/admin/branches')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list: Branch[] = Array.isArray(data) ? data : []
        setBranches(list)
        const active = list.filter(b => b.is_active)
        if (active.length > 0 && !selectedBranchId) {
          setSelectedBranchId(active[0].id)
        }
      })
      .catch(() => setBranches([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load barbers and auto-select first (filtered by branch for multi plan)
  useEffect(() => {
    if (!hasMultipleBarbers) return
    if (hasMultipleBranches && !selectedBranchId) return
    const params = new URLSearchParams()
    if (hasMultipleBranches && selectedBranchId) params.set('branch_id', selectedBranchId)
    fetch(`/api/admin/barbers?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list: Barber[] = Array.isArray(data) ? data : []
        setBarbers(list)
        const active = list.filter(b => b.is_active)
        if (active.length > 0) {
          setSelectedBarberId(active[0].id)
        } else {
          setSelectedBarberId('')
        }
      })
      .catch(() => setBarbers([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId])

  // Reset selected date when switching type
  useEffect(() => {
    setSelectedDate(null)
    setMessage(null)
    setLinkCopied(false)
  }, [activeType])

  const handleAddAvailability = async () => {
    if (!selectedDate || !startTime || !endTime) return
    if (selectedDate < todayInPanama()) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          type: activeType,
          ...(hasMultipleBarbers && selectedBarberId ? { barber_id: selectedBarberId } : {}),
          ...(hasMultipleBranches && selectedBranchId ? { branch_id: selectedBranchId } : {}),
        }),
      })

      if (res.status === 409) {
        setMessage({ type: 'error', text: 'Ya existe disponibilidad para esa fecha y hora' })
        return
      }

      if (!res.ok) throw new Error()

      const data = await res.json()
      setMessage({ type: 'success', text: `Disponibilidad creada: ${data.slots_created} cupos generados` })
      loadAvailabilities()
    } catch {
      setMessage({ type: 'error', text: 'Error al crear disponibilidad' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('¿Eliminar este bloque de disponibilidad?')) return

    try {
      const res = await fetch(`/api/admin/availability?id=${id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const data = await res.json()
        alert(data.error)
        return
      }
      if (res.ok) {
        loadAvailabilities()
      }
    } catch {
      alert('Error al eliminar')
    }
  }

  // Calendar generation
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const availByDate = new Map<string, Availability[]>()
  availabilities.forEach(a => {
    const list = availByDate.get(a.date) || []
    list.push(a)
    availByDate.set(a.date, list)
  })

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  // Time options
  const timeOptions: string[] = []
  for (let h = 6; h <= 23; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`)
    timeOptions.push(`${h.toString().padStart(2, '0')}:30`)
  }

  const todayStr = todayInPanama()
  const selectedDateAvailabilities = selectedDate ? (availByDate.get(selectedDate) || []) : []

  const handleCopyLink = (withDate: boolean) => {
    const base = activeType === 'delivery'
      ? `${window.location.origin}/reservar/delivery`
      : `${window.location.origin}/reservar`
    const url = withDate && selectedDate ? `${base}?date=${selectedDate}` : base
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const handleCopyGeneralLink = () => {
    const url = activeType === 'delivery'
      ? `${window.location.origin}/reservar/delivery`
      : `${window.location.origin}/reservar`
    navigator.clipboard.writeText(url).then(() => {
      setGeneralLinkCopied(true)
      if (generalCopyTimeoutRef.current) clearTimeout(generalCopyTimeoutRef.current)
      generalCopyTimeoutRef.current = setTimeout(() => setGeneralLinkCopied(false), 2000)
    })
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Disponibilidad</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Administra horarios y bloques de atención</p>
        </div>

        {/* Branch selector (multi plan) */}
        {hasMultipleBranches && (
          <div className="mb-4">
            {branches.filter(b => b.is_active).length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg px-4 py-3 text-sm">
                No hay sucursales activas. Crea una en la sección Sucursales primero.
              </div>
            ) : (
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Sucursal</label>
                <select
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                >
                  {branches.filter(b => b.is_active).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Barber selector */}
        {hasMultipleBarbers && (
          <div className="mb-4">
            {barbers.filter(b => b.is_active).length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg px-4 py-3 text-sm">
                {hasMultipleBranches ? 'No hay estilistas activas en esta sucursal.' : 'No hay estilistas activas. Crea una en la sección Estilistas primero.'}
              </div>
            ) : (
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Estilista</label>
                <select
                  value={selectedBarberId}
                  onChange={e => setSelectedBarberId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                >
                  {barbers.filter(b => b.is_active).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Type toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveType('en_tienda')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeType === 'en_tienda'
                ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                : 'bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            En Salón
          </button>
          <button
            onClick={() => setActiveType('delivery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeType === 'delivery'
                ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                : 'bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Delivery
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h3 className="text-white font-semibold capitalize text-lg">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs text-zinc-500 font-medium py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                const dateStr = format(d, 'yyyy-MM-dd')
                const isCurrentMonth = isSameMonth(d, currentMonth)
                const hasAvailability = availByDate.has(dateStr)
                const isSelected = selectedDate === dateStr
                const isPast = dateStr < todayStr

                return (
                  <button
                    key={i}
                    onClick={() => !isPast && isCurrentMonth && setSelectedDate(dateStr)}
                    className={`
                      relative aspect-square flex items-center justify-center rounded-lg text-sm transition-all duration-200
                      ${!isCurrentMonth ? 'text-zinc-800' : isPast ? 'text-zinc-600 cursor-default' : 'text-white hover:bg-white/[0.05] cursor-pointer'}
                      ${isSelected && !isPast ? 'bg-pink-500 text-white font-bold shadow-[0_0_12px_rgba(236,72,153,0.3)]' : ''}
                    `}
                  >
                    {format(d, 'd')}
                    {hasAvailability && (
                      <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : isPast ? 'bg-zinc-600' : 'bg-green-500'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Day editor */}
          <div>
            {selectedDate ? (
              <div className="space-y-4">
                <h3 className="text-white font-semibold capitalize">
                  {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), "EEEE, d 'de' MMMM", { locale: es })}
                </h3>

                {/* Existing availability blocks */}
                {selectedDateAvailabilities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-sm">Bloques existentes:</p>
                    {selectedDateAvailabilities.map(a => (
                      <div key={a.id} className="flex items-center justify-between glass-card rounded-lg px-3 py-2 hover:border-pink-500/20 transition-all duration-200">
                        <span className="text-white text-sm">
                          {formatTime12h(a.start_time.slice(0, 5))} - {formatTime12h(a.end_time.slice(0, 5))}
                        </span>
                        <button
                          onClick={() => handleDeleteAvailability(a.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Share link */}
                {selectedDateAvailabilities.length > 0 && (
                  <div className="glass-card gradient-border rounded-xl p-4 space-y-3">
                    <p className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Compartir enlace de reserva
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyLink(true)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          linkCopied
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/30 hover:shadow-[0_0_12px_rgba(236,72,153,0.15)]'
                        }`}
                      >
                        {linkCopied ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Enlace copiado!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            Copiar enlace con fecha
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCopyLink(false)}
                        className="py-2 px-3 rounded-lg text-sm text-zinc-400 border border-zinc-700 hover:bg-white/[0.05] transition-all"
                        title="Copiar enlace general (sin fecha)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Add new block */}
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <p className="text-zinc-400 text-sm font-medium">Agregar bloque de horario:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Desde</label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500 hover:border-zinc-600 transition-colors"
                      >
                        {timeOptions.map(t => (
                          <option key={t} value={t}>{formatTime12h(t)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Hasta</label>
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500 hover:border-zinc-600 transition-colors"
                      >
                        {timeOptions.map(t => (
                          <option key={t} value={t}>{formatTime12h(t)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddAvailability}
                    disabled={isSubmitting || startTime >= endTime}
                    className="w-full py-2 rounded-lg bg-pink-500 text-white font-bold text-sm hover:bg-pink-600 transition-all disabled:opacity-50 glow-button"
                  >
                    {isSubmitting ? 'Creando...' : 'Agregar Disponibilidad'}
                  </button>
                </div>

                {/* Message */}
                {message && (
                  <div className={`px-4 py-3 rounded-lg text-sm ${
                    message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {message.text}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-zinc-400">Selecciona un día en el calendario para administrar la disponibilidad</p>
              </div>
            )}
          </div>
        </div>

        {/* General booking link - always visible */}
        <div className="mt-6 glass-card gradient-border rounded-xl p-4 space-y-3">
          <p className="text-zinc-400 text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Enlace general de reserva
          </p>
          <p className="text-zinc-500 text-xs">Comparte este enlace para que el cliente elija el día que prefiera</p>
          <button
            onClick={handleCopyGeneralLink}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              generalLinkCopied
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/30 hover:shadow-[0_0_12px_rgba(236,72,153,0.15)]'
            }`}
          >
            {generalLinkCopied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Enlace copiado!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copiar enlace de reserva
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
