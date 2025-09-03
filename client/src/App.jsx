import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'
import HomePage from './pages/HomePage'
import BookingPage from './pages/BookingPage'
import AvailabilityPage from './pages/AvailabilityPage'
import AdminPage from './pages/AdminPage'
import Navbar from './components/Navbar'
import { BookingProvider } from './state/BookingContext'
import { desks, rooms, bookings } from './data/mock'

function App() {
  return (
    <BookingProvider initialData={{ desks, rooms, bookings }}>
      <Router>
        <div className="min-h-screen bg-gray-50 p-6">
          <Navbar />

          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </BookingProvider>
  )
}

export default App
