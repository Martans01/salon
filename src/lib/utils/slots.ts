interface SlotInput {
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  availability_id: string
}

interface GeneratedSlot {
  availability_id: string
  date: string
  start_time: string
  end_time: string
}

export function generateSlotsFromAvailability(input: SlotInput): GeneratedSlot[] {
  const slots: GeneratedSlot[] = []
  const { date, start_time, end_time, duration_minutes, availability_id } = input

  const [startH, startM] = start_time.split(':').map(Number)
  const [endH, endM] = end_time.split(':').map(Number)

  let currentMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  while (currentMinutes + duration_minutes <= endMinutes) {
    const slotStartH = Math.floor(currentMinutes / 60)
    const slotStartM = currentMinutes % 60
    const slotEndMinutes = currentMinutes + duration_minutes
    const slotEndH = Math.floor(slotEndMinutes / 60)
    const slotEndM = slotEndMinutes % 60

    slots.push({
      availability_id,
      date,
      start_time: `${slotStartH.toString().padStart(2, '0')}:${slotStartM.toString().padStart(2, '0')}`,
      end_time: `${slotEndH.toString().padStart(2, '0')}:${slotEndM.toString().padStart(2, '0')}`,
    })

    currentMinutes += duration_minutes
  }

  return slots
}
