import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ActivityFeed } from "@/components/mobile/ActivityFeed";
import { Bell, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FollowButton } from "@/components/social/FollowButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MobileActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { user } = useAuth();

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
          
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity">Feed</TabsTrigger>
              <TabsTrigger value="search">Find People</TabsTrigger>
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
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {profile.display_name?.charAt(0).toUpperCase() || 
                               profile.myfits_email?.charAt(0).toUpperCase() || 
                               profile.gmail_address?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {profile.display_name || profile.myfits_email || profile.gmail_address || 'Anonymous User'}
                            </p>
                            {profile.display_name && (profile.myfits_email || profile.gmail_address) && (
                              <p className="text-sm text-muted-foreground">
                                {profile.myfits_email || profile.gmail_address}
                              </p>
                            )}
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Search className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Search for people to connect with</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}