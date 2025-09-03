import React, { useState } from 'react'
import SeatMap from '../components/SeatMap'
import { useBooking } from '../state/BookingContext'

export default function AvailabilityPage() {
  useBooking()

  const [mode, setMode] = useState('desk')
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')

  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <p className="mt-2 text-gray-600">View current availability for desks and rooms.</p>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex rounded-md shadow-sm" role="tablist" aria-label="Resource type tabs">
            <button type="button" onClick={() => setMode('desk')} className={`px-3 py-2 ${mode === 'desk' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>Desks</button>
            <button type="button" onClick={() => setMode('room')} className={`px-3 py-2 ${mode === 'room' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>Rooms</button>
          </div>

          <div className="ml-auto flex gap-2 items-center">
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className="rounded border-gray-200" />
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded border-gray-200" />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded border-gray-200" />
          </div>
        </div>

        <div>
          <SeatMap mode={mode === 'room' ? 'room' : 'desk'} dateISO={dateISO} startTime={startTime} endTime={endTime} />
        </div>
      </div>
    </div>
  )
}