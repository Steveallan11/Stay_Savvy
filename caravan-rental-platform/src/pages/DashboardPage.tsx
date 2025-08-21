import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import { OwnerDashboard, type OwnerDashboardSection } from '@/components/owner/OwnerDashboard'
import { 
  Home, 
  Building, 
  Calendar, 
  MessageCircle, 
  BarChart3, 
  Heart,
  User,
  Settings
} from 'lucide-react'
import { Link } from 'react-router-dom'

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth()
  const { profile, loading: profileLoading, isOwner } = useUserProfile()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeSection, setActiveSection] = useState<string>(() => {
    return searchParams.get('section') || 'overview'
  })

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setSearchParams({ section })
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand">
        <Navbar />
        <div className="pt-20 container mx-auto px-4">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-charcoal mb-4">Access Denied</h1>
            <p className="text-slate-gray">Please sign in to access your dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  // Guest/Traveler Dashboard
  const renderGuestDashboard = () => (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-h1-mobile md:text-h1-desktop font-bold text-charcoal mb-2">
          Welcome back, {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-slate-gray">Manage your bookings and discover new holiday destinations.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-level-2 hover:shadow-level-3 transition-shadow">
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 text-sea-blue mr-3" />
            <h2 className="font-semibold text-charcoal">My Bookings</h2>
          </div>
          <p className="text-slate-gray mb-4">View and manage your upcoming trips</p>
          <Link to="/bookings" className="text-sea-blue hover:text-sea-blue-dark font-medium">
            View Bookings →
          </Link>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-level-2 hover:shadow-level-3 transition-shadow">
          <div className="flex items-center mb-4">
            <Heart className="h-6 w-6 text-sunset-orange mr-3" />
            <h2 className="font-semibold text-charcoal">Favorites</h2>
          </div>
          <p className="text-slate-gray mb-4">Your saved properties and wish list</p>
          <Link to="/favorites" className="text-sunset-orange hover:text-sunset-orange-dark font-medium">
            View Favorites →
          </Link>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-level-2 hover:shadow-level-3 transition-shadow">
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-charcoal mr-3" />
            <h2 className="font-semibold text-charcoal">Profile</h2>
          </div>
          <p className="text-slate-gray mb-4">Update your account and preferences</p>
          <Link to="/profile" className="text-charcoal hover:text-sea-blue font-medium">
            Edit Profile →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-level-2">
        <h2 className="text-xl font-semibold text-charcoal mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            to="/search" 
            className="flex items-center p-4 bg-gradient-to-r from-sea-blue to-sea-blue-dark text-white rounded-xl hover:from-sea-blue-dark hover:to-sea-blue transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Home className="h-5 w-5 mr-3" />
            Search Properties
          </Link>
          
          <button className="flex items-center p-4 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200 shadow-md hover:shadow-lg">
            <MessageCircle className="h-5 w-5 mr-3" />
            Contact Support
          </button>
          
          <button className="flex items-center p-4 bg-gradient-to-r from-warm-sand to-warm-sand-dark text-charcoal rounded-xl hover:from-warm-sand-dark hover:to-warm-sand transition-all duration-200 shadow-md hover:shadow-lg">
            <Settings className="h-5 w-5 mr-3" />
            Account Settings
          </button>
        </div>
      </div>
    </div>
  )

  // Owner Dashboard Navigation
  const ownerNavigation = [
    { id: 'overview', name: 'Overview', icon: Home },
    { id: 'properties', name: 'Properties', icon: Building },
    { id: 'bookings', name: 'Bookings', icon: Calendar },
    { id: 'messages', name: 'Messages', icon: MessageCircle },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand">
      <Navbar />
      <div className="pt-20 container mx-auto px-4">
        {isOwner ? (
          <div className="py-8">
            {/* Owner Dashboard Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-heading text-h1-mobile md:text-h1-desktop font-bold text-charcoal">
                    Property Owner Dashboard
                  </h1>
                  <p className="text-slate-gray">Manage your properties and track your business performance.</p>
                </div>
                <div className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white px-4 py-2 rounded-xl text-sm font-medium">
                  Owner Account
                </div>
              </div>

              {/* Owner Navigation */}
              <div className="flex space-x-1 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                {ownerNavigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                      activeSection === item.id
                        ? 'bg-white shadow-md text-charcoal'
                        : 'text-slate-gray hover:text-charcoal hover:bg-white/50'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner Dashboard Content */}
            <OwnerDashboard activeSection={activeSection as OwnerDashboardSection} />
          </div>
        ) : (
          <div className="py-8">
            {renderGuestDashboard()}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage