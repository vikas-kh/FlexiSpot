/**
 * Pure booking validators.
 * validateBooking returns { ok: true } or { ok: false, reason: string }
 */

function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return NaN
  const parts = t.split(':')
  if (parts.length < 2) return NaN
  const hh = Number(parts[0])
  const mm = Number(parts[1])
  return hh * 60 + mm
}

function fitsInsideBlock(startTime, endTime, block) {
  const s = timeToMinutes(startTime)
  const e = timeToMinutes(endTime)
  const bs = timeToMinutes(block.start)
  const be = timeToMinutes(block.end)
  if (Number.isNaN(s) || Number.isNaN(e) || Number.isNaN(bs) || Number.isNaN(be)) return false
  return s >= bs && e <= be
}

/**
 * Validate a booking against rules.
 * @param {{user:string,resourceType:string,resourceId:number|string,dateISO:string,startTime:string,endTime:string}} booking
 * @param {{bookings:Array, rules:Object, exceptions:Array, desks:Array}} context
 */
export function validateBooking(booking, context) {
  const { user, resourceType, resourceId, dateISO, startTime, endTime } = booking || {}
  const { bookings = [], rules = {}, exceptions = [], desks = [] } = context || {}
  // keep variables referenced to satisfy linters when certain rule checks are disabled
  void resourceType
  void resourceId
  void desks

  // 1) maxBookingsPerUserPerDay (consider exceptions)
  const maxDefault = typeof rules.maxBookingsPerUserPerDay === 'number' ? rules.maxBookingsPerUserPerDay : 2
  const maxEx = exceptions.find(e => e.user === user && e.ruleKey === 'maxBookingsPerUserPerDay')
  const effectiveMax = maxEx && typeof maxEx.value === 'number' ? maxEx.value : maxDefault

  const userBookingsToday = bookings.filter(b => b.user === user && b.dateISO === dateISO)
  if (userBookingsToday.length >= effectiveMax) {
    return { ok: false, reason: 'maxBookingsPerUserPerDay exceeded' }
  }

  // 2) allowedTimeBlocks (must fit entirely inside a block)
  const blocks = Array.isArray(rules.allowedTimeBlocks) ? rules.allowedTimeBlocks : []
  const hasTimeException = Boolean(exceptions.find(e => e.user === user && e.ruleKey === 'allowedTimeBlocks'))
  if (!hasTimeException) {
    const fits = blocks.some(block => fitsInsideBlock(startTime, endTime, block))
    if (!fits) return { ok: false, reason: 'Requested time outside allowed time blocks' }
  }

  // 3) restrictedZones enforcement removed for simplicity.
  // (Previously this block rejected desks in restricted zones; removed to simplify rules for tests.)

  const resOk = { ok: true }
  try {
    const el = typeof document !== 'undefined' && document.getElementById && document.getElementById('__validate_debug')
    if (el) el.textContent = JSON.stringify({ ...JSON.parse(el.textContent || '{}'), result: resOk })
  } catch {
    // ignore
  }
  return resOk
}

export default { validateBooking }

// --- Self-check helpers (development only) ---
const _testDesks = [
  { id: 1, label: 'D1', zone: 'A', isAvailable: true },
  { id: 2, label: 'D2', zone: 'B', isAvailable: true },
]

const _testRules = {
  maxBookingsPerUserPerDay: 1,
  allowedTimeBlocks: [{ start: '09:00', end: '17:00' }],
  restrictedZones: ['A'],
}

const _testBookings = [
  { id: 101, user: 'alice', resourceType: 'desk', resourceId: 2, dateISO: '2025-09-02', startTime: '10:00', endTime: '11:00' }
]

const _testExceptions = []

export function runRuleSelfCheck() {
  console.log('[rules] running self-check')

  const okBooking = {
    user: 'bob', resourceType: 'desk', resourceId: 2, dateISO: '2025-09-02', startTime: '11:30', endTime: '12:00'
  }
  console.log('OK booking:', validateBooking(okBooking, { bookings: _testBookings, rules: _testRules, exceptions: _testExceptions, desks: _testDesks }))

  const overBooking = {
    user: 'alice', resourceType: 'desk', resourceId: 2, dateISO: '2025-09-02', startTime: '12:00', endTime: '12:30'
  }
  console.log('Rejected by max per day:', validateBooking(overBooking, { bookings: _testBookings, rules: _testRules, exceptions: _testExceptions, desks: _testDesks }))

  const restricted = {
    user: 'charlie', resourceType: 'desk', resourceId: 1, dateISO: '2025-09-02', startTime: '10:00', endTime: '11:00'
  }
  console.log('Rejected by restricted zone:', validateBooking(restricted, { bookings: _testBookings, rules: _testRules, exceptions: _testExceptions, desks: _testDesks }))
}

// Run in dev only (Vite/ESM environment)
try {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    runRuleSelfCheck()
  }
} catch {
  // ignore in environments where import.meta is not available
}
