import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
import { AddLikeDialog } from "@/components/likes/AddLikeDialog";
import { LikeDetailDialog } from "@/components/likes/LikeDetailDialog";
import { Card } from "@/components/ui/card";
import { Heart, ExternalLink, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

// Head to Toe ordering - from top of body to bottom
const headToToeOrder = [
  'hats',
  'necklaces', 
  'fragrances',
  'shirts',
  't-shirts', 
  'polo-shirts',
  'hoodies',
  'sweatshirts',
  'blazers',
  'jackets',
  'coats',
  'dresses',
  'skirts',
  'pants',
  'jeans',
  'shorts',
  'shoes',
  'boots'
];

export default function MobileLikes() {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sortByHeadToToe, setSortByHeadToToe] = useState(false);
  const [selectedLike, setSelectedLike] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchLikes();
  }, [user]);

  const fetchLikes = async () => {
    const { data } = await supabase
      .from('user_likes')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setLikes(data || []);
    setLoading(false);
  };

  const handleLikeClick = (like: any) => {
    setSelectedLike(like);
    setShowDetailDialog(true);
  };

  const handleDeleteLike = async (likeId: string) => {
    try {
      const { error } = await supabase
        .from('user_likes')
        .delete()
        .eq('id', likeId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Like removed successfully",
      });

      fetchLikes();
    } catch (error) {
      console.error('Error deleting like:', error);
      toast({
        title: "Error",
        description: "Failed to delete like",
        variant: "destructive"
      });
    }
  };

  const renderLikeItem = (like: any, viewMode: 'grid' | 'list') => {
    if (viewMode === 'grid') {
      return (
        <Card key={like.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleLikeClick(like)}>
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
                  window.open(like.url, '_blank');
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
      );
    }

    // List view
    return (
      <Card key={like.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleLikeClick(like)}>
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
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
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{like.title}</p>
            <p className="text-sm text-muted-foreground">{like.brand_name}</p>
            {like.price && (
              <p className="text-sm font-semibold mt-1">{like.price}</p>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.open(like.url, '_blank');
            }}
            className="p-2"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
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

  // Sort by Head to Toe order if enabled
  const sortedLikes = sortByHeadToToe 
    ? [...likes].sort((a, b) => {
        const aIndex = a.category ? headToToeOrder.indexOf(a.category) : 999;
        const bIndex = b.category ? headToToeOrder.indexOf(b.category) : 999;
        return aIndex - bIndex;
      })
    : likes;

  return (
    <MobileLayout>
      <MobileItemGrid
        items={sortedLikes}
        renderItem={renderLikeItem}
        onAddNew={() => setShowAddDialog(true)}
        addButtonText="Add Like"
        emptyMessage="No liked items yet. Start adding things you love!"
        extraControls={
          <Button
            variant={sortByHeadToToe ? "default" : "outline"}
            size="sm"
            onClick={() => setSortByHeadToToe(!sortByHeadToToe)}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="h-3 w-3" />
            Head to Toe
          </Button>
        }
      />
      
      <AddLikeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onLikeAdded={fetchLikes}
      />
      
      {/* Like Detail Dialog */}
      <LikeDetailDialog
        like={selectedLike}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onDelete={handleDeleteLike}
        onLikeUpdated={fetchLikes}
      />
    </MobileLayout>
  );
}