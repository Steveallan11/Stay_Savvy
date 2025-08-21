import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon as HeartOutline, MapPinIcon, StarIcon, WifiIcon, HomeIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
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

interface PropertyCardProps {
  property: Property
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  // Get primary image or fallback
  const primaryImage = property.media?.find(m => m.is_primary) || property.media?.[0]
  const imageUrl = primaryImage?.url || '/images/placeholder-caravan.jpg'

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.error('Please sign in to save properties')
      return
    }

    setIsLoading(true)
    try {
      if (isLiked) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', property.id)
        
        if (error) throw error
        setIsLiked(false)
        toast.success('Removed from favorites')
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            property_id: property.id
          })
        
        if (error) throw error
        setIsLiked(true)
        toast.success('Added to favorites')
      }
    } catch (error) {
      console.error('Error updating favorites:', error)
      toast.error('Failed to update favorites')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFeatures = () => {
    const features = []
    if (property.features?.hot_tub) features.push('Hot Tub')
    if (property.features?.sea_view) features.push('Sea View')
    if (property.features?.decking) features.push('Decking')
    if (property.features?.wifi) features.push('WiFi')
    if (property.pet_friendly) features.push('Pet Friendly')
    return features.slice(0, 3)
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer"
    >
      <Link to={`/property/${property.id}`}>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-level-2 group-hover:shadow-level-3 transition-all duration-300">
          {/* Image Container */}
          <div className="relative h-64 overflow-hidden">
            <img 
              src={imageUrl}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/images/placeholder-caravan.jpg'
              }}
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Like Button */}
            <button 
              onClick={handleLike}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors duration-200 z-10"
            >
              {isLiked ? (
                <HeartSolid className="h-5 w-5 text-red-500" />
              ) : (
                <HeartOutline className="h-5 w-5 text-charcoal hover:text-red-500 transition-colors" />
              )}
            </button>

            {/* Price Tag */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-charcoal">
                £{property.pricing.base_price}
                <span className="text-sm font-normal text-slate-gray"> /night</span>
              </div>
            </div>

            {/* Rating Badge */}
            {property.rating_avg && (
              <div className="absolute top-4 left-4 flex items-center bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium text-charcoal">
                  {property.rating_avg.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Title */}
            <h3 className="font-heading text-lg font-semibold text-charcoal mb-2 group-hover:text-sea-blue transition-colors duration-200">
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center text-slate-gray mb-3">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {property.park.name}, {property.park.city}
              </span>
            </div>

            {/* Property Details */}
            <div className="flex items-center gap-4 text-sm text-slate-gray mb-4">
              <div className="flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                <span>{property.berths} guests</span>
              </div>
              <div className="flex items-center">
                <HomeIcon className="h-4 w-4 mr-1" />
                <span>{property.bedrooms} bed</span>
              </div>
              <div className="flex items-center">
                <span>{property.bathrooms} bath</span>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-4">
              {formatFeatures().map((feature, index) => (
                <span 
                  key={index}
                  className="inline-block bg-warm-sand text-charcoal px-2 py-1 rounded-md text-xs font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Description Preview */}
            <p className="text-sm text-slate-gray leading-relaxed">
              {property.description.length > 100 
                ? `${property.description.substring(0, 100)}...` 
                : property.description
              }
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default PropertyCard