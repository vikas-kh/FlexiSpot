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

    // DEBUG: write booking and current rules to a hidden DOM sink so E2E tests can inspect them
    try {
      const id = '__booking_submit_debug'
      let el = typeof document !== 'undefined' && document.getElementById && document.getElementById(id)
      if (!el && typeof document !== 'undefined' && document.createElement) {
        el = document.createElement('pre')
        el.id = id
        el.setAttribute('data-testid', 'booking-submit-debug')
        el.style.position = 'fixed'
        el.style.left = '0px'
        el.style.bottom = '10px'
        el.style.opacity = '0.01'
        el.style.height = '1px'
        el.style.width = '1px'
        el.style.zIndex = '99999'
        document.body.appendChild(el)
      }
      if (el) el.textContent = JSON.stringify({ booking, rules })
    } catch {
      // ignore in non-browser environments
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
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Book your seat</h2>
          <p className="text-sm text-gray-600 mt-1">Choose a date, time and pick a desk or room. The grid below is live and shows availability for the selected window.</p>
        </div>

        <div className="text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-400 block" aria-hidden></span>
              <span>Available</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 block" aria-hidden></span>
              <span>Booked</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-300 block" aria-hidden></span>
              <span>Disabled</span>
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`} role="alert">
          {message.text}
        </div>
      )}

      {lastBooking && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className="px-3 py-1 bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700"
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
          <div className="text-sm text-gray-600">Your booking is saved for {lastBooking.dateISO} {lastBooking.startTime}–{lastBooking.endTime}.</div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block md:col-span-2">
          <span className="text-sm text-gray-700">User</span>
          <div className="mt-1 relative">
            <svg className="absolute left-2 top-2 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a5 5 0 100-10 5 5 0 000 10zm-7 8a7 7 0 0114 0H3z" />
            </svg>
            <input value={user} onChange={(e) => setUser(e.target.value)} className="pl-9 pr-3 py-2 block w-full rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Your name" />
          </div>
        </label>

        <div className="md:col-span-1">
          <span className="text-sm text-gray-700">Resource type</span>
          <div className="mt-1 inline-flex bg-gray-100 rounded-full p-1">
            <button type="button" onClick={() => setResourceType('desk')} className={`px-3 py-1 rounded-full text-sm ${resourceType === 'desk' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-700'}`}>Desk</button>
            <button type="button" onClick={() => setResourceType('room')} className={`px-3 py-1 rounded-full text-sm ${resourceType === 'room' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-700'}`}>Room</button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <label className="md:col-span-2">
          <span className="text-sm text-gray-700">Resource</span>
          <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className="mt-1 block w-full rounded border border-gray-200 py-2 px-3">
            <option value="">Filter / select a resource</option>
            {resourceOptions.map(o => (
              <option key={o.id} value={o.id} disabled={o.disabled}>{o.label}{o.disabled ? ' (disabled)' : ''}</option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <label className="block">
            <span className="text-sm text-gray-700">Date</span>
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className="mt-1 block w-full rounded border border-gray-200 py-2 px-3" />
          </label>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-gray-700">Start time</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 block w-full rounded border border-gray-200 py-2 px-3" />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">End time</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 block w-full rounded border border-gray-200 py-2 px-3" />
        </label>
      </div>

      {resourceType === 'desk' && (
        <div className="mt-6">
          <div className="mb-3 text-sm text-gray-600">Tap a desk to select it, or use the dropdown above.</div>
          <div className="p-3 bg-gray-50 rounded">
            <SeatMap mode="desk" selectedId={resourceId ? Number(resourceId) : null} onSelect={handleSeatSelect} dateISO={dateISO} startTime={startTime} endTime={endTime} />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Confirm Booking</button>
        {lastBooking && (
          <button type="button" className="px-4 py-2 border rounded text-gray-700" onClick={() => { setLastBooking(null); setMessage(null) }}>Done</button>
        )}

        <div className="ml-auto text-sm text-gray-500">Rules: max per day <strong className="text-gray-700">{rules.maxBookingsPerUserPerDay}</strong></div>
      </div>
    </form>
  )
}
