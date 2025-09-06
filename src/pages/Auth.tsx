import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Auth() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [demoPassword, setDemoPassword] = useState("");
  const [mode, setMode] = useState<"select" | "join" | "joined" | "demo">("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Remove myfits email generation - use regular email
  const generateMyFitsEmail = (email: string): string => {
    return email; // Just return the original email
  };

  const handleJoinUs = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      setError("Please enter your name");
      return;
    }
    
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      localStorage.setItem('pendingSignupData', JSON.stringify({
        firstName,
        email
      }));

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: Math.random().toString(36),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            gmail_address: email,
            myfits_email: generateMyFitsEmail(email)
          }
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError("This email is already registered. Please use the 'Joined' option to sign in.");
        } else {
          throw authError;
        }
      } else {
        toast({
          title: "Welcome to Fits!",
          description: "Check your email for the login link.",
        });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoined = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginEmail.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: loginEmail,
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

  // Temporary dev bypass for the app owner
  const handleDevLogin = async () => {
    setLoading(true);
    try {
      console.log('Starting dev login process...');
      
      // Try password login first (your existing account)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'fitzeric97@gmail.com',
        password: 'temp123', // temporary password
      });
      
      if (error) {
        console.log('Password login failed, trying magic link...');
        // If that fails, try magic link
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: 'fitzeric97@gmail.com',
        });
        
        if (otpError) {
          console.log('Magic link failed, navigating directly...');
          // Last resort: direct navigation to skip auth
          localStorage.setItem('dev_bypass', 'true');
          navigate('/dashboard');
        } else {
          toast({
            title: "Login link sent!",
            description: "Check your email for the login link.",
          });
        }
      } else {
        console.log('Login successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Dev login error:', error);
      localStorage.setItem('dev_bypass', 'true');
      navigate('/dashboard');
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
        password: 'temp123', // Use your actual password here
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
        password: 'fits2024!', // Alternative password
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
      // Create a demo session by setting up minimal auth state
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

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-3xl flex items-center justify-center mb-6 sm:mb-8">
          <span className="text-primary-foreground font-bold text-3xl sm:text-4xl">F</span>
        </div>
        
        <div className="max-w-sm w-full space-y-3 sm:space-y-4">
          <Button 
            onClick={() => setMode("demo")}
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white touch-manipulation"
          >
            🎭 Demo Access
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Button 
            onClick={() => setMode("joined")}
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium touch-manipulation"
            variant="default"
          >
            Joined
          </Button>
          
          <Button 
            onClick={() => setMode("join")}
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium touch-manipulation"
            variant="outline"
          >
            Join Us
          </Button>
          
          {/* Temporary dev bypass for app owner */}
          <Button 
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full h-9 sm:h-10 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white touch-manipulation"
          >
            {loading ? "Logging in..." : "🔧 Dev Login (fitzeric97@gmail.com)"}
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "demo") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-3xl flex items-center justify-center mb-6 sm:mb-8">
          <span className="text-primary-foreground font-bold text-3xl sm:text-4xl">F</span>
        </div>
        
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">🎭 Demo Access</h2>
          <p className="text-sm sm:text-base text-muted-foreground px-2 mb-2">Enter the demo password to access the full Fits experience</p>
          <p className="text-xs sm:text-sm text-blue-600 font-medium px-2">You'll see real closet items, fits, and all app features with actual data</p>
        </div>
        
        <div className="max-w-sm w-full">
          <form onSubmit={handleDemoLogin} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="demoPassword" className="text-base sm:text-lg">Demo Password</Label>
              <Input
                id="demoPassword"
                type="password"
                placeholder="Enter demo password"
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                className="h-11 sm:h-12 text-base sm:text-lg"
                required
              />
              <p className="text-xs sm:text-sm text-muted-foreground px-1">
                This will log you into the founder's account with real data
              </p>
            </div>

            {error && (
              <Alert>
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 touch-manipulation"
              disabled={loading}
            >
              {loading ? "Accessing Demo..." : "🚀 Enter Demo"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setMode("select")}
              className="w-full touch-manipulation"
            >
              ← Back to Login Options
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8">
          <span className="text-primary-foreground font-bold text-4xl">F</span>
        </div>
        
        <div className="max-w-sm w-full">
          <form onSubmit={handleJoinUs} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-lg">Name</Label>
              <Input
                id="firstName"
                placeholder="Your name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>

            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Join Fits"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setMode("select")}
              className="w-full"
            >
              Back
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === "joined") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8">
          <span className="text-primary-foreground font-bold text-4xl">F</span>
        </div>
        
        <div className="max-w-sm w-full">
          <form onSubmit={handleJoined} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="loginEmail" className="text-lg">Email</Label>
              <Input
                id="loginEmail"
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>

            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? "Sending Login Link..." : "Send Login Link"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setMode("select")}
              className="w-full"
            >
              Back
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}