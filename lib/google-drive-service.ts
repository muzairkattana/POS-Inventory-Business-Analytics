// Google Drive API Service
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface DriveFileMetadata {
  id?: string;
  name: string;
  parents?: string[];
  mimeType?: string;
  description?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  parents: string[];
  webViewLink: string;
  webContentLink?: string;
}

export interface DriveStorageQuota {
  limit: string;
  usage: string;
  usageInDrive: string;
}

class GoogleDriveService {
  private oauth2Client: OAuth2Client;
  private drive: any;
  private isAuthenticated = false;

  constructor() {
    // Initialize OAuth2 client with credentials
    this.oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  // Generate authentication URL
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Set access token
  async setAccessToken(token: string): Promise<void> {
    try {
      this.oauth2Client.setCredentials({ access_token: token });
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Error setting access token:', error);
      throw new Error('Failed to authenticate with Google Drive');
    }
  }

  // Exchange authorization code for tokens
  async getAccessToken(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.isAuthenticated = true;
      
      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token
      };
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get access token');
    }
  }

  // Get user profile
  async getUserProfile(): Promise<{ email: string; name: string; picture: string }> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      return {
        email: data.email!,
        name: data.name!,
        picture: data.picture!
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  // Get storage quota
  async getStorageQuota(): Promise<DriveStorageQuota> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await this.drive.about.get({
        fields: 'storageQuota'
      });

      return response.data.storageQuota;
    } catch (error) {
      console.error('Error getting storage quota:', error);
      throw new Error('Failed to get storage quota');
    }
  }

  // Create or get "Biocure Healthcare Invoices" folder
  async getOrCreateInvoiceFolder(): Promise<string> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      // Search for existing folder
      const searchResponse = await this.drive.files.list({
        q: "name='Biocure Healthcare Invoices' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)'
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        return searchResponse.data.files[0].id;
      }

      // Create new folder
      const folderMetadata: DriveFileMetadata = {
        name: 'Biocure Healthcare Invoices',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Backup folder for Biocure Healthcare invoice data'
      };

      const response = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return response.data.id;
    } catch (error) {
      console.error('Error creating/getting invoice folder:', error);
      throw new Error('Failed to create invoice folder');
    }
  }

  // Upload file to Google Drive
  async uploadFile(
    fileName: string,
    content: string | Buffer,
    mimeType: string,
    parentFolderId?: string,
    description?: string
  ): Promise<DriveFile> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const metadata: DriveFileMetadata = {
        name: fileName,
        description: description,
        ...(parentFolderId && { parents: [parentFolderId] })
      };

      const media = {
        mimeType,
        body: typeof content === 'string' ? content : content
      };

      const response = await this.drive.files.create({
        resource: metadata,
        media,
        fields: 'id, name, mimeType, size, modifiedTime, parents, webViewLink, webContentLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  // Update existing file
  async updateFile(
    fileId: string,
    content: string | Buffer,
    mimeType: string
  ): Promise<DriveFile> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const media = {
        mimeType,
        body: typeof content === 'string' ? content : content
      };

      const response = await this.drive.files.update({
        fileId,
        media,
        fields: 'id, name, mimeType, size, modifiedTime, parents, webViewLink, webContentLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error updating file:', error);
      throw new Error('Failed to update file in Google Drive');
    }
  }

  // List files in folder
  async listFiles(
    parentFolderId?: string,
    maxResults: number = 100
  ): Promise<DriveFile[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      let query = 'trashed=false';
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        pageSize: maxResults,
        fields: 'files(id, name, mimeType, size, modifiedTime, parents, webViewLink, webContentLink)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files from Google Drive');
    }
  }

  // Download file content
  async downloadFile(fileId: string): Promise<string> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      await this.drive.files.delete({ fileId });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  // Search for file by name
  async findFileByName(fileName: string, parentFolderId?: string): Promise<DriveFile | null> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      let query = `name='${fileName}' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, size, modifiedTime, parents, webViewLink, webContentLink)'
      });

      const files = response.data.files || [];
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('Error searching for file:', error);
      throw new Error('Failed to search for file');
    }
  }

  // Check if authenticated
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  // Revoke access
  async revokeAccess(): Promise<void> {
    try {
      await this.oauth2Client.revokeCredentials();
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Error revoking access:', error);
      throw new Error('Failed to revoke access');
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
export default GoogleDriveService;
