import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export function ConnectionNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newConnectionsCount, setNewConnectionsCount] = useState(0);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(
    localStorage.getItem('lastConnectionCheck')
  );

  useEffect(() => {
    if (user) {
      checkNewConnections();
      subscribeToConnectionUpdates();
    }
  }, [user, lastCheckedTime]);

  const checkNewConnections = async () => {
    if (!user || !lastCheckedTime) return;

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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleClick = () => {
    // Mark as checked
    const now = new Date().toISOString();
    localStorage.setItem('lastConnectionCheck', now);
    setLastCheckedTime(now);
    setNewConnectionsCount(0);
    
    // Navigate to activity connections tab
    navigate('/activity');
  };

  // Don't show if no new connections
  if (newConnectionsCount === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative h-8 w-8 p-0 rounded-full hover:bg-accent"
      onClick={handleClick}
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
  );
}