import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, IOSSessionManager } from "@/lib/supabase-ios-client";
import { serviceWorkerManager } from "@/lib/service-worker";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  storageHealth: ReturnType<typeof IOSSessionManager.getStorageHealth> | null;
  attemptRecovery: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageHealth, setStorageHealth] = useState<ReturnType<typeof IOSSessionManager.getStorageHealth> | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Initialize storage health check
    setStorageHealth(IOSSessionManager.getStorageHealth());
    
    // Clear any legacy dev mode data
    try {
      localStorage.removeItem('direct_access');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('dev_bypass');
    } catch (error) {
      console.warn('Failed to clear legacy data:', error);
    }

    // Universal auth hash catcher: redirect any route with tokens to /auth/callback
    try {
      const hash = window.location.hash || '';
      const path = window.location.pathname || '/';
      if ((hash.includes('access_token=') || hash.includes('refresh_token=')) && !path.startsWith('/auth/callback')) {
        window.location.replace(`/auth/callback${hash}`);
        return;
      }
    } catch (err) {
      console.warn('Hash redirect error:', err);
    }
    
    // Enhanced auth state listener with recovery logic
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        
        if (event === 'SIGNED_OUT' && !session) {
          // Attempt recovery before setting signed out state
          const recovered = await IOSSessionManager.attemptSessionRecovery();
          if (recovered) {
            console.log('Session recovered after sign out');
            return; // Don't update state, let the recovery trigger a new event
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Update storage health after auth changes
        setStorageHealth(IOSSessionManager.getStorageHealth());
        
        // Notify service worker of session updates
        if (session) {
          serviceWorkerManager.notifyAuthSessionUpdate({
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at,
            timestamp: Date.now()
          });
        }
      }
    );

    // Enhanced session initialization
    const initializeAuth = async () => {
      try {
        // First attempt to get session normally
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!session && !error) {
          // No session found - attempt recovery
          console.log('No session found, attempting recovery...');
          const recovered = await IOSSessionManager.attemptSessionRecovery();
          
          if (recovered) {
            // Recovery successful - get the restored session
            const { data: { session: recoveredSession } } = await supabase.auth.getSession();
            if (mounted) {
              setSession(recoveredSession);
              setUser(recoveredSession?.user ?? null);
            }
          }
        } else if (session) {
          // Session exists normally
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
        
        if (mounted) {
          setLoading(false);
          setStorageHealth(IOSSessionManager.getStorageHealth());
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for service worker auth refresh requests
    const handleServiceWorkerAuthRefresh = async () => {
      if (mounted) {
        console.log('Service Worker requested auth refresh');
        await IOSSessionManager.attemptSessionRecovery();
      }
    };

    window.addEventListener('sw-auth-refresh-required', handleServiceWorkerAuthRefresh);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('sw-auth-refresh-required', handleServiceWorkerAuthRefresh);
    };
  }, []);

  const signOut = async () => {
    // Clear all storage layers on sign out
    try {
      await supabase.auth.signOut();
      // Also clear our backup storage
      const keys = ['fits-auth-backup'];
      keys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to clear storage key:', key, error);
        }
      });
      // Clear service worker auth cache
      await serviceWorkerManager.clearAuthCache();
    } catch (error) {
      console.warn('Sign out error:', error);
    }
  };

  const attemptRecovery = async (): Promise<boolean> => {
    const recovered = await IOSSessionManager.attemptSessionRecovery();
    if (recovered) {
      // Update storage health after recovery
      setStorageHealth(IOSSessionManager.getStorageHealth());
    }
    return recovered;
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    storageHealth,
    attemptRecovery,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}