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
  const [mode, setMode] = useState<'login' | 'dev'>('login');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authMode, isDevMode } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (authMode === 'supabase' || authMode === 'dev') {
      navigate('/dashboard');
    }
  }, [authMode, navigate]);

  const handleSupabaseLogin = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
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

  const handleDevAccess = () => {
    if (!isDevMode) {
      toast({
        title: "Dev mode not available",
        description: "Development access is only available in dev mode.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Set up dev access
    localStorage.setItem('user_email', email || 'fitzeric97@gmail.com');
    localStorage.setItem('user_id', 'eec9fa4a-8e91-4ef7-9469-099426cbbad6');
    localStorage.setItem('direct_access', 'true');
    
    toast({
      title: "Dev Access Enabled",
      description: "Accessing development account.",
    });
    
    navigate('/dashboard');
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

        {mode === 'login' && (
          <>
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

            {isDevMode && (
              <Button 
                onClick={() => setMode('dev')}
                variant="outline"
                className="w-full h-12 text-lg"
              >
                Developer Access
              </Button>
            )}
          </>
        )}

        {mode === 'dev' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="dev-email" className="text-lg">Dev Email (Optional)</Label>
              <Input
                id="dev-email"
                type="email"
                placeholder="fitzeric97@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <Button 
              onClick={handleDevAccess}
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? "Connecting..." : "Access Dev Account"}
            </Button>

            <Button 
              onClick={() => setMode('login')}
              variant="outline"
              className="w-full h-12 text-lg"
            >
              Back to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
