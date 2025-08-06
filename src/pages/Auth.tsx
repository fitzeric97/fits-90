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

export default function Auth() {
  const [gmailAddress, setGmailAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
      // Generate their myfits.co email
      const myFitsEmail = generateMyFitsEmail(gmailAddress);
      
      // Create user with their myfits.co email (no password needed)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: myFitsEmail,
        password: Math.random().toString(36), // Generate random password they'll never need
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            gmail_address: gmailAddress,
            myfits_email: myFitsEmail,
          }
        },
      });

      if (authError) {
        // If user already exists, try to sign them in
        if (authError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email: myFitsEmail,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
            }
          });
          
          if (signInError) {
            throw signInError;
          }
          
          toast({
            title: "Login link sent!",
            description: `Check your email at ${myFitsEmail} for the login link.`,
          });
        } else {
          throw authError;
        }
      } else {
        // Start Gmail OAuth flow
        await initiateGmailOAuth(authData.user?.id, gmailAddress, myFitsEmail);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const initiateGmailOAuth = async (userId: string | undefined, gmailAddress: string, myFitsEmail: string) => {
    if (!userId) return;

    try {
      // Create Gmail OAuth URL
      const scopes = 'https://www.googleapis.com/auth/gmail.readonly';
      const redirectUri = `${window.location.origin}/auth/gmail/callback`;
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', '285808769366-lqlshgojp9cjesg92dcd5a0ige10si7d.apps.googleusercontent.com');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('login_hint', gmailAddress);
      authUrl.searchParams.set('state', JSON.stringify({ userId, gmailAddress, myFitsEmail }));

      // Redirect to Gmail OAuth
      window.location.href = authUrl.toString();
      
    } catch (error: any) {
      console.error('Gmail OAuth error:', error);
      setError("Failed to connect to Gmail. Please try again.");
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
            Sign in to access your promotional email dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Setting up your account..."
                ) : (
                  <>
                    Get Started
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
                  <span>Use your @myfits.co email for future brand signups</span>
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