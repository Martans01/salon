'use client'

interface ClientInfoFormProps {
  name: string
  phone: string
  onNameChange: (name: string) => void
  onPhoneChange: (phone: string) => void
}

export default function ClientInfoForm({ name, phone, onNameChange, onPhoneChange }: ClientInfoFormProps) {
  const handlePhoneChange = (value: string) => {
    // Remove everything except digits
    const digits = value.replace(/\D/g, '')
    // Format: XXXX-XXXX (max 8 digits)
    let formatted = digits.slice(0, 8)
    if (formatted.length > 4) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4)
    }
    onPhoneChange(formatted)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Tu nombre"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
          maxLength={50}
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Teléfono</label>
        <div className="flex">
          <span className="bg-zinc-700 border border-zinc-600 border-r-0 rounded-l-lg px-3 py-3 text-zinc-300 text-sm flex items-center">
            +507
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="6XXX-XXXX"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-r-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
