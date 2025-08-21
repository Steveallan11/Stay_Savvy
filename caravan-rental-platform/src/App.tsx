import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Elements } from '@stripe/react-stripe-js'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { stripePromise, isStripeEnabled } from './lib/stripe'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import BookingPage from './pages/BookingPage'
import DashboardPage from './pages/DashboardPage'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

function App() {
  const AppContent = (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand bg-fixed">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/booking/:id" element={<BookingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#2C3E50',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '16px',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )

  return (
    <QueryClientProvider client={queryClient}>
      {isStripeEnabled ? (
        <Elements stripe={stripePromise}>
          {AppContent}
        </Elements>
      ) : (
        AppContent
      )}
    </QueryClientProvider>
  )
}

export default App