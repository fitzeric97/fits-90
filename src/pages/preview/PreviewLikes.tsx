import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PreviewSignUpModal } from "@/components/preview/PreviewSignUpModal";
import { PreviewMobileLayout } from "@/components/preview/PreviewMobileLayout";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, ArrowUpDown, Plus } from "lucide-react";

// Head to Toe ordering - from top of body to bottom
const headToToeOrder = [
  'hats',
  'necklaces', 
  'fragrances',
  'shirts',
  't-shirts', 
  'polo-shirts',
  'button-shirts',
  'sweaters',
  'hoodies',
  'jackets',
  'activewear',
  'pants',
  'jeans',
  'shorts',
  'shoes',
  'boots'
];

export default function PreviewLikes() {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [sortByHeadToToe, setSortByHeadToToe] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLikes, setFilteredLikes] = useState([]);
  const navigate = useNavigate();

  const DEMO_USER_EMAIL = "fitzeric97@gmail.com";

  useEffect(() => {
    fetchLikes();
  }, []);

  // Filter likes based on search query and sorting
  useEffect(() => {
    let filtered = likes;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = likes.filter((like: any) => {
        const searchableFields = [
          like.brand_name?.toLowerCase(),
          like.category?.toLowerCase(), 
          like.description?.toLowerCase(),
          like.title?.toLowerCase(),
        ].filter(Boolean);

        return searchableFields.some(field => field?.includes(query));
      });
    }

    // Sort by Head to Toe order if enabled
    if (sortByHeadToToe) {
      filtered = [...filtered].sort((a: any, b: any) => {
        const aIndex = a.category ? headToToeOrder.indexOf(a.category) : 999;
        const bIndex = b.category ? headToToeOrder.indexOf(b.category) : 999;
        return aIndex - bIndex;
      });
    }

    setFilteredLikes(filtered);
  }, [likes, searchQuery, sortByHeadToToe]);

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

  const renderLikeItem = (like: any, viewMode: 'grid' | 'list') => {
    if (viewMode === 'grid') {
      return (
        <Card key={like.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
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
      <Card key={like.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
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
      <PreviewMobileLayout onSignUpTrigger={handleInteraction} currentSection="likes">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PreviewMobileLayout>
    );
  }

  return (
    <PreviewMobileLayout onSignUpTrigger={handleInteraction} currentSection="likes">
      <MobileItemGrid
        items={filteredLikes}
        renderItem={renderLikeItem}
        onAddNew={handleInteraction}
        addButtonText="Add Like"
        emptyMessage="No liked items yet. Start adding things you love!"
        onSearch={setSearchQuery}
        searchPlaceholder="Search by brand, category, or description..."
        gridColumns={3}
        extraControls={
          <Button
            variant={sortByHeadToToe ? "secondary" : "outline"}
            size="sm"
            onClick={handleInteraction}
            className="flex items-center gap-1 bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30"
          >
            <ArrowUpDown className="h-3 w-3" />
            Head to Toe
          </Button>
        }
      />
      
      <PreviewSignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal} 
      />
    </PreviewMobileLayout>
  );
}