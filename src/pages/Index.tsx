import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

const Index = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"select" | "join" | "joined">("select");
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

  const generateMyFitsEmail = (email: string): string => {
    const username = email.split('@')[0];
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${cleanUsername}@myfits.co`;
  };

  const handleJoinUs = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name");
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
        lastName,
        email
      }));

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: Math.random().toString(36),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
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
          title: "Welcome to Fitz!",
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'openid email profile'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 flex items-center justify-center mb-8">
          <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fitz Logo" className="w-24 h-24 object-contain" />
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
            Create Account + @myfits.co Email
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 flex items-center justify-center mb-8">
          <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fitz Logo" className="w-24 h-24 object-contain" />
        </div>
        
        <div className="max-w-sm w-full">
          <form onSubmit={handleJoinUs} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-lg">First Name</Label>
              <Input
                id="firstName"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-lg">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
              {loading ? "Creating Account..." : "Join Fitz"}
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
        <div className="w-[54rem] h-[54rem] flex items-center justify-center mb-8">
          <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fitz Logo" className="w-[54rem] h-[54rem] object-contain" />
        </div>
        
        <div className="max-w-sm w-full">
          <div className="space-y-6">
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
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            
            <Button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 text-lg bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? "Connecting..." : "Continue with Google"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setMode("select")}
              className="w-full"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
