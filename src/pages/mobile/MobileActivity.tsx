import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ActivityFeed } from "@/components/mobile/ActivityFeed";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function MobileActivity() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      subscribeToUpdates();
    }
  }, [user]);

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
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full">
        <div className="sticky top-0 bg-background z-30 p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Activity</h2>
          </div>
        </div>
        
        <ActivityFeed key={refreshTrigger} />
      </div>
    </MobileLayout>
  );
}