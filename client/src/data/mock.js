// Desks: 12 items across zones A and B, some unavailable
export const desks = [
  { id: 1, label: 'D-1', zone: 'A', isAvailable: true },
  { id: 2, label: 'D-2', zone: 'A', isAvailable: true },
  { id: 3, label: 'D-3', zone: 'A', isAvailable: false },
  { id: 4, label: 'D-4', zone: 'A', isAvailable: true },
  { id: 5, label: 'D-5', zone: 'A', isAvailable: true },
  { id: 6, label: 'D-6', zone: 'B', isAvailable: false },
  { id: 7, label: 'D-7', zone: 'B', isAvailable: true },
  { id: 8, label: 'D-8', zone: 'B', isAvailable: true },
  { id: 9, label: 'D-9', zone: 'B', isAvailable: true },
  { id: 10, label: 'D-10', zone: 'B', isAvailable: true },
  { id: 11, label: 'D-11', zone: 'B', isAvailable: false },
  { id: 12, label: 'D-12', zone: 'A', isAvailable: true },
]

// Rooms: 4 items
export const rooms = [
  { id: 1, label: 'Room A1', capacity: 4, isAvailable: true },
  { id: 2, label: 'Room A2', capacity: 8, isAvailable: true },
  { id: 3, label: 'Room B1', capacity: 6, isAvailable: false },
  { id: 4, label: 'Room B2', capacity: 10, isAvailable: true },
]

// Bookings: start empty
export const bookings = []

// Export a helper for today's ISO date (not required, convenience only)
export const todayISO = new Date().toISOString().slice(0, 10)
