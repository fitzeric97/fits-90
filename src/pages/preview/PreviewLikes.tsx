import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PreviewSignUpModal } from "@/components/preview/PreviewSignUpModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, ExternalLink } from "lucide-react";

export default function PreviewLikes() {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const navigate = useNavigate();

  const DEMO_USER_EMAIL = "fitzeric97@gmail.com";

  useEffect(() => {
    fetchLikes();
  }, []);

  const fetchLikes = async () => {
    try {
      // Get the demo user's profile first
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('gmail_address', DEMO_USER_EMAIL)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      const demoUserId = profiles[0].id;

      const { data } = await supabase
        .from('user_likes')
        .select('*')
        .eq('user_id', demoUserId)
        .order('created_at', { ascending: false });

      setLikes(data || []);
    } catch (error) {
      console.error('Error fetching likes:', error);
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
                onClick={() => navigate('/preview')}
                className="flex items-center gap-1 md:gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <h1 className="text-lg md:text-xl font-bold">Your Likes</h1>
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
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-muted-foreground text-center">
            Browse through liked items - click anywhere to create your own account!
          </p>
        </div>

        {likes.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No liked items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {likes.map((like: any) => (
              <Card 
                key={like.id} 
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleInteraction}
              >
                <div className="aspect-square relative">
                  {like.image_url || like.uploaded_image_url ? (
                    <img
                      src={like.uploaded_image_url || like.image_url}
                      alt={like.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Heart className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraction();
                      }}
                      className="bg-white/90 p-1.5 rounded-full"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{like.title}</p>
                  <p className="text-xs text-muted-foreground">{like.brand_name}</p>
                  {like.price && (
                    <p className="text-sm font-semibold mt-1">{like.price}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PreviewSignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal} 
      />
    </div>
  );
}