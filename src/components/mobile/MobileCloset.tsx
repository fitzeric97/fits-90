import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
import { QuickAddFlow } from "@/components/shared/QuickAddFlow";
import { ClosetItemDetailDialog } from "@/components/closet/ClosetItemDetailDialog";
import { Card } from "@/components/ui/card";
import { FallbackImage } from "@/components/ui/fallback-image";
import { Package, Plus, ArrowUpDown } from "lucide-react";
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

export default function MobileCloset() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [sortByHeadToToe, setSortByHeadToToe] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Filter items based on search query
  useEffect(() => {
    let filtered = items;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = items.filter((item) => {
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
      filtered = [...filtered].sort((a, b) => {
        const aIndex = a.category ? headToToeOrder.indexOf(a.category) : 999;
        const bIndex = b.category ? headToToeOrder.indexOf(b.category) : 999;
        return aIndex - bIndex;
      });
    }

    setFilteredItems(filtered);
  }, [items, searchQuery, sortByHeadToToe]);

  const fetchItems = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('closet_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setItems(data || []);
      }
    } catch (err) {
      setError("Failed to load closet items");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddComplete = async (data: any) => {
    try {
      const { error } = await supabase.functions.invoke('add-item-to-closet', {
        body: {
          url: data.url,
          product_name: data.title,
          brand_name: data.brand_name,
          price: data.price,
          product_image_url: data.image_url,
          product_description: data.description
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add item to closet",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Item added to your closet",
      });

      fetchItems();
    } catch (error) {
      console.error('Error adding to closet:', error);
      toast({
        title: "Error",
        description: "Failed to add item to closet",
        variant: "destructive"
      });
    }
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowDetailDialog(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('closet_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Item removed from your closet",
      });

      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const renderClosetItem = (item: any, viewMode: 'grid' | 'list') => {    
    if (viewMode === 'grid') {
      return (
        <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleItemClick(item)}>
          <div className="aspect-square relative">
            <FallbackImage
              src={item.product_image_url}
              fallbackSrc={item.uploaded_image_url || (item.stored_image_path ? `https://ijawvesjgyddyiymiahk.supabase.co/storage/v1/object/public/closet-items/${item.stored_image_path}` : null)}
              alt={item.product_name || "Closet item"}
              className="w-full h-full object-cover"
              fallbackIcon={
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              }
            />
          </div>
        </Card>
      );
    }

    // List view
    return (
      <Card key={item.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleItemClick(item)}>
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <FallbackImage
              src={item.product_image_url}
              fallbackSrc={item.uploaded_image_url || (item.stored_image_path ? `https://ijawvesjgyddyiymiahk.supabase.co/storage/v1/object/public/closet-items/${item.stored_image_path}` : null)}
              alt={item.product_name || "Closet item"}
              className="w-full h-full object-cover"
              fallbackIcon={
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              }
            />
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

  // Error state
  if (error) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-64 p-4">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground mb-4">
            Error loading closet: {error}
          </p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchItems();
            }}
            className="text-primary underline"
          >
            Try Again
          </button>
        </div>
      </MobileLayout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  // Sort items by Head to Toe order if enabled
  const sortedItems = filteredItems;

  return (
    <MobileLayout>
      <MobileItemGrid
        items={sortedItems}
        renderItem={renderClosetItem}
        addButtonText="Add Item"
        emptyMessage="Your closet is empty. Start adding your favorite items!"
        gridColumns={3}
        extraControls={
          <Button
            variant={sortByHeadToToe ? "secondary" : "outline"}
            size="sm"
            onClick={() => setSortByHeadToToe(!sortByHeadToToe)}
            className="flex items-center gap-1 bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30"
          >
            <ArrowUpDown className="h-3 w-3" />
            Head to Toe
          </Button>
        }
      />
      
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-fits-blue hover:bg-fits-blue/90 text-fits-blue-foreground"
          onClick={() => setShowQuickAdd(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Quick Add Flow */}
      <QuickAddFlow
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        onComplete={handleQuickAddComplete}
        type="closet"
      />

      {/* Item Detail Dialog */}
      <ClosetItemDetailDialog
        item={selectedItem}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onDelete={handleDeleteItem}
        onItemUpdated={fetchItems}
      />
    </MobileLayout>
  );
}