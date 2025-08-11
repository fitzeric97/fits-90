import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthRedirectUrl } from "@/lib/auth-utils";

export default function Auth() {
  const [email, setEmail] = useState("");
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send magic link - works for both existing and new users
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: getAuthRedirectUrl('/home'),
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Check your email!",
        description: "We sent you a link to sign in or create your account.",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-32 h-32 flex items-center justify-center mb-8">
        <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fits Logo" className="w-32 h-32 object-contain" />
      </div>
      
      <div className="max-w-sm w-full">
        <form onSubmit={handleEmailSubmit} className="space-y-6">
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
            {loading ? "Sending Link..." : "Continue with Email"}
          </Button>
        </form>
        
        <p className="text-sm text-muted-foreground text-center mt-4">
          We'll send you a link to sign in or create your account
        </p>
      </div>
    </div>
  );
}