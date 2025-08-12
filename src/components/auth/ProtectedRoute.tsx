import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Check for dev bypass or stored user email
  const devBypass = localStorage.getItem('dev_bypass') === 'true';
  const storedEmail = localStorage.getItem('user_email');

  useEffect(() => {
    if (!loading && !user && !devBypass && !storedEmail) {
      navigate("/auth");
    }
  }, [user, loading, navigate, devBypass, storedEmail]);

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

  if (!user && !devBypass && !storedEmail) {
    return null;
  }

  return <>{children}</>;
}