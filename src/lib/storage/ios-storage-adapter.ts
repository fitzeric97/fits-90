/**
 * iOS-optimized storage adapter for PWA authentication persistence
 * Provides multiple fallback mechanisms for iOS Safari's aggressive storage cleanup
 */

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class IOSStorageAdapter implements StorageAdapter {
  private isIOSPWA(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      window.matchMedia('(display-mode: standalone)').matches
    );
  }

  private async initIndexedDB(): Promise<IDBDatabase | null> {
    if (!window.indexedDB) return null;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FitsAuthStorage', 1);
      
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth');
        }
      };
    });
  }

  private async getFromIndexedDB(key: string): Promise<string | null> {
    try {
      const db = await this.initIndexedDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const transaction = db.transaction(['auth'], 'readonly');
        const store = transaction.objectStore('auth');
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async setToIndexedDB(key: string, value: string): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      if (!db) return;

      const transaction = db.transaction(['auth'], 'readwrite');
      const store = transaction.objectStore('auth');
      store.put(value, key);
    } catch {
      // Silently fail - this is a fallback mechanism
    }
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      if (!db) return;

      const transaction = db.transaction(['auth'], 'readwrite');
      const store = transaction.objectStore('auth');
      store.delete(key);
    } catch {
      // Silently fail
    }
  }

  private testStorage(storage: Storage): boolean {
    try {
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    // Try localStorage first
    if (this.testStorage(localStorage)) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) return value;
      } catch {
        // Continue to next fallback
      }
    }

    // Try sessionStorage as fallback
    if (this.testStorage(sessionStorage)) {
      try {
        const value = sessionStorage.getItem(key);
        if (value !== null) return value;
      } catch {
        // Continue to next fallback
      }
    }

    // IndexedDB fallback will be handled asynchronously
    return null;
  }

  async getItemAsync(key: string): Promise<string | null> {
    // Try synchronous storage first
    const syncValue = this.getItem(key);
    if (syncValue !== null) return syncValue;

    // Try IndexedDB fallback
    return await this.getFromIndexedDB(key);
  }

  setItem(key: string, value: string): void {
    // Store in multiple locations for redundancy
    const isIOS = this.isIOSPWA();

    // Always try localStorage first
    if (this.testStorage(localStorage)) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Storage quota exceeded - clean up old data
        this.cleanupOldData();
        try {
          localStorage.setItem(key, value);
        } catch {
          // Still failing, continue to fallbacks
        }
      }
    }

    // On iOS PWA, also store in sessionStorage for immediate fallback
    if (isIOS && this.testStorage(sessionStorage)) {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // Continue to IndexedDB
      }
    }

    // Store in IndexedDB for long-term persistence
    this.setToIndexedDB(key, value);
  }

  removeItem(key: string): void {
    // Remove from all storage locations
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }

    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore errors
    }

    this.removeFromIndexedDB(key);
  }

  private cleanupOldData(): void {
    try {
      // Remove non-auth related data to free space
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.') || 
        key.startsWith('sb-') ||
        key === 'fits-auth-backup'
      );

      // Keep only auth keys, remove everything else
      Object.keys(localStorage).forEach(key => {
        if (!authKeys.includes(key)) {
          try {
            localStorage.removeItem(key);
          } catch {
            // Ignore cleanup errors
          }
        }
      });
    } catch {
      // Ignore cleanup errors
    }
  }

  // Health check method
  checkStorageHealth(): {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    isIOSPWA: boolean;
  } {
    return {
      localStorage: this.testStorage(localStorage),
      sessionStorage: this.testStorage(sessionStorage),
      indexedDB: !!window.indexedDB,
      isIOSPWA: this.isIOSPWA(),
    };
  }
}

export const iosStorageAdapter = new IOSStorageAdapter();