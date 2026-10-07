/**
 * Biometric Authentication System
 * Supports: Fingerprint, Face Recognition (WebAuthn), Voice Recognition
 */

export interface BiometricResult {
  success: boolean
  type: 'fingerprint' | 'face' | 'voice' | 'none'
  error?: string
  data?: any
}

export class BiometricAuth {
  /**
   * Check if biometric authentication is available
   */
  static async isAvailable(): Promise<{
    fingerprint: boolean
    face: boolean
    voice: boolean
  }> {
    return {
      fingerprint: await this.isFingerprintAvailable(),
      face: await this.isFaceAvailable(),
      voice: await this.isVoiceAvailable()
    }
  }

  /**
   * Check fingerprint availability (WebAuthn)
   */
  static async isFingerprintAvailable(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) return false
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  }

  /**
   * Check face recognition availability (WebAuthn with specific params)
   */
  static async isFaceAvailable(): Promise<boolean> {
    // Same as fingerprint - WebAuthn handles both
    return this.isFingerprintAvailable()
  }

  /**
   * Check voice recognition availability
   */
  static async isVoiceAvailable(): Promise<boolean> {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      return !!SpeechRecognition
    } catch {
      return false
    }
  }

  /**
   * Register fingerprint/face authentication
   */
  static async registerBiometric(username: string): Promise<BiometricResult> {
    try {
      if (!await this.isFingerprintAvailable()) {
        return { success: false, type: 'none', error: 'Biometric not available' }
      }

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32), // In production, get from server
        rp: {
          name: "Biocure Invoice System",
          id: window.location.hostname
        },
        user: {
          id: new Uint8Array(16),
          name: username,
          displayName: username
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: "none"
      }

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential

      if (credential) {
        // Store credential ID
        localStorage.setItem(`biometric-credential-${username}`, credential.id)
        
        return {
          success: true,
          type: 'fingerprint',
          data: { credentialId: credential.id }
        }
      }

      return { success: false, type: 'none', error: 'Failed to create credential' }
    } catch (error: any) {
      return { success: false, type: 'none', error: error.message }
    }
  }

  /**
   * Authenticate with fingerprint/face
   */
  static async authenticateBiometric(username: string): Promise<BiometricResult> {
    try {
      if (!await this.isFingerprintAvailable()) {
        return { success: false, type: 'none', error: 'Biometric not available' }
      }

      const credentialId = localStorage.getItem(`biometric-credential-${username}`)
      if (!credentialId) {
        return { success: false, type: 'none', error: 'No biometric registered' }
      }

      // Convert credential ID to buffer
      const credentialIdBuffer = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0))

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(32),
        allowCredentials: [{
          id: credentialIdBuffer,
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: "required",
        timeout: 60000
      }

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      })

      if (assertion) {
        return {
          success: true,
          type: 'fingerprint',
          data: { authenticated: true }
        }
      }

      return { success: false, type: 'none', error: 'Authentication failed' }
    } catch (error: any) {
      return { success: false, type: 'none', error: error.message }
    }
  }

  /**
   * Quick fingerprint authentication (simplified)
   */
  static async quickFingerprint(): Promise<boolean> {
    try {
      const result = await this.authenticateBiometric('quick-auth')
      return result.success
    } catch {
      return false
    }
  }

  /**
   * Voice authentication setup
   */
  static async setupVoiceAuth(passphrase: string = "Access granted to invoice system"): Promise<BiometricResult> {
    try {
      if (!await this.isVoiceAvailable()) {
        return { success: false, type: 'voice', error: 'Voice recognition not available' }
      }

      // Store passphrase
      localStorage.setItem('voice-passphrase', passphrase)
      
      return {
        success: true,
        type: 'voice',
        data: { passphrase }
      }
    } catch (error: any) {
      return { success: false, type: 'voice', error: error.message }
    }
  }

  /**
   * Authenticate with voice
   */
  static async authenticateVoice(): Promise<BiometricResult> {
    return new Promise((resolve) => {
      try {
        if (!this.isVoiceAvailable()) {
          resolve({ success: false, type: 'voice', error: 'Voice not available' })
          return
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        
        recognition.continuous = false
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        const expectedPhrase = localStorage.getItem('voice-passphrase') || "access granted"

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase()
          const match = transcript.includes(expectedPhrase.toLowerCase())
          
          resolve({
            success: match,
            type: 'voice',
            data: { transcript, expected: expectedPhrase }
          })
        }

        recognition.onerror = (event: any) => {
          resolve({ success: false, type: 'voice', error: event.error })
        }

        recognition.start()

        // Timeout after 5 seconds
        setTimeout(() => {
          recognition.stop()
          resolve({ success: false, type: 'voice', error: 'Timeout' })
        }, 5000)
      } catch (error: any) {
        resolve({ success: false, type: 'voice', error: error.message })
      }
    })
  }

  /**
   * Check if user has any biometric registered
   */
  static hasRegisteredBiometric(username: string): boolean {
    return !!localStorage.getItem(`biometric-credential-${username}`)
  }

  /**
   * Remove biometric registration
   */
  static removeBiometric(username: string): void {
    localStorage.removeItem(`biometric-credential-${username}`)
    localStorage.removeItem('voice-passphrase')
  }
}
