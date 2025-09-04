/**
 * iOS PWA Support Component
 * Handles iOS-specific errors, storage issues, and provides recovery options
 */

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { serviceWorkerManager } from '@/lib/service-worker';

interface IOSPWASupportProps {
  children: React.ReactNode;
}

interface StorageIssue {
  type: 'quota_exceeded' | 'storage_cleared' | 'service_worker_failed' | 'session_lost';
  message: string;
  recoverable: boolean;
}

export function IOSPWASupport({ children }: IOSPWASupportProps) {
  const { storageHealth, attemptRecovery } = useAuth();
  const [storageIssue, setStorageIssue] = useState<StorageIssue | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Check for iOS PWA specific issues
  useEffect(() => {
    const checkIOSIssues = () => {
      const isIOSPWA = serviceWorkerManager.isIOSPWA();
      const isIOS = serviceWorkerManager.isIOS();
      
      if (!isIOS) return;

      // Check storage health
      if (storageHealth) {
        if (!storageHealth.localStorage && !storageHealth.sessionStorage) {
          setStorageIssue({
            type: 'storage_cleared',
            message: 'Your browser storage was cleared. You may need to sign in again.',
            recoverable: true
          });
        } else if (!storageHealth.indexedDB) {
          console.warn('IndexedDB not available on iOS - reduced offline capabilities');
        }
      }

      // Check if we should suggest installing as PWA
      if (isIOS && !isIOSPWA && !localStorage.getItem('pwa-install-dismissed')) {
        const installPrompt = serviceWorkerManager.getInstallPrompt();
        if (installPrompt) {
          setShowInstallPrompt(true);
        }
      }
    };

    checkIOSIssues();

    // Listen for storage quota exceeded errors
    const handleQuotaExceeded = () => {
      setStorageIssue({
        type: 'quota_exceeded',
        message: 'Storage is full. Some features may not work properly.',
        recoverable: true
      });
    };

    window.addEventListener('quotaexceeded', handleQuotaExceeded);
    
    return () => {
      window.removeEventListener('quotaexceeded', handleQuotaExceeded);
    };
  }, [storageHealth]);

  // Handle storage recovery
  const handleRecovery = async () => {
    setIsRecovering(true);
    
    try {
      switch (storageIssue?.type) {
        case 'storage_cleared':
        case 'session_lost':
          const recovered = await attemptRecovery();
          if (recovered) {
            setStorageIssue(null);
          } else {
            setStorageIssue({
              type: 'session_lost',
              message: 'Unable to recover your session. Please sign in again.',
              recoverable: false
            });
          }
          break;
          
        case 'quota_exceeded':
          // Clear non-essential storage
          try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (!key.startsWith('supabase.') && !key.startsWith('sb-') && key !== 'fits-auth-backup') {
                localStorage.removeItem(key);
              }
            });
            setStorageIssue(null);
          } catch (error) {
            console.error('Failed to clear storage:', error);
          }
          break;
      }
    } catch (error) {
      console.error('Recovery failed:', error);
    }
    
    setIsRecovering(false);
  };

  // Handle PWA installation
  const handleInstallPWA = async () => {
    const success = await serviceWorkerManager.promptInstall();
    if (success) {
      setShowInstallPrompt(false);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <>
      {/* Storage Issue Alert */}
      {storageIssue && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="flex items-center justify-between">
              <span>{storageIssue.message}</span>
              {storageIssue.recoverable && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRecovery}
                    disabled={isRecovering}
                  >
                    {isRecovering ? 'Recovering...' : 'Fix'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStorageIssue(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Install Fits App</p>
                  <p className="text-sm text-gray-600">
                    Install for better performance and offline access
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleInstallPWA}>
                    Install
                  </Button>
                  <Button size="sm" variant="ghost" onClick={dismissInstallPrompt}>
                    Later
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {children}
    </>
  );
}

// Hook for iOS-specific error handling
export function useIOSErrorHandling() {
  const [lastError, setLastError] = useState<string | null>(null);

  const handleIOSError = (error: Error | string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const isIOS = serviceWorkerManager.isIOS();
    
    if (!isIOS) {
      setLastError(errorMessage);
      return;
    }

    // iOS-specific error handling
    if (errorMessage.includes('quotaExceededError') || errorMessage.includes('storage quota')) {
      setLastError('Storage is full. Try clearing some browser data or installing the app.');
      return;
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      setLastError('Network error. Check your connection and try again.');
      return;
    }

    if (errorMessage.includes('oauth') || errorMessage.includes('redirect')) {
      setLastError('Sign-in redirect failed. Try refreshing the page or signing in again.');
      return;
    }

    // Default error handling
    setLastError(errorMessage);
  };

  const clearError = () => setLastError(null);

  return { lastError, handleIOSError, clearError };
}