'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import AdminLayout from '@/components/Admin/AdminLayout'
import { hasMultipleBarbers, hasMultipleBranches } from '@/config/plan'
import type { Barber, Branch } from '@/types'

interface BarberFormState {
  name: string
  title: string
  bio: string
  image_url: string
  phone: string
  instagram: string
  years_of_experience: number
  commission_percent: number
  branch_id: string
}

const emptyForm: BarberFormState = {
  name: '',
  title: '',
  bio: '',
  image_url: '',
  phone: '',
  instagram: '',
  years_of_experience: 0,
  commission_percent: 50,
  branch_id: '',
}

export default function BarberosPage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BarberFormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])

  // Load branches for the form dropdown
  useEffect(() => {
    if (!hasMultipleBranches) return
    fetch('/api/admin/branches')
      .then(r => r.ok ? r.json() : [])
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]))
  }, [])

  const loadBarbers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/barbers')
      if (res.ok) {
        setBarbers(await res.json())
      }
    } catch (err) {
      console.error('Error loading barbers:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBarbers()
  }, [loadBarbers])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const openCreateForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEditForm = (barber: Barber) => {
    setEditingId(barber.id)
    setForm({
      name: barber.name,
      title: barber.title || '',
      bio: barber.bio || '',
      image_url: barber.image_url || '',
      phone: barber.phone || '',
      instagram: barber.instagram || '',
      years_of_experience: barber.years_of_experience || 0,
      commission_percent: barber.commission_percent ?? 50,
      branch_id: barber.branch_id || '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showMessage('error', 'El nombre es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      const url = '/api/admin/barbers'
      const method = editingId ? 'PATCH' : 'POST'
      const formData = { ...form, branch_id: form.branch_id || null }
      const body = editingId ? { id: editingId, ...formData } : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar')
      }

      showMessage('success', editingId ? 'Estilista actualizada' : 'Estilista creada')
      closeForm()
      loadBarbers()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (barber: Barber) => {
    try {
      if (barber.is_active) {
        if (!confirm(`¿Desactivar a ${barber.name}? No aparecerá en reservas.`)) return
        const res = await fetch(`/api/admin/barbers?id=${barber.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch('/api/admin/barbers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: barber.id, is_active: true }),
        })
        if (!res.ok) throw new Error()
      }
      loadBarbers()
    } catch {
      showMessage('error', 'Error al actualizar estado')
    }
  }

  const handleReorder = async (barber: Barber, direction: 'up' | 'down') => {
    const sorted = [...barbers].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex(b => b.id === barber.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const other = sorted[swapIdx]
    try {
      await Promise.all([
        fetch('/api/admin/barbers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: barber.id, display_order: other.display_order }),
        }),
        fetch('/api/admin/barbers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: other.id, display_order: barber.display_order }),
        }),
      ])
      loadBarbers()
    } catch {
      showMessage('error', 'Error al reordenar')
    }
  }

  if (!hasMultipleBarbers) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-zinc-500">Esta sección no está disponible en tu plan actual.</p>
        </div>
      </AdminLayout>
    )
  }

  const sortedBarbers = [...barbers].sort((a, b) => a.display_order - b.display_order)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Estilistas</h1>
            <p className="text-zinc-500 text-sm mt-1">Gestiona el equipo de estilistas</p>
          </div>
          <button
            onClick={openCreateForm}
            className="px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900 rounded-xl p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : sortedBarbers.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800">
            <p className="text-zinc-500 mb-4">No hay estilistas registradas</p>
            <button
              onClick={openCreateForm}
              className="text-pink-500 hover:text-pink-400 text-sm font-medium"
            >
              Crear la primera estilista
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBarbers.map((barber, index) => (
              <div
                key={barber.id}
                className={`bg-zinc-900 rounded-xl p-4 border transition-colors ${
                  barber.is_active ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                    {barber.image_url ? (
                      <Image
                        src={barber.image_url}
                        alt={barber.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold">{barber.name}</h3>
                      {!barber.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Inactivo</span>
                      )}
                    </div>
                    {barber.title && (
                      <p className="text-pink-500 text-xs mt-0.5">{barber.title}</p>
                    )}
                    {barber.branch && (
                      <p className="text-purple-400 text-xs mt-0.5">{barber.branch.name}</p>
                    )}
                    {barber.bio && (
                      <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{barber.bio}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      {barber.years_of_experience > 0 && (
                        <span>{barber.years_of_experience}+ años</span>
                      )}
                      <span className="text-pink-400 font-medium">{barber.commission_percent ?? 50}% comisión</span>
                      {barber.phone && <span>{barber.phone}</span>}
                      {barber.instagram && <span>{barber.instagram}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReorder(barber, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Subir"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReorder(barber, 'down')}
                        disabled={index === sortedBarbers.length - 1}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Bajar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => openEditForm(barber)}
                    className="flex-1 text-xs font-medium py-2 rounded-lg border border-zinc-700 text-white hover:bg-zinc-800 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(barber)}
                    className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                      barber.is_active
                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                        : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {barber.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeForm}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Editar estilista' : 'Nueva estilista'}
              </h2>
              <button
                onClick={closeForm}
                className="text-zinc-500 hover:text-white p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Master Barber"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Biografía</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Especialista en cortes clásicos y modernos..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">URL de imagen</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+507..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Instagram</label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={e => setForm({ ...form, instagram: e.target.value })}
                    placeholder="@usuario"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Años de experiencia</label>
                  <input
                    type="number"
                    min="0"
                    value={form.years_of_experience}
                    onChange={e => setForm({ ...form, years_of_experience: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Comisión (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.commission_percent}
                    onChange={e => setForm({ ...form, commission_percent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                  />
                  <p className="text-zinc-600 text-[10px] mt-1">% que recibe la estilista</p>
                </div>
              </div>

              {hasMultipleBranches && branches.length > 0 && (
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Sucursal</label>
                  <select
                    value={form.branch_id}
                    onChange={e => setForm({ ...form, branch_id: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="">Sin asignar</option>
                    {branches.filter(b => b.is_active).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-zinc-950 border-t border-zinc-800 px-5 py-4 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                onClick={closeForm}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-lg border border-zinc-700 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
