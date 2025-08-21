import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  RefreshCw,
  Eye,
  MessageCircle,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  property_id: string
  guest_name: string
  guest_email: string
  guest_phone?: string
  start_date: string
  end_date: string
  adults: number
  children: number
  infants: number
  pets: number
  total_price: number
  status: string
  payment_status: string
  special_requests?: string
  created_at: string
  property: {
    title: string
    property_type: string
    park_name?: string
  }
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
}

const paymentStatusColors = {
  pending: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

export function OwnerBookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['user-bookings'],
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: { action: 'get_bookings' },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) throw error
      return data.data.bookings
    },
    enabled: !!user
  })

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, statusUpdate }: { bookingId: string, statusUpdate: any }) => {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'update_booking_status',
          bookingId,
          statusUpdate
        }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] })
      toast.success('Booking updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update booking')
    }
  })

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    updateBookingMutation.mutate({
      bookingId,
      statusUpdate: {
        status: newStatus
      }
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredBookings = bookings.filter(booking => 
    statusFilter === 'all' || booking.status === statusFilter
  )

  const calculateNights = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-charcoal">Bookings</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <p className="text-red-700">Error loading bookings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Bookings</h1>
          <p className="text-slate-gray mt-1">Manage your property bookings and guest communications</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange focus:border-transparent bg-white"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Booking Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-sea-blue to-sea-blue-dark rounded-xl p-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-gray">Total Bookings</p>
              <p className="text-2xl font-bold text-charcoal">{bookings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-3">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-gray">Pending</p>
              <p className="text-2xl font-bold text-charcoal">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-gray">Confirmed</p>
              <p className="text-2xl font-bold text-charcoal">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark rounded-xl p-3">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-gray">Total Revenue</p>
              <p className="text-2xl font-bold text-charcoal">
                £{bookings.reduce((sum, b) => sum + parseFloat(b.total_price.toString()), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-sm text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-charcoal mb-4">No Bookings Yet</h2>
          <p className="text-slate-gray">
            {statusFilter === 'all' 
              ? 'Your bookings will appear here once guests make reservations.' 
              : `No ${statusFilter} bookings found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  {/* Property Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal">
                        {booking.property.title}
                      </h3>
                      <p className="text-sm text-slate-gray">
                        {booking.property.property_type} 
                        {booking.property.park_name && ` at ${booking.property.park_name}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status as keyof typeof statusColors]}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Guest and Booking Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-charcoal mb-2">Guest Information</h4>
                      <div className="space-y-1 text-sm text-slate-gray">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {booking.guest_name}
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {booking.guest_email}
                        </div>
                        {booking.guest_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {booking.guest_phone}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-charcoal mb-2">Booking Details</h4>
                      <div className="space-y-1 text-sm text-slate-gray">
                        <p><strong>Check-in:</strong> {new Date(booking.start_date).toLocaleDateString()}</p>
                        <p><strong>Check-out:</strong> {new Date(booking.end_date).toLocaleDateString()}</p>
                        <p><strong>Nights:</strong> {calculateNights(booking.start_date, booking.end_date)}</p>
                        <div className="flex items-center space-x-4">
                          <span><strong>Adults:</strong> {booking.adults}</span>
                          {booking.children > 0 && <span><strong>Children:</strong> {booking.children}</span>}
                          {booking.pets > 0 && <span><strong>Pets:</strong> {booking.pets}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-charcoal mb-2">Payment</h4>
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-charcoal">£{parseFloat(booking.total_price.toString()).toLocaleString()}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[booking.payment_status as keyof typeof paymentStatusColors]}`}>
                          {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Special Requests */}
                  {booking.special_requests && (
                    <div>
                      <h4 className="font-medium text-charcoal mb-2">Special Requests</h4>
                      <p className="text-sm text-slate-gray bg-gray-50 p-3 rounded-lg">
                        {booking.special_requests}
                      </p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  {booking.status === 'pending' && (
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}