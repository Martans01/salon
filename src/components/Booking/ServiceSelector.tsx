'use client'

import { SERVICES } from '@/utils/constants'

interface ServiceSelectorProps {
  selected: string[]
  onChange: (services: string[]) => void
}

export default function ServiceSelector({ selected, onChange }: ServiceSelectorProps) {
  const toggle = (serviceId: string) => {
    if (selected.includes(serviceId)) {
      onChange(selected.filter(s => s !== serviceId))
    } else {
      onChange([...selected, serviceId])
    }
  }

  return (
    <div className="space-y-2">
      {SERVICES.map(service => {
        const isSelected = selected.includes(service.id)
        return (
          <button
            key={service.id}
            onClick={() => toggle(service.id)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
              ${isSelected
                ? 'bg-pink-500/20 border border-pink-500'
                : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
              }
            `}
          >
            <div className={`
              w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0
              ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-zinc-600'}
            `}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{service.name}</p>
              <p className="text-zinc-400 text-xs">{service.description}</p>
            </div>
            {service.featured && (
              <span className="ml-auto text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                Popular
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
