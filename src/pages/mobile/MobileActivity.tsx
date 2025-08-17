import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ActivityFeed } from "@/components/mobile/ActivityFeed";
import { Bell, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FollowButton } from "@/components/social/FollowButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MobileActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchActivities();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Get activities from connected users and own activities
      // RLS policies will handle filtering to only show activities from connected users
      const { data: activityData, error } = await supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      // Get unique actor IDs to fetch profile information
      const actorIds = [...new Set(activityData?.map(a => a.actor_id) || [])];
      
      // Fetch profile information for all actors
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', actorIds);

      // Create a map for quick profile lookups
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Transform the data to match the ActivityFeed component interface
      const transformedActivities = (activityData || []).map(activity => {
        const profile = profileMap.get(activity.actor_id);
        return {
          id: activity.id,
          actor_id: activity.actor_id,
          action_type: activity.action_type,
          target_id: activity.target_id,
          target_type: activity.target_type,
          metadata: activity.metadata || {},
          created_at: activity.created_at,
          actor: {
            id: activity.actor_id,
            email: '',
            profiles: {
              display_name: profile?.display_name || 'Unknown User',
              username: '',
              avatar_url: ''
            }
          }
        };
      });

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('activity-feed-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed'
        },
        (payload) => {
          // Trigger a refresh when new activities are added
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, myfits_email, gmail_address')
        .or(`display_name.ilike.%${query}%,myfits_email.ilike.%${query}%,gmail_address.ilike.%${query}%`)
        .neq('id', user?.id) // Exclude current user
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults(profiles || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchConnections = async () => {
    setConnectionsLoading(true);
    try {
      // Get current connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('user_connections')
        .select(`
          id,
          user_id,
          connected_user_id,
          status,
          created_at
        `)
        .or(`user_id.eq.${user?.id},connected_user_id.eq.${user?.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        return;
      }

      // Get connected user IDs
      const connectedUserIds = connectionsData?.map(conn => 
        conn.user_id === user?.id ? conn.connected_user_id : conn.user_id
      ) || [];

      // Fetch profiles for connected users
      let connectionsWithProfiles = [];
      if (connectedUserIds.length > 0) {
        const { data: connectedProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, myfits_email, gmail_address')
          .in('id', connectedUserIds);

        connectionsWithProfiles = connectedProfiles || [];
      }

      setConnections(connectionsWithProfiles);

      // Get suggested connections (all users except current user and current connections)
      const excludeIds = [user?.id, ...connectedUserIds];
      const { data: suggestedData, error: suggestedError } = await supabase
        .from('profiles')
        .select('id, display_name, myfits_email, gmail_address')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(20);

      if (suggestedError) {
        console.error('Error fetching suggested connections:', suggestedError);
        return;
      }

      setSuggestedConnections(suggestedData || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setConnectionsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col h-full">
        <div className="sticky top-0 bg-background z-30 p-4 border-b">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Activity</h2>
          </div>
          
          <Tabs defaultValue="activity" className="w-full" onValueChange={(value) => {
            if ((value === 'connections' || value === 'search') && connections.length === 0 && suggestedConnections.length === 0) {
              fetchConnections();
            }
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">Feed</TabsTrigger>
              <TabsTrigger value="search">Find People</TabsTrigger>
              <TabsTrigger value="connections">
                <Users className="h-4 w-4 mr-1" />
                Connections
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="mt-0">
              <div className="mt-4">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 p-4">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground">
                      No activity yet. Connect with friends to see their updates!
                    </p>
                  </div>
                ) : (
                  <ActivityFeed activities={activities} />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="search" className="mt-0">
              <div className="mt-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card text-card-foreground border-border placeholder:text-muted-foreground focus:bg-card"
                  />
                </div>
                
                {searchLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                        <div 
                          className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                          onClick={() => navigate(`/profile/${profile.id}`)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {profile.display_name?.charAt(0).toUpperCase() || 
                               profile.myfits_email?.charAt(0).toUpperCase() || 
                               profile.gmail_address?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-primary">
                              {profile.display_name || profile.myfits_email || profile.gmail_address || 'Anonymous User'}
                            </p>
                            {profile.display_name && (profile.myfits_email || profile.gmail_address) && (
                              <p className="text-sm text-primary/70">
                                {profile.myfits_email || profile.gmail_address}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Tap to view profile
                            </p>
                          </div>
                        </div>
                        <FollowButton 
                          targetUserId={profile.id}
                          targetUsername={profile.display_name || profile.myfits_email || profile.gmail_address}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !searchLoading ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Search className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
                  </div>
                ) : null}

                {/* Suggested Connections Section */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">People You May Know</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={fetchConnections}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Refresh
                    </Button>
                  </div>
                  
                  {connectionsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading suggestions...</span>
                    </div>
                  ) : suggestedConnections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 p-4 bg-muted/20 rounded-lg">
                      <Users className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-center text-muted-foreground">
                        No new people to connect with right now.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {suggestedConnections.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                          <div 
                            className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                            onClick={() => navigate(`/profile/${profile.id}`)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {profile.display_name?.charAt(0).toUpperCase() || 
                                 profile.myfits_email?.charAt(0).toUpperCase() || 
                                 profile.gmail_address?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-primary">
                                {profile.display_name || profile.myfits_email || profile.gmail_address || 'Anonymous User'}
                              </p>
                              {profile.display_name && (profile.myfits_email || profile.gmail_address) && (
                                <p className="text-sm text-primary/70">
                                  {profile.myfits_email || profile.gmail_address}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Tap to view profile
                              </p>
                            </div>
                          </div>
                          <FollowButton 
                            targetUserId={profile.id}
                            targetUsername={profile.display_name || profile.myfits_email || profile.gmail_address}
                            size="sm"
                            onFollowChange={() => fetchConnections()}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Default state when no search and no suggestions yet */}
                {!searchQuery && !searchLoading && suggestedConnections.length === 0 && !connectionsLoading && (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Search className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Search for people to connect with</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="connections" className="mt-0">
              <div className="mt-4 space-y-6">
                {connectionsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading connections...</span>
                  </div>
                ) : (
                  <>
                    {/* Current Connections Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Your Connections</h3>
                        <span className="text-sm text-muted-foreground">
                          {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
                        </span>
                      </div>
                      
                      {connections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 p-4 bg-muted/20 rounded-lg">
                          <Users className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-center text-muted-foreground">
                            No connections yet. Start connecting with people!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {connections.map((profile) => (
                            <div key={profile.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                              <div 
                                className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                                onClick={() => navigate(`/profile/${profile.id}`)}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                    {profile.display_name?.charAt(0).toUpperCase() || 
                                     profile.myfits_email?.charAt(0).toUpperCase() || 
                                     profile.gmail_address?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium text-primary">
                                    {profile.display_name || profile.myfits_email || profile.gmail_address || 'Anonymous User'}
                                  </p>
                                  {profile.display_name && (profile.myfits_email || profile.gmail_address) && (
                                    <p className="text-sm text-primary/70">
                                      {profile.myfits_email || profile.gmail_address}
                                    </p>
                                  )}
                                  <p className="text-xs text-fits-blue font-medium mt-1">
                                    Connected • Tap to view profile
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/profile/${profile.id}`)}
                              >
                                View Profile
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}