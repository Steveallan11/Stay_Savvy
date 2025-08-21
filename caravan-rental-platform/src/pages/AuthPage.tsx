import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { signInWithEmail, signUpWithEmail } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [mode, setMode] = useState<'signin' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userType, setUserType] = useState<'guest' | 'owner'>('guest')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      await signInWithEmail(email, password)
      toast.success('Successfully signed in!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !fullName) {
      toast.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      await signUpWithEmail(email, password, fullName, userType)
      toast.success('Please check your email to verify your account')
      setMode('signin')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-blue via-sea-blue-light to-sunset-orange flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/images/pattern-holiday.svg')] bg-repeat opacity-20"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-glass border border-white/20 w-full max-w-md p-8 relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-sunset-orange to-sea-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-charcoal">
            Welcome to CaravanStay
          </h1>
          <p className="text-slate-gray mt-2">
            {mode === 'signin' 
              ? 'Sign in to your account' 
              : 'Create your account'
            }
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-warm-sand-light rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              mode === 'signin' 
                ? 'bg-white text-charcoal shadow-sm' 
                : 'text-slate-gray hover:text-charcoal'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              mode === 'signup' 
                ? 'bg-white text-charcoal shadow-sm' 
                : 'text-slate-gray hover:text-charcoal'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-warm-sand-light border-0 rounded-xl text-charcoal placeholder-slate-gray focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserType('guest')}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      userType === 'guest'
                        ? 'bg-sunset-orange text-white'
                        : 'bg-warm-sand-light text-charcoal hover:bg-warm-sand'
                    }`}
                  >
                    Book Holidays
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('owner')}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      userType === 'owner'
                        ? 'bg-sunset-orange text-white'
                        : 'bg-warm-sand-light text-charcoal hover:bg-warm-sand'
                    }`}
                  >
                    List Property
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-warm-sand-light border-0 rounded-xl text-charcoal placeholder-slate-gray focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-warm-sand-light border-0 rounded-xl text-charcoal placeholder-slate-gray focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-gray hover:text-charcoal transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-warm-sand-light border-0 rounded-xl text-charcoal placeholder-slate-gray focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-level-2"
          >
            {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          {mode === 'signin' ? (
            <p className="text-sm text-slate-gray">
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('signup')}
                className="text-sunset-orange hover:text-sunset-orange-dark font-medium transition-colors"
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-gray">
              Already have an account?{' '}
              <button 
                onClick={() => setMode('signin')}
                className="text-sunset-orange hover:text-sunset-orange-dark font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>

        {/* Terms */}
        {mode === 'signup' && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-gray">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-sunset-orange hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-sunset-orange hover:underline">Privacy Policy</a>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default AuthPage