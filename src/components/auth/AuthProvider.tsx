import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] Setting up Supabase authentication v2');
    
    // Clear any legacy dev mode data
    localStorage.removeItem('direct_access');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('dev_bypass');

    // Universal auth hash catcher: redirect any route with tokens to /auth/callback
    try {
      const hash = window.location.hash || '';
      const path = window.location.pathname || '/';
      if ((hash.includes('access_token=') || hash.includes('refresh_token=')) && !path.startsWith('/auth/callback')) {
        console.log('[AuthProvider] Detected auth tokens in hash - redirecting to /auth/callback');
        window.location.replace(`/auth/callback${hash}`);
        return;
      }
    } catch (err) {
      console.error('[AuthProvider] Error handling auth hash redirect', err);
    }
    
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthProvider] Auth state changed', { 
          event, 
          hasSession: !!session, 
          userEmail: session?.user?.email,
          userId: session?.user?.id 
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthProvider] Error getting session:', error);
      }
      console.log('[AuthProvider] Initial session check', { 
        hasSession: !!session, 
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        error: error?.message
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('[AuthProvider] Signing out from Supabase');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthProvider] Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
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