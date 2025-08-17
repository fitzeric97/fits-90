import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ActivityFeed } from "@/components/mobile/ActivityFeed";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function MobileActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
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
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Activity</h2>
          </div>
        </div>
        
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
    </MobileLayout>
  );
}