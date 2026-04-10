'use client'

import { useEffect, useRef, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import type { DeliveryLocation } from '@/types'

interface MapPickerProps {
  value: DeliveryLocation | null
  onChange: (location: DeliveryLocation) => void
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  // Use ref to avoid stale closures in map event handlers
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  onChangeRef.current = onChange
  valueRef.current = value

  const placeMarker = useCallback((lat: number, lng: number) => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
      markerRef.current = marker
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onChangeRef.current({
          lat: pos.lat,
          lng: pos.lng,
          description: valueRef.current?.description ?? '',
        })
      })
    }
    onChangeRef.current({
      lat,
      lng,
      description: valueRef.current?.description ?? '',
    })
  }, [])

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        mapInstanceRef.current?.setView([latitude, longitude], 16)
        placeMarker(latitude, longitude)
      },
      () => {
        // Permission denied or error — do nothing
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [placeMarker])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      leafletRef.current = L

      const defaultLat = valueRef.current?.lat ?? 9.0
      const defaultLng = valueRef.current?.lng ?? -79.52

      const map = L.map(mapRef.current!).setView([defaultLat, defaultLng], 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Restore existing marker if value exists
      if (valueRef.current) {
        const marker = L.marker([valueRef.current.lat, valueRef.current.lng], { draggable: true }).addTo(map)
        markerRef.current = marker
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onChangeRef.current({
            lat: pos.lat,
            lng: pos.lng,
            description: valueRef.current?.description ?? '',
          })
        })
      }

      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        placeMarker(e.latlng.lat, e.latlng.lng)
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        leafletRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="w-full h-64 md:h-80 rounded-xl overflow-hidden border border-zinc-700" />
      <button
        type="button"
        onClick={handleLocateMe}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-pink-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4m8-4h-4M4 12h4" />
        </svg>
        Usar mi ubicación
      </button>
    </div>
  )
}
