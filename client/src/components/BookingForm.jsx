import React, { useState, useEffect } from 'react'
import SeatMap from './SeatMap'
import { useBooking } from '../state/BookingContext'
import { validateBooking } from '../logic/rules'
import { makeIcsEvent } from '../logic/ics'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function BookingForm() {
  const { desks, rooms, bookings, rules, exceptions, bookResource } = useBooking()

  const [user, setUser] = useState('')
  const [resourceType, setResourceType] = useState('desk')
  const [resourceId, setResourceId] = useState('')
  const [dateISO, setDateISO] = useState(todayISO())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  const [message, setMessage] = useState(null) // { type: 'success'|'error', text }
  const [lastBooking, setLastBooking] = useState(null)

  // when resourceType switches, clear resourceId
  useEffect(() => setResourceId(''), [resourceType])

  // when a desk is selected from SeatMap, set resourceId
  function handleSeatSelect(id) {
    setResourceId(String(id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (!user.trim()) return setMessage({ type: 'error', text: 'User is required.' })
    if (!resourceId) return setMessage({ type: 'error', text: 'Resource is required.' })
    if (!dateISO) return setMessage({ type: 'error', text: 'Date is required.' })
    if (!startTime || !endTime) return setMessage({ type: 'error', text: 'Start and end time are required.' })

    const booking = {
      user: user.trim(),
      resourceType,
      resourceId: Number(resourceId),
      dateISO,
      startTime,
      endTime,
    }

    const validation = validateBooking(booking, { bookings, rules, exceptions, desks })
    if (!validation.ok) {
      setMessage({ type: 'error', text: validation.reason })
      return
    }

    const result = bookResource(booking)
    if (!result || result.success === false) {
      const reason = (result && result.error) || 'Booking failed'
      setMessage({ type: 'error', text: reason })
      return
    }

  setLastBooking(result.booking)
  setMessage({ type: 'success', text: `Booked ${resourceType} ${resourceId} for ${user}.` })
    // leave selection visible; clear user and times
    setUser('')
    setStartTime('09:00')
    setEndTime('10:00')
  }

  const resourceOptions = resourceType === 'desk'
    ? desks.map(d => ({ id: d.id, label: d.label || `Desk ${d.id}`, disabled: d.isAvailable === false }))
    : rooms.map(r => ({ id: r.id, label: r.label || `Room ${r.id}`, disabled: r.isAvailable === false }))

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded">
      <h2 className="text-lg font-medium mb-3">Booking Form</h2>

      {message && (
        <div className={`mb-3 p-2 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}` } role="alert">
          {message.text}
        </div>
      )}

      {lastBooking && (
        <div className="mb-3">
          <button
            type="button"
            className="px-3 py-1 bg-indigo-600 text-white rounded"
            onClick={() => {
              const label = (resourceType === 'desk'
                ? (desks.find(d => d.id === Number(lastBooking.resourceId)) || {}).label
                : (rooms.find(r => r.id === Number(lastBooking.resourceId)) || {}).label) || `${lastBooking.resourceType} ${lastBooking.resourceId}`

              const ics = makeIcsEvent(lastBooking, label)
              const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `booking-${lastBooking.id}.ics`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }}
          >
            Add to Calendar (.ics)
          </button>
        </div>
      )}

      <label className="block mb-2">
        <span className="text-sm text-gray-700">User</span>
        <input value={user} onChange={(e) => setUser(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
      </label>

      <div className="mb-3">
        <span className="text-sm text-gray-700">Resource type</span>
        <div className="mt-1 flex gap-4">
          <label className="inline-flex items-center">
            <input type="radio" name="resourceType" value="desk" checked={resourceType === 'desk'} onChange={() => setResourceType('desk')} />
            <span className="ml-2">Desk</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name="resourceType" value="room" checked={resourceType === 'room'} onChange={() => setResourceType('room')} />
            <span className="ml-2">Room</span>
          </label>
        </div>
      </div>

      <label className="block mb-3">
        <span className="text-sm text-gray-700">Resource</span>
        <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className="mt-1 block w-full rounded border-gray-200">
          <option value="">-- select --</option>
          {resourceOptions.map(o => (
            <option key={o.id} value={o.id} disabled={o.disabled}>{o.label}{o.disabled ? ' (disabled)' : ''}</option>
          ))}
        </select>
      </label>

      {resourceType === 'desk' && (
        <div className="mb-3">
          <SeatMap mode="desk" selectedId={resourceId ? Number(resourceId) : null} onSelect={handleSeatSelect} dateISO={dateISO} startTime={startTime} endTime={endTime} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-gray-700">Date</span>
          <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Start time</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
        </label>
      </div>

      <label className="block mt-3">
        <span className="text-sm text-gray-700">End time</span>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
      </label>

      <div className="mt-4">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Book</button>
      </div>
    </form>
  )
}
