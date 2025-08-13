import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDevMode: boolean;
  authMode: 'supabase' | 'dev' | 'unauthenticated';
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Detect dev mode - check for development environment
  const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';

  // Determine authentication mode - moved inside useEffect to avoid dependency issues
  const getAuthMode = (): 'supabase' | 'dev' | 'unauthenticated' => {
    const directAccess = localStorage.getItem('direct_access') === 'true';
    const storedUserId = localStorage.getItem('user_id');
    
    if (session?.user) {
      return 'supabase';
    }
    
    if (isDevMode && directAccess && storedUserId) {
      return 'dev';
    }
    
    return 'unauthenticated';
  };

  useEffect(() => {
    console.log('[AuthProvider] Unified Auth Setup');
    console.log('[AuthProvider] Dev Mode:', isDevMode);
    
    // Clear dev access if not in dev mode
    if (!isDevMode) {
      const hadDirectAccess = localStorage.getItem('direct_access') === 'true';
      if (hadDirectAccess) {
        console.log('[AuthProvider] Clearing dev access - not in dev mode');
        localStorage.removeItem('direct_access');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_email');
      }
    }
    
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthProvider] Supabase auth changed', { 
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
  }, [isDevMode]); // Removed authMode from dependencies to fix circular dependency

  const signOut = async () => {
    const currentAuthMode = getAuthMode();
    console.log('[AuthProvider] Signing out, current mode:', currentAuthMode);
    
    // Clear dev mode data
    if (currentAuthMode === 'dev') {
      localStorage.removeItem('direct_access');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      console.log('[AuthProvider] Cleared dev mode data');
    }
    
    // Sign out from Supabase if in supabase mode
    if (currentAuthMode === 'supabase') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthProvider] Error signing out from Supabase:', error);
      }
    }
  };

  const authMode = getAuthMode(); // Calculate authMode for the return value

  const value = {
    user,
    session,
    loading,
    isDevMode,
    authMode,
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