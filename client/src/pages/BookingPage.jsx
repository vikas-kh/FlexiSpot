import React from 'react'
import BookingForm from '../components/BookingForm'

export default function BookingPage() {
  return (
    <div className="p-6 bg-white rounded shadow">
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h1 className="text-xl font-semibold">Seat Booking Engine</h1>
        <p className="text-sm text-gray-600 mt-1">Book desks or rooms for a chosen date and time.</p>
      </div>

      <BookingForm />
    </div>
  )
}