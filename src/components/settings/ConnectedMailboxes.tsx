import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GmailConnector } from "@/components/gmail/GmailConnector";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectedMailbox {
  id: string;
  gmail_address: string;
  myfits_email: string;
  created_at: string;
}

export function ConnectedMailboxes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mailboxes, setMailboxes] = useState<ConnectedMailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnector, setShowConnector] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnectedMailboxes();
    }
  }, [user]);

  const fetchConnectedMailboxes = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, gmail_address, myfits_email, created_at')
        .eq('id', user?.id)
        .not('gmail_address', 'is', null);

      if (error) throw error;

      setMailboxes(data || []);
    } catch (error) {
      console.error('Error fetching mailboxes:', error);
      toast({
        title: "Error",
        description: "Failed to load connected mailboxes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (mailboxId: string) => {
    try {
      // Remove Gmail tokens
      const { error: tokenError } = await supabase
        .from('user_gmail_tokens')
        .delete()
        .eq('user_id', mailboxId);

      if (tokenError) throw tokenError;

      // Clear Gmail address from profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ gmail_address: null })
        .eq('id', mailboxId);

      if (profileError) throw profileError;

      toast({
        title: "Mailbox Disconnected",
        description: "Gmail account has been disconnected successfully",
      });

      fetchConnectedMailboxes();
    } catch (error) {
      console.error('Error disconnecting mailbox:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect mailbox",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading connected mailboxes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Mailboxes</CardTitle>
        <CardDescription>
          Manage your connected Gmail accounts and @fits.co forwarding addresses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mailboxes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No mailboxes connected</p>
            <Button onClick={() => setShowConnector(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Gmail Account
            </Button>
          </div>
        ) : (
          <>
            {mailboxes.map((mailbox) => (
              <div key={mailbox.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{mailbox.gmail_address}</span>
                    <Badge variant="secondary">Primary</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fits Email: {mailbox.myfits_email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Connected: {new Date(mailbox.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(mailbox.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowConnector(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Additional Gmail Account
              </Button>
            </div>
          </>
        )}

        {showConnector && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Connect New Gmail Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will automatically create a @fits.co email for you to use with new brands (e.g., your-gmail@fits.co). Each Gmail account gets its own separate data.
            </p>
            <GmailConnector />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowConnector(false)}
              className="mt-2"
            >
              Cancel
            </Button>
          </div>
        )}

        {mailboxes.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <h3 className="font-medium">Combine Mailboxes</h3>
            <p className="text-sm text-muted-foreground">
              Want to see promotions from multiple Gmail accounts in one dashboard? This feature is coming soon.
            </p>
            <Button variant="outline" disabled>
              Combine Mailboxes (Coming Soon)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}