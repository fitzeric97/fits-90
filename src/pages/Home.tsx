import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, Avatar as AvatarComponent, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, ShirtIcon, Clock, ExternalLink, Plus, Camera } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AddLikeDialog } from "@/components/likes/AddLikeDialog";

interface ActivityItem {
  id: string;
  type: 'like' | 'closet_add' | 'fit_post';
  user_name: string;
  user_email: string;
  title: string;
  description?: string;
  image_url?: string;
  brand_name?: string;
  category?: string;
  price?: string;
  url?: string;
  created_at: string;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLikeDialog, setShowAddLikeDialog] = useState(false);

  useEffect(() => {
    fetchActivityFeed();
  }, [user]);

  const fetchActivityFeed = async () => {
    if (!user) return;

    try {
      // Fetch from centralized activity_feed table to avoid duplicates
      const { data: activityData, error } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching activity feed:', error);
        setActivities([]);
        return;
      }

      // Transform to match ActivityItem interface
      const transformedActivities: ActivityItem[] = (activityData || []).map(activity => {
        const metadata = (activity.metadata as any) || {};
        
        let type: 'like' | 'closet_add' | 'fit_post';
        switch (activity.action_type) {
          case 'liked_item':
            type = 'like';
            break;
          case 'added_closet':
            type = 'closet_add';
            break;
          case 'created_fit':
            type = 'fit_post';
            break;
          default:
            type = 'like';
        }

        return {
          id: activity.target_id,
          type,
          user_name: 'You',
          user_email: user.email || '',
          title: metadata.item_name || metadata.fit_caption || 'New Item',
          description: metadata.fit_caption,
          image_url: metadata.item_image,
          brand_name: metadata.brand_name,
          category: undefined,
          price: metadata.price,
          url: undefined,
          created_at: activity.created_at,
        };
      });

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500 flex-shrink-0" />;
      case 'closet_add':
        return <ShirtIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />;
      case 'fit_post':
        return <Camera className="h-4 w-4 text-green-500 flex-shrink-0" />;
      default:
        return <ShirtIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'like':
        return 'liked';
      case 'closet_add':
        return 'added to closet';
      case 'fit_post':
        return 'posted a fit';
      default:
        return 'updated';
    }
  };

  const handleItemClick = (activity: ActivityItem) => {
    if (activity.type === 'like') {
      // Navigate to likes page with the specific item highlighted
      navigate('/likes');
    } else if (activity.type === 'closet_add') {
      // Navigate to specific closet item detail page
      navigate(`/closet/${activity.id}`);
    } else if (activity.type === 'fit_post') {
      // Navigate to fits page
      navigate('/fits');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="px-0 sm:px-2">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-4 sm:px-0">Activity Feed</h1>
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse mx-2 sm:mx-0">
                  <CardContent className="p-4">
                    <div className="flex space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-0 sm:px-2">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 sm:mb-6 px-4 sm:px-0">
            <h1 className="text-xl sm:text-2xl font-bold">Activity Feed</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">See what's happening with your style</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="mb-6 px-4 sm:px-0">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 flex items-center justify-center gap-2"
                onClick={() => setShowAddLikeDialog(true)}
              >
                <Heart className="h-4 w-4" />
                <span>Add a Like</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 flex items-center justify-center gap-2"
                onClick={() => navigate('/closet')}
              >
                <Plus className="h-4 w-4" />
                <span>Add to Closet</span>
              </Button>
            </div>
          </div>

          {activities.length === 0 ? (
            <Card className="mx-2 sm:mx-0">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">No activity yet</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-2">
                  Start by adding items to your closet or liking some products!
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-2">
                  <Button 
                    variant="outline" 
                    className="min-h-[44px] text-sm sm:text-base"
                    onClick={() => window.location.href = '/closet'}
                  >
                    Browse Closet
                  </Button>
                  <Button 
                    variant="outline"
                    className="min-h-[44px] text-sm sm:text-base" 
                    onClick={() => window.location.href = '/likes'}
                  >
                    View Likes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {activities.map((activity) => (
                <Card 
                  key={activity.id} 
                  className="hover:shadow-md transition-shadow mx-2 sm:mx-0 cursor-pointer"
                  onClick={() => handleItemClick(activity)}
                >
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <AvatarComponent className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">
                          {activity.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </AvatarComponent>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                          {getActivityIcon(activity.type)}
                          <span className="font-medium text-sm sm:text-base">{activity.user_name}</span>
                          <span className="text-muted-foreground text-sm">{getActivityText(activity)}</span>
                          {activity.brand_name && (
                            <span className="text-xs sm:text-sm text-muted-foreground">from {activity.brand_name}</span>
                          )}
                         </div>
                         
                         <div className="flex flex-wrap items-center gap-2 mb-2">
                           {activity.brand_name && (
                             <span className="text-sm font-medium text-foreground">
                               {activity.brand_name}
                             </span>
                           )}
                           {activity.category && (
                             <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                               {activity.category}
                             </span>
                           )}
                           {activity.price && (
                             <span className="text-sm font-medium text-foreground">
                               {activity.price}
                             </span>
                           )}
                         </div>
                         
                           <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                               <div className="flex items-center gap-1">
                                 <Clock className="h-3 w-3 flex-shrink-0" />
                                 <span className="truncate">
                                   {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                 </span>
                               </div>
                             </div>
                             
                             {activity.url && (
                               <Button
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-xs sm:text-sm flex-shrink-0 min-h-[32px]" 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  window.open(activity.url, '_blank', 'noopener,noreferrer');
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Visit Store</span>
                                <span className="sm:hidden">Store</span>
                              </Button>
                            )}
                          </div>
                      </div>
                      
                       {activity.image_url && (
                         <div className="flex-shrink-0">
                           <img 
                             src={activity.image_url} 
                             alt={activity.title}
                             className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                             onError={(e) => {
                               e.currentTarget.style.display = 'none';
                             }}
                           />
                         </div>
                       )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <AddLikeDialog 
        open={showAddLikeDialog} 
        onOpenChange={setShowAddLikeDialog}
        onLikeAdded={fetchActivityFeed}
      />
    </DashboardLayout>
  );
}