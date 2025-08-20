import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PreviewSignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewSignUpModal({ open, onOpenChange }: PreviewSignUpModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a login link to get started.",
      });
      
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Join Fits Today</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground">
            Ready to organize your style and discover new looks? Sign up to get started.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="preview-email">Email</Label>
            <Input
              id="preview-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
            />
          </div>
          
          <Button 
            onClick={handleSignUp}
            className="w-full"
            disabled={loading || !email}
          >
            {loading ? "Sending link..." : "Send Login Link"}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            We'll send you a magic link to sign in - no password needed!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}