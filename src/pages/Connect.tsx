import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, UserCheck, UserX, Search } from "lucide-react";

interface User {
  id: string;
  display_name: string;
  gmail_address: string;
  myfits_email: string;
  created_at: string;
}

interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  requested_by: string;
  created_at: string;
  connected_profile?: User;
  requester_profile?: User;
}

export default function Connect() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      // Fetch connected user profiles separately
      if (data && data.length > 0) {
        const connectedUserIds = data.map(c => c.connected_user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', connectedUserIds);

        const connectionsWithProfiles = data.map(connection => ({
          ...connection,
          connected_profile: profiles?.find(p => p.id === connection.connected_user_id)
        }));
        setConnections(connectionsWithProfiles as Connection[]);
      } else {
        setConnections([]);
      }
    }
  };

  const fetchPendingRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('connected_user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending requests:', error);
    } else {
      // Fetch requester profiles separately
      if (data && data.length > 0) {
        const requesterIds = data.map(c => c.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', requesterIds);

        const requestsWithProfiles = data.map(request => ({
          ...request,
          requester_profile: profiles?.find(p => p.id === request.user_id)
        }));
        setPendingRequests(requestsWithProfiles as Connection[]);
      } else {
        setPendingRequests([]);
      }
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim() || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`display_name.ilike.%${searchTerm}%,gmail_address.ilike.%${searchTerm}%,myfits_email.ilike.%${searchTerm}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search Error",
          description: "Failed to search users",
          variant: "destructive",
        });
      } else {
        setUsers(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_connections')
        .insert({
          user_id: user.id,
          connected_user_id: targetUserId,
          requested_by: user.id,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending connection request:', error);
        toast({
          title: "Request Failed",
          description: "Failed to send connection request",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Request Sent",
          description: "Connection request sent successfully",
        });
        // Remove from search results
        setUsers(users.filter(u => u.id !== targetUserId));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleConnectionRequest = async (connectionId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: action })
        .eq('id', connectionId);

      if (error) {
        console.error('Error updating connection:', error);
        toast({
          title: "Update Failed",
          description: "Failed to update connection request",
          variant: "destructive",
        });
      } else {
        toast({
          title: action === 'accepted' ? "Connection Accepted" : "Request Declined",
          description: `Connection request ${action}`,
        });
        
        // Refresh data
        fetchPendingRequests();
        if (action === 'accepted') {
          fetchConnections();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getConnectionStatus = (targetUserId: string) => {
    // Check if already connected
    const connection = connections.find(c => c.connected_user_id === targetUserId);
    if (connection) return 'connected';
    
    // Check if request pending (sent by current user)
    // This would require another query, for now we'll assume none
    return 'none';
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={loading}>
              Search
            </Button>
          </div>
          
          {users.length > 0 && (
            <div className="mt-4 space-y-2">
              {users.map((searchUser) => (
                <div key={searchUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {searchUser.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{searchUser.display_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{searchUser.myfits_email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendConnectionRequest(searchUser.id)}
                    disabled={getConnectionStatus(searchUser.id) !== 'none'}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Connection Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {request.requester_profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.requester_profile?.display_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{request.requester_profile?.myfits_email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConnectionRequest(request.id, 'accepted')}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConnectionRequest(request.id, 'rejected')}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Connections ({connections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No connections yet. Search for users above to start connecting!
            </p>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {connection.connected_profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{connection.connected_profile?.display_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{connection.connected_profile?.myfits_email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/profile/${connection.connected_user_id}`}>
                      View Profile
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}