import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

export default function GmailCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const handleGmailCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // Check if this is a Google OAuth callback (user is already authenticated)
        if (user && user.email) {
          console.log('Google OAuth user detected:', user.email);
          
          // Generate @fits.co email from user's Google email
          const fitsEmail = user.email.replace('@gmail.com', '@fits.co');
          
          // Update profile with Gmail address and generated @fits.co email
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              gmail_address: user.email,
              myfits_email: fitsEmail,
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Profile update error:', profileError);
          }

          // Start email scanning with user's ID
          const { data: scanData, error: scanError } = await supabase.functions.invoke('scan-gmail', {
            body: {
              userId: user.id,
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

          navigate('/home');
          return;
        }

        // Handle direct Gmail OAuth flow (legacy)
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

        // Sign in the user with the @fits.co email
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: fitsEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          }
        });

        if (signInError) {
          throw signInError;
        }

        navigate('/home');

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
  }, [navigate, toast, user]);

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