'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/Admin/AdminLayout'
import AppointmentCard from '@/components/Admin/AppointmentCard'
import { hasMultipleBarbers, hasMultipleBranches } from '@/config/plan'
import type { Appointment, AppointmentStatus, PaymentMethod, Barber, Branch } from '@/types'

type Filter = 'todas' | AppointmentStatus
type TypeFilter = 'todas' | 'en_tienda' | 'delivery'

const statusFilters: { key: Filter; label: string; color: string }[] = [
  { key: 'pendiente', label: 'Pendientes', color: 'amber' },
  { key: 'confirmada', label: 'Confirmadas', color: 'emerald' },
  { key: 'completada', label: 'Completadas', color: 'blue' },
  { key: 'cancelada', label: 'Canceladas', color: 'zinc' },
  { key: 'todas', label: 'Todas', color: 'white' },
]

const typeFilters: { key: TypeFilter; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'en_tienda', label: 'En Salón' },
  { key: 'delivery', label: 'Delivery' },
]

export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todas')
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [barberFilter, setBarberFilter] = useState<string>('todos')
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchFilter, setBranchFilter] = useState<string>('todas')
  const [filter, setFilter] = useState<Filter>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('bs_initial_filter')
      if (cached) return cached as Filter
    }
    return 'pendiente'
  })
  const [initializing, setInitializing] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('bs_initial_filter')
    }
    return true
  })
  const [initMessage, setInitMessage] = useState('Buscando citas pendientes...')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!initializing) return
    async function determineInitialFilter() {
      let resolved: Filter = 'pendiente'
      try {
        const pendRes = await fetch('/api/admin/appointments?status=pendiente')
        if (pendRes.ok) {
          const pending = await pendRes.json()
          if (pending.length === 0) {
            setInitMessage('No hay citas pendientes')
            await new Promise(r => setTimeout(r, 800))
            setInitMessage('Buscando citas confirmadas...')
            const confRes = await fetch('/api/admin/appointments?status=confirmada')
            if (confRes.ok) {
              const confirmed = await confRes.json()
              if (confirmed.length > 0) {
                setInitMessage('Redirigiendo a citas confirmadas...')
                await new Promise(r => setTimeout(r, 800))
                resolved = 'confirmada'
                setFilter('confirmada')
              } else {
                setInitMessage('No hay citas pendientes ni confirmadas')
                await new Promise(r => setTimeout(r, 800))
              }
            }
          }
        }
      } catch {
        // Use default 'pendiente'
      } finally {
        sessionStorage.setItem('bs_initial_filter', resolved)
        setInitializing(false)
      }
    }
    determineInitialFilter()
  }, [])

  const loadAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'todas') params.set('status', filter)
      if (hasMultipleBarbers && barberFilter !== 'todos') params.set('barber_id', barberFilter)
      if (hasMultipleBranches && branchFilter !== 'todas') params.set('branch_id', branchFilter)
      const res = await fetch(`/api/admin/appointments?${params}`)
      if (res.ok) {
        setAppointments(await res.json())
      }
    } catch (err) {
      console.error('Error loading appointments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filter, barberFilter, branchFilter])

  useEffect(() => {
    if (!initializing) loadAppointments()
  }, [loadAppointments, initializing])

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

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) await loadAppointments()
    } catch (err) {
      console.error('Error updating appointment:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleComplete = async (id: string, amount: number, method: PaymentMethod) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'completada', payment_amount: amount, payment_method: method }),
      })
      if (res.ok) await loadAppointments()
    } catch (err) {
      console.error('Error completing appointment:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleChangeSlot = async (id: string, newSlotId: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, new_time_slot_id: newSlotId }),
      })
      if (res.ok) await loadAppointments()
    } catch (err) {
      console.error('Error changing slot:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/appointments?id=${id}`, { method: 'DELETE' })
      if (res.ok) await loadAppointments()
    } catch (err) {
      console.error('Error deleting appointment:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredAppointments = appointments.filter(a => typeFilter === 'todas' || a.appointment_type === typeFilter)

  if (initializing) {
    return (
      <AdminLayout>
        <div>
          <h1 className="text-2xl font-bold text-white mb-6">Citas</h1>
          <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-zinc-800 border-t-pink-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 text-sm animate-pulse">{initMessage}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Citas</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Gestiona las reservas de tus clientes</p>
          </div>
          {!isLoading && (
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{filteredAppointments.length}</span>
              <p className="text-zinc-500 text-[11px]">resultados</p>
            </div>
          )}
        </div>

        {/* Filters bar */}
        <div className="space-y-3 mb-6">
          {/* Branch + Barber selectors */}
          {(hasMultipleBranches || hasMultipleBarbers) && (
            <div className="flex gap-2 flex-wrap">
              {hasMultipleBranches && branches.length > 0 && (
                <select
                  value={branchFilter}
                  onChange={e => { setBranchFilter(e.target.value); setIsLoading(true) }}
                  className="bg-zinc-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
                >
                  <option value="todas">Todas las sucursales</option>
                  {branches.filter(b => b.is_active).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
              {hasMultipleBarbers && barbers.length > 0 && (
                <select
                  value={barberFilter}
                  onChange={e => { setBarberFilter(e.target.value); setIsLoading(true) }}
                  className="bg-zinc-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
                >
                  <option value="todos">Todas las estilistas</option>
                  {barbers.filter(b => b.is_active).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Type + Status filters row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Type filter */}
            <div className="flex items-center bg-zinc-900/60 rounded-lg p-0.5 border border-white/[0.04]">
              {typeFilters.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    typeFilter === t.key
                      ? 'bg-white/[0.08] text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-white/[0.06]" />

            {/* Status filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {statusFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setFilter(f.key); setIsLoading(true) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    filter === f.key
                      ? 'bg-pink-500 text-white shadow-[0_2px_8px_rgba(236,72,153,0.25)]'
                      : 'bg-zinc-900/60 border border-white/[0.04] text-zinc-500 hover:text-white hover:border-white/[0.08]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="shimmer-skeleton rounded-xl h-36" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-zinc-900/40 border border-white/[0.04] border-dashed rounded-xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium">No hay citas</p>
            <p className="text-zinc-600 text-sm mt-1">
              {filter !== 'todas' ? `No se encontraron citas con estado "${filter}"` : 'No hay citas registradas'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map(apt => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onStatusChange={handleStatusChange}
                onComplete={handleComplete}
                onChangeSlot={handleChangeSlot}
                onDelete={handleDelete}
                isUpdating={updatingId === apt.id}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
