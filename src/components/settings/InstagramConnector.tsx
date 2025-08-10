import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Instagram, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface InstagramConnection {
  id: string;
  instagram_username: string;
  instagram_user_id: string;
  connected_at: string;
}

export function InstagramConnector() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<InstagramConnection[]>([]);
  const [showConnector, setShowConnector] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_connections')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      console.error('Error fetching Instagram connections:', error);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter an Instagram username",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to connect Instagram",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // For now, we'll store the username directly
      // In a real implementation, you'd need Instagram's API to get the user_id
      const { error } = await supabase
        .from('instagram_connections')
        .insert({
          user_id: user.id,
          instagram_username: username,
          instagram_user_id: username, // Placeholder - would need real Instagram API
        });

      if (error) throw error;

      toast({
        title: "Instagram Connected!",
        description: `Successfully linked @${username}`,
      });

      setUsername("");
      setShowConnector(false);
      fetchConnections();
    } catch (error: any) {
      console.error('Error connecting Instagram:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Instagram account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('instagram_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Instagram Disconnected",
        description: `Unlinked @${username}`,
      });

      fetchConnections();
    } catch (error: any) {
      console.error('Error disconnecting Instagram:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Instagram account",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5" />
          Instagram Accounts
        </CardTitle>
        <CardDescription>
          Link your Instagram accounts to showcase your style and outfits
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connections.length > 0 && (
          <div className="space-y-3 mb-4">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Instagram className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">@{connection.instagram_username}</p>
                    <p className="text-sm text-muted-foreground">
                      Connected {new Date(connection.connected_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(connection.id, connection.instagram_username)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {!showConnector ? (
          <Button
            onClick={() => setShowConnector(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect Instagram Account
          </Button>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram-username">Instagram Username</Label>
              <Input
                id="instagram-username"
                type="text"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Connecting..." : "Connect"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowConnector(false);
                  setUsername("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {connections.length === 0 && !showConnector && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No Instagram accounts connected yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}