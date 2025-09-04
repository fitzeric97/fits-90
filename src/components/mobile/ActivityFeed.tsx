import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FallbackImage } from "@/components/ui/fallback-image";
import { Heart, ShirtIcon, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActivityItem {
  id: string;
  actor_id: string;
  action_type: 'liked_item' | 'added_closet' | 'created_fit';
  target_id: string;
  target_type: 'like' | 'closet_item' | 'fit';
  metadata: {
    item_name?: string;
    item_image?: string;
    brand_name?: string;
    price?: string;
    fit_caption?: string;
  };
  created_at: string;
  actor: {
    id: string;
    email: string;
    profiles: {
      display_name: string;
      username: string;
      avatar_url?: string;
    };
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const navigate = useNavigate();

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'liked_item':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'added_closet':
        return <ShirtIcon className="h-4 w-4 text-blue-500" />;
      case 'created_fit':
        return <Camera className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'liked_item':
        return 'liked';
      case 'added_closet':
        return 'added to closet';
      case 'created_fit':
        return 'posted a fit';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2 p-3">
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          className="cursor-pointer"
          onClick={() => {
            // Navigate to the item/fit detail
            if (activity.target_type === 'fit') {
              navigate(`/fits/${activity.target_id}`);
            }
          }}
        >
          {/* Clean Header */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {activity.actor?.profiles?.display_name?.[0] || 
                   activity.actor?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">
                {activity.actor?.profiles?.display_name || 
                 activity.actor?.profiles?.username ||
                 activity.actor?.email?.split('@')[0]}
              </span>
              {getActionIcon(activity.action_type)}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { 
                addSuffix: true 
              })}
            </span>
          </div>

          {/* Large Image */}
          {activity.metadata?.item_image && (
            <div className="rounded-lg overflow-hidden mt-1">
              <FallbackImage 
                src={activity.metadata.item_image} 
                alt={activity.metadata.item_name || 'Item'}
                className="w-full h-64 object-cover"
                fallbackIcon={
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                    {getActionIcon(activity.action_type) || <Camera className="h-12 w-12 text-muted-foreground" />}
                  </div>
                }
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}