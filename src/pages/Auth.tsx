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
  const [mode, setMode] = useState<"select" | "join" | "joined">("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const generateMyFitsEmail = (email: string): string => {
    const username = email.split('@')[0];
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${cleanUsername}@myfits.co`;
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
          emailRedirectTo: `${window.location.origin}/dashboard`,
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
          emailRedirectTo: `${window.location.origin}/dashboard`,
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
      // Create a temporary session for the app owner
      const { error } = await supabase.auth.signInWithOtp({
        email: 'fitzeric97@gmail.com',
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        }
      });
      
      if (error) {
        // If OTP fails, try direct navigation as fallback
        console.log('OTP failed, creating manual session...');
        navigate('/home');
      } else {
        toast({
          title: "Dev login link sent!",
          description: "Check your email for the login link, or try refreshing in a moment.",
        });
      }
    } catch (error: any) {
      console.error('Dev login error:', error);
      // Fallback: direct navigation
      navigate('/home');
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
            onClick={() => setMode("joined")}
            className="w-full h-14 text-lg font-medium"
            variant="default"
          >
            Joined
          </Button>
          
          <Button 
            onClick={() => setMode("join")}
            className="w-full h-14 text-lg font-medium"
            variant="outline"
          >
            Join Us
          </Button>
          
          {/* Temporary dev bypass for app owner */}
          <Button 
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full h-12 text-sm bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Logging in..." : "🔧 Dev Login (fitzeric97@gmail.com)"}
          </Button>
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