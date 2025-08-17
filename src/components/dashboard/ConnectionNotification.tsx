import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

interface Connection {
  id: string;
  user_id: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    myfits_email: string | null;
    gmail_address: string | null;
  };
}

export function ConnectionNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newConnectionsCount, setNewConnectionsCount] = useState(0);
  const [recentConnections, setRecentConnections] = useState<Connection[]>([]);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>(
    localStorage.getItem('lastConnectionCheck') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Default to 7 days ago
  );

  useEffect(() => {
    if (user) {
      checkNewConnections();
      fetchRecentConnections();
      subscribeToConnectionUpdates();
    }
  }, [user, lastCheckedTime]);

  const checkNewConnections = async () => {
    if (!user) return;

    try {
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('connected_user_id', user.id)
        .eq('status', 'accepted')
        .gt('created_at', lastCheckedTime);

      if (error) {
        console.error('Error checking new connections:', error);
        return;
      }

      setNewConnectionsCount(connections?.length || 0);
    } catch (error) {
      console.error('Error checking new connections:', error);
    }
  };

  const fetchRecentConnections = async () => {
    if (!user) return;

    try {
      // Get the user_ids of people who followed me
      const { data: connections, error: connectionsError } = await supabase
        .from('user_connections')
        .select('id, user_id, created_at')
        .eq('connected_user_id', user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(10);

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        return;
      }

      if (!connections || connections.length === 0) {
        setRecentConnections([]);
        return;
      }

      // Get profile information for those users
      const userIds = connections.map(c => c.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, myfits_email, gmail_address')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Combine the data
      const connectionsWithProfiles = connections.map(connection => {
        const profile = profiles?.find(p => p.id === connection.user_id);
        return {
          id: connection.id,
          user_id: connection.user_id,
          created_at: connection.created_at,
          profiles: {
            display_name: profile?.display_name || null,
            myfits_email: profile?.myfits_email || null,
            gmail_address: profile?.gmail_address || null,
          }
        };
      });

      setRecentConnections(connectionsWithProfiles);
    } catch (error) {
      console.error('Error fetching recent connections:', error);
    }
  };

  const subscribeToConnectionUpdates = () => {
    const channel = supabase
      .channel('connection-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_connections',
          filter: `connected_user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new.status === 'accepted') {
            setNewConnectionsCount(prev => prev + 1);
            fetchRecentConnections();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_connections',
          filter: `connected_user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new.status === 'accepted' && payload.old.status !== 'accepted') {
            setNewConnectionsCount(prev => prev + 1);
            fetchRecentConnections();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleMarkAsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastConnectionCheck', now);
    setLastCheckedTime(now);
    setNewConnectionsCount(0);
  };

  const getDisplayName = (connection: Connection) => {
    return connection.profiles?.display_name || 
           connection.profiles?.myfits_email || 
           connection.profiles?.gmail_address || 
           'Anonymous User';
  };

  const getInitial = (connection: Connection) => {
    const name = getDisplayName(connection);
    return name.charAt(0).toUpperCase();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0 rounded-full hover:bg-accent"
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <UserPlus className="h-4 w-4 text-primary-foreground" />
          </div>
          {newConnectionsCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {newConnectionsCount > 9 ? '9+' : newConnectionsCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-card border border-border">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-card-foreground">Recent Followers</h3>
            {newConnectionsCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAsRead} className="text-xs">
                Mark as read
              </Button>
            )}
          </div>
        </div>
        
        {recentConnections.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent followers</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {recentConnections.map((connection) => (
              <DropdownMenuItem 
                key={connection.id}
                className="p-3 cursor-pointer hover:bg-muted"
                onClick={() => navigate(`/profile/${connection.user_id}`)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getInitial(connection)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground truncate">
                      {getDisplayName(connection)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Started following you • {formatTimeAgo(connection.created_at)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        <div className="p-3 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-center text-sm"
            onClick={() => navigate('/activity')}
          >
            View all connections
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}