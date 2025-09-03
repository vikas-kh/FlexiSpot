import React from 'react'
import { useBooking } from '../state/BookingContext'

/**
 * SeatMap
 * Props:
 * - mode: 'desk' | 'room'
 * - selectedId
 * - onSelect(id)
 * - dateISO, startTime, endTime: used to compute availability
 */
export default function SeatMap({ mode = 'desk', selectedId = null, onSelect = () => {}, dateISO, startTime, endTime }) {
  const { desks, rooms, isResourceAvailableAt } = useBooking()

  const resources = mode === 'room' ? rooms : desks

  // defaults for view if none provided
  const viewDate = dateISO || new Date().toISOString().slice(0, 10)
  const viewStart = startTime || '09:00'
  const viewEnd = endTime || '18:00'

  const gridCols = mode === 'room' ? 'grid-cols-3' : 'grid-cols-6'

  return (
    <div>
      <div className={`grid ${gridCols} gap-3`}>
        {resources.map((r) => {
          const id = r.id
          const globallyDisabled = r.isAvailable === false
          const availableForWindow = isResourceAvailableAt(mode, id, viewDate, viewStart, viewEnd)

          let btnClass = 'w-14 h-14 flex items-center justify-center rounded select-none font-medium'

          if (globallyDisabled) {
            btnClass += ' bg-gray-300 text-gray-700 cursor-not-allowed'
          } else if (!availableForWindow) {
            btnClass += ' bg-red-500 text-white cursor-not-allowed'
          } else {
            // available
            btnClass += selectedId === id
              ? ' bg-green-700 text-white ring-2 ring-offset-2 ring-green-300'
              : ' bg-green-400 hover:bg-green-500 text-white cursor-pointer'
          }

          return (
            <button
              key={id}
              type="button"
              aria-pressed={selectedId === id}
              aria-label={`${mode} ${r.label || id} ${globallyDisabled ? 'disabled' : (availableForWindow ? 'available' : 'booked')}`}
              className={btnClass}
              onClick={() => {
                if (globallyDisabled) return
                if (!availableForWindow) return
                onSelect && onSelect(id)
              }}
              disabled={globallyDisabled || !availableForWindow}
            >
              <div className="text-sm">{r.label || `#${id}`}</div>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-sm text-gray-600">Green = available, Red = booked, Gray = disabled (global).</p>
    </div>
  )
}
