import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Plus, 
  Edit3, 
  Eye, 
  MapPin, 
  Users, 
  Bed, 
  Bath, 
  Wifi,
  Car,
  Dog,
  CheckCircle,
  Clock,
  AlertCircle,
  Camera,
  Star
} from 'lucide-react'
import toast from 'react-hot-toast'
import { EnhancedPropertyForm } from '@/components/properties/EnhancedPropertyForm'
import { ImageUploadModal } from '@/components/properties/ImageUploadModal'

interface Property {
  id: string
  title: string
  description: string
  property_type: string
  berths: number
  bedrooms: number
  bathrooms: number
  status: string
  verification_status: string
  featured_image_url?: string
  address?: string
  park_name?: string
  created_at: string
  rating_avg?: number
}

export function PropertiesPage() {
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [imageUploadPropertyId, setImageUploadPropertyId] = useState<string | null>(null)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch user's properties
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['user-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const handleAddProperty = () => {
    setSelectedProperty(null)
    setShowPropertyForm(true)
  }

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property)
    setShowPropertyForm(true)
  }

  const handleUploadImages = (propertyId: string) => {
    setImageUploadPropertyId(propertyId)
    setShowImageUpload(true)
  }

  const getStatusBadge = (status: string, verificatonStatus?: string) => {
    if (verificatonStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </span>
      )
    }
    
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Draft
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-charcoal">Properties</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
              <div className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Properties</h1>
          <p className="text-slate-gray mt-1">Manage your caravan and holiday home listings</p>
        </div>
        <button
          onClick={handleAddProperty}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Property
        </button>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark rounded-full p-4 w-20 h-20 mx-auto mb-6">
              <Plus className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">No Properties Yet</h2>
            <p className="text-slate-gray mb-8">Get started by adding your first property to begin receiving bookings.</p>
            <button
              onClick={handleAddProperty}
              className="px-8 py-4 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Add Your First Property
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              {/* Property Image */}
              <div className="relative h-48 bg-gray-100">
                {property.featured_image_url ? (
                  <img 
                    src={property.featured_image_url} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  {getStatusBadge(property.status, property.verification_status)}
                </div>
                
                {/* Rating */}
                {property.rating_avg && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-charcoal ml-1">
                        {property.rating_avg.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Property Details */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-2 line-clamp-1">
                  {property.title}
                </h3>
                
                {property.address && (
                  <div className="flex items-center text-slate-gray mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm truncate">{property.address}</span>
                  </div>
                )}
                
                {/* Property Features */}
                <div className="flex items-center space-x-4 mb-4 text-sm text-slate-gray">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{property.berths}</span>
                  </div>
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    <span>{property.bathrooms}</span>
                  </div>
                </div>
                
                {/* Property Type */}
                <div className="mb-4">
                  <span className="inline-block bg-sea-blue-light text-sea-blue text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {property.property_type}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditProperty(property)}
                    className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-slate-gray bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleUploadImages(property.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-lg text-sm font-medium hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Images
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Form Modal */}
      {showPropertyForm && (
        <EnhancedPropertyForm
          property={selectedProperty}
          onClose={() => setShowPropertyForm(false)}
          onSuccess={() => {
            setShowPropertyForm(false)
            queryClient.invalidateQueries({ queryKey: ['user-properties'] })
            toast.success(selectedProperty ? 'Property updated successfully!' : 'Property added successfully!')
          }}
        />
      )}

      {/* Image Upload Modal */}
      {showImageUpload && imageUploadPropertyId && (
        <ImageUploadModal
          propertyId={imageUploadPropertyId}
          onClose={() => {
            setShowImageUpload(false)
            setImageUploadPropertyId(null)
          }}
          onSuccess={() => {
            setShowImageUpload(false)
            setImageUploadPropertyId(null)
            queryClient.invalidateQueries({ queryKey: ['user-properties'] })
            toast.success('Images uploaded successfully!')
          }}
        />
      )}
    </div>
  )
}