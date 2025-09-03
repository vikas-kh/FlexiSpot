// Simple in-memory desk store with subscription support to simulate real-time updates
const createDesks = () => Array.from({ length: 24 }, (_, i) => {
  const id = i + 1
  const status = id % 4 === 0 ? 'booked' : 'available'
  return { id, status }
})

let desks = createDesks()
const subscribers = new Set()

export function getDesks() {
  // return a shallow copy
  return desks.map(d => ({ ...d }))
}

export function subscribe(cb) {
  subscribers.add(cb)
  // return unsubscribe
  return () => subscribers.delete(cb)
}

function notify() {
  for (const cb of subscribers) cb(getDesks())
}

export function bookDesk(deskId) {
  const id = Number(deskId)
  const idx = desks.findIndex(d => d.id === id)
  if (idx === -1) return false
  if (desks[idx].status === 'booked') return false
  desks = desks.map(d => d.id === id ? { ...d, status: 'booked' } : d)
  notify()
  return true
}

// Helper to randomly book an available desk (used to simulate external bookings)
export function bookRandomAvailableDesk() {
  const available = desks.filter(d => d.status === 'available')
  if (available.length === 0) return null
  const pick = available[Math.floor(Math.random() * available.length)]
  bookDesk(pick.id)
  return pick.id
}

export function resetStore() {
  desks = createDesks()
  notify()
}
