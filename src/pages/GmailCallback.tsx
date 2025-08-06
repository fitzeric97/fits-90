import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function GmailCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleGmailCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Gmail OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        const stateData = JSON.parse(state);
        const { userId, gmailAddress } = stateData;
        
        // Generate @fits.co email from Gmail address
        const fitsEmail = gmailAddress.replace('@gmail.com', '@fits.co');

        // Exchange code for tokens
        const { data, error: oauthError } = await supabase.functions.invoke('gmail-oauth', {
          body: {
            code,
            userId,
          },
        });

        if (oauthError) {
          throw oauthError;
        }

        // Start email scanning
        const { data: scanData, error: scanError } = await supabase.functions.invoke('scan-gmail', {
          body: {
            userId,
            maxResults: 100,
          },
        });

        if (scanError) {
          console.error('Scan error:', scanError);
          // Don't throw here - let them access dashboard even if scan fails
        }

        toast({
          title: "Welcome to Fits!",
          description: `Your @fits.co email is ready! We've scanned ${scanData?.processed || 0} promotional emails.`,
        });

        // Sign in the user
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: fitsEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          }
        });

        if (signInError) {
          throw signInError;
        }

        navigate('/dashboard');

      } catch (error: any) {
        console.error('Gmail callback error:', error);
        toast({
          title: "Setup Error",
          description: error.message || "Failed to complete Gmail setup",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleGmailCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto animate-pulse">
          <span className="text-primary-foreground font-bold text-2xl">F</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Setting up your Fits account...</h1>
          <p className="text-muted-foreground">
            We're scanning your Gmail and creating your @fits.co email
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}