import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase, propertyAPI, fileToBase64 } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  X, Save, MapPin, Home, Users, Bed, Bath, DollarSign, 
  Camera, Wifi, Car, Dog, TreePine, Thermometer, Tv,
  ChefHat, Waves, Mountain, Shirt, Lock, Building2,
  Calendar, Clock, Shield, FileText, Phone, Star,
  Upload, Image as ImageIcon, Video, RotateCcw
} from 'lucide-react'
import toast from 'react-hot-toast'

// Enhanced schema with comprehensive fields
const propertySchema = z.object({
  // Basic Information
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  property_type: z.string().min(1, 'Property type is required'),
  year_built: z.number().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  dimensions_length: z.number().optional(),
  dimensions_width: z.number().optional(),
  renovation_history: z.string().optional(),
  
  // Capacity & Layout
  berths: z.number().min(1, 'At least 1 berth required').max(20, 'Maximum 20 berths'),
  bedrooms: z.number().min(1, 'At least 1 bedroom required').max(10, 'Maximum 10 bedrooms'),
  bathrooms: z.number().min(1, 'At least 1 bathroom required').max(5, 'Maximum 5 bathrooms'),
  sofa_beds: z.number().min(0).optional(),
  layout_type: z.enum(['open_plan', 'separate_rooms', 'loft_style', 'split_level']).optional(),
  layout_description: z.string().optional(),
  
  // Location & Context
  address: z.string().optional(),
  park_name: z.string().optional(),
  park_facilities: z.string().optional(),
  local_attractions: z.string().optional(),
  transport_links: z.string().optional(),
  parking_details: z.string().optional(),
  
  // Pricing Structure
  base_price_per_night: z.number().min(1, 'Price must be at least £1'),
  weekend_premium: z.number().min(0).optional(),
  peak_season_rate: z.number().optional(),
  cleaning_fee: z.number().min(0).optional(),
  pet_fee: z.number().min(0).optional(),
  extra_guest_fee: z.number().min(0).optional(),
  security_deposit: z.number().min(0).optional(),
  
  // Booking Rules & Policies
  min_stay_nights: z.number().min(1, 'Minimum stay must be at least 1 night'),
  min_stay_peak: z.number().optional(),
  advance_booking_days: z.number().min(0),
  max_advance_days: z.number().optional(),
  check_in_time: z.string(),
  check_out_time: z.string(),
  cancellation_policy: z.enum(['flexible', 'moderate', 'strict']).optional(),
  house_rules: z.string().optional(),
  
  // Accessibility & Pets
  wheelchair_accessible: z.boolean().optional(),
  mobility_features: z.string().optional(),
  pets_allowed: z.boolean().optional(),
  pet_restrictions: z.string().optional(),
  
  // Professional Details
  emergency_contact: z.string().optional(),
  wifi_password: z.string().optional(),
  special_instructions: z.string().optional(),
  virtual_tour_url: z.string().url().optional().or(z.literal(''))
})

type PropertyFormData = z.infer<typeof propertySchema>

interface MediaFile {
  id: string
  file?: File
  url: string
  type: 'image' | 'video' | '360'
  caption: string
  isPrimary: boolean
}

interface PropertyFormProps {
  property?: any
  onClose: () => void
  onSuccess: () => void
}

const propertyTypes = [
  'Static Caravan',
  'Luxury Lodge',
  'Premium Lodge',
  'Standard Lodge', 
  'Holiday Chalet',
  'Mobile Home',
  'Holiday Home',
  'Glamping Pod',
  'Log Cabin',
  'Park Home',
  'Caravan (Touring)'
]

const layoutTypes = [
  { value: 'open_plan', label: 'Open Plan Living' },
  { value: 'separate_rooms', label: 'Separate Rooms' },
  { value: 'loft_style', label: 'Loft/Mezzanine' },
  { value: 'split_level', label: 'Split Level' }
]

const cancellationPolicies = [
  { value: 'flexible', label: 'Flexible - Free cancellation until 24 hours before check-in' },
  { value: 'moderate', label: 'Moderate - Free cancellation until 5 days before check-in' },
  { value: 'strict', label: 'Strict - 50% refund until 14 days before check-in' }
]

