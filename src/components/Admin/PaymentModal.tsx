'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PaymentMethod } from '@/types'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (amount: number, method: PaymentMethod) => void
  clientName: string
  serviceNames: string[]
  isSubmitting: boolean
}

const methods: { key: PaymentMethod; label: string }[] = [
  { key: 'efectivo', label: 'Efectivo' },
  { key: 'yappy', label: 'Yappy' },
]

export default function PaymentModal({ isOpen, onClose, onSubmit, clientName, serviceNames, isSubmitting }: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0 || !method) return
    onSubmit(num, method)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const isValid = parseFloat(amount) > 0 && method !== null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="bg-zinc-900 rounded-xl w-full max-w-sm border border-zinc-700"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            <div className="flex justify-between items-center p-5 border-b border-zinc-700">
              <h3 className="text-lg font-bold text-white">Completar Cita</h3>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Context */}
              <div className="text-sm space-y-1">
                <p className="text-zinc-300 font-medium">{clientName}</p>
                <p className="text-zinc-500">{serviceNames.join(', ')}</p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-lg font-medium focus:outline-none focus:border-pink-500 transition-colors [color-scheme:dark]"
                  autoFocus
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {methods.map(m => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        method === m.key
                          ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-zinc-700 text-zinc-400 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Completar y Cobrar'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
