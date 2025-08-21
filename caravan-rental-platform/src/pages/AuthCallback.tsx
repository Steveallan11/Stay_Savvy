import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hashFragment = window.location.hash

        if (hashFragment && hashFragment.length > 0) {
          // The user has been redirected after email verification
          const { data, error } = await supabase.auth.getSession()

          if (error) {
            console.error('Error getting session:', error.message)
            toast.error('Authentication failed')
            navigate('/auth?error=authentication_failed')
            return
          }

          if (data.session) {
            // Successfully signed in, redirect to app
            toast.success('Email verified successfully!')
            navigate('/dashboard')
            return
          }
        }

        // If we get here, something went wrong
        toast.error('Authentication failed')
        navigate('/auth?error=no_session')
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Authentication failed')
        navigate('/auth?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-blue via-sea-blue-light to-sunset-orange flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 text-center shadow-glass">
        <div className="animate-spin w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-charcoal font-medium">Verifying your account...</p>
      </div>
    </div>
  )
}

export default AuthCallback