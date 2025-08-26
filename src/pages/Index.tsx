import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to home
        navigate('/home', { replace: true });
      }
      // Don't redirect unauthenticated users - show auth screen instead
    }
  }, [user, loading, navigate]);

  // Show loading screen while determining auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-foreground"></div>
      </div>
    );
  }

  // Show brown login screen for unauthenticated users
  if (!user) {
    return <AuthScreen />;
  }

  return null;
};

// Brown login screen component with email input and preview mode
function AuthScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (signInError) {
        throw signInError;
      }
      
      toast({
        title: "Login link sent!",
        description: "Check your email inbox for the login link.",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="w-24 h-24 flex items-center justify-center mb-8">
        <img 
          src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
          alt="Fits Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="max-w-sm w-full space-y-4">
        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary-foreground text-lg">
              Enter your email to continue
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-lg bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
              required
            />
          </div>

          {error && (
            <Alert className="bg-destructive/10 border-destructive/20">
              <AlertDescription className="text-primary-foreground">{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            disabled={loading}
          >
            {loading ? "Sending login link..." : "Continue with Email"}
          </Button>
        </form>
        
        {/* Preview Mode Option */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-primary-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-primary px-2 text-primary-foreground/60">or</span>
          </div>
        </div>
        
        <Button 
          onClick={() => navigate('/preview')}
          className="w-full h-14 text-lg font-medium bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
          variant="outline"
        >
          Browse in Preview Mode
        </Button>
        
        <p className="text-center text-sm text-primary-foreground/60 mt-6">
          Preview mode lets you explore the app without an account
        </p>
      </div>
    </div>
  );
}

export default Index;
