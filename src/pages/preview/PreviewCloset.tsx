import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PreviewSignUpModal } from "@/components/preview/PreviewSignUpModal";
import { PreviewMobileLayout } from "@/components/preview/PreviewMobileLayout";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowUpDown, Plus } from "lucide-react";

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

export default function PreviewCloset() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [sortByHeadToToe, setSortByHeadToToe] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const navigate = useNavigate();

  const DEMO_USER_EMAIL = "fitzeric97@gmail.com";

  useEffect(() => {
    fetchItems();
  }, []);

  // Filter items based on search query and sorting
  useEffect(() => {
    let filtered = items;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = items.filter((item: any) => {
        const searchableFields = [
          item.product_name?.toLowerCase(),
          item.brand_name?.toLowerCase(),
          item.product_description?.toLowerCase(),
          item.category?.toLowerCase(),
          item.color?.toLowerCase(),
          item.size?.toLowerCase(),
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

    setFilteredItems(filtered);
  }, [items, searchQuery, sortByHeadToToe]);

  const fetchItems = async () => {
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
        .from('closet_items')
        .select('*')
        .eq('user_id', demoUserId)
        .order('created_at', { ascending: false });

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching closet items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = () => {
    setShowSignUpModal(true);
  };

  const renderClosetItem = (item: any, viewMode: 'grid' | 'list') => {
    const imageUrl = item.uploaded_image_url || item.product_image_url || item.stored_image_path;
    
    if (viewMode === 'grid') {
      return (
        <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
          <div className="aspect-square relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.product_name || "Closet item"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="font-medium text-sm truncate">{item.product_name || "Unknown Item"}</p>
            <p className="text-xs text-muted-foreground">{item.brand_name}</p>
            {item.price && (
              <p className="text-sm font-semibold mt-1">{item.price}</p>
            )}
          </div>
        </Card>
      );
    }

    // List view
    return (
      <Card key={item.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
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
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{item.product_name || "Unknown Item"}</p>
            <p className="text-sm text-muted-foreground">{item.brand_name}</p>
            {item.price && (
              <p className="text-sm font-semibold mt-1">{item.price}</p>
            )}
            {item.category && (
              <p className="text-xs text-muted-foreground mt-1 capitalize">{item.category}</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <PreviewMobileLayout onSignUpTrigger={handleInteraction} currentSection="closet">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PreviewMobileLayout>
    );
  }

  return (
    <PreviewMobileLayout onSignUpTrigger={handleInteraction} currentSection="closet">
      <MobileItemGrid
        items={filteredItems}
        renderItem={renderClosetItem}
        onAddNew={handleInteraction}
        addButtonText="Add Item"
        emptyMessage="Your closet is empty. Start adding your favorite items!"
        onSearch={setSearchQuery}
        searchPlaceholder="Search by brand, name, category, color, or size..."
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