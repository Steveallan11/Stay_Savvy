import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Save, MapPin, Home, Users, Bed, Bath, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const propertySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  property_type: z.string().min(1, 'Property type is required'),
  berths: z.number().min(1, 'At least 1 berth required').max(20, 'Maximum 20 berths'),
  bedrooms: z.number().min(1, 'At least 1 bedroom required').max(10, 'Maximum 10 bedrooms'),
  bathrooms: z.number().min(1, 'At least 1 bathroom required').max(5, 'Maximum 5 bathrooms'),
  address: z.string().optional(),
  park_name: z.string().optional(),
  base_price_per_night: z.number().min(1, 'Price must be at least £1'),
  cleaning_fee: z.number().min(0, 'Cleaning fee cannot be negative').optional(),
  security_deposit: z.number().min(0, 'Security deposit cannot be negative').optional(),
  min_stay_nights: z.number().min(1, 'Minimum stay must be at least 1 night'),
  advance_booking_days: z.number().min(0, 'Advance booking days cannot be negative'),
  check_in_time: z.string(),
  check_out_time: z.string(),
})

type PropertyFormData = z.infer<typeof propertySchema>

interface PropertyFormProps {
  property?: any
  onClose: () => void
  onSuccess: () => void
}

const propertyTypes = [
  'Static Caravan',
  'Lodge',
  'Chalet',
  'Mobile Home',
  'Holiday Home',
  'Glamping Pod',
  'Cabin'
]

const amenityOptions = [
  { type: 'connectivity', name: 'WiFi', icon: 'wifi' },
  { type: 'pets', name: 'Pet Friendly', icon: 'dog' },
  { type: 'parking', name: 'Parking Available', icon: 'car' },
  { type: 'accessibility', name: 'Wheelchair Accessible', icon: 'accessibility' },
  { type: 'heating', name: 'Central Heating', icon: 'thermometer' },
  { type: 'entertainment', name: 'TV/Entertainment', icon: 'tv' },
  { type: 'kitchen', name: 'Full Kitchen', icon: 'chef-hat' },
  { type: 'outdoor', name: 'Garden/Patio', icon: 'tree-pine' },
  { type: 'leisure', name: 'Hot Tub', icon: 'waves' },
  { type: 'view', name: 'Sea View', icon: 'mountain' },
  { type: 'laundry', name: 'Washing Machine', icon: 'shirt' },
  { type: 'security', name: 'Secure Entry', icon: 'lock' }
]

export function PropertyForm({ property, onClose, onSuccess }: PropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const { user } = useAuth()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title || '',
      description: property?.description || '',
      property_type: property?.property_type || 'Static Caravan',
      berths: property?.berths || 2,
      bedrooms: property?.bedrooms || 1,
      bathrooms: property?.bathrooms || 1,
      address: property?.address || '',
      park_name: property?.park_name || '',
      base_price_per_night: property?.base_price_per_night || 50,
      cleaning_fee: property?.cleaning_fee || 0,
      security_deposit: property?.security_deposit || 0,
      min_stay_nights: property?.min_stay_nights || 2,
      advance_booking_days: property?.advance_booking_days || 1,
      check_in_time: property?.check_in_time || '15:00',
      check_out_time: property?.check_out_time || '11:00',
    }
  })

  const handleAmenityToggle = (amenityName: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityName) 
        ? prev.filter(a => a !== amenityName)
        : [...prev, amenityName]
    )
  }

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) {
      toast.error('Please log in to continue')
      return
    }

    setIsSubmitting(true)
    
    try {
      const propertyData = {
        ...data,
        owner_id: user.id,
        status: property ? property.status : 'draft',
        verification_status: property ? property.verification_status : 'pending'
      }

      if (property) {
        // Update existing property
        const { data: result, error } = await supabase.functions.invoke('property-management', {
          body: {
            action: 'update_property',
            propertyData: { ...propertyData, id: property.id }
          }
        })
        if (error) throw error
      } else {
        // Create new property
        const { data: result, error } = await supabase.functions.invoke('property-management', {
          body: {
            action: 'create_property',
            propertyData
          }
        })
        if (error) throw error
        
        // Add amenities if any selected
        if (selectedAmenities.length > 0 && result?.data?.property?.id) {
          const amenities = selectedAmenities.map(name => {
            const amenity = amenityOptions.find(a => a.name === name)
            return {
              type: amenity?.type || 'general',
              name,
              hasAmenity: true
            }
          })
          
          await supabase.functions.invoke('property-management', {
            body: {
              action: 'update_amenities',
              propertyData: { id: result.data.property.id },
              amenities
            }
          })
        }
      }
      
      onSuccess()
    } catch (error: any) {
      console.error('Property save error:', error)
      toast.error(error.message || 'Failed to save property')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-900">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Luxury Seaside Caravan with Sea Views"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    {...register('property_type')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price per Night (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('base_price_per_night', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="50.00"
                  />
                  {errors.base_price_per_night && (
                    <p className="text-red-600 text-sm mt-1">{errors.base_price_per_night.message}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Describe your property, its features, and what makes it special..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Capacity & Features */}
            <div className="bg-gray-50/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Capacity & Features
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Berths (Sleeps) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    {...register('berths', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {errors.berths && (
                    <p className="text-red-600 text-sm mt-1">{errors.berths.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    {...register('bedrooms', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {errors.bedrooms && (
                    <p className="text-red-600 text-sm mt-1">{errors.bedrooms.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    {...register('bathrooms', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {errors.bathrooms && (
                    <p className="text-red-600 text-sm mt-1">{errors.bathrooms.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="bg-gray-50/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holiday Park Name
                  </label>
                  <input
                    type="text"
                    {...register('park_name')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Sunshine Holiday Park"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    {...register('address')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Property address or park location"
                  />
                </div>
              </div>
            </div>
            
            {/* Pricing */}
            <div className="bg-gray-50/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Pricing & Fees
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cleaning Fee (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('cleaning_fee', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('security_deposit', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stay (nights) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('min_stay_nights', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Booking Rules */}
            <div className="bg-gray-50/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Rules</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Booking (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('advance_booking_days', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="How many days in advance guests can book"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    {...register('check_in_time')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    {...register('check_out_time')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Amenities */}
            <div className="bg-gray-50/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities & Features</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenityOptions.map((amenity) => (
                  <label key={amenity.name} className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-white/60 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity.name)}
                      onChange={() => handleAmenityToggle(amenity.name)}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{amenity.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200/50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {property ? 'Update Property' : 'Create Property'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}