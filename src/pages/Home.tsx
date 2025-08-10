import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, Avatar as AvatarComponent, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, ShirtIcon, Clock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'like' | 'closet_add';
  user_name: string;
  user_email: string;
  title: string;
  description?: string;
  image_url?: string;
  brand_name?: string;
  price?: string;
  url?: string;
  created_at: string;
}

export default function Home() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityFeed();
  }, [user]);

  const fetchActivityFeed = async () => {
    if (!user) return;

    try {
      // Fetch recent likes
      const { data: likes, error: likesError } = await supabase
        .from('user_likes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent closet items
      const { data: closetItems, error: closetError } = await supabase
        .from('closet_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (likesError) console.error('Error fetching likes:', likesError);
      if (closetError) console.error('Error fetching closet items:', closetError);

      // Transform and combine data
      const likeActivities: ActivityItem[] = (likes || []).map(like => ({
        id: like.id,
        type: 'like' as const,
        user_name: 'You', // Will be updated when we have friends system
        user_email: user.email || '',
        title: like.title,
        description: like.description,
        image_url: like.image_url,
        brand_name: like.brand_name,
        price: like.price,
        url: like.url,
        created_at: like.created_at,
      }));

      const closetActivities: ActivityItem[] = (closetItems || []).map(item => ({
        id: item.id,
        type: 'closet_add' as const,
        user_name: 'You', // Will be updated when we have friends system
        user_email: user.email || '',
        title: item.product_name || 'New Item',
        description: item.product_description,
        image_url: item.product_image_url || item.uploaded_image_url,
        brand_name: item.brand_name,
        price: item.price,
        url: item.company_website_url,
        created_at: item.created_at,
      }));

      // Combine and sort by created_at
      const combined = [...likeActivities, ...closetActivities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

      setActivities(combined);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    return type === 'like' ? 
      <Heart className="h-4 w-4 text-red-500 fill-red-500" /> : 
      <ShirtIcon className="h-4 w-4 text-blue-500" />;
  };

  const getActivityText = (activity: ActivityItem) => {
    return activity.type === 'like' ? 'liked' : 'added to closet';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Activity Feed</h1>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
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
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Activity Feed</h1>
            <p className="text-muted-foreground">See what's happening with your style</p>
          </div>

          {activities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding items to your closet or liking some products!
                </p>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => window.location.href = '/closet'}>
                    Browse Closet
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/likes'}>
                    View Likes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <AvatarComponent className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {activity.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </AvatarComponent>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getActivityIcon(activity.type)}
                          <span className="font-medium">{activity.user_name}</span>
                          <span className="text-muted-foreground">{getActivityText(activity)}</span>
                          {activity.brand_name && (
                            <span className="text-sm text-muted-foreground">from {activity.brand_name}</span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                          {activity.title}
                        </h3>
                        
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </div>
                            {activity.price && (
                              <span className="font-medium text-foreground">
                                {activity.price}
                              </span>
                            )}
                          </div>
                          
                          {activity.url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={activity.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {activity.image_url && (
                        <div className="flex-shrink-0">
                          <img 
                            src={activity.image_url} 
                            alt={activity.title}
                            className="w-16 h-16 object-cover rounded-lg"
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
    </DashboardLayout>
  );
}