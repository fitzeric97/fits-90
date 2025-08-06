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
  display_name: string | null;
  is_primary: boolean;
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
        .from('connected_gmail_accounts')
        .select('id, gmail_address, display_name, is_primary, created_at')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

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
      // Get the Gmail address for this connection
      const { data: accountData, error: accountError } = await supabase
        .from('connected_gmail_accounts')
        .select('gmail_address')
        .eq('id', mailboxId)
        .single();

      if (accountError) throw accountError;

      // Remove Gmail tokens for this specific account
      const { error: tokenError } = await supabase
        .from('user_gmail_tokens')
        .delete()
        .eq('user_id', user?.id)
        .eq('gmail_address', accountData.gmail_address);

      if (tokenError) throw tokenError;

      // Remove the connected account
      const { error: accountDeleteError } = await supabase
        .from('connected_gmail_accounts')
        .delete()
        .eq('id', mailboxId);

      if (accountDeleteError) throw accountDeleteError;

      toast({
        title: "Account Disconnected",
        description: `${accountData.gmail_address} has been disconnected successfully`,
      });

      fetchConnectedMailboxes();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
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
        <CardTitle>Connected Gmail Accounts</CardTitle>
        <CardDescription>
          Manage multiple Gmail accounts to pull promotions from. All emails will be accessible in your single @myfits.co account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mailboxes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No Gmail accounts connected</p>
            <Button onClick={() => setShowConnector(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Gmail Account
            </Button>
          </div>
        ) : (
          <>
            {mailboxes.map((mailbox) => (
              <div key={mailbox.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{mailbox.gmail_address}</span>
                    {mailbox.is_primary && <Badge variant="secondary">Primary</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {mailbox.display_name && `Display Name: ${mailbox.display_name}`}
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
            <h3 className="font-medium mb-2">Connect Additional Gmail Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add another Gmail account to pull promotions from. All promotional emails will be accessible in your single dashboard under your @myfits.co account.
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

        {mailboxes.length > 1 && (
          <div className="pt-4 border-t space-y-2">
            <h3 className="font-medium">Multi-Account Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              All promotional emails from your connected Gmail accounts are automatically combined in your dashboard. No additional setup required!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}