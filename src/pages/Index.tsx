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
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle auth tokens in URL fragment and redirect if already authenticated
  useEffect(() => {
    // Check if there are auth tokens in the URL fragment (from magic link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Redirect to auth callback to handle the tokens properly
      const authCallbackUrl = `/auth/callback${window.location.hash}`;
      navigate(authCallbackUrl, { replace: true });
      return;
    }
    
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSupabaseLogin = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      // Always use the current origin for redirect to ensure we're on the right project
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('Using redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a login link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-32 h-32 flex items-center justify-center mb-8">
        <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fits Logo" className="w-32 h-32 object-contain" />
      </div>
      
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Fits</h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
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

        <Button 
          onClick={handleSupabaseLogin}
          className="w-full h-12 text-lg"
          disabled={loading || !email}
        >
          {loading ? "Sending link..." : "Send Login Link"}
        </Button>
      </div>
    </div>
  );
};

export default Index;
