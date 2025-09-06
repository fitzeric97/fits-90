import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppleSignIn } from "@/components/auth/AppleSignIn";

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
  const [demoPassword, setDemoPassword] = useState("");
  const [mode, setMode] = useState<"login" | "demo">("login");
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

  // Demo access handler - directly access fitzeric97@gmail.com account
  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!demoPassword) {
      setError("Please enter the demo password");
      return;
    }

    if (demoPassword !== "fits-90") {
      setError("Incorrect demo password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First attempt: Try password login with known credentials
      console.log('Attempting demo login to fitzeric97@gmail.com account...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'fitzeric97@gmail.com',
        password: 'temp123',
      });

      if (data?.user) {
        console.log('Demo login successful - accessing fitzeric97@gmail.com account');
        toast({
          title: "🎭 Demo Access Granted!",
          description: "You're now viewing the full Fits experience with real data.",
        });
        navigate('/dashboard');
        return;
      }

      // Second attempt: Try alternative password
      const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: 'fitzeric97@gmail.com',
        password: 'fits2024!',
      });

      if (data2?.user) {
        console.log('Demo login successful with alternative credentials');
        toast({
          title: "🎭 Demo Access Granted!",
          description: "You're now viewing the full Fits experience with real data.",
        });
        navigate('/dashboard');
        return;
      }

      // Third attempt: Magic link as fallback
      console.log('Password attempts failed, trying magic link...');
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: 'fitzeric97@gmail.com',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (!otpError) {
        toast({
          title: "🎭 Demo Login Link Sent!",
          description: "A magic link has been sent to fitzeric97@gmail.com. Click it to access the demo with real data.",
        });
        setError("Check fitzeric97@gmail.com email for the demo access link");
      } else {
        throw new Error('All authentication methods failed');
      }

    } catch (error: any) {
      console.error('Demo login failed:', error);
      toast({
        title: "🎭 Demo Mode Active",
        description: "Proceeding with limited demo access. Some features may not work without full authentication.",
        variant: "default",
      });
      
      // Store demo flag and proceed
      localStorage.setItem('demo-mode', 'true');
      localStorage.setItem('demo-user', JSON.stringify({
        email: 'fitzeric97@gmail.com',
        id: 'demo-user-id',
        demo: true
      }));
      
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Apple login will be handled by the AppleSignIn component

  if (mode === "demo") {
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
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">🎭 Demo Access</h2>
          <p className="text-primary-foreground/80">Enter the demo password to access the full Fits experience</p>
          <p className="text-sm text-primary-foreground/60 mt-2">You'll see real closet items, fits, and all app features with actual data</p>
        </div>
        
        <div className="max-w-sm w-full">
          <form onSubmit={handleDemoLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="demoPassword" className="text-primary-foreground text-lg">Demo Password</Label>
              <Input
                id="demoPassword"
                type="password"
                placeholder="Enter demo password"
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                className="h-12 text-lg bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                required
              />
              <p className="text-xs text-primary-foreground/60">
                This will log you into the founder's account with real data
              </p>
            </div>

            {error && (
              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertDescription className="text-primary-foreground">{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? "Accessing Demo..." : "🚀 Enter Demo"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setMode("login")}
              className="w-full text-primary-foreground hover:bg-primary-foreground/10"
            >
              ← Back to Login Options
            </Button>
          </form>
        </div>
      </div>
    );
  }

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
        {/* Demo Access Button */}
        <Button 
          onClick={() => setMode("demo")}
          className="w-full h-14 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
        >
          🎭 Demo Access
        </Button>
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-primary-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-primary px-2 text-primary-foreground/60">or continue with</span>
          </div>
        </div>
        
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
        
        {/* Apple Sign-In temporarily disabled - requires Apple Developer setup
        <AppleSignIn
          onLoading={setLoading}
          onError={setError}
          className="h-14 text-lg font-medium"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span>Continue with Apple</span>
        </AppleSignIn>
        -->
        
        {/* Preview Mode Option */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-primary-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-primary px-2 text-primary-foreground/60">or explore without account</span>
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
