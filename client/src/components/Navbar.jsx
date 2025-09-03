import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const baseClass = 'block px-3 py-2 rounded'
  const activeClass = 'text-white bg-blue-600 '
  const inactiveClass = 'text-blue-600 hover:bg-blue-50'

  return (
    <header className="bg-white shadow-sm mb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <NavLink to="/" className="text-xl font-bold text-gray-800">Flexispot</NavLink>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-2">
            <NavLink to="/" className={({isActive}) => baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>Home</NavLink>
            <NavLink to="/booking" className={({isActive}) => baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>Booking</NavLink>
            <NavLink to="/availability" className={({isActive}) => baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>Availability</NavLink>
            <NavLink to="/admin" className={({isActive}) => baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>Admin</NavLink>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink to="/" onClick={() => setOpen(false)} className={({isActive}) => baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>Home</NavLink>
            <NavLink to="/booking" onClick={() => setOpen(false)} className={({isActive}) => baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>Booking</NavLink>
            <NavLink to="/availability" onClick={() => setOpen(false)} className={({isActive}) => baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>Availability</NavLink>
            <NavLink to="/admin" onClick={() => setOpen(false)} className={({isActive}) => baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>Admin</NavLink>
          </div>
        </div>
      )}
    </header>
  )
}
