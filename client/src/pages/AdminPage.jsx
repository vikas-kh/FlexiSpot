import React, { useState } from 'react'
import { useBooking } from '../state/BookingContext'

export default function AdminPage() {
  const { desks, rules, exceptions, toggleDeskAvailability, updateRules, addException, removeException } = useBooking()

  // rule form state
  const [maxPerDay, setMaxPerDay] = useState(rules.maxBookingsPerUserPerDay)
  const [allowedBlocksText, setAllowedBlocksText] = useState(rules.allowedTimeBlocks.map(b => `${b.start}-${b.end}`).join(','))
  const [restrictedZonesText, setRestrictedZonesText] = useState((rules.restrictedZones || []).join(','))

  const [exUser, setExUser] = useState('')
  const [exRuleKey, setExRuleKey] = useState('')
  const [exValue, setExValue] = useState('')

  function saveRules() {
    const blocks = allowedBlocksText.split(',').map(s => s.trim()).filter(Boolean).map(pair => {
      const [start, end] = pair.split('-').map(x => x.trim())
      return { start, end }
    })
    const restricted = restrictedZonesText.split(',').map(s => s.trim()).filter(Boolean)
    updateRules({ maxBookingsPerUserPerDay: Number(maxPerDay), allowedTimeBlocks: blocks, restrictedZones: restricted })
  }

  function handleAddException(e) {
    e.preventDefault()
    if (!exUser || !exRuleKey) return
    addException({ user: exUser, ruleKey: exRuleKey, value: exValue })
    setExUser('')
    setExRuleKey('')
    setExValue('')
  }

  return (
    <div className="p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      {/* 1) Desk Availability */}
      <section className="p-4 border rounded">
        <h2 className="font-medium">Desk Availability</h2>
        <p className="text-sm text-gray-600 mb-3">Enable or disable desks globally.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {desks.map(d => (
            <div key={d.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="font-medium">{d.label || `Desk ${d.id}`}</div>
                <div className="text-sm text-gray-600">Zone: {d.zone}</div>
              </div>
              <div>
                <button
                  className={`px-3 py-1 rounded ${d.isAvailable ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  onClick={() => toggleDeskAvailability(d.id, !d.isAvailable)}
                >
                  {d.isAvailable ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Current effective rules (helpful for testing/diagnostics) */}
      <section className="p-4 border rounded">
        <h2 className="font-medium">Effective rules (debug)</h2>
        <pre data-testid="effective-rules" className="mt-2 text-sm bg-gray-50 p-2 rounded text-xs overflow-auto">{JSON.stringify(rules)}</pre>
      </section>

      {/* 2) Booking Rules */}
      <section className="p-4 border rounded">
        <h2 className="font-medium">Booking Rules</h2>
        <p className="text-sm text-gray-600 mb-3">Update booking rules (max per day, allowed time blocks, restricted zones).</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm text-gray-700">Max bookings per user per day</span>
            <input type="number" value={maxPerDay} onChange={e => setMaxPerDay(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm text-gray-700">Allowed time blocks (comma separated, e.g. 09:00-12:00,13:00-18:00)</span>
            <input value={allowedBlocksText} onChange={e => setAllowedBlocksText(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
          </label>

          <label className="block md:col-span-3">
            <span className="text-sm text-gray-700">Restricted zones (comma separated)</span>
            <input value={restrictedZonesText} onChange={e => setRestrictedZonesText(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
          </label>
        </div>

        <div className="mt-3">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={saveRules}>Save rules</button>
        </div>
      </section>

      {/* 3) Rule Exceptions */}
      <section className="p-4 border rounded">
        <h2 className="font-medium">Rule Exceptions</h2>
        <p className="text-sm text-gray-600 mb-3">Add exceptions for specific users.</p>

        <form onSubmit={handleAddException} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <label className="block">
            <span className="text-sm text-gray-700">User</span>
            <input value={exUser} onChange={e => setExUser(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
          </label>

          <label className="block">
            <span className="text-sm text-gray-700">Rule key</span>
            <input value={exRuleKey} onChange={e => setExRuleKey(e.target.value)} placeholder="maxBookingsPerUserPerDay" className="mt-1 block w-full rounded border-gray-200" />
          </label>

          <label className="block">
            <span className="text-sm text-gray-700">Value</span>
            <input value={exValue} onChange={e => setExValue(e.target.value)} className="mt-1 block w-full rounded border-gray-200" />
          </label>

          <div>
            <button className="px-3 py-1 bg-green-600 text-white rounded" type="submit">Add exception</button>
          </div>
        </form>

        <div className="mt-4">
          <h3 className="font-medium">Current exceptions</h3>
          <div className="mt-2 space-y-2">
            {exceptions.length === 0 && <div className="text-sm text-gray-600">No exceptions</div>}
            {exceptions.map(ex => (
              <div key={ex.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{ex.user}</div>
                  <div className="text-sm text-gray-600">{ex.ruleKey}: {String(ex.value)}</div>
                </div>
                <div>
                  <button className="px-2 py-1 bg-red-100 text-red-700 rounded" onClick={() => removeException(ex.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}