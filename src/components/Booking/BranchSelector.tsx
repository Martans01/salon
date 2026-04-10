'use client'

import { motion } from 'framer-motion'
import type { Branch } from '@/types'

interface BranchSelectorProps {
  branches: Branch[]
  selectedBranchId: string | null
  onSelect: (branchId: string) => void
  isLoading: boolean
}

export default function BranchSelector({ branches, selectedBranchId, onSelect, isLoading }: BranchSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-900 rounded-xl p-4 h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  if (branches.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-8 text-center">
        <p className="text-zinc-400">No hay sucursales disponibles en este momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {branches.map((branch) => {
        const isSelected = selectedBranchId === branch.id
        return (
          <motion.button
            key={branch.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(branch.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              isSelected
                ? 'border-pink-500 bg-pink-500/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <svg className={`w-6 h-6 ${isSelected ? 'text-pink-500' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${isSelected ? 'text-pink-400' : 'text-white'}`}>
                {branch.name}
              </p>
              {branch.address && (
                <p className="text-zinc-500 text-xs mt-0.5 truncate">{branch.address}</p>
              )}
            </div>
            {isSelected && (
              <svg className="w-5 h-5 text-pink-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
