import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

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
          navigate("/");
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
          
          // Update or create basic profile with user's email and display name
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.session.user.id,
              gmail_address: userEmail,
              myfits_email: fitsEmail,
              display_name: `${firstName} ${lastName}`.trim() || data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name,
              first_name: firstName || null,
              last_name: lastName || null,
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

          // Success: proceed directly to dashboard
          toast({
            title: 'Signed in!',
            description: 'Welcome back. Redirecting to your dashboard...',
          });
          navigate('/dashboard');
          
        } else {
          // No session, redirect to unified auth
          navigate("/");
        }
      } catch (error: any) {
        console.error('Callback processing error:', error);
        toast({
          title: "Setup Error",
          description: "Failed to complete setup. Please try again.",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-primary-foreground font-bold text-2xl">F</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Finalizing your sign-in...</h2>
        <p className="text-muted-foreground">Redirecting to your dashboard</p>
        <div className="mt-4 flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}