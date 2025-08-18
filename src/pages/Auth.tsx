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
  const [email, setEmail] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (signInError) {
        throw signInError;
      }
      
      toast({
        title: "Magic link sent!",
        description: "Check your email inbox for the login link.",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8">
        <span className="text-primary-foreground font-bold text-4xl">F</span>
      </div>
      
      <div className="max-w-sm w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Welcome to Fits</h1>
            <p className="text-muted-foreground">Enter your email to get started</p>
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
            {loading ? "Sending Magic Link..." : "Send Magic Link"}
          </Button>
        </form>
      </div>
    </div>
  );
}