import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Auth() {
  const [gmailAddress, setGmailAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is already logged in
    if (user) {
      navigate("/dashboard");
    }

  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    console.log('Google Sign In clicked - starting OAuth flow');
    setLoading(true);
    setError("");

    try {
      console.log('Initiating Supabase Google OAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'https://www.googleapis.com/auth/gmail.readonly openid email profile'
          }
        }
      });

      console.log('OAuth result:', { error });

      if (error) {
        console.error('Supabase OAuth error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('handleGoogleSignIn error:', error);
      setError(error.message);
      setLoading(false);
    }
  };



  const generateMyFitsEmail = (gmailAddress: string): string => {
    // Extract username from Gmail address and create myfits.co email
    const username = gmailAddress.split('@')[0];
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${cleanUsername}@myfits.co`;
  };

  const handleGmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gmailAddress || !gmailAddress.includes('@gmail.com')) {
      setError("Please enter a valid Gmail address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use the actual Gmail address for authentication
      // Create user with their Gmail address  
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: gmailAddress,
        password: Math.random().toString(36), // Generate random password they'll never need
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            gmail_address: gmailAddress,
            myfits_email: generateMyFitsEmail(gmailAddress),
          }
        },
      });

      if (authError) {
        // If user already exists, try to sign them in
        if (authError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email: gmailAddress,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
            }
          });
          
          if (signInError) {
            throw signInError;
          }
          
          toast({
            title: "Login link sent!",
            description: `Check your Gmail inbox for the login link.`,
          });
        } else {
          throw authError;
        }
      } else {
        console.log('User signed up successfully, redirecting to dashboard');
        toast({
          title: "Account created!",
          description: "Check your email for the login link.",
        });
        // Don't initiate Gmail OAuth here, let them complete email verification first
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-bold">Welcome to Fits</h1>
          <p className="text-muted-foreground mt-2">
            Enter your Gmail to get started and receive your @myfits.co email
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Connect Your Gmail
            </CardTitle>
            <CardDescription>
              We'll scan your promotional emails and create your personal @myfits.co address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gmail">Your Gmail Address</Label>
                <Input
                  id="gmail"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  required
                />
              </div>
              
              {gmailAddress && gmailAddress.includes('@gmail.com') && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Your Fits email will be:</p>
                  <p className="font-mono text-sm font-medium text-primary">
                    {generateMyFitsEmail(gmailAddress)}
                  </p>
              </div>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={handleGoogleSignIn} 
                  disabled={loading}
                  className="w-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? "Connecting..." : "Continue with Google"}
                </Button>


                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading} variant="outline">
                {loading ? (
                  "Setting up your account..."
                ) : (
                  <>
                    Continue with Email
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    How it works
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                  <span>We connect to your Gmail and scan promotional emails</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">2</span>
                  <span>You get a personal @myfits.co email address</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">3</span>
                  <span>Add items via link to your likes and closet to share your style</span>
                </div>
              </div>
            </div>

            {error && (
              <Alert className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}