// Enhanced amenity categories
const amenityCategories = {
  kitchen: {
    name: 'Kitchen & Dining',
    icon: ChefHat,
    options: [
      'Full Kitchen', 'Kitchenette', 'Microwave', 'Dishwasher', 
      'Coffee Machine', 'Dining Table (6+)', 'Breakfast Bar', 'Food Prep Area'
    ]
  },
  entertainment: {
    name: 'Entertainment & Media',
    icon: Tv,
    options: [
      'Smart TV', 'Cable/Satellite TV', 'Streaming Services', 'WiFi (High Speed)',
      'Gaming Console', 'Books Library', 'Board Games', 'DVD Collection'
    ]
  },
  outdoor: {
    name: 'Outdoor & Views',
    icon: TreePine,
    options: [
      'Private Garden', 'Shared Garden', 'Patio/Decking', 'Outdoor Furniture',
      'BBQ/Grill', 'Sea View', 'Lake View', 'Mountain View', 
      'Countryside View', 'Private Hot Tub', 'Shared Pool Access'
    ]
  },
  climate: {
    name: 'Climate & Comfort',
    icon: Thermometer,
    options: [
      'Central Heating', 'Air Conditioning', 'Ceiling Fans', 
      'Electric Blankets', 'Fireplace', 'Underfloor Heating'
    ]
  },
  practical: {
    name: 'Practical Amenities',
    icon: Shirt,
    options: [
      'Washing Machine', 'Tumble Dryer', 'Iron & Board', 'Hair Dryer',
      'Safe/Security Box', 'First Aid Kit', 'Cleaning Supplies'
    ]
  },
  accessibility: {
    name: 'Accessibility',
    icon: Users,
    options: [
      'Wheelchair Accessible', 'Grab Rails', 'Wide Doorways', 
      'Accessible Bathroom', 'Level Access', 'Hearing Loop'
    ]
  },
  transport: {
    name: 'Transport & Parking',
    icon: Car,
    options: [
      'Private Parking (1 Car)', 'Private Parking (2+ Cars)', 
      'Electric Vehicle Charging', 'Bicycle Storage', 'Public Transport Links'
    ]
  },
  pets: {
    name: 'Pet-Friendly',
    icon: Dog,
    options: [
      'Dogs Welcome', 'Cats Welcome', 'Small Pets Only', 'Pet Bed Provided',
      'Food/Water Bowls', 'Garden/Enclosed Area', 'Dog Walking Area Nearby'
    ]
  }
}

