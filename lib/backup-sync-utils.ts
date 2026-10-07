// Backup and Sync Utilities for Google Drive
import { googleDriveClient } from './google-drive-client';
import { googleAuthManager } from './google-auth';
import type { SavedInvoice } from '../components/invoice-manager';

export interface BackupStatus {
  success: boolean;
  message: string;
  timestamp: Date;
  invoicesBackedUp?: number;
  fileId?: string;
}

export interface SyncStatus {
  success: boolean;
  message: string;
  timestamp: Date;
  localInvoices: number;
  cloudInvoices: number;
  conflicts?: string[];
}

export interface BackupMetadata {
  version: string;
  timestamp: Date;
  totalInvoices: number;
  companyInfo: any;
  exportedBy: string;
  appVersion: string;
}

class BackupSyncManager {
  private readonly BACKUP_FILE_NAME = 'biocure-healthcare-invoices-backup.json';
  private readonly BACKUP_VERSION = '1.0';
  
  // Backup all invoices to Google Drive
  async backupInvoices(): Promise<BackupStatus> {
    try {
      // Check authentication
      if (!googleAuthManager.isAuthenticated()) {
        return {
          success: false,
          message: 'Not authenticated with Google Drive. Please connect your account first.',
          timestamp: new Date()
        };
      }

      // Restore authentication
      const authResult = await googleAuthManager.restoreAuth();
      if (!authResult?.success) {
        return {
          success: false,
          message: 'Failed to restore Google Drive authentication. Please reconnect your account.',
          timestamp: new Date()
        };
      }

      // Get all invoices from localStorage
      const savedInvoices = localStorage.getItem('saved-invoices');
      if (!savedInvoices) {
        return {
          success: false,
          message: 'No invoices found to backup.',
          timestamp: new Date()
        };
      }

      const invoices: SavedInvoice[] = JSON.parse(savedInvoices);
      if (invoices.length === 0) {
        return {
          success: false,
          message: 'No invoices found to backup.',
          timestamp: new Date()
        };
      }

      // Get company info
      const companyInfoStr = localStorage.getItem('company-info');
      const companyInfo = companyInfoStr ? JSON.parse(companyInfoStr) : null;

      // Prepare backup data
      const backupData = {
        metadata: {
          version: this.BACKUP_VERSION,
          timestamp: new Date(),
          totalInvoices: invoices.length,
          companyInfo,
          exportedBy: authResult.user?.email || 'Unknown',
          appVersion: '1.0.0'
        } as BackupMetadata,
        invoices: invoices,
        settings: {
          tableColumns: localStorage.getItem('table-columns'),
          preferences: localStorage.getItem('user-preferences')
        }
      };

      // Get or create backup folder
      const folderId = await googleDriveClient.getOrCreateInvoiceFolder();
      
      // Check if backup file exists
      const existingFile = await googleDriveClient.findFileByName(
        this.BACKUP_FILE_NAME, 
        folderId
      );

      const backupContent = JSON.stringify(backupData, null, 2);

      let fileResult;
      if (existingFile) {
        // Update existing backup
        fileResult = await googleDriveClient.updateFile(
          existingFile.id,
          backupContent,
          'application/json'
        );
      } else {
        // Create new backup
        fileResult = await googleDriveClient.uploadFile(
          this.BACKUP_FILE_NAME,
          backupContent,
          'application/json',
          folderId,
          `Biocure Healthcare invoices backup - ${new Date().toLocaleDateString()}`
        );
      }

      // Update last backup timestamp
      localStorage.setItem('last_backup_timestamp', new Date().toISOString());
      
      return {
        success: true,
        message: `Successfully backed up ${invoices.length} invoices to Google Drive.`,
        timestamp: new Date(),
        invoicesBackedUp: invoices.length,
        fileId: fileResult.id
      };

    } catch (error) {
      console.error('Backup error:', error);
      return {
        success: false,
        message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  // Restore invoices from Google Drive
  async restoreInvoices(): Promise<BackupStatus> {
    try {
      // Check authentication
      if (!googleAuthManager.isAuthenticated()) {
        return {
          success: false,
          message: 'Not authenticated with Google Drive. Please connect your account first.',
          timestamp: new Date()
        };
      }

      // Restore authentication
      const authResult = await googleAuthManager.restoreAuth();
      if (!authResult?.success) {
        return {
          success: false,
          message: 'Failed to restore Google Drive authentication. Please reconnect your account.',
          timestamp: new Date()
        };
      }

      // Get backup folder
      const folderId = await googleDriveClient.getOrCreateInvoiceFolder();
      
      // Find backup file
      const backupFile = await googleDriveClient.findFileByName(
        this.BACKUP_FILE_NAME, 
        folderId
      );

      if (!backupFile) {
        return {
          success: false,
          message: 'No backup file found in Google Drive.',
          timestamp: new Date()
        };
      }

      // Download backup file
      const backupContent = await googleDriveClient.downloadFile(backupFile.id);
      const backupData = JSON.parse(backupContent);

      // Validate backup data
      if (!backupData.metadata || !backupData.invoices) {
        return {
          success: false,
          message: 'Invalid backup file format.',
          timestamp: new Date()
        };
      }

      // Ask for confirmation before overwriting
      const confirmRestore = confirm(
        `This will restore ${backupData.invoices.length} invoices from Google Drive backup created on ${new Date(backupData.metadata.timestamp).toLocaleDateString()}.\n\nThis will overwrite your current local invoices. Do you want to continue?`
      );

      if (!confirmRestore) {
        return {
          success: false,
          message: 'Restore cancelled by user.',
          timestamp: new Date()
        };
      }

      // Restore invoices
      localStorage.setItem('saved-invoices', JSON.stringify(backupData.invoices));
      
      // Restore settings if available
      if (backupData.settings?.tableColumns) {
        localStorage.setItem('table-columns', backupData.settings.tableColumns);
      }
      if (backupData.settings?.preferences) {
        localStorage.setItem('user-preferences', backupData.settings.preferences);
      }

      // Update last restore timestamp
      localStorage.setItem('last_restore_timestamp', new Date().toISOString());

      return {
        success: true,
        message: `Successfully restored ${backupData.invoices.length} invoices from Google Drive backup.`,
        timestamp: new Date(),
        invoicesBackedUp: backupData.invoices.length
      };

    } catch (error) {
      console.error('Restore error:', error);
      return {
        success: false,
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  // Auto-sync invoices (called when invoices are created/updated)
  async autoSync(invoiceData: SavedInvoice): Promise<BackupStatus> {
    try {
      // Check if auto-sync is enabled and user is authenticated
      if (!googleAuthManager.isAuthenticated()) {
        return {
          success: false,
          message: 'Auto-sync skipped: Not authenticated',
          timestamp: new Date()
        };
      }

      // Simple auto-sync: backup all invoices
      return await this.backupInvoices();

    } catch (error) {
      console.error('Auto-sync error:', error);
      return {
        success: false,
        message: `Auto-sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  // Export single invoice to Google Drive
  async exportSingleInvoice(invoice: SavedInvoice): Promise<BackupStatus> {
    try {
      // Check authentication
      if (!googleAuthManager.isAuthenticated()) {
        return {
          success: false,
          message: 'Not authenticated with Google Drive. Please connect your account first.',
          timestamp: new Date()
        };
      }

      // Restore authentication
      const authResult = await googleAuthManager.restoreAuth();
      if (!authResult?.success) {
        return {
          success: false,
          message: 'Failed to restore Google Drive authentication. Please reconnect your account.',
          timestamp: new Date()
        };
      }

      // Get or create backup folder
      const folderId = await googleDriveClient.getOrCreateInvoiceFolder();
      
      // Prepare individual invoice file
      const invoiceData = {
        metadata: {
          version: this.BACKUP_VERSION,
          timestamp: new Date(),
          invoiceNumber: invoice.invoiceNumber,
          exportedBy: authResult.user?.email || 'Unknown',
          appVersion: '1.0.0'
        },
        invoice
      };

      const fileName = `invoice-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
      const fileContent = JSON.stringify(invoiceData, null, 2);

      // Check if file exists
      const existingFile = await googleDriveClient.findFileByName(fileName, folderId);

      let fileResult;
      if (existingFile) {
        // Update existing file
        fileResult = await googleDriveClient.updateFile(
          existingFile.id,
          fileContent,
          'application/json'
        );
      } else {
        // Create new file
        fileResult = await googleDriveClient.uploadFile(
          fileName,
          fileContent,
          'application/json',
          folderId,
          `Individual invoice backup - ${invoice.invoiceNumber}`
        );
      }

      return {
        success: true,
        message: `Successfully exported invoice ${invoice.invoiceNumber} to Google Drive.`,
        timestamp: new Date(),
        invoicesBackedUp: 1,
        fileId: fileResult.id
      };

    } catch (error) {
      console.error('Export single invoice error:', error);
      return {
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  // Get backup status and info
  async getBackupInfo(): Promise<{
    lastBackup?: Date;
    lastRestore?: Date;
    hasCloudBackup: boolean;
    cloudBackupDate?: Date;
    localInvoicesCount: number;
  }> {
    const info = {
      lastBackup: undefined as Date | undefined,
      lastRestore: undefined as Date | undefined,
      hasCloudBackup: false,
      cloudBackupDate: undefined as Date | undefined,
      localInvoicesCount: 0
    };

    // Get local backup timestamps
    const lastBackupStr = localStorage.getItem('last_backup_timestamp');
    if (lastBackupStr) {
      info.lastBackup = new Date(lastBackupStr);
    }

    const lastRestoreStr = localStorage.getItem('last_restore_timestamp');
    if (lastRestoreStr) {
      info.lastRestore = new Date(lastRestoreStr);
    }

    // Count local invoices
    const savedInvoices = localStorage.getItem('saved-invoices');
    if (savedInvoices) {
      const invoices: SavedInvoice[] = JSON.parse(savedInvoices);
      info.localInvoicesCount = invoices.length;
    }

    // Check cloud backup if authenticated
    try {
      if (googleAuthManager.isAuthenticated()) {
        const authResult = await googleAuthManager.restoreAuth();
        if (authResult?.success) {
          const folderId = await googleDriveClient.getOrCreateInvoiceFolder();
          const backupFile = await googleDriveClient.findFileByName(
            this.BACKUP_FILE_NAME, 
            folderId
          );
          
          if (backupFile) {
            info.hasCloudBackup = true;
            info.cloudBackupDate = new Date(backupFile.modifiedTime);
          }
        }
      }
    } catch (error) {
      console.error('Error checking cloud backup:', error);
    }

    return info;
  }

  // List all backup files in Google Drive
  async listBackupFiles(): Promise<{ id: string; name: string; modifiedTime: Date; size: string }[]> {
    try {
      if (!googleAuthManager.isAuthenticated()) {
        throw new Error('Not authenticated with Google Drive');
      }

      const authResult = await googleAuthManager.restoreAuth();
      if (!authResult?.success) {
        throw new Error('Failed to restore Google Drive authentication');
      }

      const folderId = await googleDriveClient.getOrCreateInvoiceFolder();
      const files = await googleDriveClient.listFiles(folderId);

      return files.map(file => ({
        id: file.id,
        name: file.name,
        modifiedTime: new Date(file.modifiedTime),
        size: file.size
      }));

    } catch (error) {
      console.error('Error listing backup files:', error);
      return [];
    }
  }
}

// Export singleton instance
export const backupSyncManager = new BackupSyncManager();
export default BackupSyncManager;
