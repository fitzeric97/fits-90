import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2 } from "lucide-react";

export default function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState("Processing Instagram connection...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Instagram authorization failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Instagram');
        }

        if (!user) {
          throw new Error('User not authenticated');
        }

        setStatus("Exchanging authorization code for access token...");

        // Exchange code for access token
        const { data, error: apiError } = await supabase.functions.invoke('instagram-api', {
          body: {
            action: 'exchange_token',
            code: code,
          },
        });

        if (apiError) throw apiError;

        setStatus("Fetching Instagram profile information...");

        // Get user profile from Instagram
        const profileResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch Instagram profile');
        }

        setStatus("Saving connection to your account...");

        // Store the connection in our database
        const { error: dbError } = await (supabase as any)
          .from('instagram_connections')
          .upsert({
            user_id: user.id,
            instagram_username: profileData.username,
            instagram_user_id: profileData.id,
            access_token: data.access_token,
          }, {
            onConflict: 'user_id,instagram_user_id'
          });

        if (dbError) throw dbError;

        toast({
          title: "Instagram Connected!",
          description: `Successfully connected @${profileData.username}`,
        });

        // Redirect back to fits page
        navigate('/fits');

      } catch (error: any) {
        console.error('Instagram callback error:', error);
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect Instagram account",
          variant: "destructive",
        });
        navigate('/fits');
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-primary-foreground font-bold text-2xl">F</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Connecting Instagram</h1>
          <p className="text-muted-foreground">{status}</p>
        </div>

        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>

        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}