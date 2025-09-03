/**
 * @file JSDoc type definitions for app data models.
 * These are plain JSDoc typedefs (no TypeScript). Small exported placeholders
 * are provided so editors can pick up types when importing this module.
 */

/**
 * A single desk resource.
 * @typedef {Object} Desk
 * @property {number} id - Numeric id
 * @property {string} label - Human-friendly label (e.g. "D1")
 * @property {string} zone - Zone identifier (e.g. "A" or "B")
 * @property {boolean} isAvailable - true when available for booking
 */

/**
 * A room resource.
 * @typedef {Object} Room
 * @property {number} id - Numeric id
 * @property {string} label - Human-friendly label (e.g. "Room 101")
 * @property {number} capacity - Seating capacity
 * @property {boolean} isAvailable - true when available for booking
 */

/**
 * A booking entry.
 * @typedef {Object} Booking
 * @property {number|string} id - Unique id for the booking
 * @property {string} user - User who made the booking
 * @property {"desk"|"room"} resourceType - "desk" or "room"
 * @property {number} resourceId - id of the desk or room
 * @property {string} dateISO - ISO date string (YYYY-MM-DD)
 * @property {string} startTime - Start time (HH:MM)
 * @property {string} endTime - End time (HH:MM)
 */

// Export small placeholders to make this file a module and allow IDEs to
// resolve the typedefs when importing. These values are intentionally
// undefined and should not be used at runtime.

/** @type {Desk|undefined} */
export const DeskType = undefined

/** @type {Room|undefined} */
export const RoomType = undefined

/** @type {Booking|undefined} */
export const BookingType = undefined
