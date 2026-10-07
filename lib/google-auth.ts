// Google OAuth2 Authentication Handler
import { googleDriveClient } from './google-drive-client';

export interface GoogleAuthResult {
  success: boolean;
  user?: {
    email: string;
    name: string;
    picture: string;
  };
  tokens?: {
    access_token: string;
    refresh_token?: string;
  };
  error?: string;
}

export interface StoredGoogleAuth {
  accessToken: string;
  refreshToken?: string;
  userProfile: {
    email: string;
    name: string;
    picture: string;
  };
  expiresAt: number;
  connectedAt: number;
}

class GoogleAuthManager {
  private readonly STORAGE_KEY = 'google_drive_auth';
  private readonly AUTH_WINDOW_FEATURES = 'width=500,height=600,scrollbars=yes,resizable=yes';

  // Generate Google OAuth URL
  private generateAuthUrl(): string {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      throw new Error('Google OAuth configuration missing. Please check environment variables.');
    }

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  // Start OAuth2 flow
  async startAuth(): Promise<GoogleAuthResult> {
    try {
      const authUrl = this.generateAuthUrl();
      
      // Open popup window for authentication
      const authWindow = window.open(authUrl, 'google_auth', this.AUTH_WINDOW_FEATURES);
      
      if (!authWindow) {
        return {
          success: false,
          error: 'Failed to open authentication window. Please allow popups and try again.'
        };
      }

      // Wait for authentication to complete
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            resolve({
              success: false,
              error: 'Authentication window was closed before completing the process.'
            });
          }
        }, 1000);

        // Listen for message from popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            authWindow.close();
            
            try {
              const result = await this.handleAuthSuccess(event.data.code);
              resolve(result);
            } catch (error) {
              resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process authentication'
              });
            }
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            authWindow.close();
            
            resolve({
              success: false,
              error: event.data.error || 'Authentication failed'
            });
          }
        };

        window.addEventListener('message', handleMessage);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start authentication'
      };
    }
  }

  // Exchange code for access token
  private async exchangeCodeForTokens(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri!,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token
    };
  }

  // Handle successful authentication
  private async handleAuthSuccess(code: string): Promise<GoogleAuthResult> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      // Set access token and get user profile
      googleDriveClient.setAccessToken(tokens.access_token);
      const userProfile = await googleDriveClient.getUserProfile();
      
      // Store authentication data
      const authData: StoredGoogleAuth = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        userProfile,
        expiresAt: Date.now() + (3600 * 1000), // 1 hour
        connectedAt: Date.now()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
      
      return {
        success: true,
        user: userProfile,
        tokens
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to complete authentication');
    }
  }

  // Restore authentication from storage
  async restoreAuth(): Promise<GoogleAuthResult | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const authData: StoredGoogleAuth = JSON.parse(stored);
      
      // Check if token is expired
      if (Date.now() > authData.expiresAt) {
        // Try to refresh token if available
        if (authData.refreshToken) {
          try {
            await this.refreshAccessToken(authData.refreshToken);
            return await this.restoreAuth(); // Retry after refresh
          } catch (error) {
            // Refresh failed, clear stored auth
            this.clearAuth();
            return null;
          }
        } else {
          // No refresh token, clear auth
          this.clearAuth();
          return null;
        }
      }
      
      // Set access token and verify
      googleDriveClient.setAccessToken(authData.accessToken);
      
      return {
        success: true,
        user: authData.userProfile,
        tokens: {
          access_token: authData.accessToken,
          refresh_token: authData.refreshToken
        }
      };
    } catch (error) {
      console.error('Failed to restore authentication:', error);
      this.clearAuth();
      return null;
    }
  }

  // Refresh access token
  private async refreshAccessToken(refreshToken: string): Promise<void> {
    // Note: In a real implementation, you would need to implement token refresh
    // For now, we'll just clear the auth and require re-authentication
    throw new Error('Token refresh not implemented - please re-authenticate');
  }

  // Clear authentication
  clearAuth(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return false;
    
    try {
      const authData: StoredGoogleAuth = JSON.parse(stored);
      return Date.now() < authData.expiresAt;
    } catch {
      return false;
    }
  }

  // Get stored user profile
  getUserProfile(): { email: string; name: string; picture: string } | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    
    try {
      const authData: StoredGoogleAuth = JSON.parse(stored);
      return authData.userProfile;
    } catch {
      return null;
    }
  }

  // Revoke access and clear auth
  async revokeAccess(): Promise<void> {
    try {
      // For browser-based OAuth, we just clear the local auth
      // The user can revoke access through Google account settings
      this.clearAuth();
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  }
}

// Export singleton instance
export const googleAuthManager = new GoogleAuthManager();
export default GoogleAuthManager;
