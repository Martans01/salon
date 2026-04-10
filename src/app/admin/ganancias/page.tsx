'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, addDays, addWeeks, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import AdminLayout from '@/components/Admin/AdminLayout'
import { SERVICES } from '@/utils/constants'
import { nowInPanama, formatDateSpanish, formatTime12h } from '@/lib/utils/dates'
import { hasMultipleBarbers, hasMultipleBranches } from '@/config/plan'
import type { Appointment, PaymentMethod, Barber, Branch } from '@/types'

type Period = 'hoy' | 'semana' | 'mes'
type ViewMode = 'general' | 'barberos'

const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  yappy: 'Yappy',
}

function getDateRange(period: Period, offset: number): { from: string; to: string } {
  const now = nowInPanama()

  if (period === 'hoy') {
    const day = addDays(now, offset)
    const d = format(day, 'yyyy-MM-dd')
    return { from: d, to: d }
  }
  if (period === 'semana') {
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekStart = addWeeks(currentWeekStart, offset)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    return { from: format(weekStart, 'yyyy-MM-dd'), to: format(weekEnd, 'yyyy-MM-dd') }
  }
  // mes
  const currentMonthStart = startOfMonth(now)
  const monthStart = addMonths(currentMonthStart, offset)
  const monthEnd = endOfMonth(monthStart)
  return { from: format(monthStart, 'yyyy-MM-dd'), to: format(monthEnd, 'yyyy-MM-dd') }
}

