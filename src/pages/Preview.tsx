import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PreviewSignUpModal } from "@/components/preview/PreviewSignUpModal";
import { PreviewSection } from "@/components/preview/PreviewSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Package, ImageIcon, Activity, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Preview() {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [previewData, setPreviewData] = useState({
    likes: [],
    closetItems: [],
    fits: [],
    activityFeed: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const DEMO_USER_EMAIL = "fitzeric97@gmail.com";

  useEffect(() => {
    fetchPreviewData();
  }, []);

  const fetchPreviewData = async () => {
    try {
      // Get the demo user's profile first
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('gmail_address', DEMO_USER_EMAIL)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        console.log('Demo user not found');
        setLoading(false);
        return;
      }

      const demoUserId = profiles[0].id;

      // Fetch all data in parallel
      const [likesResponse, closetResponse, fitsResponse, activityResponse] = await Promise.all([
        supabase
          .from('user_likes')
          .select('*')
          .eq('user_id', demoUserId)
          .order('created_at', { ascending: false })
          .limit(6),
        
        supabase
          .from('closet_items')
          .select('*')
          .eq('user_id', demoUserId)
          .order('created_at', { ascending: false })
          .limit(6),
        
        supabase
          .from('fits')
          .select('*')
          .eq('user_id', demoUserId)
          .order('created_at', { ascending: false })
          .limit(4),
        
        supabase
          .from('activity_feed')
          .select('*')
          .eq('user_id', demoUserId)
          .order('created_at', { ascending: false })
          .limit(8)
      ]);

      setPreviewData({
        likes: likesResponse.data || [],
        closetItems: closetResponse.data || [],
        fits: fitsResponse.data || [],
        activityFeed: activityResponse.data || []
      });
    } catch (error) {
      console.error('Error fetching preview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = () => {
    setShowSignUpModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-1 md:gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fits Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                <h1 className="text-lg md:text-xl font-bold">Fits Preview</h1>
              </div>
            </div>
            <Button onClick={handleInteraction} size="sm" className="md:size-default">
              <span className="hidden sm:inline">Sign Up Now</span>
              <span className="sm:hidden">Sign Up</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-4 md:py-8 space-y-6 md:space-y-8">
        {/* Introduction */}
        <div className="text-center space-y-4 py-4 md:py-8">
          <h2 className="text-2xl md:text-3xl font-bold">Welcome to Fits</h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Organize your style, track your favorites, and discover new looks. 
            Here's a preview of what you can do with Fits - click anywhere to get started!
          </p>
        </div>

        {/* Likes Section */}
        <PreviewSection
          title="Your Likes"
          icon={<Heart className="h-5 w-5 text-red-500" />}
          onInteraction={handleInteraction}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {previewData.likes.slice(0, 6).map((like: any) => (
              <Card key={like.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  {like.image_url || like.uploaded_image_url ? (
                    <img
                      src={like.uploaded_image_url || like.image_url}
                      alt={like.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Heart className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{like.title}</p>
                  <p className="text-xs text-muted-foreground">{like.brand_name}</p>
                </div>
              </Card>
            ))}
          </div>
        </PreviewSection>

        {/* Closet Section */}
        <PreviewSection
          title="Your Closet"
          icon={<Package className="h-5 w-5 text-blue-500" />}
          onInteraction={handleInteraction}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {previewData.closetItems.slice(0, 6).map((item: any) => {
              const imageUrl = item.uploaded_image_url || item.product_image_url || item.stored_image_path;
              return (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.product_name || "Closet item"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.product_name || "Unknown Item"}</p>
                    <p className="text-xs text-muted-foreground">{item.brand_name}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </PreviewSection>

        {/* Fits Section */}
        <PreviewSection
          title="Your Fits"
          icon={<ImageIcon className="h-5 w-5 text-green-500" />}
          onInteraction={handleInteraction}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {previewData.fits.slice(0, 4).map((fit: any) => (
              <Card key={fit.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={fit.image_url}
                    alt={fit.caption || "Fit"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {fit.caption && (
                  <div className="p-2">
                    <p className="text-xs truncate">{fit.caption}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </PreviewSection>

        {/* Activity Feed Section */}
        <PreviewSection
          title="Activity Feed"
          icon={<Activity className="h-5 w-5 text-purple-500" />}
          onInteraction={handleInteraction}
        >
          <div className="space-y-3">
            {previewData.activityFeed.slice(0, 5).map((activity: any) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {activity.action_type === 'liked_item' && <Heart className="h-4 w-4 text-red-500" />}
                    {activity.action_type === 'added_closet' && <Package className="h-4 w-4 text-blue-500" />}
                    {activity.action_type === 'created_fit' && <ImageIcon className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      {activity.action_type === 'liked_item' && `Liked ${activity.metadata?.item_name || 'an item'}`}
                      {activity.action_type === 'added_closet' && `Added ${activity.metadata?.item_name || 'an item'} to closet`}
                      {activity.action_type === 'created_fit' && `Created a new fit`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {activity.metadata?.item_image && (
                    <img 
                      src={activity.metadata.item_image} 
                      alt="Activity item"
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </PreviewSection>

        {/* Call to Action */}
        <div className="text-center py-8 md:py-12 border-t">
          <h3 className="text-xl md:text-2xl font-bold mb-4">Ready to organize your style?</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-6 px-4">
            Join thousands of users who are already using Fits to track their wardrobe and discover new looks.
          </p>
          <Button size="lg" onClick={handleInteraction} className="w-full sm:w-auto">
            Get Started Now
          </Button>
        </div>
      </div>

      <PreviewSignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal} 
      />
    </div>
  );
}