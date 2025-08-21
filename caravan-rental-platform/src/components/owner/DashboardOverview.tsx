import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { 
  Home, 
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardStats {
  totalProperties: number
  activeProperties: number
  pendingVerification: number
  totalBookings: number
  totalRevenue: number
  totalUpcomingBookings: number
  recentInquiries: any[]
  properties: any[]
}

export function DashboardOverview() {
  const { user } = useAuth()

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async (): Promise<DashboardStats> => {
      const { data, error } = await supabase.functions.invoke('dashboard-analytics', {
        body: { action: 'dashboard_overview' },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) throw error
      return data.data
    },
    enabled: !!user
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading dashboard data</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Properties',
      value: stats?.totalProperties || 0,
      subtitle: `${stats?.activeProperties || 0} active`,
      icon: Home,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      subtitle: `${stats?.totalUpcomingBookings || 0} upcoming`,
      icon: Calendar,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Revenue',
      value: `£${(stats?.totalRevenue || 0).toLocaleString()}`,
      subtitle: 'All time earnings',
      icon: TrendingUp,
      color: 'from-orange-500 to-pink-500'
    },
    {
      title: 'New Inquiries',
      value: stats?.recentInquiries?.length || 0,
      subtitle: 'This week',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Welcome Back!</h1>
        <p className="text-slate-gray">Here's what's happening with your properties today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-gray">{stat.title}</p>
                <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
                <p className="text-xs text-slate-gray">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Properties Overview and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Properties Status */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold text-charcoal mb-6">Properties Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-slate-gray">Active Properties</span>
              </div>
              <span className="text-xl font-semibold text-charcoal">{stats?.activeProperties || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="text-slate-gray">Pending Verification</span>
              </div>
              <span className="text-xl font-semibold text-charcoal">{stats?.pendingVerification || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-slate-gray">Total Properties</span>
              </div>
              <span className="text-xl font-semibold text-charcoal">{stats?.totalProperties || 0}</span>
            </div>
          </div>
          
          {stats?.totalProperties === 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-blue-700 text-sm">
                Ready to get started? Add your first property to begin receiving bookings.
              </p>
            </div>
          )}
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold text-charcoal mb-6">Recent Inquiries</h2>
          
          {stats?.recentInquiries && stats.recentInquiries.length > 0 ? (
            <div className="space-y-4">
              {stats.recentInquiries.slice(0, 5).map((inquiry: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/40 transition-colors">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-full p-2">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {inquiry.subject || 'New Inquiry'}
                    </p>
                    <p className="text-sm text-slate-gray truncate">
                      {inquiry.message_text}
                    </p>
                    <p className="text-xs text-slate-gray mt-1">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!inquiry.is_resolved && (
                    <div className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                      New
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-slate-gray">No recent inquiries</p>
              <p className="text-sm text-slate-gray">Inquiries will appear here once guests contact you</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
        <h2 className="text-xl font-semibold text-charcoal mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg">
            <Home className="h-5 w-5 mr-2" />
            Add Property
          </button>
          
          <button className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
            <Calendar className="h-5 w-5 mr-2" />
            Update Calendar
          </button>
          
          <button className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg">
            <MessageCircle className="h-5 w-5 mr-2" />
            View Messages
          </button>
          
          <button className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
            <TrendingUp className="h-5 w-5 mr-2" />
            View Analytics
          </button>
        </div>
      </div>
    </div>
  )
}