import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MagnifyingGlassIcon, MapPinIcon, CalendarDaysIcon, UsersIcon, StarIcon } from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import SearchBar from '@/components/search/SearchBar'
import PropertyCard from '@/components/properties/PropertyCard'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
}

interface HolidayPark {
  id: string
  name: string
  city: string
  region: string
  rating_avg: number
  features: Record<string, any>
}

const HomePage: React.FC = () => {
  const [searchLocation, setSearchLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)

  // Fetch featured properties
  const { data: featuredProperties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          holiday_parks!properties_park_id_fkey (name, city, region),
          property_media (url, is_primary)
        `)
        .eq('status', 'active')
        .eq('verification_status', 'verified')
        .order('rating_avg', { ascending: false, nullsFirst: false })
        .limit(6)
      
      if (error) {
        console.error('Error fetching featured properties:', error)
        return []
      }
      
      return data?.map(property => ({
        ...property,
        park: property.holiday_parks,
        media: property.property_media,
        pricing: { base_price: 85 } // Default pricing, would be calculated from availability
      })) || []
    }
  })

  // Fetch top holiday parks
  const { data: topParks = [], isLoading: parksLoading } = useQuery({
    queryKey: ['top-parks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holiday_parks')
        .select('*')
        .eq('status', 'active')
        .order('rating_avg', { ascending: false, nullsFirst: false })
        .limit(4)
      
      if (error) {
        console.error('Error fetching holiday parks:', error)
        return []
      }
      
      return data || []
    }
  })

  const handleSearch = () => {
    const searchParams = new URLSearchParams()
    if (searchLocation) searchParams.set('location', searchLocation)
    if (checkIn) searchParams.set('checkin', checkIn)
    if (checkOut) searchParams.set('checkout', checkOut)
    if (guests) searchParams.set('guests', guests.toString())
    
    window.location.href = `/search?${searchParams.toString()}`
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/hero-luxury-caravan-site.png)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/30"></div>
        
        {/* Secondary Pattern Overlay for Texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('/images/pattern-holiday.svg')] bg-repeat"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="font-heading text-h1-mobile md:text-h1-desktop font-bold mb-6 drop-shadow-lg"
            >
              Find Your Perfect
              <span className="block text-sunset-orange-light">Holiday Caravan</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-body-mobile md:text-body-desktop mb-8 opacity-90 max-w-2xl mx-auto"
            >
              Discover amazing static caravans and holiday homes across the UK. 
              From seaside escapes to countryside retreats, find your ideal getaway.
            </motion.p>
            
            {/* Search Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/25 backdrop-blur-lg rounded-3xl p-8 shadow-glass border border-white/20 max-w-5xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Location */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-white/90">Where</label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
                    <input
                      type="text"
                      placeholder="Holiday park or location"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-charcoal placeholder-slate-gray focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                
                {/* Check-in */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-white/90">Check-in</label>
                  <div className="relative">
                    <CalendarDaysIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                
                {/* Check-out */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-white/90">Check-out</label>
                  <div className="relative">
                    <CalendarDaysIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                
                {/* Guests */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-white/90">Guests</label>
                  <div className="relative">
                    <UsersIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                    >
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <option key={num} value={num}>{num} Guest{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSearch}
                className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 shadow-level-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                Search Caravans
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl font-bold text-sea-blue mb-2">500+</div>
              <div className="text-slate-gray">Verified Properties</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl font-bold text-sea-blue mb-2">4.8⭐</div>
              <div className="text-slate-gray">Average Rating</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl font-bold text-sea-blue mb-2">50k+</div>
              <div className="text-slate-gray">Happy Guests</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl font-bold text-sea-blue mb-2">£3M</div>
              <div className="text-slate-gray">Secure Protection</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-gradient-to-b from-warm-sand-light to-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-h2-mobile md:text-h2-desktop font-semibold text-charcoal mb-4">
              Featured Holiday Caravans
            </h2>
            <p className="text-body-mobile md:text-body-desktop text-slate-gray max-w-2xl mx-auto">
              Discover our most popular and highly-rated properties across the UK
            </p>
          </motion.div>
          
          {propertiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl h-64 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property, index) => (
                <motion.div 
                  key={property.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          )}
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link 
              to="/search" 
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-sea-blue to-sea-blue-dark text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              View All Properties
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Top Holiday Parks */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-h2-mobile md:text-h2-desktop font-semibold text-charcoal mb-4">
              Top Holiday Parks
            </h2>
            <p className="text-body-mobile md:text-body-desktop text-slate-gray max-w-2xl mx-auto">
              Explore our partner holiday parks with excellent facilities and locations
            </p>
          </motion.div>
          
          {parksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl h-48 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topParks.map((park, index) => (
                <motion.div 
                  key={park.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-level-2 hover:shadow-level-3 transition-all duration-300 cursor-pointer group"
                >
                  <div className="h-48 bg-gradient-to-br from-sea-blue-light to-sunset-orange-light relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <h3 className="font-semibold text-lg">{park.name}</h3>
                          <p className="text-sm opacity-90">{park.city}, {park.region}</p>
                        </div>
                        {park.rating_avg && (
                          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                            <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{park.rating_avg.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(park.features || {}).slice(0, 3).map(([key, value]) => (
                        value && (
                          <span key={key} className="inline-block bg-warm-sand text-charcoal px-2 py-1 rounded-md text-xs capitalize">
                            {key.replace('_', ' ')}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-sunset-orange via-sunset-orange-dark to-sea-blue text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-heading text-h2-mobile md:text-h2-desktop font-semibold mb-6">
              Ready for Your Next Holiday Adventure?
            </h2>
            <p className="text-body-mobile md:text-body-desktop mb-8 opacity-90">
              Join thousands of happy holidaymakers who have found their perfect caravan getaway. 
              Start your search today and create memories that will last a lifetime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/search" 
                className="inline-flex items-center px-8 py-4 bg-white text-sunset-orange font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Start Searching
              </Link>
              <Link 
                to="/auth" 
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-sunset-orange transition-all duration-200"
              >
                List Your Property
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-heading font-semibold mb-4">CaravanStay</h3>
              <p className="text-gray-300 mb-4">Your trusted platform for holiday caravan rentals across the UK.</p>
              <div className="flex space-x-4">
                {/* Social media links would go here */}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Guests</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/search" className="hover:text-white transition-colors">Search Properties</Link></li>
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/reviews" className="hover:text-white transition-colors">Reviews</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Owners</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/auth" className="hover:text-white transition-colors">List Your Property</Link></li>
                <li><Link to="/owner-guide" className="hover:text-white transition-colors">Owner Guide</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/safety" className="hover:text-white transition-colors">Safety</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <hr className="border-gray-600 my-8" />
          <div className="text-center text-gray-300">
            <p>&copy; 2025 CaravanStay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage