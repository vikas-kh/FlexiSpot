# FlexiSpot

A small single-page React app for booking desks and rooms with a simple rules engine and an admin UI to manage global rules and exceptions.

## Summary

FlexiSpot is a demo workspace booking app (client-only) that lets users book desks and rooms for time windows. It contains:
- An interactive SeatMap showing availability for a chosen date/time window.
- A Booking form to create bookings and download an .ics calendar event.
- An Admin page to change global rules (max-per-day, allowed time blocks, restricted zones) and to add per-user exceptions.
- Simple in-memory state (React Context) and mock data for desks/rooms/bookings.
- End-to-end Robot Framework tests that exercise booking flows and admin controls.

This README documents how the app works, the rules engine behavior, where code lives, and how to run the app and tests.

## Tech stack

- React (Vite)
- Tailwind CSS (utility classes used in components)
- React Router for page routing
- Robot Framework + Selenium for E2E tests (in `tests/`)

## Project structure (important files)

- `client/` — React app
  - `src/components/` — UI components (BookingForm.jsx, SeatMap.jsx, Navbar.jsx)
  - `src/pages/` — pages (BookingPage.jsx, AdminPage.jsx, AvailabilityPage.jsx, HomePage.jsx)
  - `src/state/BookingContext.jsx` — central in-memory state provider and actions (bookResource, cancelBooking, updateRules, ...)
  - `src/logic/rules.js` — pure validation logic (validateBooking)
  - `src/data/mock.js` — mock desks, rooms and initial bookings
  - `main.jsx`, `App.jsx` — app entry and router
- `tests/` — Robot Framework suites for admin, booking, availability, rules, navigation

## Data model (core shapes)

- Desk: { id: number, label: string, zone: string, isAvailable: boolean }
- Room: { id: number, label: string, capacity: number, isAvailable: boolean }
- Booking: { id: number, user: string, resourceType: 'desk'|'room', resourceId: number, dateISO: 'YYYY-MM-DD', startTime: 'HH:MM', endTime: 'HH:MM' }
- Rules: {
  maxBookingsPerUserPerDay: number,
  allowedTimeBlocks: [{ start: 'HH:MM', end: 'HH:MM' }],
  restrictedZones: [ 'A', 'B', ... ]
}
- Exceptions: { id, user, ruleKey, value } — per-user overrides for a specific rule

## Rules engine (how booking validation works)

The validator is implemented in `src/logic/rules.js` as `validateBooking(booking, context)` and enforces the following (current simplified behavior):

1. maxBookingsPerUserPerDay
	- Default: 2 (can be changed via Admin rules or exceptions)
	- Counts existing bookings for the same user on the same date. If the user has reached the effective max, the booking is rejected.

2. allowedTimeBlocks
	- Admin defines allowed blocks (e.g., 09:00-12:00,13:00-18:00). Booking must fit fully inside one allowed block unless the user has an exception for `allowedTimeBlocks`.

3. restrictedZones (note: simplified)
	- The original app supported rejecting bookings in restricted zones. For test stability, this demo may run with restricted-zone enforcement disabled or simplified.
	- Admin can still set `restrictedZones`, and there are admin controls and debug sinks to inspect rule state. If you want strict enforcement re-enabled, it can be toggled back in `src/logic/rules.js`.

Exceptions
- Per-user exceptions let admins exempt a user from a specific rule (for example, allow a user more bookings per day). Exceptions are stored in-memory in the provider.

## Admin UI

- Edit max bookings per user per day, allowed time blocks, and restricted zones.
- Add/remove per-user exceptions.
- Toggle global desk availability.
- Admin UI shows an `Effective rules` JSON block to help tests and debugging.

## Tests (Robot Framework)

- Suites live in `tests/` (admin.robot, booking.robot, availability.robot, rules.robot, navigation.robot).
- Tests use Selenium to control a browser and exercise the booking flows.
- Some tests use small DOM debug sinks (hidden <pre data-testid=...>) to read runtime rule state and validation outputs when needed — these were added to make E2E assertions reliable under rapid navigation.

## How to run (development)

1. From the repository root, go to the client folder:

```powershell
cd client
npm install
npm run dev
```

2. Open http://localhost:5173 (Vite default) and use the app.

## How to run tests (Robot)

Install Robot Framework and Selenium dependencies, and ensure Chrome is available for Selenium.

From the `tests/` folder run (example):

```powershell
# run a single suite
python -m robot rules.robot

# run all suites one-by-one
python -m robot admin.robot
python -m robot booking.robot
python -m robot availability.robot
python -m robot navigation.robot
```

Notes:
- Some tests interact with React-controlled inputs. The suites already use JavaScript setters and small waits to ensure React receives updates.

## Features

- Book desks and rooms for specific date/time windows.
- Live seat map showing availability for chosen window.
- Admin rules: max per day, allowed blocks, restricted zones.
- Per-user exceptions.
- Download booking as .ics calendar event.
- Robot Framework E2E tests to validate flows.

## Development notes & tips

- State is in-memory inside `BookingContext.jsx`. For persistence between page loads, the app writes rules to localStorage (so admin rule saves survive refresh).
- The rules validator is pure and located at `src/logic/rules.js`. If you change rules behavior, update this file and adjust tests.
- Debug sinks were added (hidden small <pre> elements) to help E2E tests inspect runtime state. They are safe to remove once tests are stable.

## Next steps / improvements

- Re-enable and harden restricted-zone enforcement with robust E2E waiting patterns.
- Add server-side persistence (API + database) so bookings are shared across users.
- Add authentication so admin controls are protected.
- Add unit tests for `validateBooking` to guard rule regressions.
 pass. Tell me which and I'll proceed.

## Quick start for new users

Follow these steps to get the project running locally and run the Robot Framework tests (PowerShell examples included).

Prerequisites
- Node.js (16+) and npm
- Python 3.8+ and pip
- Google Chrome (for Selenium tests)

Start the frontend dev server

Open a PowerShell terminal and run:

```powershell
cd client
npm install
npm run dev
```

This starts the Vite dev server (default: http://localhost:5173). Leave this running while you run the tests.

Install test dependencies (Python)

In a separate PowerShell window run:

```powershell
# Install Robot Framework and Selenium libraries
python -m pip install --user robotframework selenium robotframework-seleniumlibrary webdriver-manager
```

Run Robot Framework tests

Make sure the dev server is running (see above). From the repository `tests` folder run the suites one-by-one:

```powershell
cd tests
python -m robot admin.robot
python -m robot booking.robot
python -m robot availability.robot
python -m robot rules.robot
python -m robot navigation.robot
```

Notes & troubleshooting
- Ensure Chrome is installed and up-to-date; Selenium will connect to your local browser. If you need a chromedriver, use a driver manager or install a matching chromedriver and add it to your PATH.
- If tests fail because the app state didn't propagate (race conditions), re-run the suite after ensuring the dev server is ready and the Admin changes are saved.
- If you prefer a single command, you can run each suite sequentially in one PowerShell invocation; explicit commands above are usually clearer for debugging.


# FlexiSpot


