import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClosetItem {
  id: string;
  product_name: string;
  brand_name: string;
  category?: string;
  product_image_url?: string;
}

interface TagClosetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fitId: string;
}

export function TagClosetDialog({ open, onOpenChange, fitId }: TagClosetDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [taggedItems, setTaggedItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadClosetItems();
      loadTaggedItems();
    }
  }, [open, fitId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (open) {
        loadClosetItems();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, open]);

  const loadClosetItems = async () => {
    try {
      const { data, error } = await supabase
        .from('closet_items')
        .select('id, product_name, brand_name, category, product_image_url')
        .ilike('product_name', `%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      setClosetItems(data || []);
    } catch (error) {
      console.error('Error fetching closet items:', error);
      setClosetItems([]);
    }
  };

  const loadTaggedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('fit_tags')
        .select(`
          closet_item_id,
          closet_items (
            id,
            product_name,
            brand_name,
            category,
            product_image_url
          )
        `)
        .eq('fit_id', fitId);

      if (error) throw error;
      
      const tagged = data?.map(tag => tag.closet_items).filter(Boolean) || [];
      setTaggedItems(tagged as ClosetItem[]);
    } catch (error) {
      console.error('Error fetching tagged items:', error);
      setTaggedItems([]);
    }
  };

  const handleTagItem = async (item: ClosetItem) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('fit_tags')
        .insert([
          {
            fit_id: fitId,
            closet_item_id: item.id,
          }
        ]);

      if (error) throw error;

      setTaggedItems([...taggedItems, item]);
      toast({
        title: "Item tagged",
        description: `${item.product_name} has been tagged to this fit.`,
      });
    } catch (error) {
      console.error('Error tagging item:', error);
      toast({
        title: "Error",
        description: "Failed to tag item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUntagItem = async (item: ClosetItem) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('fit_tags')
        .delete()
        .eq('fit_id', fitId)
        .eq('closet_item_id', item.id);

      if (error) throw error;

      setTaggedItems(taggedItems.filter(tagged => tagged.id !== item.id));
      toast({
        title: "Item untagged",
        description: `${item.product_name} has been removed from this fit.`,
      });
    } catch (error) {
      console.error('Error untagging item:', error);
      toast({
        title: "Error",
        description: "Failed to untag item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = closetItems.filter(
    item => !taggedItems.some(tagged => tagged.id === item.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tag Closet Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your closet items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tagged Items */}
          {taggedItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tagged Items</h4>
              <div className="flex flex-wrap gap-2">
                {taggedItems.map((item) => (
                  <Badge key={item.id} variant="secondary" className="pr-1">
                    {item.product_name}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleUntagItem(item)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Items */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Items</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.product_image_url && (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.brand_name}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTagItem(item)}
                    disabled={loading}
                  >
                    Tag
                  </Button>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items found. Try adjusting your search.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}