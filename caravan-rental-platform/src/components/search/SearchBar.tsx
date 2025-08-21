import React, { useState } from 'react'
import { MagnifyingGlassIcon, MapPinIcon, CalendarDaysIcon, UsersIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface SearchBarProps {
  onSearch?: (params: SearchParams) => void
  defaultValues?: Partial<SearchParams>
  compact?: boolean
}

interface SearchParams {
  location: string
  checkIn: string
  checkOut: string
  guests: number
  petFriendly?: boolean
  priceRange?: [number, number]
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, defaultValues, compact = false }) => {
  const [location, setLocation] = useState(defaultValues?.location || '')
  const [checkIn, setCheckIn] = useState(defaultValues?.checkIn || '')
  const [checkOut, setCheckOut] = useState(defaultValues?.checkOut || '')
  const [guests, setGuests] = useState(defaultValues?.guests || 2)
  const [showFilters, setShowFilters] = useState(false)
  const [petFriendly, setPetFriendly] = useState(defaultValues?.petFriendly || false)
  const [priceRange, setPriceRange] = useState<[number, number]>(defaultValues?.priceRange || [50, 300])

  const handleSearch = () => {
    const searchParams: SearchParams = {
      location,
      checkIn,
      checkOut,
      guests,
      petFriendly,
      priceRange
    }
    
    onSearch?.(searchParams)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  if (compact) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-level-2 border border-white/20">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
            <input
              type="text"
              placeholder="Where to?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 bg-warm-sand-light border-0 rounded-xl text-charcoal placeholder-slate-gray focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            <span className="hidden sm:block">Search</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-glass border border-white/20"
    >
      {/* Main Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Location */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 text-charcoal">Where</label>
          <div className="relative">
            <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
            <input
              type="text"
              placeholder="Holiday park or location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-3 bg-warm-sand-light border-0 rounded-xl text-charcoal placeholder-slate-gray focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Check-in */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 text-charcoal">Check-in</label>
          <div className="relative">
            <CalendarDaysIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full pl-12 pr-4 py-3 bg-warm-sand-light border-0 rounded-xl text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Check-out */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 text-charcoal">Check-out</label>
          <div className="relative">
            <CalendarDaysIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full pl-12 pr-4 py-3 bg-warm-sand-light border-0 rounded-xl text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Guests */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 text-charcoal">Guests</label>
          <div className="relative">
            <UsersIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sea-blue" />
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full pl-12 pr-4 py-3 bg-warm-sand-light border-0 rounded-xl text-charcoal focus:ring-2 focus:ring-sunset-orange focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
            >
              {[1,2,3,4,5,6,7,8].map(num => (
                <option key={num} value={num}>{num} Guest{num !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sea-blue hover:text-sea-blue-dark transition-colors font-medium"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          {showFilters ? 'Hide Filters' : 'More Filters'}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-4 border-t border-warm-sand"
        >
          {/* Pet Friendly */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="petFriendly"
              checked={petFriendly}
              onChange={(e) => setPetFriendly(e.target.checked)}
              className="h-5 w-5 text-sunset-orange focus:ring-sunset-orange border-gray-300 rounded"
            />
            <label htmlFor="petFriendly" className="text-charcoal font-medium">
              Pet Friendly
            </label>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-2 text-charcoal">
              Price Range: £{priceRange[0]} - £{priceRange[1]} per night
            </label>
            <div className="flex gap-2">
              <input
                type="range"
                min="30"
                max="500"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="30"
                max="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSearch}
          className="px-12 py-4 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 shadow-level-2"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
          Search Caravans
        </button>
      </div>
    </motion.div>
  )
}

export default SearchBar