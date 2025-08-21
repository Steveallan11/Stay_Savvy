import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPinIcon, StarIcon, HeartIcon, ShareIcon, WifiIcon, UserGroupIcon, HomeIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface Property {
  id: string
  title: string
  description: string
  berths: number
  bedrooms: number
  bathrooms: number
  pet_friendly: boolean
  features: Record<string, any>
  park: {
    id: string
    name: string
    city: string
    region: string
    features: Record<string, any>
  }
  media: Array<{
    url: string
    is_primary: boolean
    title?: string
  }>
  rating_avg?: number
}

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)

  // Fetch property details
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) throw new Error('Property ID is required')
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          holiday_parks!properties_park_id_fkey (*),
          property_media (*)
        `)
        .eq('id', id)
        .eq('status', 'active')
        .eq('verification_status', 'verified')
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching property:', error)
        throw error
      }
      
      if (!data) {
        throw new Error('Property not found')
      }
      
      return {
        ...data,
        park: data.holiday_parks,
        media: data.property_media.sort((a: any, b: any) => {
          if (a.is_primary) return -1
          if (b.is_primary) return 1
          return a.display_order - b.display_order
        })
      } as Property
    }
  })

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please sign in to make a booking')
      return
    }
    
    if (!checkIn || !checkOut) {
      toast.error('Please select your dates')
      return
    }
    
    // Navigate to booking page with parameters
    const bookingUrl = `/booking/${id}?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`
    window.location.href = bookingUrl
  }

  const formatFeatures = () => {
    if (!property?.features) return []
    
    const features = []
    if (property.features.hot_tub) features.push({ icon: '♨️', label: 'Hot Tub' })
    if (property.features.sea_view) features.push({ icon: '🌊', label: 'Sea View' })
    if (property.features.decking) features.push({ icon: '🏡', label: 'Decking' })
    if (property.features.wifi) features.push({ icon: '📶', label: 'WiFi' })
    if (property.features.parking) features.push({ icon: '🚗', label: 'Parking' })
    if (property.features.dishwasher) features.push({ icon: '🍽️', label: 'Dishwasher' })
    if (property.pet_friendly) features.push({ icon: '🐕', label: 'Pet Friendly' })
    
    return features
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand">
        <Navbar />
        <div className="pt-20 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
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
            <h1 className="text-2xl font-bold text-charcoal mb-4">Property Not Found</h1>
            <p className="text-slate-gray mb-6">The property you're looking for doesn't exist or has been removed.</p>
            <Link to="/search" className="inline-flex items-center px-6 py-3 bg-sunset-orange text-white font-medium rounded-xl hover:bg-sunset-orange-dark transition-colors">
              Browse Properties
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand">
      <Navbar />
      
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-h1-mobile md:text-h1-desktop font-bold text-charcoal mb-4"
            >
              {property.title}
            </motion.h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 text-slate-gray">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-5 w-5" />
                  <span>{property.park.name}, {property.park.city}</span>
                </div>
                {property.rating_avg && (
                  <div className="flex items-center gap-1">
                    <StarIcon className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">{property.rating_avg.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white transition-colors">
                  <ShareIcon className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white transition-colors">
                  <HeartIcon className="h-5 w-5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Photos and Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Photo Gallery */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative h-96 rounded-2xl overflow-hidden">
                  <img 
                    src={property.media[selectedImageIndex]?.url || '/images/placeholder-caravan.jpg'}
                    alt={property.media[selectedImageIndex]?.title || property.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/placeholder-caravan.jpg'
                    }}
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {property.media.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {property.media.slice(0, 4).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative h-20 rounded-xl overflow-hidden ${
                          selectedImageIndex === index 
                            ? 'ring-2 ring-sunset-orange' 
                            : 'hover:opacity-80'
                        } transition-all duration-200`}
                      >
                        <img 
                          src={image.url}
                          alt={image.title || `Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/images/placeholder-caravan.jpg'
                          }}
                        />
                        {index === 3 && property.media.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                            +{property.media.length - 4}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-level-2">
                <h2 className="font-heading text-h3-mobile font-semibold text-charcoal mb-4">
                  Property Details
                </h2>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-warm-sand-light rounded-xl">
                    <UserGroupIcon className="h-8 w-8 text-sea-blue mx-auto mb-2" />
                    <div className="font-semibold text-charcoal">{property.berths}</div>
                    <div className="text-sm text-slate-gray">Guests</div>
                  </div>
                  <div className="text-center p-4 bg-warm-sand-light rounded-xl">
                    <HomeIcon className="h-8 w-8 text-sea-blue mx-auto mb-2" />
                    <div className="font-semibold text-charcoal">{property.bedrooms}</div>
                    <div className="text-sm text-slate-gray">Bedrooms</div>
                  </div>
                  <div className="text-center p-4 bg-warm-sand-light rounded-xl">
                    <div className="h-8 w-8 text-sea-blue mx-auto mb-2 flex items-center justify-center text-xl">🚿</div>
                    <div className="font-semibold text-charcoal">{property.bathrooms}</div>
                    <div className="text-sm text-slate-gray">Bathrooms</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-charcoal mb-3">Description</h3>
                  <p className="text-slate-gray leading-relaxed">{property.description}</p>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-level-2">
                <h2 className="font-heading text-h3-mobile font-semibold text-charcoal mb-4">
                  Amenities
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formatFeatures().map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-warm-sand-light rounded-xl">
                      <span className="text-2xl">{feature.icon}</span>
                      <span className="text-charcoal font-medium">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Holiday Park Info */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-level-2">
                <h2 className="font-heading text-h3-mobile font-semibold text-charcoal mb-4">
                  About {property.park.name}
                </h2>
                <p className="text-slate-gray mb-4">
                  This caravan is located at {property.park.name} in {property.park.city}, {property.park.region}.
                </p>
                
                {/* Park Features */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(property.park.features || {}).map(([key, value]) => (
                    value && (
                      <span key={key} className="inline-block bg-sea-blue-light/20 text-sea-blue px-3 py-1 rounded-full text-sm capitalize">
                        {key.replace('_', ' ')}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-glass border border-white/20">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-charcoal">
                    £85 <span className="text-lg font-normal text-slate-gray">/ night</span>
                  </div>
                  <p className="text-sm text-slate-gray">Prices may vary by date</p>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Check-in</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 bg-warm-sand-light border-0 rounded-lg text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Check-out</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 bg-warm-sand-light border-0 rounded-lg text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-warm-sand-light border-0 rounded-lg text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                    >
                      {Array.from({ length: property.berths }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} Guest{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleBookNow}
                  className="w-full py-3 px-4 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-level-2"
                >
                  Book Now
                </button>
                
                <p className="text-xs text-center text-slate-gray mt-4">
                  You won't be charged yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetailPage