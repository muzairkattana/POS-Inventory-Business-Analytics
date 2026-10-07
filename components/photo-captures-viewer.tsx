"use client"

import { useState, useEffect } from 'react'
import { CameraCapture } from '@/lib/camera-capture'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Camera, Download, Trash2, X, User, Clock } from 'lucide-react'
import { Card } from './ui/card'

interface Capture {
  username: string
  imageData: string
  timestamp: string
  eventType: 'login' | 'logout'
}

export default function PhotoCapturesViewer() {
  const [captures, setCaptures] = useState<Capture[]>([])
  const [filter, setFilter] = useState<'all' | 'login' | 'logout'>('all')
  const [selectedImage, setSelectedImage] = useState<Capture | null>(null)

  useEffect(() => {
    loadCaptures()
  }, [filter])

  const loadCaptures = () => {
    const allCaptures = filter === 'all' 
      ? CameraCapture.getCapturesFromLogs()
      : CameraCapture.getCapturesFromLogs(filter)
    setCaptures(allCaptures)
  }

  const downloadImage = (capture: Capture) => {
    const link = document.createElement('a')
    link.href = capture.imageData
    link.download = `${capture.eventType}-${capture.username}-${new Date(capture.timestamp).getTime()}.jpg`
    link.click()
  }

  const clearAll = () => {
    if (confirm('Delete all captured photos?')) {
      localStorage.removeItem('camera-captures-login')
      localStorage.removeItem('camera-captures-logout')
      setCaptures([])
      setSelectedImage(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Captured Photos</h3>
          <Badge variant="secondary">{captures.length}</Badge>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'ghost'}
              onClick={() => setFilter('all')}
              className="h-7"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'login' ? 'default' : 'ghost'}
              onClick={() => setFilter('login')}
              className="h-7"
            >
              Login
            </Button>
            <Button
              size="sm"
              variant={filter === 'logout' ? 'default' : 'ghost'}
              onClick={() => setFilter('logout')}
              className="h-7"
            >
              Logout
            </Button>
          </div>
          {captures.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearAll}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Photos Grid */}
      {captures.length === 0 ? (
        <Card className="p-12 text-center">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No photos captured yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Photos will appear here after login/logout
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {captures.map((capture, index) => (
            <Card 
              key={index}
              className="p-3 space-y-2 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedImage(capture)}
            >
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={capture.imageData}
                  alt={`${capture.eventType} capture`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <User className="w-3 h-3" />
                  <span className="truncate">{capture.username.split('@')[0]}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(capture.timestamp).toLocaleString()}
                </div>
                <Badge 
                  variant={capture.eventType === 'login' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {capture.eventType}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full Size Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Photo Details</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <img
                src={selectedImage.imageData}
                alt="Full size"
                className="w-full rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Username</p>
                  <p className="font-medium">{selectedImage.username}</p>
                </div>
                <div>
                  <p className="text-gray-500">Event Type</p>
                  <Badge variant={selectedImage.eventType === 'login' ? 'default' : 'secondary'}>
                    {selectedImage.eventType}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Timestamp</p>
                  <p className="font-medium">
                    {new Date(selectedImage.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedImage.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => downloadImage(selectedImage)}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
