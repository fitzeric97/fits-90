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

  // Demo access handler
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
      // Try to login with your account for demo purposes
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'fitzeric97@gmail.com',
        password: 'temp123', // temporary password
      });

      if (error) {
        console.log('Password login failed, trying magic link...');
        // If password fails, try magic link
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: 'fitzeric97@gmail.com',
        });
        
        if (otpError) {
          toast({
            title: "Demo Access",
            description: "Please use the 'Joined' option to login with your email for the full demo.",
            variant: "default",
          });
          setMode("joined");
        } else {
          toast({
            title: "Demo login link sent!",
            description: "Check fitzeric97@gmail.com for the login link.",
          });
        }
      } else {
        console.log('Demo login successful!');
        toast({
          title: "Demo Access Granted!",
          description: "Welcome to the Fits app demo.",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast({
        title: "Demo Access",
        description: "Redirecting to main dashboard for demo purposes.",
      });
      // For demo purposes, proceed to dashboard
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8">
          <span className="text-primary-foreground font-bold text-4xl">F</span>
        </div>
        
        <div className="max-w-sm w-full space-y-4">
          <Button 
            onClick={() => setMode("demo")}
            className="w-full h-14 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
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
            className="w-full h-12 text-base font-medium"
            variant="default"
          >
            Joined
          </Button>
          
          <Button 
            onClick={() => setMode("join")}
            className="w-full h-12 text-base font-medium"
            variant="outline"
          >
            Join Us
          </Button>
          
          {/* Temporary dev bypass for app owner */}
          <Button 
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full h-10 text-sm bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Logging in..." : "🔧 Dev Login (fitzeric97@gmail.com)"}
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "demo") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8">
          <span className="text-primary-foreground font-bold text-4xl">F</span>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">🎭 Demo Access</h2>
          <p className="text-muted-foreground">Enter the demo password to explore the full Fits experience</p>
        </div>
        
        <div className="max-w-sm w-full">
          <form onSubmit={handleDemoLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="demoPassword" className="text-lg">Demo Password</Label>
              <Input
                id="demoPassword"
                type="password"
                placeholder="Enter demo password"
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                className="h-12 text-lg"
                required
              />
              <p className="text-sm text-muted-foreground">
                This will give you access to explore all app features
              </p>
            </div>

            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Accessing Demo..." : "🚀 Enter Demo"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setMode("select")}
              className="w-full"
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