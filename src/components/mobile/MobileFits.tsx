import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Camera, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export default function MobileFits() {
  const [fits, setFits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchFits();
  }, [user]);

  const fetchFits = async () => {
    const { data } = await supabase
      .from('fits')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setFits(data || []);
    setLoading(false);
  };

  const handleAddFit = async () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please provide an image URL",
        variant: "destructive",
      });
      return;
    }

    setAddLoading(true);
    try {
      const { error } = await supabase
        .from('fits')
        .insert({
          user_id: user?.id,
          image_url: imageUrl,
          caption: caption.trim() || null,
          is_instagram_url: imageUrl.includes('instagram.com'),
        });

      if (error) throw error;

      toast({
        title: "Fit added!",
        description: "Your fit has been shared successfully",
      });

      setImageUrl("");
      setCaption("");
      setShowAddDialog(false);
      fetchFits();
    } catch (error) {
      console.error('Error adding fit:', error);
      toast({
        title: "Error",
        description: "Failed to add fit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const renderFitItem = (fit: any, viewMode: 'grid' | 'list') => {
    if (viewMode === 'grid') {
      return (
        <Card key={fit.id} className="overflow-hidden">
          <div className="aspect-[3/4] relative">
            {fit.image_url ? (
              <img
                src={fit.image_url}
                alt={fit.caption || "Outfit"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          {fit.caption && (
            <div className="p-3">
              <p className="text-sm truncate">{fit.caption}</p>
            </div>
          )}
        </Card>
      );
    }

    // List view
    return (
      <Card key={fit.id} className="p-3">
        <div className="flex gap-3">
          <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
            {fit.image_url ? (
              <img
                src={fit.image_url}
                alt={fit.caption || "Outfit"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Outfit</p>
            {fit.caption && (
              <p className="text-sm text-muted-foreground mt-1">{fit.caption}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(fit.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <MobileItemGrid
        items={fits}
        renderItem={renderFitItem}
        onAddNew={() => setShowAddDialog(true)}
        addButtonText="Add Outfit"
        emptyMessage="No outfits yet. Share your first fit!"
      />
      
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Fit</DialogTitle>
            <DialogDescription>
              Add a photo of your outfit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                placeholder="Describe your fit..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddFit}
                disabled={addLoading || !imageUrl.trim()}
                className="flex-1"
              >
                {addLoading ? "Sharing..." : "Share Fit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}