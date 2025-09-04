/**
 * iOS-optimized Supabase client with enhanced session persistence
 * Extends the base Supabase client with iOS PWA-specific storage handling
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { iosStorageAdapter } from './storage/ios-storage-adapter';

const SUPABASE_URL = "https://ijawvesjgyddyiymiahk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYXd2ZXNqZ3lkZHlpeW1pYWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzQ2MzgsImV4cCI6MjA3MDAxMDYzOH0.ZFG9EoTGU_gar6cGnu4LYAcsfRXtQQ0yLeq7E3g0CE4";

// Custom storage interface that Supabase expects
const customStorage = {
  getItem: (key: string): string | null => {
    return iosStorageAdapter.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    iosStorageAdapter.setItem(key, value);
  },
  removeItem: (key: string): void => {
    iosStorageAdapter.removeItem(key);
  }
};

// Create the enhanced Supabase client
export const supabaseIOS = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: customStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Detect session recovery issues and handle gracefully
    detectSessionInUrl: true,
    // More aggressive token refresh for PWA
    flowType: 'pkce'
  }
});

// Enhanced session management utilities
export class IOSSessionManager {
  private static readonly AUTH_BACKUP_KEY = 'fits-auth-backup';
  private static readonly SESSION_CHECK_INTERVAL = 30000; // 30 seconds
  private checkInterval: NodeJS.Timeout | null = null;

  static async initializeSession(): Promise<void> {
    try {
      // Check storage health
      const health = iosStorageAdapter.checkStorageHealth();
      console.log('Storage health check:', health);

      // Try to recover session from IndexedDB if localStorage failed
      if (!health.localStorage && health.indexedDB) {
        await this.recoverSessionFromIndexedDB();
      }

      // Create backup of current session
      const { data: { session } } = await supabaseIOS.auth.getSession();
      if (session) {
        await this.backupSession(session);
      }

    } catch (error) {
      console.warn('Session initialization warning:', error);
    }
  }

  static async recoverSessionFromIndexedDB(): Promise<boolean> {
    try {
      const sessionData = await iosStorageAdapter.getItemAsync('supabase.auth.token');
      if (sessionData) {
        // Manually set the session in localStorage if it's available
        if (iosStorageAdapter.checkStorageHealth().localStorage) {
          localStorage.setItem('supabase.auth.token', sessionData);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to recover session from IndexedDB:', error);
    }
    return false;
  }

  static async backupSession(session: any): Promise<void> {
    try {
      const backup = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: {
          id: session.user?.id,
          email: session.user?.email
        },
        timestamp: Date.now()
      };

      iosStorageAdapter.setItem(this.AUTH_BACKUP_KEY, JSON.stringify(backup));
    } catch (error) {
      console.warn('Failed to backup session:', error);
    }
  }

  static async attemptSessionRecovery(): Promise<boolean> {
    try {
      // First try IndexedDB recovery
      const recovered = await this.recoverSessionFromIndexedDB();
      if (recovered) return true;

      // Try backup recovery
      const backupData = await iosStorageAdapter.getItemAsync(this.AUTH_BACKUP_KEY);
      if (backupData) {
        const backup = JSON.parse(backupData);
        
        // Check if backup is not too old (24 hours)
        if (Date.now() - backup.timestamp < 24 * 60 * 60 * 1000) {
          // Attempt to refresh the session with the backed up refresh token
          const { data, error } = await supabaseIOS.auth.refreshSession({
            refresh_token: backup.refresh_token
          });

          if (data.session && !error) {
            await this.backupSession(data.session);
            return true;
          }
        }
      }
    } catch (error) {
      console.warn('Session recovery failed:', error);
    }
    return false;
  }

  static startSessionMonitoring(): void {
    // Stop any existing monitoring
    this.stopSessionMonitoring();

    this.checkInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabaseIOS.auth.getSession();
        
        if (!session && !error) {
          // Session lost - attempt recovery
          const recovered = await this.attemptSessionRecovery();
          if (!recovered) {
            console.warn('Session lost and recovery failed');
            // Could emit event here for UI to handle
          }
        } else if (session) {
          // Update backup with fresh session
          await this.backupSession(session);
        }
      } catch (error) {
        console.warn('Session monitoring error:', error);
      }
    }, this.SESSION_CHECK_INTERVAL);
  }

  static stopSessionMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  static getStorageHealth() {
    return iosStorageAdapter.checkStorageHealth();
  }
}

// Auto-initialize session management
IOSSessionManager.initializeSession().then(() => {
  IOSSessionManager.startSessionMonitoring();
});

// Enhanced client for iOS PWA
export { supabaseIOS as supabase };