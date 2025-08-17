import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, ShirtIcon, Camera, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  action_type: 'liked_item' | 'added_closet' | 'created_fit';
  target_id: string;
  target_type: 'like' | 'closet_item' | 'fit';
  metadata: any;
  created_at: string;
  target_title?: string;
  target_brand?: string;
  target_image?: string;
}

export function ActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Get the activity feed first
      const { data: activityData, error: activityError } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activityError) throw activityError;

      // Now enrich with actor profiles and target details
      const enrichedActivities: ActivityItem[] = [];
      
      for (const activity of activityData || []) {
        // Get actor profile
        const { data: actorProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', activity.actor_id)
          .maybeSingle();

        let targetDetails = {};
        
        // Fetch target details based on type
        if (activity.target_type === 'like') {
          const { data: likeData } = await supabase
            .from('user_likes')
            .select('title, brand_name, image_url')
            .eq('id', activity.target_id)
            .maybeSingle();
          
          if (likeData) {
            targetDetails = {
              target_title: likeData.title,
              target_brand: likeData.brand_name,
              target_image: likeData.image_url
            };
          }
        } else if (activity.target_type === 'closet_item') {
          const { data: closetData } = await supabase
            .from('closet_items')
            .select('product_name, brand_name, product_image_url, uploaded_image_url')
            .eq('id', activity.target_id)
            .maybeSingle();
          
          if (closetData) {
            targetDetails = {
              target_title: closetData.product_name,
              target_brand: closetData.brand_name,
              target_image: closetData.product_image_url || closetData.uploaded_image_url
            };
          }
        } else if (activity.target_type === 'fit') {
          const { data: fitData } = await supabase
            .from('fits')
            .select('caption, image_url')
            .eq('id', activity.target_id)
            .maybeSingle();
          
          if (fitData) {
            targetDetails = {
              target_title: fitData.caption || 'New fit',
              target_image: fitData.image_url
            };
          }
        }

        enrichedActivities.push({
          id: activity.id,
          actor_id: activity.actor_id,
          actor_name: actorProfile?.display_name || 'Unknown user',
          actor_email: '', // We don't expose email for privacy
          action_type: activity.action_type as 'liked_item' | 'added_closet' | 'created_fit',
          target_id: activity.target_id,
          target_type: activity.target_type as 'like' | 'closet_item' | 'fit',
          metadata: activity.metadata,
          created_at: activity.created_at,
          ...targetDetails
        });
      }

      setActivities(enrichedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'liked_item':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'added_closet':
        return <ShirtIcon className="h-4 w-4 text-blue-500" />;
      case 'created_fit':
        return <Camera className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const actorName = activity.actor_name || 'Someone';
    
    switch (activity.action_type) {
      case 'liked_item':
        return `${actorName} liked "${activity.target_title}"`;
      case 'added_closet':
        return `${actorName} added "${activity.target_title}" to closet`;
      case 'created_fit':
        return `${actorName} created a new fit`;
      default:
        return `${actorName} performed an action`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Clock className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
        <p className="text-gray-600">
          Start adding items to your closet, liking products, or creating fits to see your activity feed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                {getInitials(activity.actor_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getActivityIcon(activity.action_type)}
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getActivityText(activity)}
                </p>
              </div>
              
              {activity.target_brand && (
                <p className="text-xs text-gray-600 mb-1">
                  from {activity.target_brand}
                </p>
              )}
              
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
            
            {activity.target_image && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={activity.target_image}
                  alt="Activity item"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}