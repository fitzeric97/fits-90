/**
 * Service Worker for Fits PWA
 * Provides offline capabilities and enhanced auth session management
 */

const CACHE_NAME = 'fits-pwa-v1';
const STATIC_CACHE = 'fits-static-v1';
const DYNAMIC_CACHE = 'fits-dynamic-v1';

// Critical assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/index.html',
  // Add other critical static assets
];

// API endpoints to cache for offline auth support
const AUTH_ENDPOINTS = [
  'https://ijawvesjgyddyiymiahk.supabase.co/auth/v1/user',
  'https://ijawvesjgyddyiymiahk.supabase.co/auth/v1/token',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE && 
                     cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // Static assets - cache first
    if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      return;
    }

    // Auth endpoints - network first with cache fallback
    if (AUTH_ENDPOINTS.some(endpoint => request.url.startsWith(endpoint))) {
      event.respondWith(networkFirstAuthCache(request));
      return;
    }

    // API requests - network first
    if (url.hostname.includes('supabase.co')) {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
      return;
    }

    // Other GET requests - stale while revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Cache first failed:', error);
    // Return offline fallback if available
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network first fallback to cache:', error);
    const cache = await caches.open(cacheName);
    return cache.match(request) || new Response('Offline', { status: 503 });
  }
}

async function networkFirstAuthCache(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache auth responses for offline recovery
      const cache = await caches.open(DYNAMIC_CACHE);
      // Only cache successful auth responses
      if (request.url.includes('/user') || request.url.includes('/token')) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Auth request failed, checking cache:', error);
    
    // For offline auth recovery, try to return cached auth data
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline indicator to response headers
      const response = cachedResponse.clone();
      response.headers.set('X-Offline-Response', 'true');
      return response;
    }
    
    return new Response(
      JSON.stringify({ error: 'Offline - auth data not available' }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = cache.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || networkResponsePromise || new Response('Offline', { status: 503 });
}

// Handle background sync for auth token refresh
self.addEventListener('sync', (event) => {
  if (event.tag === 'auth-token-refresh') {
    event.waitUntil(handleAuthTokenRefresh());
  }
});

async function handleAuthTokenRefresh() {
  try {
    // Attempt to refresh auth token in background
    console.log('Background auth token refresh triggered');
    
    // Get all clients and notify them to attempt token refresh
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'AUTH_TOKEN_REFRESH_REQUIRED',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.log('Background auth refresh failed:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'AUTH_SESSION_UPDATE':
      // Cache the auth session for offline use
      handleAuthSessionUpdate(payload);
      break;
      
    case 'CLEAR_AUTH_CACHE':
      // Clear auth-related cache
      clearAuthCache();
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

async function handleAuthSessionUpdate(sessionData) {
  try {
    // Store critical auth data for offline recovery
    const cache = await caches.open(DYNAMIC_CACHE);
    const authResponse = new Response(JSON.stringify(sessionData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put('/sw-auth-session', authResponse);
    console.log('Auth session cached for offline use');
  } catch (error) {
    console.log('Failed to cache auth session:', error);
  }
}

async function clearAuthCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const authKeys = ['/sw-auth-session'];
    
    await Promise.all(
      authKeys.map(key => cache.delete(key))
    );
    
    console.log('Auth cache cleared');
  } catch (error) {
    console.log('Failed to clear auth cache:', error);
  }
}