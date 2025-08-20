import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PreviewSignUpModal } from "@/components/preview/PreviewSignUpModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, ArrowLeft } from "lucide-react";

export default function PreviewFits() {
  const [fits, setFits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const navigate = useNavigate();

  const DEMO_USER_EMAIL = "fitzeric97@gmail.com";

  useEffect(() => {
    fetchFits();
  }, []);

  const fetchFits = async () => {
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
        .from('fits')
        .select('*')
        .eq('user_id', demoUserId)
        .order('created_at', { ascending: false });

      setFits(data || []);
    } catch (error) {
      console.error('Error fetching fits:', error);
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
                <ImageIcon className="h-5 w-5 text-green-500" />
                <h1 className="text-lg md:text-xl font-bold">Your Fits</h1>
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
            Browse through outfit photos - click anywhere to create your own account!
          </p>
        </div>

        {fits.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No fits found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {fits.map((fit: any) => (
              <Card 
                key={fit.id} 
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleInteraction}
              >
                <div className="aspect-square relative">
                  <img
                    src={fit.image_url}
                    alt={fit.caption || "Fit"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {fit.caption && (
                  <div className="p-3">
                    <p className="text-sm truncate">{fit.caption}</p>
                  </div>
                )}
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