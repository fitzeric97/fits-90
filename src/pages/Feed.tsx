import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share, MoreHorizontal, Camera, ShirtIcon, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface FeedItem {
  id: string;
  type: 'fit' | 'like' | 'closet_item';
  user_name: string;
  user_avatar?: string;
  content: string;
  image_url?: string;
  created_at: string;
  brand_name?: string;
  item_name?: string;
}

const mockFeedData: FeedItem[] = [
  {
    id: '1',
    type: 'fit',
    user_name: 'Sarah M.',
    user_avatar: '/placeholder.svg',
    content: 'Just dropped this cozy fall look! Perfect for the coffee run ☕',
    image_url: '/placeholder.svg',
    created_at: '2 hours ago',
  },
  {
    id: '2',
    type: 'like',
    user_name: 'Alex K.',
    user_avatar: '/placeholder.svg',
    content: 'added a new item to their likes',
    item_name: 'Vintage Denim Jacket',
    brand_name: 'Levi\'s',
    image_url: '/placeholder.svg',
    created_at: '4 hours ago',
  },
  {
    id: '3',
    type: 'closet_item',
    user_name: 'Jordan P.',
    user_avatar: '/placeholder.svg',
    content: 'added to their closet',
    item_name: 'Sustainable Cotton Tee',
    brand_name: 'Everlane',
    image_url: '/placeholder.svg',
    created_at: '6 hours ago',
  },
  {
    id: '4',
    type: 'fit',
    user_name: 'Maya L.',
    user_avatar: '/placeholder.svg',
    content: 'Office vibes today! Mixing professional with a pop of color 💼✨',
    image_url: '/placeholder.svg',
    created_at: '8 hours ago',
  },
];

const FeedItemCard = ({ item }: { item: FeedItem }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'fit':
        return <Camera className="h-4 w-4 text-primary" />;
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'closet_item':
        return <ShirtIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-purple-500" />;
    }
  };

  const getActivityText = () => {
    switch (item.type) {
      case 'fit':
        return 'shared a new fit';
      case 'like':
        return 'liked an item';
      case 'closet_item':
        return 'added to closet';
      default:
        return 'shared an update';
    }
  };

  return (
    <Card className="w-full border-border/40 hover:bg-muted/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.user_avatar} alt={item.user_name} />
              <AvatarFallback>{item.user_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{item.user_name}</span>
                {getIcon()}
                <span className="text-xs text-muted-foreground">{getActivityText()}</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.created_at}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {item.content && (
          <p className="text-sm mb-3 leading-relaxed">{item.content}</p>
        )}
        
        {item.item_name && item.brand_name && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3">
            <p className="text-sm font-medium">{item.item_name}</p>
            <p className="text-xs text-muted-foreground">from {item.brand_name}</p>
          </div>
        )}
        
        {item.image_url && (
          <div className="rounded-lg overflow-hidden mb-3 bg-muted">
            <img 
              src={item.image_url} 
              alt="Feed content" 
              className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-xs">24</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">8</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              <Share className="h-4 w-4 mr-1" />
              <span className="text-xs">3</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Feed() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'fits' | 'likes' | 'closet'>('all');

  // TODO: Replace with actual data fetching
  const { data: feedItems = mockFeedData } = useQuery({
    queryKey: ['feed', filter],
    queryFn: async () => {
      // This will be replaced with actual Supabase queries
      return mockFeedData.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'fits' && item.type === 'fit') return true;
        if (filter === 'likes' && item.type === 'like') return true;
        if (filter === 'closet' && item.type === 'closet_item') return true;
        return false;
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 p-4 lg:p-0">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Fashion Feed</h1>
          <p className="text-muted-foreground text-sm">
            Discover what your fashion community is wearing and loving
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { key: 'all', label: 'All Activity' },
            { key: 'fits', label: 'Fits' },
            { key: 'likes', label: 'Likes' },
            { key: 'closet', label: 'Closet' },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(tab.key as any)}
              className="flex-1 text-xs"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {feedItems.length === 0 ? (
            <Card className="text-center p-8">
              <div className="text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No activity yet</p>
                <p className="text-sm">
                  Follow friends and brands to see their latest fits and fashion finds here!
                </p>
              </div>
            </Card>
          ) : (
            feedItems.map((item) => (
              <FeedItemCard key={item.id} item={item} />
            ))
          )}
        </div>

        {/* Load More */}
        <div className="text-center py-4">
          <Button variant="outline" size="sm">
            Load More
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}