import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
import { AddClosetItemDialog } from "@/components/closet/AddClosetItemDialog";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function MobileCloset() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('closet_items')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setItems(data || []);
    setLoading(false);
  };

  const renderClosetItem = (item: any, viewMode: 'grid' | 'list') => {
    const imageUrl = item.uploaded_image_url || item.product_image_url || item.stored_image_path;
    
    if (viewMode === 'grid') {
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
      <Card key={item.id} className="p-3">
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
        items={items}
        renderItem={renderClosetItem}
        onAddNew={() => setShowAddDialog(true)}
        addButtonText="Add Item"
        emptyMessage="Your closet is empty. Start adding your favorite items!"
      />
      
      {showAddDialog && (
        <AddClosetItemDialog onItemAdded={() => {
          fetchItems();
          setShowAddDialog(false);
        }} />
      )}
    </MobileLayout>
  );
}