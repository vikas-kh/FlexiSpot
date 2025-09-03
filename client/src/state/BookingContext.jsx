import React, { createContext, useContext, useState, useMemo } from 'react'
import { validateBooking } from '../logic/rules'
import { desks as mockDesks, rooms as mockRooms, bookings as mockBookings } from '../data/mock'

/**
 * BookingContext provides in-memory booking state and actions.
 * No external libraries used.
 */

const BookingContext = createContext(null)

const DEFAULT_RULES = {
  maxBookingsPerUserPerDay: 2,
  allowedTimeBlocks: [{ start: '09:00', end: '18:00' }],
  restrictedZones: [],
}

function timeToMinutes(t) {
  const [hh, mm] = String(t).split(':').map(Number)
  return hh * 60 + mm
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

/**
 * Provider component
 */
export function BookingProvider({ children, initialData } = {}) {
  // copy initial data to avoid mutating imports; allow overrides via initialData
  const [desks, setDesks] = useState(() => {
    const source = initialData && Array.isArray(initialData.desks) ? initialData.desks : mockDesks
    return source.map(d => ({ ...d }))
  })
  const rooms = useMemo(() => {
    const source = initialData && Array.isArray(initialData.rooms) ? initialData.rooms : mockRooms
    return source.map(r => ({ ...r }))
  }, [initialData])
  const [bookings, setBookings] = useState(() => {
    const source = initialData && Array.isArray(initialData.bookings) ? initialData.bookings : mockBookings
    return source.slice()
  })
  const [rules, setRules] = useState(() => ({ ...DEFAULT_RULES }))
  const [exceptions, setExceptions] = useState([]) // { id, user, ruleKey, value }

  // derived lookup helpers
  const desksById = useMemo(() => {
    const m = new Map()
    desks.forEach(d => m.set(d.id, d))
    return m
  }, [desks])

  const roomsById = useMemo(() => {
    const m = new Map()
    rooms.forEach(r => m.set(r.id, r))
    return m
  }, [rooms])

  function findExceptionFor(user, ruleKey) {
    return exceptions.find(e => e.user === user && e.ruleKey === ruleKey)
  }

  /**
   * Check resource availability by checking existing bookings for overlap
   * This updates availability only in memory (bookings array)
   */
  function isResourceAvailableAt(resourceType, resourceId, dateISO, startTime, endTime) {
    const s = timeToMinutes(startTime)
    const e = timeToMinutes(endTime)
    return !bookings.some(b =>
      b.resourceType === resourceType &&
      Number(b.resourceId) === Number(resourceId) &&
      b.dateISO === dateISO &&
      rangesOverlap(s, e, timeToMinutes(b.startTime), timeToMinutes(b.endTime))
    )
  }

  /**
   * Book a resource with basic rules enforcement.
   * Returns { success: boolean, booking?, error? }
   */
  function bookResource({ user, resourceType, resourceId, dateISO, startTime, endTime }) {
    // validate resource exists first
    if (resourceType === 'desk') {
      if (!desksById.has(Number(resourceId))) return { success: false, error: 'Desk not found' }
    } else if (resourceType === 'room') {
      if (!roomsById.has(Number(resourceId))) return { success: false, error: 'Room not found' }
    } else {
      return { success: false, error: 'Invalid resourceType' }
    }

    // Use centralized validator to ensure consistent rule enforcement/messages
    const booking = { user, resourceType, resourceId: Number(resourceId), dateISO, startTime, endTime }
    const validation = validateBooking(booking, { bookings, rules, exceptions, desks })
    if (!validation.ok) return { success: false, error: validation.reason }

    // availability check (overlapping bookings)
    if (!isResourceAvailableAt(resourceType, resourceId, dateISO, startTime, endTime)) {
      return { success: false, error: 'Resource is already booked for requested time' }
    }

    const newBooking = {
      id: Date.now(),
      user,
      resourceType,
      resourceId: Number(resourceId),
      dateISO,
      startTime,
      endTime,
    }

    setBookings(prev => [...prev, newBooking])

    // Note: we don't flip global desk.isAvailable here; availability for date/time is derived from bookings
    return { success: true, booking: newBooking }
  }

  function cancelBooking(bookingId) {
    const id = Number(bookingId)
    const exists = bookings.some(b => Number(b.id) === id)
    if (!exists) return { success: false, error: 'Booking not found' }
    setBookings(prev => prev.filter(b => Number(b.id) !== id))
    return { success: true }
  }

  function toggleDeskAvailability(deskId, isAvailable) {
    setDesks(prev => prev.map(d => d.id === Number(deskId) ? { ...d, isAvailable: !!isAvailable } : d))
    return { success: true }
  }

  function updateRules(partialRules) {
    setRules(prev => ({ ...prev, ...partialRules }))
    return { success: true }
  }

  function addException({ user, ruleKey, value }) {
    const ex = { id: Date.now(), user, ruleKey, value }
    setExceptions(prev => [...prev, ex])
    return { success: true, exception: ex }
  }

  function removeException(exceptionId) {
    setExceptions(prev => prev.filter(e => Number(e.id) !== Number(exceptionId)))
    return { success: true }
  }

  const value = {
    desks,
    rooms,
    bookings,
    rules,
    exceptions,
    // actions
    bookResource,
    cancelBooking,
    toggleDeskAvailability,
    updateRules,
    addException,
  removeException,
    // helpers
    isResourceAvailableAt,
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
