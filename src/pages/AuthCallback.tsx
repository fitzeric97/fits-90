import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    console.log('AuthCallback component mounted');
    const handleAuthCallback = async () => {
      console.log('Starting auth callback processing...');
      try {
        // Handle the OAuth callback
        console.log('Getting session from Supabase...');
        const { data, error } = await supabase.auth.getSession();
        console.log('Session result:', { data: !!data?.session, error });
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        if (data?.session?.user) {
          console.log('User authenticated:', data.session.user.email);
          
          // Check if this is a new user by looking for existing profile
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single();

          const isNewUser = !existingProfile;
          
          // Use the user's actual email instead of generating myfits email
          const userEmail = data.session.user.email || '';
          const fitsEmail = userEmail; // Use the actual email
          
          // Get first and last name from localStorage if available (from signup form)
          const pendingSignupData = localStorage.getItem('pendingSignupData');
          let firstName = '';
          let lastName = '';
          
          if (pendingSignupData) {
            try {
              const signupData = JSON.parse(pendingSignupData);
              firstName = signupData.firstName || '';
              lastName = signupData.lastName || '';
              localStorage.removeItem('pendingSignupData'); // Clean up
            } catch (e) {
              console.error('Error parsing signup data:', e);
            }
          }
          
          // Fallback to metadata if no signup data
          if (!firstName && !lastName) {
            const fullName = data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || '';
            const nameParts = fullName.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // Update or create profile with Gmail address
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.session.user.id,
              gmail_address: userEmail,
              myfits_email: fitsEmail,
              display_name: `${firstName} ${lastName}`.trim() || data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Profile update error:', profileError);
          }

          // Send signup notification email if this is a new user
          if (isNewUser && firstName && lastName) {
            try {
              console.log('Sending signup notification for new user');
              await supabase.functions.invoke('send-signup-notification', {
                body: {
                  email: userEmail,
                  firstName,
                  lastName
                }
              });
              console.log('Signup notification sent successfully');
            } catch (error) {
              console.error('Failed to send signup notification:', error);
              // Don't block signup flow if notification fails
            }
          }

          // Add to connected accounts
          const { error: accountError } = await supabase
            .from('connected_gmail_accounts')
            .upsert({
              user_id: data.session.user.id,
              gmail_address: userEmail,
              display_name: `${firstName} ${lastName}`.trim() || data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name,
              is_primary: true, // First account is primary
            }, {
              onConflict: 'user_id,gmail_address'
            });

          if (accountError) {
            console.error('Connected account error:', accountError);
          }

          // Check if we have the Gmail scope in the provider token
          const providerToken = data.session.provider_token;
          const providerRefreshToken = data.session.provider_refresh_token;
          
          if (providerToken) {
            console.log('Using provider token for Gmail access');
            
            // Store the provider tokens directly for Gmail API access
            const { error: tokenError } = await supabase
              .from('user_gmail_tokens')
              .upsert({
                user_id: data.session.user.id,
                gmail_address: userEmail,
                access_token: providerToken,
                refresh_token: providerRefreshToken || '',
                expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour default
                scope: 'https://www.googleapis.com/auth/gmail.readonly',
              }, {
                onConflict: 'user_id,gmail_address'
              });

            if (tokenError) {
              console.error('Token storage error:', tokenError);
            }

            // Show success and redirect to dashboard
            toast({
              title: "Welcome to Fits!",
              description: "Your account has been set up successfully.",
            });
            
            navigate("/home");
          } else {
            console.log('No provider token found, initiating separate Gmail OAuth');
            // Fallback to separate Gmail OAuth flow
            await initiateGmailOAuth(data.session.user.id, userEmail);
          }
          
        } else {
          // No session, redirect to auth
          navigate("/auth");
        }
      } catch (error: any) {
        console.error('Callback processing error:', error);
        toast({
          title: "Setup Error",
          description: "Failed to complete setup. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  const initiateGmailOAuth = async (userId: string, gmailAddress: string) => {
    try {
      // Create Gmail OAuth URL for API access
      const scopes = 'https://www.googleapis.com/auth/gmail.readonly';
      const redirectUri = 'https://ijawvesjgyddyiymiahk.supabase.co/functions/v1/gmail-oauth';
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', '285808769366-lqlshgojp9cjesg92dcd5a0ige10si7d.apps.googleusercontent.com');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('login_hint', gmailAddress);
      authUrl.searchParams.set('state', JSON.stringify({ 
        userId, 
        gmailAddress,
        isAdditionalAccount: false,
        redirectTo: `${window.location.origin}/dashboard`
      }));

      // Redirect to Gmail OAuth
      window.location.href = authUrl.toString();
      
    } catch (error: any) {
      console.error('Gmail OAuth initiation error:', error);
      toast({
        title: "Gmail Connection Error",
        description: "Failed to connect to Gmail. Please try from Settings.",
        variant: "destructive",
      });
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-primary-foreground font-bold text-2xl">F</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Setting up your account...</h2>
        <p className="text-muted-foreground">Connecting to Gmail and setting up your dashboard</p>
        <div className="mt-4 flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}