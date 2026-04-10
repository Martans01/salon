'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/Admin/AdminLayout'
import { hasMultipleBranches } from '@/config/plan'
import type { Branch } from '@/types'

interface BranchFormState {
  name: string
  address: string
  phone: string
  lat: string
  lng: string
  image_url: string
}

const emptyForm: BranchFormState = {
  name: '',
  address: '',
  phone: '',
  lat: '',
  lng: '',
  image_url: '',
}

export default function SucursalesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BranchFormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadBranches = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/branches')
      if (res.ok) setBranches(await res.json())
    } catch (err) {
      console.error('Error loading branches:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const openCreateForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEditForm = (branch: Branch) => {
    setEditingId(branch.id)
    setForm({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      lat: branch.lat?.toString() || '',
      lng: branch.lng?.toString() || '',
      image_url: branch.image_url || '',
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
      showMsg('error', 'El nombre es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      const url = '/api/admin/branches'
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId
        ? {
            id: editingId,
            name: form.name,
            address: form.address || null,
            phone: form.phone || null,
            lat: form.lat ? parseFloat(form.lat) : null,
            lng: form.lng ? parseFloat(form.lng) : null,
            image_url: form.image_url || null,
          }
        : {
            name: form.name,
            address: form.address || null,
            phone: form.phone || null,
            lat: form.lat ? parseFloat(form.lat) : null,
            lng: form.lng ? parseFloat(form.lng) : null,
            image_url: form.image_url || null,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar')
      }

      showMsg('success', editingId ? 'Sucursal actualizada' : 'Sucursal creada')
      closeForm()
      loadBranches()
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (branch: Branch) => {
    try {
      if (branch.is_active) {
        if (!confirm(`¿Desactivar ${branch.name}? No aparecerá en reservas.`)) return
        const res = await fetch(`/api/admin/branches?id=${branch.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch('/api/admin/branches', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: branch.id, is_active: true }),
        })
        if (!res.ok) throw new Error()
      }
      loadBranches()
    } catch {
      showMsg('error', 'Error al actualizar estado')
    }
  }

  const handleReorder = async (branch: Branch, direction: 'up' | 'down') => {
    const sorted = [...branches].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex(b => b.id === branch.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const other = sorted[swapIdx]
    try {
      await Promise.all([
        fetch('/api/admin/branches', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: branch.id, display_order: other.display_order }),
        }),
        fetch('/api/admin/branches', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: other.id, display_order: branch.display_order }),
        }),
      ])
      loadBranches()
    } catch {
      showMsg('error', 'Error al reordenar')
    }
  }

  if (!hasMultipleBranches) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-zinc-500">Esta sección no está disponible en tu plan actual.</p>
        </div>
      </AdminLayout>
    )
  }

  const sortedBranches = [...branches].sort((a, b) => a.display_order - b.display_order)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Sucursales</h1>
            <p className="text-zinc-500 text-sm mt-1">Gestiona las sedes del negocio</p>
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
            {[1, 2].map(i => (
              <div key={i} className="bg-zinc-900 rounded-xl p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : sortedBranches.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800">
            <p className="text-zinc-500 mb-4">No hay sucursales registradas</p>
            <button onClick={openCreateForm} className="text-pink-500 hover:text-pink-400 text-sm font-medium">
              Crear la primera sucursal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBranches.map((branch, index) => (
              <div
                key={branch.id}
                className={`bg-zinc-900 rounded-xl p-4 border transition-colors ${
                  branch.is_active ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold">{branch.name}</h3>
                      {!branch.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Inactiva</span>
                      )}
                    </div>
                    {branch.address && (
                      <p className="text-zinc-500 text-xs mt-0.5">{branch.address}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      {branch.phone && <span>{branch.phone}</span>}
                      {branch.lat && branch.lng && <span>GPS configurado</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReorder(branch, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReorder(branch, 'down')}
                        disabled={index === sortedBranches.length - 1}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
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
                    onClick={() => openEditForm(branch)}
                    className="flex-1 text-xs font-medium py-2 rounded-lg border border-zinc-700 text-white hover:bg-zinc-800 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(branch)}
                    className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                      branch.is_active
                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                        : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {branch.is_active ? 'Desactivar' : 'Activar'}
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
                {editingId ? 'Editar sucursal' : 'Nueva sucursal'}
              </h2>
              <button onClick={closeForm} className="text-zinc-500 hover:text-white p-1">
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
                  placeholder="Sede Centro"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Calle 50, Ciudad de Panamá"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+507 6000-0000"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Latitud</label>
                  <input
                    type="text"
                    value={form.lat}
                    onChange={e => setForm({ ...form, lat: e.target.value })}
                    placeholder="8.9824"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Longitud</label>
                  <input
                    type="text"
                    value={form.lng}
                    onChange={e => setForm({ ...form, lng: e.target.value })}
                    placeholder="-79.5199"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
                  />
                </div>
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
