import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import {
  Calendar,
  Users,
  MapPin,
  Wifi,
  Car,
  Dog,
  Star,
  Bath,
  Bed,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Property {
  id: string
  title: string
  description: string
  property_type: string
  berths: number
  bedrooms: number
  bathrooms: number
  pet_friendly: boolean
  accessible: boolean
  features: Record<string, boolean>
  address: string
  rating_avg: number
  holiday_parks: {
    name: string
    city: string
    region: string
  }
  property_media: Array<{
    url: string
    is_primary: boolean
    title: string
  }>
}

interface PricingRule {
  base_price_per_night: number
  cleaning_fee: number
  pet_fee: number
  security_deposit: number
  min_stay_nights: number
  check_in_time: string
  check_out_time: string
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)

function BookingForm({ property, pricing }: { property: Property; pricing: PricingRule }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [searchParams] = useSearchParams()
  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '')
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '')
  const [adults, setAdults] = useState(parseInt(searchParams.get('adults') || '2'))
  const [children, setChildren] = useState(parseInt(searchParams.get('children') || '0'))
  const [infants, setInfants] = useState(0)
  const [pets, setPets] = useState(0)
  const [specialRequests, setSpecialRequests] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState<any>(null)
  const [paymentIntent, setPaymentIntent] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate pricing
  const nights = startDate && endDate 
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const basePrice = pricing.base_price_per_night * nights
  const cleaningFee = pricing.cleaning_fee || 0
  const petFee = pets > 0 ? (pricing.pet_fee || 0) : 0
  const serviceFee = Math.round(basePrice * 0.12) // 12% service fee
  const totalPrice = basePrice + cleaningFee + petFee + serviceFee

  // Check availability mutation
  const checkAvailabilityMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'check_availability',
          property_id: property.id,
          start_date: startDate,
          end_date: endDate
        }
      })
      if (error) throw error
      if (data.error) throw new Error(data.error.message)
      return data.data
    },
    onSuccess: (data) => {
      if (data.available) {
        toast.success('Property is available for your dates!')
        setCurrentStep(2)
      } else {
        toast.error('Property is not available for selected dates')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check availability')
    }
  })

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'create_booking',
          property_id: property.id,
          start_date: startDate,
          end_date: endDate,
          adults,
          children,
          infants,
          pets,
          special_requests: specialRequests,
          pricing
        }
      })
      if (error) throw error
      if (data.error) throw new Error(data.error.message)
      return data.data
    },
    onSuccess: (data) => {
      setBookingData(data)
      toast.success('Booking created! Proceed to payment.')
      setCurrentStep(3)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create booking')
    }
  })

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('booking-management', {
        body: {
          action: 'create_payment_intent',
          booking_id: bookingData.booking.id,
          amount: totalPrice,
          currency: 'gbp'
        }
      })
      if (error) throw error
      if (data.error) throw new Error(data.error.message)
      return data.data
    },
    onSuccess: (data) => {
      setPaymentIntent(data)
      toast.success('Ready to process payment')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create payment intent')
    }
  })

  const handleDateSubmit = () => {
    if (!startDate || !endDate) {
      toast.error('Please select check-in and check-out dates')
      return
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('Check-out date must be after check-in date')
      return
    }
    if (nights < pricing.min_stay_nights) {
      toast.error(`Minimum stay is ${pricing.min_stay_nights} nights`)
      return
    }
    checkAvailabilityMutation.mutate()
  }

  const handleBookingSubmit = () => {
    if (!user) {
      toast.error('Please log in to make a booking')
      navigate('/auth')
      return
    }
    if (adults + children > property.berths) {
      toast.error(`Property sleeps maximum ${property.berths} guests`)
      return
    }
    createBookingMutation.mutate()
  }

  const handlePaymentSubmit = async () => {
    if (!stripe || !elements) return
    
    setIsProcessing(true)
    
    try {
      if (!paymentIntent) {
        await createPaymentIntentMutation.mutateAsync()
        return
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user?.email
            }
          }
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (confirmedPayment.status === 'succeeded') {
        // Confirm payment with backend
        const { data, error } = await supabase.functions.invoke('booking-management', {
          body: {
            action: 'confirm_payment',
            payment_intent_id: confirmedPayment.id,
            booking_id: bookingData.booking.id
          }
        })

        if (error) throw error
        if (data.error) throw new Error(data.error.message)

        toast.success('Payment successful! Booking confirmed!')
        setCurrentStep(4)
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-sunset-orange text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-0.5 ${
                  currentStep > step ? 'bg-sunset-orange' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <div className="text-sm text-gray-500">
            {currentStep === 1 && 'Select Dates'}
            {currentStep === 2 && 'Guest Details'}
            {currentStep === 3 && 'Payment'}
            {currentStep === 4 && 'Confirmed'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-level-2 h-fit">
          <div className="flex items-start space-x-4 mb-4">
            <img 
              src={property.property_media.find(m => m.is_primary)?.url || property.property_media[0]?.url || '/images/placeholder.jpg'}
              alt={property.title}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-charcoal mb-1">{property.title}</h3>
              <div className="flex items-center text-slate-gray mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{property.holiday_parks.name}, {property.holiday_parks.city}</span>
              </div>
              {property.rating_avg && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-charcoal ml-1">{property.rating_avg.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-slate-gray mb-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>Sleeps {property.berths}</span>
            </div>
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.bedrooms} bed</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms} bath</span>
            </div>
          </div>

          {nights > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-charcoal mb-3">Price Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>£{pricing.base_price_per_night.toFixed(2)} x {nights} nights</span>
                  <span>£{basePrice.toFixed(2)}</span>
                </div>
                {cleaningFee > 0 && (
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>£{cleaningFee.toFixed(2)}</span>
                  </div>
                )}
                {petFee > 0 && (
                  <div className="flex justify-between">
                    <span>Pet fee</span>
                    <span>£{petFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>£{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>£{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-level-2">
          {currentStep === 1 && (
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-6">Select Your Dates</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Check-in</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Check-out</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange"
                  />
                </div>
              </div>

              {nights > 0 && (
                <div className="bg-sunset-orange-light/20 rounded-xl p-4 mb-6">
                  <div className="text-sm text-charcoal">
                    <div className="font-medium">{nights} nights selected</div>
                    <div>Check-in: {pricing.check_in_time} • Check-out: {pricing.check_out_time}</div>
                    <div>Minimum stay: {pricing.min_stay_nights} nights</div>
                  </div>
                </div>
              )}

              <button
                onClick={handleDateSubmit}
                disabled={!startDate || !endDate || checkAvailabilityMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl font-medium hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkAvailabilityMutation.isPending ? 'Checking...' : 'Check Availability'}
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-6">Guest Details</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Adults</label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange"
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Children</label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange"
                  >
                    {[0,1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Infants</label>
                  <select
                    value={infants}
                    onChange={(e) => setInfants(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange"
                  >
                    {[0,1,2,3].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Pets</label>
                  <select
                    value={pets}
                    onChange={(e) => setPets(parseInt(e.target.value))}
                    disabled={!property.pet_friendly}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange disabled:opacity-50"
                  >
                    {[0,1,2,3].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  {!property.pet_friendly && (
                    <p className="text-xs text-red-600 mt-1">Pets not allowed</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-charcoal mb-2">Special Requests (Optional)</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange"
                  placeholder="Any special requests or requirements..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-charcoal rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleBookingSubmit}
                  disabled={createBookingMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl font-medium hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200 disabled:opacity-50"
                >
                  {createBookingMutation.isPending ? 'Creating...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-6">Payment Details</h3>
              
              <div className="mb-6">
                <div className="flex items-center text-green-600 mb-4">
                  <Shield className="h-5 w-5 mr-2" />
                  <span className="text-sm">Your payment is secured by Stripe</span>
                </div>
                
                <div className="border border-gray-300 rounded-xl p-4">
                  <CardElement 
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 py-3 border border-gray-300 text-charcoal rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing || !stripe || !elements}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isProcessing ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay £{totalPrice.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-2">Booking Confirmed!</h3>
              <p className="text-slate-gray mb-6">
                Your booking has been confirmed. You will receive a confirmation email shortly.
              </p>
              <div className="bg-green-50 rounded-xl p-4 mb-6">
                <div className="text-sm text-green-800">
                  <div className="font-medium">Booking Reference: {bookingData?.booking?.id}</div>
                  <div>Check-in: {startDate} at {pricing.check_in_time}</div>
                  <div>Check-out: {endDate} at {pricing.check_out_time}</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl font-medium hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200"
              >
                View My Bookings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  
  // Fetch property details
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          holiday_parks!properties_park_id_fkey(name, city, region),
          property_media(url, is_primary, title),
          property_pricing_rules(base_price_per_night, cleaning_fee, pet_fee, security_deposit, min_stay_nights, check_in_time, check_out_time)
        `)
        .eq('id', propertyId)
        .eq('status', 'active')
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!propertyId
  })

  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand">
        <Navbar />
        <div className="pt-20 container mx-auto px-4 flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand">
        <Navbar />
        <div className="pt-20 container mx-auto px-4">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-charcoal mb-4">Property Not Found</h1>
            <p className="text-slate-gray mb-8">The property you're looking for is not available.</p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200"
            >
              Browse Properties
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pricing = property.property_pricing_rules?.[0] || {
    base_price_per_night: 100,
    cleaning_fee: 25,
    pet_fee: 15,
    security_deposit: 100,
    min_stay_nights: 2,
    check_in_time: '15:00',
    check_out_time: '11:00'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-gray hover:text-charcoal transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Property
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Book Your Stay</h1>
          <p className="text-slate-gray">Complete your booking in just a few simple steps</p>
        </div>

        <Elements stripe={stripePromise}>
          <BookingForm property={property} pricing={pricing} />
        </Elements>
      </div>
    </div>
  )
}