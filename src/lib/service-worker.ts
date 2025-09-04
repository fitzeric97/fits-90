/**
 * Service Worker registration and communication utilities
 * Handles PWA functionality and offline auth support
 */

interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isRegistered = false;

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.registration = registration;
      this.isRegistered = true;

      console.log('Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker installed, reload recommended');
              // Could emit event here for UI to show update notification
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  private handleServiceWorkerMessage(message: ServiceWorkerMessage) {
    const { type, payload } = message;

    switch (type) {
      case 'AUTH_TOKEN_REFRESH_REQUIRED':
        console.log('Service Worker requesting auth token refresh');
        // Emit custom event for auth system to handle
        window.dispatchEvent(new CustomEvent('sw-auth-refresh-required', {
          detail: payload
        }));
        break;

      default:
        console.log('Unknown service worker message:', type, payload);
    }
  }

  async sendMessage(message: ServiceWorkerMessage): Promise<void> {
    if (!this.isRegistered || !navigator.serviceWorker.controller) {
      console.warn('Service Worker not available for messaging');
      return;
    }

    try {
      navigator.serviceWorker.controller.postMessage(message);
    } catch (error) {
      console.error('Failed to send message to Service Worker:', error);
    }
  }

  async notifyAuthSessionUpdate(sessionData: any): Promise<void> {
    await this.sendMessage({
      type: 'AUTH_SESSION_UPDATE',
      payload: sessionData
    });
  }

  async clearAuthCache(): Promise<void> {
    await this.sendMessage({
      type: 'CLEAR_AUTH_CACHE'
    });
  }

  async skipWaiting(): Promise<void> {
    await this.sendMessage({
      type: 'SKIP_WAITING'
    });
  }

  // Check if we're running as a PWA
  isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  // Check if we're on iOS
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Check if we're on iOS Safari PWA
  isIOSPWA(): boolean {
    return this.isIOS() && this.isPWA();
  }

  // Get installation prompt
  getInstallPrompt(): any {
    return (window as any).deferredPrompt;
  }

  // Handle PWA install prompt
  async promptInstall(): Promise<boolean> {
    const deferredPrompt = this.getInstallPrompt();
    
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      
      // Clear the prompt
      (window as any).deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register service worker
if (typeof window !== 'undefined') {
  serviceWorkerManager.register().then((registered) => {
    if (registered) {
      console.log('Service Worker auto-registered successfully');
    }
  });

  // Handle install prompt
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    (window as any).deferredPrompt = event;
    console.log('Install prompt captured');
  });

  // Handle app installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    (window as any).deferredPrompt = null;
  });
}