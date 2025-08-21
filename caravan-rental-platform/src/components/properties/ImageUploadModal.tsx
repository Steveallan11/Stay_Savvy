import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase'
import { X, Upload, Image, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploadModalProps {
  propertyId: string
  onClose: () => void
  onSuccess: () => void
}

interface ImageFile {
  file: File
  preview: string
  altText: string
  uploading: boolean
  uploaded: boolean
  error?: string
}

export function ImageUploadModal({ propertyId, onClose, onSuccess }: ImageUploadModalProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      altText: file.name.split('.')[0],
      uploading: false,
      uploaded: false
    }))
    
    setImages(prev => [...prev, ...newImages])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      // Clean up preview URL
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const updateImageAltText = (index: number, altText: string) => {
    setImages(prev => {
      const newImages = [...prev]
      newImages[index].altText = altText
      return newImages
    })
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const uploadImages = async () => {
    if (images.length === 0) {
      toast.error('Please select at least one image')
      return
    }

    setIsUploading(true)
    
    try {
      // Mark all images as uploading
      setImages(prev => prev.map(img => ({ ...img, uploading: true })))
      
      // Convert all images to base64
      const imageDataArray = await Promise.all(
        images.map(async (imageFile) => {
          try {
            const base64Data = await convertFileToBase64(imageFile.file)
            return {
              imageData: base64Data,
              fileName: imageFile.file.name,
              altText: imageFile.altText
            }
          } catch (error) {
            console.error('Error converting file to base64:', error)
            return null
          }
        })
      )
      
      // Filter out any failed conversions
      const validImages = imageDataArray.filter(img => img !== null)
      
      if (validImages.length === 0) {
        throw new Error('Failed to process images')
      }
      
      // Upload to edge function
      const { data, error } = await supabase.functions.invoke('property-image-upload', {
        body: {
          propertyId,
          images: validImages
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        throw error
      }

      // Mark successful uploads
      setImages(prev => prev.map(img => ({ 
        ...img, 
        uploading: false, 
        uploaded: true 
      })))
      
      toast.success(`Successfully uploaded ${data.data.totalUploaded} images`)
      
      // Close modal after a brief delay
      setTimeout(() => {
        onSuccess()
      }, 1000)
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload images')
      
      // Mark upload as failed
      setImages(prev => prev.map(img => ({ 
        ...img, 
        uploading: false, 
        error: error.message 
      })))
    } finally {
      setIsUploading(false)
    }
  }

  // Clean up preview URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(image => {
        URL.revokeObjectURL(image.preview)
      })
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-900">Upload Property Images</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
              ${
                isDragActive
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-full p-4 w-16 h-16 mx-auto">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop images here...' : 'Click or drag images to upload'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Supports JPEG, PNG, WebP up to 10MB each
                </p>
              </div>
            </div>
          </div>
          
          {/* Image Previews */}
          {images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Selected Images ({images.length})</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3">
                    {/* Image Preview */}
                    <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Status Overlay */}
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="bg-white rounded-lg p-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                          </div>
                        </div>
                      )}
                      
                      {image.uploaded && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      {/* Remove Button */}
                      {!image.uploading && !image.uploaded && (
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Alt Text Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alt Text (for accessibility)
                      </label>
                      <input
                        type="text"
                        value={image.altText}
                        onChange={(e) => updateImageAltText(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder="Describe this image..."
                        disabled={image.uploading || image.uploaded}
                      />
                    </div>
                    
                    {/* File Info */}
                    <div className="text-xs text-gray-500">
                      <p>{image.file.name}</p>
                      <p>{(image.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    
                    {/* Error Message */}
                    {image.error && (
                      <div className="text-red-600 text-sm">
                        {image.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200/50">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={uploadImages}
            disabled={isUploading || images.length === 0}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Images ({images.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}