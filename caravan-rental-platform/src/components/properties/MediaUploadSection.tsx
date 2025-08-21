import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Image as ImageIcon, Video, RotateCcw, Camera, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface MediaFile {
  id: string
  file?: File
  url: string
  type: 'image' | 'video' | '360'
  caption: string
  isPrimary: boolean
}

interface MediaUploadSectionProps {
  media: MediaFile[]
  onMediaUpdate: (media: MediaFile[]) => void
  virtualTourUrl?: string
  onVirtualTourUpdate: (url: string) => void
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  media,
  onMediaUpdate,
  virtualTourUrl,
  onVirtualTourUpdate
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newMedia: MediaFile[] = acceptedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(),
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      caption: '',
      isPrimary: media.length === 0 // First image is primary by default
    }))
    
    onMediaUpdate([...media, ...newMedia])
  }, [media, onMediaUpdate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 20,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const removeMedia = (id: string) => {
    const updated = media.filter(m => m.id !== id)
    if (updated.length > 0 && !updated.some(m => m.isPrimary)) {
      updated[0].isPrimary = true
    }
    onMediaUpdate(updated)
  }

  const setPrimary = (id: string) => {
    const updated = media.map(m => ({ ...m, isPrimary: m.id === id }))
    onMediaUpdate(updated)
  }

  const updateCaption = (id: string, caption: string) => {
    const updated = media.map(m => m.id === id ? { ...m, caption } : m)
    onMediaUpdate(updated)
  }

  const reorderMedia = (dragId: string, hoverId: string) => {
    const dragIndex = media.findIndex(m => m.id === dragId)
    const hoverIndex = media.findIndex(m => m.id === hoverId)
    
    const updated = [...media]
    const dragItem = updated[dragIndex]
    updated.splice(dragIndex, 1)
    updated.splice(hoverIndex, 0, dragItem)
    
    onMediaUpdate(updated)
  }

  return (
    <div className="bg-gray-50/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Camera className="h-5 w-5 mr-2" />
        Media & Virtual Tour
      </h3>
      
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragActive 
            ? 'border-orange-400 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drag & drop media files here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Upload images, videos, or 360° photos. Max file size: 50MB each
        </p>
        <div className="flex justify-center space-x-4 text-xs text-gray-400">
          <span className="flex items-center"><ImageIcon className="h-4 w-4 mr-1" />Images</span>
          <span className="flex items-center"><Video className="h-4 w-4 mr-1" />Videos</span>
          <span className="flex items-center"><RotateCcw className="h-4 w-4 mr-1" />360° Photos</span>
        </div>
      </div>
      
      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Uploaded Media ({media.length})</h4>
            <p className="text-sm text-gray-500">Drag to reorder • Click star to set as primary</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white"
                draggable
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedId) {
                    reorderMedia(draggedId, item.id)
                    setDraggedId(null)
                  }
                }}
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
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setPrimary(item.id)}
                    className={`p-2 rounded-full transition-colors ${
                      item.isPrimary
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/20 text-white hover:bg-yellow-500'
                    }`}
                    title="Set as primary image"
                  >
                    ⭐
                  </button>
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Primary Badge */}
                {item.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    Primary
                  </div>
                )}
                
                {/* Type Badge */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {item.type === '360' ? '360°' : item.type === 'video' ? 'Video' : 'Photo'}
                </div>
                
                {/* Caption Input */}
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Add caption..."
                    value={item.caption}
                    onChange={(e) => updateCaption(item.id, e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
          Virtual Tour URL (Optional)
        </label>
        <div className="flex">
          <div className="flex-1">
            <input
              type="url"
              value={virtualTourUrl || ''}
              onChange={(e) => onVirtualTourUpdate(e.target.value)}
              placeholder="https://example.com/virtual-tour"
              className="w-full px-4 py-2 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {virtualTourUrl && (
            <a
              href={virtualTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-orange-500 text-white rounded-r-xl hover:bg-orange-600 transition-colors flex items-center"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Link to external virtual tour services like Matterport, 360° tours, etc.
        </p>
      </div>
    </div>
  )
}

export default MediaUploadSection