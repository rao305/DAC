'use client'

import React, { useState } from 'react'
import { Download, Maximize2, X, Eye, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageFile {
  file?: File
  url: string
  id: string
}

interface ImageMessageDisplayProps {
  images: ImageFile[]
  className?: string
}

interface ImageViewerProps {
  image: ImageFile
  isOpen: boolean
  onClose: () => void
  images: ImageFile[]
  currentIndex: number
  onNavigate: (direction: 'prev' | 'next') => void
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate
}) => {
  const [isLoading, setIsLoading] = useState(true)

  if (!isOpen) return null

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = image.file?.name || `image-${image.id}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  const handleCopyImage = async () => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
    } catch (error) {
      console.error('Failed to copy image:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-white">
          <span className="text-sm">
            {currentIndex + 1} of {images.length}
          </span>
          {image.file?.name && (
            <span className="text-sm text-zinc-300">• {image.file.name}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyImage}
            className="text-white hover:bg-white/10"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => onNavigate('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10 transition-colors"
            disabled={currentIndex === 0}
          >
            ←
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10 transition-colors"
            disabled={currentIndex === images.length - 1}
          >
            →
          </button>
        </>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[90vh] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={image.url}
          alt="Full size"
          className="max-w-full max-h-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </div>

      {/* Backdrop */}
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  )
}

export const ImageMessageDisplay: React.FC<ImageMessageDisplayProps> = ({
  images,
  className = ''
}) => {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const openViewer = (index: number) => {
    setCurrentImageIndex(index)
    setViewerOpen(true)
  }

  const closeViewer = () => {
    setViewerOpen(false)
  }

  const navigateViewer = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    } else if (direction === 'next' && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  if (!images || images.length === 0) {
    return null
  }

  const renderImageGrid = () => {
    if (images.length === 1) {
      return (
        <div className="relative group cursor-pointer" onClick={() => openViewer(0)}>
          <img
            src={images[0].url}
            alt="Uploaded image"
            className="max-w-full max-h-64 object-cover rounded-lg border border-zinc-700"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-black/50 text-white p-2 rounded-full">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      )
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => (
            <div 
              key={image.id} 
              className="relative group cursor-pointer"
              onClick={() => openViewer(index)}
            >
              <img
                src={image.url}
                alt={`Uploaded image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-zinc-700"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-black/50 text-white p-2 rounded-full">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 max-w-md">
          <div 
            className="relative group cursor-pointer"
            onClick={() => openViewer(0)}
          >
            <img
              src={images[0].url}
              alt="Uploaded image 1"
              className="w-full h-40 object-cover rounded-lg border border-zinc-700"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/50 text-white p-2 rounded-full">
                <Eye className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {images.slice(1).map((image, index) => (
              <div 
                key={image.id} 
                className="relative group cursor-pointer"
                onClick={() => openViewer(index + 1)}
              >
                <img
                  src={image.url}
                  alt={`Uploaded image ${index + 2}`}
                  className="w-full h-[76px] object-cover rounded-lg border border-zinc-700"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-black/50 text-white p-2 rounded-full">
                    <Eye className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // 4+ images
    return (
      <div className="grid grid-cols-2 gap-2 max-w-md">
        {images.slice(0, 3).map((image, index) => (
          <div 
            key={image.id} 
            className="relative group cursor-pointer"
            onClick={() => openViewer(index)}
          >
            <img
              src={image.url}
              alt={`Uploaded image ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border border-zinc-700"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/50 text-white p-2 rounded-full">
                <Eye className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
        <div 
          className="relative group cursor-pointer bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center"
          onClick={() => openViewer(3)}
        >
          <div className="absolute inset-0">
            <img
              src={images[3].url}
              alt="More images"
              className="w-full h-32 object-cover rounded-lg opacity-50"
            />
          </div>
          <div className="relative bg-black/60 text-white px-3 py-2 rounded-lg">
            <span className="font-semibold">+{images.length - 3}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`mb-3 ${className}`}>
        {renderImageGrid()}
      </div>

      <ImageViewer
        image={images[currentImageIndex]}
        isOpen={viewerOpen}
        onClose={closeViewer}
        images={images}
        currentIndex={currentImageIndex}
        onNavigate={navigateViewer}
      />
    </>
  )
}