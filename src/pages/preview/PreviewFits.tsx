import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PreviewSignUpModal } from "@/components/preview/PreviewSignUpModal";
import { PreviewMobileLayout } from "@/components/preview/PreviewMobileLayout";
import { usePreviewInteraction } from "@/hooks/usePreviewInteraction";
import { Card } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

export default function PreviewFits() {
  const [fits, setFits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const navigate = useNavigate();

  const { handleInteraction } = usePreviewInteraction(() => setShowSignUpModal(true));

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

  const renderFitItem = (fit: any) => (
    <Card key={fit.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={handleInteraction}>
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
  );

  if (loading) {
    return (
      <PreviewMobileLayout onInteraction={handleInteraction} currentSection="fits">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PreviewMobileLayout>
    );
  }

  return (
    <PreviewMobileLayout onInteraction={handleInteraction} currentSection="fits">
      <div className="p-4">
        {fits.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No fits found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fits.map(renderFitItem)}
          </div>
        )}
      </div>
      
      <PreviewSignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal} 
      />
    </PreviewMobileLayout>
  );
}