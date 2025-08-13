import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, authMode, isDevMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[ProtectedRoute] Auth check', { 
      loading, 
      authMode, 
      isDevMode, 
      hasUser: !!user 
    });

    if (!loading) {
      if (authMode === 'unauthenticated') {
        console.log('[ProtectedRoute] Unauthenticated - redirecting to auth');
        navigate("/");
      } else if (authMode === 'dev' && !isDevMode) {
        console.log('[ProtectedRoute] Dev mode access in production - redirecting to auth');
        navigate("/");
      }
    }
  }, [user, loading, authMode, isDevMode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-primary-foreground font-bold text-2xl">F</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state for future guest mode provision
  if (authMode === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive-foreground font-bold text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access this content.</p>
          <p className="text-sm text-muted-foreground">Guest mode coming soon...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}