export function EnhancedPropertyForm({ property, onClose, onSuccess }: PropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, string[]>>({})
  const [media, setMedia] = useState<MediaFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const { user } = useAuth()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title || '',
      description: property?.description || '',
      property_type: property?.property_type || 'Static Caravan',
      berths: property?.berths || 4,
      bedrooms: property?.bedrooms || 2,
      bathrooms: property?.bathrooms || 1,
      base_price_per_night: property?.base_price_per_night || 75,
      min_stay_nights: property?.min_stay_nights || 3,
      advance_booking_days: property?.advance_booking_days || 1,
      check_in_time: property?.check_in_time || '15:00',
      check_out_time: property?.check_out_time || '11:00',
      cancellation_policy: property?.cancellation_policy || 'moderate'
    }
  })

  const handleAmenityToggle = (category: string, amenity: string) => {
    setSelectedAmenities(prev => ({
      ...prev,
      [category]: prev[category]?.includes(amenity)
        ? prev[category].filter(a => a !== amenity)
        : [...(prev[category] || []), amenity]
    }))
  }

  // Media upload handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )
    
    if (validFiles.length !== files.length) {
      toast.error('Only image and video files are allowed')
    }
    
    const newMedia: MediaFile[] = validFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(),
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      caption: '',
      isPrimary: media.length === 0
    }))
    
    setMedia(prev => [...prev, ...newMedia])
  }

  const removeMedia = (id: string) => {
    const updated = media.filter(m => m.id !== id)
    if (updated.length > 0 && !updated.some(m => m.isPrimary)) {
      updated[0].isPrimary = true
    }
    setMedia(updated)
  }

  const setPrimaryMedia = (id: string) => {
    setMedia(prev => prev.map(m => ({ ...m, isPrimary: m.id === id })))
  }

  const updateMediaCaption = (id: string, caption: string) => {
    setMedia(prev => prev.map(m => m.id === id ? { ...m, caption } : m))
  }

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) {
      toast.error('Please log in to continue')
      return
    }

    if (media.length === 0) {
      toast.error('Please upload at least one image')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Convert media files to base64 for transmission
      const mediaFiles = await Promise.all(
        media.map(async (item) => {
          if (item.file) {
            const base64Data = await fileToBase64(item.file);
            return {
              fileData: base64Data,
              fileName: item.file.name,
              fileType: item.file.type,
              caption: item.caption,
              isPrimary: item.isPrimary,
              mediaType: item.type
            };
          }
          return null;
        })
      );

      const validMediaFiles = mediaFiles.filter(Boolean);

      // Transform form data to match the 7-tab backend structure
      const transformedData = {
        basicInfo: {
          title: data.title,
          propertyType: data.property_type,
          description: data.description,
          yearBuilt: data.year_built,
          manufacturer: data.manufacturer,
          model: data.model,
          dimensions: data.dimensions_length && data.dimensions_width ? 
            `${data.dimensions_length}ft x ${data.dimensions_width}ft` : undefined,
          renovationHistory: data.renovation_history
        },
        capacity: {
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          maxOccupancy: data.berths,
          sofaBeds: data.sofa_beds || 0,
          layoutDescription: data.layout_description,
          uniqueFeatures: [] // Can be extracted from selectedAmenities if needed
        },
        amenities: {
          kitchen: selectedAmenities.kitchen || [],
          entertainment: selectedAmenities.entertainment || [],
          outdoor: selectedAmenities.outdoor || [],
          accessibility: selectedAmenities.accessibility || [],
          petPolicy: {
            allowed: data.pets_allowed || false,
            restrictions: data.pet_restrictions || '',
            additionalFee: data.pet_fee || 0
          },
          climateControl: selectedAmenities.climate || []
        },
        location: {
          holidayParkName: data.park_name,
          parkFacilities: data.park_facilities ? data.park_facilities.split(',').map(s => s.trim()) : [],
          localAttractions: data.local_attractions ? data.local_attractions.split(',').map(s => s.trim()) : [],
          transportation: {
            parking: data.parking_details,
            publicTransport: data.transport_links
          },
          directionsAccess: data.address
        },
        pricing: {
          basePrice: data.base_price_per_night,
          seasonalRates: {
            weekend: data.weekend_premium,
            peak: data.peak_season_rate
          },
          feesStructure: {
            cleaningFee: data.cleaning_fee || 0,
            petFee: data.pet_fee || 0,
            securityDeposit: data.security_deposit || 0,
            extraGuestFee: data.extra_guest_fee || 0
          },
          minimumStays: {
            standard: data.min_stay_nights,
            peak: data.min_stay_peak
          },
          cancellationPolicy: data.cancellation_policy,
          houseRules: {
            checkIn: data.check_in_time,
            checkOut: data.check_out_time,
            smoking: false,
            parties: false,
            quietHours: '22:00 - 08:00'
          }
        },
        professional: {
          emergencyContacts: {
            owner: data.emergency_contact
          },
          ownerInstructions: data.special_instructions,
          wifiPassword: data.wifi_password,
          applianceGuides: []
        }
      };

      // Use the new propertyAPI
      const result = await propertyAPI.createProperty(transformedData, validMediaFiles);
      
      toast.success(property ? 'Property updated successfully!' : 'Property created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Property save error:', error)
      toast.error(error.message || 'Failed to save property')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Home },
    { id: 'media', label: 'Media & Photos', icon: Camera },
    { id: 'details', label: 'Property Details', icon: Building2 },
    { id: 'amenities', label: 'Amenities', icon: Star },
    { id: 'location', label: 'Location & Context', icon: MapPin },
    { id: 'pricing', label: 'Pricing & Policies', icon: DollarSign },
    { id: 'professional', label: 'Professional Info', icon: Shield }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-900">
            {property ? 'Edit Property Listing' : 'Create New Property Listing'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-gray-200/50">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 whitespace-nowrap font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-orange-500 text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-160px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Basic Property Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Title * <span className="text-orange-500">(Make it compelling!)</span>
                      </label>
                      <input
                        type="text"
                        {...register('title')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., 'Luxury Lakeside Lodge with Private Hot Tub & Stunning Views'"
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
                        placeholder="75.00"
                      />
                      {errors.base_price_per_night && (
                        <p className="text-red-600 text-sm mt-1">{errors.base_price_per_night.message}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Description * <span className="text-orange-500">(At least 50 characters)</span>
                      </label>
                      <textarea
                        rows={6}
                        {...register('description')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Describe your property in detail. What makes it special? What can guests expect? Include unique features, nearby attractions, and what makes this the perfect holiday destination..."
                      />
                      {errors.description && (
                        <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Media Upload Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* Media Upload Area */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Camera className="h-5 w-5 mr-2" />
                    Property Media & Virtual Tour
                  </h3>
                  
                  {/* Upload Zone */}
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                      dragActive 
                        ? 'border-orange-400 bg-orange-50 scale-105' 
                        : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer block">
                      <Upload className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                      <h4 className="text-xl font-medium text-gray-900 mb-2">
                        Upload Property Photos & Videos
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Drag and drop files here, or click to browse. High-quality images get more bookings!
                      </p>
                      <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <ImageIcon className="h-5 w-5 mr-2" />
                          Photos (JPG, PNG, WebP)
                        </div>
                        <div className="flex items-center">
                          <Video className="h-5 w-5 mr-2" />
                          Videos (MP4, MOV)
                        </div>
                        <div className="flex items-center">
                          <RotateCcw className="h-5 w-5 mr-2" />
                          360° Photos
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {/* Media Preview Grid */}
                  {media.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Uploaded Media ({media.length})</h4>
                        <p className="text-sm text-gray-500">Click the star to set as primary image</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {media.map((item) => (
                          <div
                            key={item.id}
                            className="relative group border-2 border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all duration-200"
                          >
                            {/* Media Preview */}
                            <div className="aspect-square bg-gray-100 flex items-center justify-center">
                              {item.type === 'video' ? (
                                <video
                                  src={item.url}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                              ) : (
                                <img
                                  src={item.url}
                                  alt={item.caption || 'Property media'}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            
                            {/* Controls Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => setPrimaryMedia(item.id)}
                                className={`p-2 rounded-full transition-all duration-200 ${
                                  item.isPrimary
                                    ? 'bg-yellow-500 text-white scale-110'
                                    : 'bg-white/20 text-white hover:bg-yellow-500 hover:scale-110'
                                }`}
                                title="Set as primary image"
                              >
                                ⭐
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMedia(item.id)}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all duration-200"
                                title="Remove"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {/* Primary Badge */}
                            {item.isPrimary && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                PRIMARY
                              </div>
                            )}
                            
                            {/* Type Badge */}
                            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full">
                              {item.type === '360' ? '360°' : item.type === 'video' ? 'Video' : 'Photo'}
                            </div>
                            
                            {/* Caption Input */}
                            <div className="p-3">
                              <input
                                type="text"
                                placeholder="Add caption (optional)..."
                                value={item.caption}
                                onChange={(e) => updateMediaCaption(item.id, e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Virtual Tour URL */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Virtual Tour URL (Optional) <span className="text-blue-500">Boost bookings with 360° tours!</span>
                    </label>
                    <div className="flex">
                      <input
                        type="url"
                        {...register('virtual_tour_url')}
                        placeholder="https://my.matterport.com/show/?m=abc123 or similar"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <div className="px-4 py-3 bg-blue-500 text-white rounded-r-xl flex items-center">
                        <RotateCcw className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Link to Matterport, Kuula, or other virtual tour services. Properties with virtual tours get 40% more bookings!
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Continue with other tabs in similar enhanced format... */}
            {/* Amenities Tab */}
            {activeTab === 'amenities' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Property Amenities & Features
                  </h3>
                  
                  <div className="space-y-8">
                    {Object.entries(amenityCategories).map(([categoryKey, category]) => {
                      const Icon = category.icon
                      return (
                        <div key={categoryKey} className="bg-white rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Icon className="h-5 w-5 mr-2 text-gray-600" />
                            {category.name}
                          </h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {category.options.map((amenity) => (
                              <label
                                key={amenity}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                  selectedAmenities[categoryKey]?.includes(amenity)
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedAmenities[categoryKey]?.includes(amenity) || false}
                                  onChange={() => handleAmenityToggle(categoryKey, amenity)}
                                  className="sr-only"
                                />
                                <span className="text-sm font-medium">{amenity}</span>
                                {selectedAmenities[categoryKey]?.includes(amenity) && (
                                  <div className="ml-auto w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  </div>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Pet Policy */}
                  <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Dog className="h-5 w-5 mr-2 text-gray-600" />
                      Pet Policy
                    </h4>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('pets_allowed')}
                          className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">Pets Welcome</span>
                      </label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pet Fee (£ per stay)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('pet_fee', { valueAsNumber: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="25.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pet Restrictions
                          </label>
                          <input
                            type="text"
                            {...register('pet_restrictions')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Max 2 dogs, no cats"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Location & Context Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location & Context
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Holiday Park Information */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Holiday Park Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Holiday Park Name
                          </label>
                          <input
                            type="text"
                            {...register('park_name')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Lakeside Holiday Park"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Property Address/Directions
                          </label>
                          <input
                            type="text"
                            {...register('address')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Full address or clear directions"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Park Facilities
                        </label>
                        <textarea
                          rows={3}
                          {...register('park_facilities')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Describe park amenities: swimming pool, restaurant, entertainment, playground, etc."
                        />
                      </div>
                    </div>
                    
                    {/* Local Area */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Local Area & Attractions</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nearby Attractions
                          </label>
                          <textarea
                            rows={3}
                            {...register('local_attractions')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="What can guests enjoy nearby? Beaches, theme parks, historic sites, shopping, restaurants..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Transport Links
                            </label>
                            <textarea
                              rows={2}
                              {...register('transport_links')}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Bus routes, train stations, airports nearby"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Parking Information
                            </label>
                            <textarea
                              rows={2}
                              {...register('parking_details')}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Number of spaces, type of parking, EV charging, etc."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Pricing & Policies Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Pricing Structure & Policies
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Pricing Structure */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Pricing Structure</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Weekend Premium (£)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('weekend_premium', { valueAsNumber: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="15.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Peak Season Rate (£)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('peak_season_rate', { valueAsNumber: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="95.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cleaning Fee (£)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('cleaning_fee', { valueAsNumber: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="35.00"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="100.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Extra Guest Fee (£)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('extra_guest_fee', { valueAsNumber: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="10.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Booking Rules */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Booking Rules</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Minimum Stay (nights) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              {...register('min_stay_nights', { valueAsNumber: true })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            {errors.min_stay_nights && (
                              <p className="text-red-600 text-sm mt-1">{errors.min_stay_nights.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Peak Season Min Stay
                            </label>
                            <input
                              type="number"
                              min="1"
                              {...register('min_stay_peak', { valueAsNumber: true })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="7"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Advance Booking (days) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              {...register('advance_booking_days', { valueAsNumber: true })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Check-in Time *
                            </label>
                            <input
                              type="time"
                              {...register('check_in_time')}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Check-out Time *
                            </label>
                            <input
                              type="time"
                              {...register('check_out_time')}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cancellation Policy
                            </label>
                            <select
                              {...register('cancellation_policy')}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              {cancellationPolicies.map(policy => (
                                <option key={policy.value} value={policy.value}>{policy.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* House Rules */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">House Rules</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional House Rules
                        </label>
                        <textarea
                          rows={4}
                          {...register('house_rules')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Any specific rules for your property: no smoking, no parties, quiet hours, etc."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Professional Info Tab */}
            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Professional Information & Guest Support
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Phone className="h-5 w-5 mr-2 text-gray-600" />
                        Emergency & Contact Information
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emergency Contact Number
                          </label>
                          <input
                            type="tel"
                            {...register('emergency_contact')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="24/7 emergency contact number"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Property Access */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-gray-600" />
                        Property Access & WiFi
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            WiFi Password
                          </label>
                          <input
                            type="text"
                            {...register('wifi_password')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Guest WiFi password"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Special Instructions */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-600" />
                        Special Instructions & Guest Information
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Owner Instructions & Welcome Information
                          </label>
                          <textarea
                            rows={6}
                            {...register('special_instructions')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Key collection instructions, welcome information, appliance guides, local recommendations, important notes for guests..."
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Accessibility */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Accessibility Features</h4>
                      
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('wheelchair_accessible')}
                            className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="ml-3 text-sm font-medium text-gray-700">Wheelchair Accessible</span>
                        </label>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mobility Features & Accessibility Notes
                          </label>
                          <textarea
                            rows={3}
                            {...register('mobility_features')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Ramps, grab rails, wide doorways, step-free access, etc."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            
            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200/50 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || media.length === 0}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Saving...' : property ? 'Update Listing' : 'Create Listing'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}

export default EnhancedPropertyForm