// Generate a minimal ICS VEVENT string for a booking

function pad(n) {
  return String(n).padStart(2, '0')
}

function toICSTimestamp(dateISO, time) {
  // dateISO: YYYY-MM-DD, time: HH:MM
  const [y, m, d] = dateISO.split('-')
  const [hh, mm] = time.split(':')
  return `${y}${m}${d}T${pad(hh)}${pad(mm)}00`
}

export function makeIcsEvent(booking, resourceLabel) {
  // booking: { id, user, resourceType, resourceId, dateISO, startTime, endTime }
  const uid = `booking-${booking.id}@flexispot.local`
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const dtstart = toICSTimestamp(booking.dateISO, booking.startTime)
  const dtend = toICSTimestamp(booking.dateISO, booking.endTime)

  const summary = `${booking.resourceType} booking — ${resourceLabel}`
  const description = `Booked by: ${booking.user}\nResource ID: ${booking.resourceId}`

  return [`BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID:-//flexispot//EN`, `CALSCALE:GREGORIAN`, `BEGIN:VEVENT`, `UID:${uid}`, `DTSTAMP:${dtstamp}`, `DTSTART:${dtstart}`, `DTEND:${dtend}`, `SUMMARY:${summary}`, `DESCRIPTION:${description}`, `END:VEVENT`, `END:VCALENDAR`].join('\r\n')
}

export default { makeIcsEvent }
