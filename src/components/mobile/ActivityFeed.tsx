import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, ShirtIcon, Camera, ExternalLink } from "lucide-react";
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
    <div className="space-y-3 p-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {activity.actor?.profiles?.display_name?.[0] || 
                 activity.actor?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {activity.actor?.profiles?.display_name || 
                       activity.actor?.profiles?.username ||
                       activity.actor?.email?.split('@')[0]}
                    </span>
                    <span className="text-muted-foreground mx-1">
                      {getActionText(activity.action_type)}
                    </span>
                    {activity.metadata?.item_name && (
                      <span className="font-medium">
                        {activity.metadata.item_name}
                      </span>
                    )}
                  </p>
                  
                  {/* Brand and price info */}
                  {activity.metadata?.brand_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.metadata.brand_name}
                      {activity.metadata.price && ` • ${activity.metadata.price}`}
                    </p>
                  )}
                  
                  {/* Fit caption */}
                  {activity.metadata?.fit_caption && (
                    <p className="text-sm mt-1">
                      {activity.metadata.fit_caption}
                    </p>
                  )}
                  
                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(activity.created_at), { 
                      addSuffix: true 
                    })}
                  </p>
                </div>

                {/* Action icon */}
                <div className="ml-2">
                  {getActionIcon(activity.action_type)}
                </div>
              </div>

              {/* Image preview if available */}
              {activity.metadata?.item_image && (
                <div 
                  className="mt-3 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => {
                    // Navigate to the item/fit detail
                    if (activity.target_type === 'fit') {
                      navigate(`/fits/${activity.target_id}`);
                    }
                  }}
                >
                  <img 
                    src={activity.metadata.item_image} 
                    alt={activity.metadata.item_name || 'Item'}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}