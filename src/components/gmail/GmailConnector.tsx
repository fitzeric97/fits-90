import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw } from "lucide-react";

export function GmailConnector() {
  const [connecting, setConnecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const connectGmail = async () => {
    if (!user) return;

    setConnecting(true);
    
    try {
      // Create Gmail OAuth URL  
      const scopes = 'https://www.googleapis.com/auth/gmail.readonly';
      const redirectUri = 'https://ijawvesjgyddyiymiahk.supabase.co/functions/v1/gmail-oauth';
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', '285808769366-lqlshgojp9cjesg92dcd5a0ige10si7d.apps.googleusercontent.com');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', JSON.stringify({ 
        userId: user.id, 
        gmailAddress: user.email,
        isAdditionalAccount: true,
        redirectTo: `${window.location.origin}/settings`
      }));

      // Redirect directly to Gmail OAuth (same as auth page approach)
      window.location.href = authUrl.toString();

    } catch (error: any) {
      console.error('Gmail connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const checkGmailConnection = async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_gmail_tokens')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        toast({
          title: "Gmail Connected!",
          description: "You can now scan your promotional emails.",
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const scanGmailEmails = async () => {
    if (!user) return;

    setScanning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('scan-gmail', {
        body: {
          userId: user.id,
          maxResults: 100,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Scan Complete!",
        description: `Processed ${data.processed} promotional emails.`,
      });

      // Refresh the page to show new emails
      window.location.reload();

    } catch (error: any) {
      console.error('Gmail scan error:', error);
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan Gmail",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Integration
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to import promotional emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={connectGmail} 
            disabled={connecting}
            variant="outline"
            className="flex-1"
          >
            {connecting ? "Connecting..." : "Connect Gmail"}
          </Button>
          <Button 
            onClick={scanGmailEmails} 
            disabled={scanning}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "Scanning..." : "Scan Emails"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          This will securely access your Gmail to find promotional emails and organize them in your dashboard.
        </p>
      </CardContent>
    </Card>
  );
}