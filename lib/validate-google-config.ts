/**
 * Google Drive Configuration Validator
 * Use this to check if your environment variables are properly set up
 */

export function validateGoogleConfig() {
  const config = {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Check required environment variables
  if (!config.clientId) {
    errors.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing')
  } else if (config.clientId === 'your_google_client_id_here') {
    errors.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID still contains placeholder value')
  } else if (!config.clientId.includes('.googleusercontent.com')) {
    warnings.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID does not look like a valid Google Client ID')
  }

  if (!config.clientSecret) {
    errors.push('GOOGLE_CLIENT_SECRET is missing')
  } else if (config.clientSecret === 'your_google_client_secret_here') {
    errors.push('GOOGLE_CLIENT_SECRET still contains placeholder value')
  }

  if (!config.nextAuthSecret) {
    errors.push('NEXTAUTH_SECRET is missing')
  } else if (config.nextAuthSecret === 'your_nextauth_secret_here') {
    errors.push('NEXTAUTH_SECRET still contains placeholder value')
  } else if (config.nextAuthSecret.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters long for security')
  }

  if (!config.nextAuthUrl) {
    warnings.push('NEXTAUTH_URL is missing (will default to localhost:3000)')
  }

  if (!config.redirectUri) {
    warnings.push('NEXT_PUBLIC_GOOGLE_REDIRECT_URI is missing (will use default)')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      clientId: config.clientId ? `${config.clientId.slice(0, 20)}...` : 'NOT SET',
      clientSecret: config.clientSecret ? 'SET' : 'NOT SET',
      nextAuthSecret: config.nextAuthSecret ? 'SET' : 'NOT SET',
      nextAuthUrl: config.nextAuthUrl || 'NOT SET',
      redirectUri: config.redirectUri || 'NOT SET',
    }
  }
}

export function getGoogleAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`

  if (!clientId) {
    throw new Error('Google OAuth configuration missing. Please check environment variables.')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent'
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Client-side validation (for browser environment)
export function validateGoogleConfigClient() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

  if (!clientId) {
    throw new Error('Google OAuth configuration missing. Please check environment variables.')
  }

  if (clientId === 'your_google_client_id_here') {
    throw new Error('Google Client ID not configured. Please update your .env.local file.')
  }

  return {
    clientId,
    redirectUri: redirectUri || `${window.location.origin}/api/auth/google/callback`
  }
}
