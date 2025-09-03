import React from 'react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold">FlexiSpot</h1>
      <p className="mt-2 text-gray-600">FlexiSpot helps teams reserve desks and rooms quickly — pick a date, time, and resource to book.</p>

      <div className="mt-6 flex gap-3">
        <Link to="/booking" className="px-3 py-2 bg-blue-600 text-white rounded">Booking</Link>
        <Link to="/availability" className="px-3 py-2 bg-gray-200 text-gray-800 rounded">Availability</Link>
        <Link to="/admin" className="px-3 py-2 bg-gray-200 text-gray-800 rounded">Admin</Link>
      </div>
    </div>
  )
}