function getPeriodLabel(period: Period, offset: number): string {
  const now = nowInPanama()

  if (period === 'hoy') {
    const day = addDays(now, offset)
    return format(day, "d 'de' MMMM 'de' yyyy", { locale: es })
  }
  if (period === 'semana') {
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekStart = addWeeks(currentWeekStart, offset)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    return `${format(weekStart, 'd', { locale: es })} – ${format(weekEnd, "d MMM yyyy", { locale: es })}`
  }
  // mes
  const currentMonthStart = startOfMonth(now)
  const monthStart = addMonths(currentMonthStart, offset)
  const label = format(monthStart, 'MMMM yyyy', { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

interface BarberEarnings {
  barber: Barber
  totalRevenue: number
  barberCut: number
  houseCut: number
  appointmentCount: number
  appointments: Appointment[]
}

export default function GananciasPage() {
  const [period, setPeriod] = useState<Period>('hoy')
  const [offset, setOffset] = useState(0)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [barberFilter, setBarberFilter] = useState<string>('todos')
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchFilter, setBranchFilter] = useState<string>('todas')
  const [viewMode, setViewMode] = useState<ViewMode>(hasMultipleBarbers ? 'barberos' : 'general')
  const [expandedBarber, setExpandedBarber] = useState<string | null>(null)

  const loadEarnings = useCallback(async () => {
    setIsLoading(true)
    try {
      const { from, to } = getDateRange(period, offset)
      const params = new URLSearchParams({ status: 'completada', from, to })
      if (hasMultipleBarbers && barberFilter !== 'todos') params.set('barber_id', barberFilter)
      if (hasMultipleBranches && branchFilter !== 'todas') params.set('branch_id', branchFilter)
      const res = await fetch(`/api/admin/appointments?${params}`)
      if (res.ok) {
        const data: Appointment[] = await res.json()
        setAppointments(data.filter(a => a.payment_amount != null))
      }
    } catch (err) {
      console.error('Error loading earnings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [period, offset, barberFilter, branchFilter])

  useEffect(() => {
    loadEarnings()
  }, [loadEarnings])

  // Load barbers list
  useEffect(() => {
    if (!hasMultipleBarbers) return
    fetch('/api/admin/barbers')
      .then(r => r.ok ? r.json() : [])
      .then(data => setBarbers(Array.isArray(data) ? data : []))
      .catch(() => setBarbers([]))
    if (hasMultipleBranches) {
      fetch('/api/admin/branches')
        .then(r => r.ok ? r.json() : [])
        .then(data => setBranches(Array.isArray(data) ? data : []))
        .catch(() => setBranches([]))
    }
  }, [])

  // Calculate barber earnings breakdown
  const barberEarnings: BarberEarnings[] = barbers
    .filter(b => b.is_active)
    .map(barber => {
      const barberAppts = appointments.filter(a => a.barber_id === barber.id)
      const totalRevenue = barberAppts.reduce((sum, a) => sum + (a.payment_amount || 0), 0)
      const commission = barber.commission_percent ?? 50
      const barberCut = totalRevenue * (commission / 100)
      const houseCut = totalRevenue - barberCut
      return {
        barber,
        totalRevenue,
        barberCut,
        houseCut,
        appointmentCount: barberAppts.length,
        appointments: barberAppts,
      }
    })
    .filter(e => e.appointmentCount > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  const totalEarnings = appointments.reduce((sum, a) => sum + (a.payment_amount || 0), 0)
  const totalCount = appointments.length
  const totalHouseCut = barberEarnings.reduce((sum, e) => sum + e.houseCut, 0)
  const totalBarbersCut = barberEarnings.reduce((sum, e) => sum + e.barberCut, 0)

  // Group by date (for general view)
  const grouped = appointments.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const date = apt.time_slot?.date || 'sin-fecha'
    if (!acc[date]) acc[date] = []
    acc[date].push(apt)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const periods: { key: Period; label: string }[] = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mes' },
  ]

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Ganancias</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Resumen de ingresos y comisiones</p>
        </div>

        {/* Branch + Barber filter */}
        {(hasMultipleBranches || hasMultipleBarbers) && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {hasMultipleBranches && branches.length > 0 && (
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              >
                <option value="todas">Todas las sucursales</option>
                {branches.filter(b => b.is_active).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            {hasMultipleBarbers && barbers.length > 0 && viewMode === 'general' && (
              <select
                value={barberFilter}
                onChange={e => setBarberFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
              >
                <option value="todos">Todas las estilistas</option>
                {barbers.filter(b => b.is_active).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => { setPeriod(p.key); setOffset(0) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                period === p.key
                  ? 'bg-pink-500 text-white shadow-[0_0_16px_rgba(236,72,153,0.3)]'
                  : 'glass-card text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Period navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setOffset(o => o - 1)}
            className="p-2 rounded-lg glass-card text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-200"
            aria-label="Período anterior"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-zinc-300">{getPeriodLabel(period, offset)}</span>
          <button
            onClick={() => setOffset(o => o + 1)}
            disabled={offset >= 0}
            className={`p-2 rounded-lg glass-card transition-all duration-200 ${
              offset >= 0
                ? 'text-zinc-700 cursor-not-allowed'
                : 'text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}
            aria-label="Período siguiente"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Summary cards */}
        <div className={`grid gap-3 mb-6 ${hasMultipleBarbers ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider">Ingreso Total</span>
            </div>
            <p className="text-2xl font-bold text-white">${totalEarnings.toFixed(2)}</p>
          </div>
          {hasMultipleBarbers && (
            <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                </div>
                <span className="text-zinc-500 text-xs uppercase tracking-wider">Local</span>
              </div>
              <p className="text-2xl font-bold text-green-400">${totalHouseCut.toFixed(2)}</p>
            </div>
          )}
          <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider">Citas</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalCount}</p>
          </div>
        </div>

        {/* View mode toggle (only for plans with multiple barbers) */}
        {hasMultipleBarbers && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setViewMode('barberos'); setBarberFilter('todos') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'barberos'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Por Estilista
            </button>
            <button
              onClick={() => setViewMode('general')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'general'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Detalle General
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="shimmer-skeleton rounded-xl h-20" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-zinc-400">No hay ganancias en este período</p>
          </div>
        ) : viewMode === 'barberos' && hasMultipleBarbers ? (
          /* === BARBER VIEW === */
          <div className="space-y-3">
            {barberEarnings.map(({ barber, totalRevenue, barberCut, houseCut, appointmentCount, appointments: barberAppts }) => {
              const isExpanded = expandedBarber === barber.id
              const commission = barber.commission_percent ?? 50
              return (
                <div key={barber.id} className="admin-card rounded-xl overflow-hidden">
                  {/* Barber summary row */}
                  <button
                    onClick={() => setExpandedBarber(isExpanded ? null : barber.id)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {barber.image_url ? (
                        <img src={barber.image_url} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-pink-500 font-bold text-sm">
                          {barber.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm truncate">{barber.name}</span>
                        <span className="text-zinc-600 text-xs">{commission}%</span>
                      </div>
                      <p className="text-zinc-500 text-xs">{appointmentCount} cita{appointmentCount !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Amounts */}
                    <div className="text-right shrink-0">
                      <p className="text-pink-400 font-bold text-sm">${barberCut.toFixed(2)}</p>
                      <p className="text-green-400/70 text-xs">Local: ${houseCut.toFixed(2)}</p>
                    </div>

                    {/* Chevron */}
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800">
                      {/* Commission bar */}
                      <div className="px-4 py-3 bg-zinc-900/50">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-zinc-400">Total generado</span>
                          <span className="text-white font-medium">${totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                          <div
                            className="h-full bg-pink-500 rounded-l-full"
                            style={{ width: `${commission}%` }}
                          />
                          <div
                            className="h-full bg-green-500 rounded-r-full"
                            style={{ width: `${100 - commission}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] mt-1">
                          <span className="text-pink-400">Estilista: ${barberCut.toFixed(2)} ({commission}%)</span>
                          <span className="text-green-400">Local: ${houseCut.toFixed(2)} ({100 - commission}%)</span>
                        </div>
                      </div>

                      {/* Appointments list */}
                      <div className="divide-y divide-zinc-800/50">
                        {barberAppts.map(apt => {
                          const serviceNames = apt.services.map(id =>
                            SERVICES.find(s => s.id === id)?.name || id
                          )
                          return (
                            <div key={apt.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {apt.time_slot && (
                                    <span className="text-xs text-zinc-500">
                                      {apt.time_slot.date !== (barberAppts[0]?.time_slot?.date)
                                        ? `${format(new Date(apt.time_slot.date + 'T12:00:00'), 'd MMM', { locale: es })} `
                                        : ''
                                      }
                                      {formatTime12h(apt.time_slot.start_time)}
                                    </span>
                                  )}
                                  <span className="text-sm text-white truncate">{apt.client_name}</span>
                                </div>
                                <p className="text-xs text-zinc-600 truncate">{serviceNames.join(', ')}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-medium text-white">${(apt.payment_amount || 0).toFixed(2)}</p>
                                <p className="text-[10px] text-zinc-600">{apt.payment_method ? paymentMethodLabels[apt.payment_method] : ''}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* House total summary */}
            {barberEarnings.length > 1 && (
              <div className="admin-card rounded-xl p-4 border-t-2 border-green-500/30">
                <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Resumen del Local</h3>
                <div className="space-y-2">
                  {barberEarnings.map(({ barber, totalRevenue, barberCut, houseCut }) => (
                    <div key={barber.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{barber.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-600 text-xs">${totalRevenue.toFixed(2)} total</span>
                        <span className="text-pink-400 text-xs">-${barberCut.toFixed(2)}</span>
                        <span className="text-green-400 font-medium">${houseCut.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-zinc-800 pt-2 flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">Ganancia del Local</span>
                    <span className="text-green-400 font-bold text-lg">${totalHouseCut.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-sm">Pago a estilistas</span>
                    <span className="text-pink-400 font-medium">${totalBarbersCut.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* === GENERAL VIEW (by date) === */
          <div className="space-y-4">
            {sortedDates.map(date => {
              const dayAppointments = grouped[date]
              const dayTotal = dayAppointments.reduce((sum, a) => sum + (a.payment_amount || 0), 0)

              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-medium text-zinc-400 capitalize">
                      {date !== 'sin-fecha' ? formatDateSpanish(date) : 'Sin fecha'}
                    </h2>
                    <span className="text-sm font-semibold text-pink-400">${dayTotal.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    {dayAppointments.map(apt => {
                      const serviceNames = apt.services.map(id =>
                        SERVICES.find(s => s.id === id)?.name || id
                      )
                      const barber = barbers.find(b => b.id === apt.barber_id)
                      return (
                        <div key={apt.id} className="admin-card rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {apt.time_slot && (
                                <span className="text-xs text-zinc-500">{formatTime12h(apt.time_slot.start_time)}</span>
                              )}
                              <span className="text-sm text-white font-medium truncate">{apt.client_name}</span>
                            </div>
                            <p className="text-xs text-zinc-500 truncate">
                              {serviceNames.join(', ')}
                              {barber ? ` — ${barber.name}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-pink-400">${(apt.payment_amount || 0).toFixed(2)}</p>
                            <p className="text-xs text-zinc-500">{apt.payment_method ? paymentMethodLabels[apt.payment_method] : ''}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
