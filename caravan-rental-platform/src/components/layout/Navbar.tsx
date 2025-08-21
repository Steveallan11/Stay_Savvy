import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, XMarkIcon, UserCircleIcon, HeartIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const { profile, isOwner } = useUserProfile()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-level-1">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-2xl font-heading font-bold text-sea-blue hover:text-sea-blue-dark transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-sunset-orange to-sea-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span>CaravanStay</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="text-charcoal hover:text-sea-blue transition-colors font-medium">
              Search Properties
            </Link>
            <Link to="/parks" className="text-charcoal hover:text-sea-blue transition-colors font-medium">
              Holiday Parks
            </Link>
            <Link to="/help" className="text-charcoal hover:text-sea-blue transition-colors font-medium">
              Help
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-2">
                    <Link 
                      to="/dashboard" 
                      className="hidden md:flex items-center space-x-2 px-4 py-2 text-charcoal hover:text-sea-blue transition-colors font-medium"
                    >
                      <CalendarDaysIcon className="h-5 w-5" />
                      <span>My Trips</span>
                    </Link>
                    <Link 
                      to="/favorites" 
                      className="hidden md:flex items-center space-x-2 px-4 py-2 text-charcoal hover:text-sunset-orange transition-colors"
                    >
                      <HeartIcon className="h-5 w-5" />
                    </Link>
                    <div className="relative group">
                      <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-warm-sand hover:bg-warm-sand-dark transition-colors">
                        <UserCircleIcon className="h-6 w-6 text-charcoal" />
                        <span className="hidden md:block text-charcoal font-medium">
                          {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                        </span>
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-level-3 border border-warm-sand opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-2">
                          <Link to="/dashboard" className="block px-4 py-2 text-charcoal hover:bg-warm-sand-light transition-colors">
                            Dashboard
                          </Link>
                          <Link to="/profile" className="block px-4 py-2 text-charcoal hover:bg-warm-sand-light transition-colors">
                            Profile
                          </Link>
                          <Link to="/bookings" className="block px-4 py-2 text-charcoal hover:bg-warm-sand-light transition-colors">
                            My Bookings
                          </Link>
                          {isOwner && (
                            <>
                              <hr className="my-2 border-warm-sand" />
                              <div className="px-4 py-1">
                                <span className="text-xs font-medium text-slate-gray uppercase tracking-wide">Property Owner</span>
                              </div>
                              <Link to="/dashboard?section=properties" className="block px-4 py-2 text-charcoal hover:bg-warm-sand-light transition-colors">
                                My Properties
                              </Link>
                              <Link to="/dashboard?section=bookings" className="block px-4 py-2 text-charcoal hover:bg-warm-sand-light transition-colors">
                                Property Bookings
                              </Link>
                              <Link to="/dashboard?section=analytics" className="block px-4 py-2 text-charcoal hover:bg-warm-sand-light transition-colors">
                                Analytics
                              </Link>
                            </>
                          )}
                          <hr className="my-2 border-warm-sand" />
                          <button 
                            onClick={signOut}
                            className="block w-full text-left px-4 py-2 text-error-red hover:bg-red-50 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link 
                      to="/auth" 
                      className="text-charcoal hover:text-sea-blue transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/auth?mode=signup" 
                      className="px-6 py-2 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-warm-sand-light transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6 text-charcoal" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-charcoal" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-warm-sand mt-4 pt-4 pb-4"
            >
              <div className="space-y-4">
                <Link 
                  to="/search" 
                  onClick={toggleMenu}
                  className="block text-charcoal hover:text-sea-blue transition-colors font-medium"
                >
                  Search Properties
                </Link>
                <Link 
                  to="/parks" 
                  onClick={toggleMenu}
                  className="block text-charcoal hover:text-sea-blue transition-colors font-medium"
                >
                  Holiday Parks
                </Link>
                <Link 
                  to="/help" 
                  onClick={toggleMenu}
                  className="block text-charcoal hover:text-sea-blue transition-colors font-medium"
                >
                  Help
                </Link>
                
                {user ? (
                  <div className="space-y-4 pt-4 border-t border-warm-sand">
                    <Link 
                      to="/dashboard" 
                      onClick={toggleMenu}
                      className="block text-charcoal hover:text-sea-blue transition-colors font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/bookings" 
                      onClick={toggleMenu}
                      className="block text-charcoal hover:text-sea-blue transition-colors font-medium"
                    >
                      My Bookings
                    </Link>
                    <button 
                      onClick={() => {
                        signOut()
                        toggleMenu()
                      }}
                      className="block text-error-red font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-warm-sand">
                    <Link 
                      to="/auth" 
                      onClick={toggleMenu}
                      className="block text-charcoal hover:text-sea-blue transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/auth?mode=signup" 
                      onClick={toggleMenu}
                      className="block w-full text-center px-6 py-3 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white font-medium rounded-xl"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar