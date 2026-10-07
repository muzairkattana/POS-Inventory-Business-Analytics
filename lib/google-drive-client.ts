// Browser-compatible Google Drive Client
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

class GoogleDriveClient {
  private accessToken: string | null = null;
  
  // Set access token for API calls
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Make authenticated API call
  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please call setAccessToken() first.');
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`API call failed: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  // Upload file
  private async uploadFileMultipart(
    metadata: DriveFileMetadata, 
    content: string, 
    mimeType: string
  ): Promise<DriveFile> {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const body = 
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      close_delim;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,parents,webViewLink,webContentLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user profile using Google OAuth2 API
  async getUserProfile(): Promise<{ email: string; name: string; picture: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    const data = await response.json();
    return {
      email: data.email,
      name: data.name,
      picture: data.picture
    };
  }

  // Get storage quota
  async getStorageQuota(): Promise<DriveStorageQuota> {
    const response = await this.makeApiCall('/about?fields=storageQuota');
    return response.storageQuota;
  }

  // Create folder
  async createFolder(name: string, description?: string): Promise<DriveFile> {
    const metadata: DriveFileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      description
    };

    return this.makeApiCall('/files?fields=id,name,mimeType,size,modifiedTime,parents,webViewLink', {
      method: 'POST',
      body: JSON.stringify(metadata)
    });
  }

  // List files
  async listFiles(parentId?: string, maxResults: number = 100): Promise<DriveFile[]> {
    let query = 'trashed=false';
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const response = await this.makeApiCall(
      `/files?q=${encodeURIComponent(query)}&pageSize=${maxResults}&fields=files(id,name,mimeType,size,modifiedTime,parents,webViewLink,webContentLink)&orderBy=modifiedTime desc`
    );

    return response.files || [];
  }

  // Find file by name
  async findFileByName(name: string, parentId?: string): Promise<DriveFile | null> {
    let query = `name='${name}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const response = await this.makeApiCall(
      `/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,parents,webViewLink,webContentLink)`
    );

    const files = response.files || [];
    return files.length > 0 ? files[0] : null;
  }

  // Upload or update file
  async uploadFile(
    name: string,
    content: string,
    mimeType: string,
    parentId?: string,
    description?: string
  ): Promise<DriveFile> {
    const metadata: DriveFileMetadata = {
      name,
      description,
      ...(parentId && { parents: [parentId] })
    };

    return this.uploadFileMultipart(metadata, content, mimeType);
  }

  // Update existing file
  async updateFile(fileId: string, content: string, mimeType: string): Promise<DriveFile> {
    // First update the content
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': mimeType
      },
      body: content
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }

    // Then get the updated file metadata
    return this.makeApiCall(`/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,parents,webViewLink,webContentLink`);
  }

  // Download file
  async downloadFile(fileId: string): Promise<string> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.text();
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    await this.makeApiCall(`/files/${fileId}`, { method: 'DELETE' });
  }

  // Get or create "BioCure Health Care Invoices" folder
  async getOrCreateInvoiceFolder(): Promise<string> {
    // Search for existing folder
    const existingFolder = await this.findFileByName('BioCure Health Care Invoices');
    
    if (existingFolder && existingFolder.mimeType === 'application/vnd.google-apps.folder') {
      return existingFolder.id;
    }

    // Create new folder
    const newFolder = await this.createFolder(
      'BioCure Health Care Invoices',
      'Backup folder for BioCure Health Care invoice data'
    );

    return newFolder.id;
  }
}

// Export singleton instance
export const googleDriveClient = new GoogleDriveClient();
export default GoogleDriveClient;
