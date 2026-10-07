/**
 * Camera Capture Utility
 * Captures user photo during login/logout for security audit trail
 */

export interface CaptureResult {
  success: boolean
  imageData?: string // base64 encoded image
  timestamp: string
  error?: string
  deviceInfo?: {
    camera: string
    resolution: string
  }
}

export class CameraCapture {
  private static stream: MediaStream | null = null

  /**
   * Check if camera is available
   */
  static async isCameraAvailable(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false
      }
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.some(device => device.kind === 'videoinput')
    } catch {
      return false
    }
  }

  /**
   * Capture photo from webcam
   */
  static async capturePhoto(silent: boolean = false): Promise<CaptureResult> {
    // Auto/silent capture is disabled per system requirements
    if (silent) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Auto camera capture is disabled'
      }
    }

    try {
      // Request camera permission with better quality settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          // Request better exposure and white balance
          aspectRatio: { ideal: 1.7777777778 }
        }
      })

      // Create video element
      const video = document.createElement('video')
      video.srcObject = this.stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true

      // Wait for video to be ready and playing
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve)
        }
      })

      // Wait longer for camera to warm up and adjust exposure/white balance
      // This is crucial for proper lighting and image quality
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create canvas and capture frame
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Enhance brightness and contrast for better visibility
      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageDataObj.data
      const brightnessAdjust = 30 // Increase brightness
      const contrastFactor = 1.2 // Increase contrast

      for (let i = 0; i < data.length; i += 4) {
        // Adjust brightness and contrast for RGB channels
        data[i] = Math.min(255, (data[i] - 128) * contrastFactor + 128 + brightnessAdjust)     // Red
        data[i + 1] = Math.min(255, (data[i + 1] - 128) * contrastFactor + 128 + brightnessAdjust) // Green
        data[i + 2] = Math.min(255, (data[i + 2] - 128) * contrastFactor + 128 + brightnessAdjust) // Blue
      }

      ctx.putImageData(imageDataObj, 0, 0)

      // Convert to base64 with higher quality
      const imageData = canvas.toDataURL('image/jpeg', 0.95)

      // Get device info
      const track = this.stream.getVideoTracks()[0]
      const settings = track.getSettings()

      // Stop camera
      this.stopCamera()

      return {
        success: true,
        imageData,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          camera: track.label || 'Unknown Camera',
          resolution: `${settings.width}x${settings.height}`
        }
      }
    } catch (error: any) {
      this.stopCamera()
      
      if (!silent) {
        console.warn('Camera capture failed:', error.message)
      }
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message || 'Camera access denied'
      }
    }
  }

  /**
   * Stop camera stream
   */
  static stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
  }

  /**
   * Request camera permission upfront
   */
  static async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch {
      return false
    }
  }

  /**
   * Save capture to activity logs
   */
  static saveCaptureToLogs(
    imageData: string,
    eventType: 'login' | 'logout',
    username: string
  ) {
    const key = `camera-captures-${eventType}`
    try {
      const existing = localStorage.getItem(key)
      const captures = existing ? JSON.parse(existing) : []
      
      captures.unshift({
        username,
        imageData,
        timestamp: new Date().toISOString(),
        eventType
      })

      // Keep only last 50 captures per event type
      if (captures.length > 50) {
        captures.splice(50)
      }

      localStorage.setItem(key, JSON.stringify(captures))
    } catch (error) {
      console.error('Failed to save capture:', error)
    }
  }

  /**
   * Get captures from logs
   */
  static getCapturesFromLogs(eventType?: 'login' | 'logout') {
    try {
      if (eventType) {
        const key = `camera-captures-${eventType}`
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : []
      } else {
        const loginCaptures = this.getCapturesFromLogs('login')
        const logoutCaptures = this.getCapturesFromLogs('logout')
        return [...loginCaptures, ...logoutCaptures].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }
    } catch {
      return []
    }
  }
}
