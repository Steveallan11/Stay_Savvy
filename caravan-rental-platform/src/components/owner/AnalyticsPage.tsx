import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Eye,
  MessageCircle,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsData {
  propertyId: string
  totalBookings: number
  confirmedBookings: number
  totalRevenue: number
  averageBookingValue: number
  occupancyRate: number
  bookedDays: number
  totalDays: number
  recentBookings: any[]
  inquiries: any[]
  totalInquiries: number
  unresolvedInquiries: number
}

interface EarningsData {
  totalEarnings: number
  totalBookings: number
  monthlyEarnings: { month: string, earnings: number }[]
  averageBookingValue: number
}

const COLORS = ['#f97316', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']

export function AnalyticsPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>(() => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 6) // Last 6 months
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  })
  const { user } = useAuth()

  // Fetch user's properties
  const { data: properties = [] } = useQuery({
    queryKey: ['user-properties-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title')
        .eq('owner_id', user?.id)
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  // Fetch property analytics
  const { data: propertyAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['property-analytics', selectedProperty, dateRange],
    queryFn: async (): Promise<AnalyticsData | null> => {
      if (selectedProperty === 'all') return null
      
      const { data, error } = await supabase.functions.invoke('dashboard-analytics', {
        body: {
          action: 'property_analytics',
          propertyId: selectedProperty,
          dateRange
        }
      })

      if (error) throw error
      return data.data
    },
    enabled: !!user && selectedProperty !== 'all'
  })

  // Fetch earnings summary
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['earnings-summary', dateRange],
    queryFn: async (): Promise<EarningsData> => {
      const { data, error } = await supabase.functions.invoke('dashboard-analytics', {
        body: {
          action: 'earnings_summary',
          dateRange
        }
      })

      if (error) throw error
      return data.data
    },
    enabled: !!user
  })

  // Set initial property selection
  React.useEffect(() => {
    if (properties.length > 0 && selectedProperty === 'all') {
      setSelectedProperty(properties[0]?.id || 'all')
    }
  }, [properties, selectedProperty])

  const formatCurrency = (value: number) => `£${value.toLocaleString()}`
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  // Prepare chart data
  const monthlyEarningsChart = earningsData?.monthlyEarnings?.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    earnings: item.earnings
  })) || []

  const occupancyData = [
    { name: 'Booked', value: propertyAnalytics?.bookedDays || 0, color: '#10b981' },
    { name: 'Available', value: (propertyAnalytics?.totalDays || 0) - (propertyAnalytics?.bookedDays || 0), color: '#e5e7eb' }
  ]

  const bookingStatusData = [
    { name: 'Confirmed', value: propertyAnalytics?.confirmedBookings || 0, color: '#10b981' },
    { name: 'Total', value: (propertyAnalytics?.totalBookings || 0) - (propertyAnalytics?.confirmedBookings || 0), color: '#f59e0b' }
  ]

  if (properties.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Analytics</h1>
            <p className="text-slate-gray mt-1">Property performance insights and earnings tracking</p>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-sm text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-charcoal mb-4">No Properties Available</h2>
          <p className="text-slate-gray">Add properties to view detailed analytics and performance metrics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Analytics</h1>
          <p className="text-slate-gray mt-1">Property performance insights and earnings tracking</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunset-orange focus:border-transparent text-sm"
            />
            <span className="text-slate-gray">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunset-orange focus:border-transparent text-sm"
            />
          </div>
          
          {/* Property Selector */}
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange focus:border-transparent bg-white min-w-[200px]"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>
          
          <button className="flex items-center px-4 py-2 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overall Earnings Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-gray">Total Earnings</p>
              <p className="text-2xl font-bold text-charcoal">
                {formatCurrency(earningsData?.totalEarnings || 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-sea-blue to-sea-blue-dark rounded-xl p-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-gray">Total Bookings</p>
              <p className="text-2xl font-bold text-charcoal">
                {earningsData?.totalBookings || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark rounded-xl p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-gray">Avg Booking Value</p>
              <p className="text-2xl font-bold text-charcoal">
                {formatCurrency(earningsData?.averageBookingValue || 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-3">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-gray">Occupancy Rate</p>
              <p className="text-2xl font-bold text-charcoal">
                {formatPercentage(propertyAnalytics?.occupancyRate || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Earnings Chart */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold text-charcoal mb-6">Monthly Earnings</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEarningsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), 'Earnings']}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Rate Chart */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold text-charcoal mb-6">Occupancy Rate</h2>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} days`, 'Days']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {occupancyData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-slate-gray">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {selectedProperty !== 'all' && propertyAnalytics && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold text-charcoal mb-6">Property Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-charcoal">{propertyAnalytics.totalBookings}</p>
              <p className="text-sm text-slate-gray">Total Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-charcoal">{formatCurrency(propertyAnalytics.totalRevenue)}</p>
              <p className="text-sm text-slate-gray">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-charcoal">{formatCurrency(propertyAnalytics.averageBookingValue)}</p>
              <p className="text-sm text-slate-gray">Avg Booking Value</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-charcoal">{propertyAnalytics.totalInquiries}</p>
              <p className="text-sm text-slate-gray">Total Inquiries</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}