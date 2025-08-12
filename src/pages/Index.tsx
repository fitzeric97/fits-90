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
  console.log('Index component rendering...');
  
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
  
  console.log('Index component state:', { mode, user, loading });

  // Check for auth tokens in URL hash and process them
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      console.log('Auth tokens found in URL, processing...');
      
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error setting session:', error);
        } else if (data.session) {
          console.log('Session set successfully, redirecting to dashboard');
          // Clear the hash and redirect
          window.location.hash = '';
          navigate('/dashboard');
        }
      });
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  // Remove myfits email generation - use regular email  
  const generateMyFitsEmail = (email: string): string => {
    return email; // Just return the original email
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
      // First try to sign up the user to check if they already exist
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: Math.random().toString(36),
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: {
            first_name: firstName,
            last_name: lastName,
            gmail_address: email,
            myfits_email: generateMyFitsEmail(email)
          }
        },
      });

      // Check if user already exists
      if (signUpError && signUpError.message.includes('already registered')) {
        setError("This email is already registered. Please use the 'Joined' option to sign in.");
        setTimeout(() => {
          setMode("joined");
          setLoginEmail(email);
          setError("");
        }, 2000);
        return;
      }

      if (signUpError) {
        throw signUpError;
      }

      // Store signup data for later use
      localStorage.setItem('pendingSignupData', JSON.stringify({
        firstName,
        lastName,
        email,
        myfitsEmail: generateMyFitsEmail(email)
      }));

      // Send signup notification
      try {
        await supabase.functions.invoke('send-signup-notification', {
          body: { email, firstName, lastName }
        });
      } catch (notificationError) {
        console.log('Signup notification failed:', notificationError);
        // Don't fail the signup if notification fails
      }

      // Now send OTP for login
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        }
      });
      
      if (otpError) {
        throw otpError;
      }
      
      toast({
        title: "Welcome to Fits!",
        description: "Check your email for the login link to complete your account setup.",
      });
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
          emailRedirectTo: `${window.location.origin}/home`,
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
        <div className="w-72 h-72 flex items-center justify-center mb-8">
          <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fits Logo" className="w-72 h-72 object-contain" />
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
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 flex items-center justify-center mb-8">
          <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fits Logo" className="w-24 h-24 object-contain" />
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
        <div className="w-32 h-32 flex items-center justify-center mb-8">
          <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fits Logo" className="w-32 h-32 object-contain" />
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
              
              {/* Dev login for fitzeric97@gmail.com */}
              {loginEmail === "fitzeric97@gmail.com" && (
                <Button 
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      localStorage.setItem('dev_bypass', 'true');
                      navigate('/dashboard');
                    } catch (error) {
                      console.error('Dev bypass error:', error);
                      navigate('/dashboard');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  🔧 Quick Access (Dev Mode)
                </Button>
              )}
            </form>
            
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
