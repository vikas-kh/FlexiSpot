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
  const [rules, setRules] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('flexispot:rules')
      if (raw) return JSON.parse(raw)
    } catch {
      // ignore
    }
    return { ...DEFAULT_RULES }
  })
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

  // helper to find exceptions is intentionally inlined where needed

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

  // DEBUG: log current rules and exceptions before validation
  console.log('[bookResource] validating booking', booking, 'rules=', rules, 'exceptions=', exceptions)

    // PRE-CHECK: enforce restricted zones immediately to avoid race between pages
    try {
      if (resourceType === 'desk') {
        const desk = desks.find(d => Number(d.id) === Number(resourceId))
        const restrictedZonesRaw = Array.isArray(rules.restrictedZones) ? rules.restrictedZones : []
        const restrictedZones = restrictedZonesRaw.map(z => (z === undefined || z === null) ? '' : String(z).trim().toUpperCase())
        const deskZoneNorm = desk && desk.zone ? String(desk.zone).trim().toUpperCase() : ''
        const hasZoneException = Boolean(exceptions.find(e => e.user === user && e.ruleKey === 'restrictedZones'))
        if (desk && restrictedZones.includes(deskZoneNorm) && !hasZoneException) {
          return { success: false, error: `Desk in restricted zone ${desk.zone}` }
        }
      }
    } catch {
      // ignore
    }

    const validation = validateBooking(booking, { bookings, rules, exceptions, desks })
    // DEBUG: log validation result and write a DOM sink for E2E tests
    console.log('[bookResource] validation result=', validation)
    try {
      const id = '__bookresource_validation'
      let el = typeof document !== 'undefined' && document.getElementById && document.getElementById(id)
      if (!el && typeof document !== 'undefined' && document.createElement) {
        el = document.createElement('pre')
        el.id = id
        el.setAttribute('data-testid', 'bookresource-validation')
        el.style.position = 'fixed'
        el.style.left = '20px'
        el.style.bottom = '0px'
        el.style.opacity = '0.01'
        el.style.height = '1px'
        el.style.width = '1px'
        el.style.zIndex = '99999'
        document.body.appendChild(el)
      }
      if (el) el.textContent = JSON.stringify(validation)
    } catch {
      // ignore
    }

    if (!validation.ok) return { success: false, error: validation.reason }

    // DEFENSIVE: additionally enforce restricted zones at booking time in case of mismatch
    try {
      if (resourceType === 'desk') {
        const desk = desks.find(d => Number(d.id) === Number(resourceId))
        const restrictedZones = Array.isArray(rules.restrictedZones) ? rules.restrictedZones : []
        const hasZoneException = Boolean(exceptions.find(e => e.user === user && e.ruleKey === 'restrictedZones'))
        if (desk && restrictedZones.includes(desk.zone) && !hasZoneException) {
          return { success: false, error: `Desk in restricted zone ${desk.zone}` }
        }
      }
    } catch {
      // ignore defensive check errors
    }

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
    // DEBUG: log incoming partial rules
    console.log('[updateRules] incoming partialRules=', partialRules)
    const next = { ...rules, ...partialRules }
    try { console.log('[updateRules] next rules=', next) } catch {
      // ignore logging errors
    }
    setRules(next)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('flexispot:rules', JSON.stringify(next))
      }
    } catch {
      // ignore localStorage errors
    }
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

  // Debug sink: write current rules into a DOM element so end-to-end tests can read them
  try {
    const elId = '__effective_rules_debug'
    let el = document.getElementById(elId)
    if (!el) {
      el = document.createElement('pre')
      el.id = elId
      el.setAttribute('data-testid', 'effective-rules-debug')
      // make it tiny but readable by Selenium (avoid display:none)
      el.style.position = 'fixed'
      el.style.left = '0px'
      el.style.bottom = '0px'
      el.style.opacity = '0.01'
      el.style.height = '1px'
      el.style.width = '1px'
      el.style.zIndex = '99999'
      document.body.appendChild(el)
    }
    el.textContent = JSON.stringify(rules)
  } catch {
    // ignore in non-browser environments
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
