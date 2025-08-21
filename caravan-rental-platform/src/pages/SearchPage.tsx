import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AdjustmentsHorizontalIcon, MapIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import SearchBar from '@/components/search/SearchBar'
import PropertyCard from '@/components/properties/PropertyCard'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface SearchParams {
  location: string
  checkIn: string
  checkOut: string
  guests: number
  petFriendly?: boolean
  priceRange?: [number, number]
}

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
    name: string
    city: string
    region: string
  }
  media: Array<{
    url: string
    is_primary: boolean
  }>
  pricing: {
    base_price: number
  }
  rating_avg?: number
}

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    checkIn: searchParams.get('checkin') || '',
    checkOut: searchParams.get('checkout') || '',
    guests: parseInt(searchParams.get('guests') || '2'),
    petFriendly: searchParams.get('pet_friendly') === 'true',
    priceRange: [50, 300] as [number, number]
  })

  // Fetch properties based on search criteria
  const { data: properties = [], isLoading, refetch } = useQuery({
    queryKey: ['search-properties', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select(`
          *,
          holiday_parks!properties_park_id_fkey (name, city, region),
          property_media (url, is_primary)
        `)
        .eq('status', 'active')
        .eq('verification_status', 'verified')

      // Apply location filter
      if (filters.location) {
        query = query.or(
          `title.ilike.%${filters.location}%,` +
          `holiday_parks.name.ilike.%${filters.location}%,` +
          `holiday_parks.city.ilike.%${filters.location}%,` +
          `holiday_parks.region.ilike.%${filters.location}%`
        )
      }

      // Apply guest capacity filter
      if (filters.guests) {
        query = query.gte('berths', filters.guests)
      }

      // Apply pet-friendly filter
      if (filters.petFriendly) {
        query = query.eq('pet_friendly', true)
      }

      query = query.order('rating_avg', { ascending: false, nullsFirst: false })
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching properties:', error)
        return []
      }
      
      return data?.map(property => ({
        ...property,
        park: property.holiday_parks,
        media: property.property_media,
        pricing: { base_price: 85 } // Default pricing
      })) || []
    }
  })

  const handleSearch = (searchParams: SearchParams) => {
    setFilters({
      ...searchParams,
      petFriendly: searchParams.petFriendly || false,
      priceRange: searchParams.priceRange || [50, 300]
    })
    refetch()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-sand-light via-white to-warm-sand">
      <Navbar />
      
      <div className="pt-20">
        {/* Search Header */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-warm-sand sticky top-16 z-40">
          <div className="container mx-auto px-4 py-6">
            <SearchBar 
              onSearch={handleSearch}
              defaultValues={filters}
              compact
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading text-h2-mobile md:text-h2-desktop font-semibold text-charcoal">
                {filters.location ? `Properties in ${filters.location}` : 'All Properties'}
              </h1>
              <p className="text-slate-gray">
                {isLoading ? 'Searching...' : `${properties.length} properties found`}
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-warm-sand-light rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white text-charcoal shadow-sm' 
                      : 'text-slate-gray hover:text-charcoal'
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                  <span className="hidden sm:block">List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    viewMode === 'map' 
                      ? 'bg-white text-charcoal shadow-sm' 
                      : 'text-slate-gray hover:text-charcoal'
                  }`}
                >
                  <MapIcon className="h-4 w-4" />
                  <span className="hidden sm:block">Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Summary */}
          {(filters.checkIn && filters.checkOut) && (
            <div className="bg-sea-blue-light/10 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-medium text-charcoal">Your Search:</span>
                <span className="text-slate-gray">
                  {new Date(filters.checkIn).toLocaleDateString()} - {new Date(filters.checkOut).toLocaleDateString()}
                </span>
                <span className="text-slate-gray">{filters.guests} guests</span>
                {filters.petFriendly && (
                  <span className="bg-success-green/20 text-success-green px-2 py-1 rounded-full text-xs">
                    Pet Friendly
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Results Content */}
          {viewMode === 'list' ? (
            // List View
            <div>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-2xl h-64 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property, index) => (
                    <motion.div 
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-warm-sand rounded-full flex items-center justify-center mx-auto mb-4">
                    <AdjustmentsHorizontalIcon className="h-8 w-8 text-slate-gray" />
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">No properties found</h3>
                  <p className="text-slate-gray mb-6">Try adjusting your search criteria or explore different locations.</p>
                  <button 
                    onClick={() => {
                      setFilters({
                        location: '',
                        checkIn: '',
                        checkOut: '',
                        guests: 2,
                        petFriendly: false,
                        priceRange: [50, 300]
                      })
                      refetch()
                    }}
                    className="px-6 py-3 bg-sunset-orange text-white font-medium rounded-xl hover:bg-sunset-orange-dark transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Map View
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-level-2 text-center">
              <div className="w-16 h-16 bg-sea-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapIcon className="h-8 w-8 text-sea-blue" />
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Interactive Map Coming Soon</h3>
              <p className="text-slate-gray">We're working on an interactive map view to help you explore properties by location.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage