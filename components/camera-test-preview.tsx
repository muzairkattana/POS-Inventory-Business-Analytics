"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Camera, X, Check, AlertCircle } from 'lucide-react'
import { CameraCapture } from '@/lib/camera-capture'

export default function CameraTestPreview() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      setStatus('Starting camera...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
        setStatus('Camera is warming up... (2 seconds)')
        
        // Show countdown
        setTimeout(() => setStatus('Camera ready! Check your lighting.'), 2000)
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    }
  }

  const captureTest = async () => {
    if (!videoRef.current) return

    try {
      setStatus('Capturing...')
      
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw video frame
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

      // Apply same brightness/contrast enhancement as the real capture
      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageDataObj.data
      const brightnessAdjust = 30
      const contrastFactor = 1.2

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, (data[i] - 128) * contrastFactor + 128 + brightnessAdjust)
        data[i + 1] = Math.min(255, (data[i + 1] - 128) * contrastFactor + 128 + brightnessAdjust)
        data[i + 2] = Math.min(255, (data[i + 2] - 128) * contrastFactor + 128 + brightnessAdjust)
      }

      ctx.putImageData(imageDataObj, 0, 0)

      const imageData = canvas.toDataURL('image/jpeg', 0.95)
      setCapturedImage(imageData)
      setStatus('Photo captured! This is how it will look.')
    } catch (error) {
      setStatus('Capture failed')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
    setCapturedImage(null)
    setStatus('')
  }

  const handleClose = () => {
    stopCamera()
    setIsOpen(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Camera className="w-4 h-4" />
        Test Camera
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Camera Test Preview</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!isCameraActive && !capturedImage && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-2">Tips for better photos:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Make sure you have good lighting in front of you</li>
                    <li>Avoid backlighting (light behind you)</li>
                    <li>Face the camera directly</li>
                    <li>Camera will take 2 seconds to adjust brightness</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Button onClick={startCamera} className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          </div>
        )}

        {isCameraActive && !capturedImage && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            
            {status && (
              <div className="text-center text-sm text-muted-foreground">
                {status}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={captureTest} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Take Test Photo
              </Button>
              <Button onClick={stopCamera} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Test capture"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-300 text-center">
                ✓ This is how your security photo will look during login/logout
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setCapturedImage(null)
                  startCamera()
                }} 
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
