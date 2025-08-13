import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ClosetItem {
  id: string;
  product_name: string;
  brand_name: string;
  category?: string;
  product_image_url?: string;
}

interface TaggedItem extends ClosetItem {
  tagId: string;
  item_order: number;
}

interface TagClosetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fitId: string;
}

export function TagClosetDialog({ open, onOpenChange, fitId }: TagClosetDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [taggedItems, setTaggedItems] = useState<TaggedItem[]>([]);
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
      const { data, error } = await (supabase as any)
        .from('closet_items')
        .select('id, product_name, brand_name, category, product_image_url')
        .or(`product_name.ilike.%${searchTerm}%,brand_name.ilike.%${searchTerm}%`)
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
      const { data, error } = await (supabase as any)
        .from('fit_tags')
        .select(`
          id,
          closet_item_id,
          item_order,
          closet_items (
            id,
            product_name,
            brand_name,
            category,
            product_image_url
          )
        `)
        .eq('fit_id', fitId)
        .order('item_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const tagged: TaggedItem[] = data?.map(tag => ({
        ...tag.closet_items,
        tagId: tag.id,
        item_order: tag.item_order || 0
      })).filter(Boolean) || [];
      
      setTaggedItems(tagged);
    } catch (error) {
      console.error('Error fetching tagged items:', error);
      setTaggedItems([]);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTagItem = async (item: ClosetItem) => {
    setLoading(true);
    try {
      // Get the highest order number and add 1
      const maxOrder = taggedItems.length > 0 ? Math.max(...taggedItems.map(t => t.item_order)) : -1;
      const newOrder = maxOrder + 1;

      const { data, error } = await (supabase as any)
        .from('fit_tags')
        .insert([
          {
            fit_id: fitId,
            closet_item_id: item.id,
            item_order: newOrder,
          }
        ])
        .select('id')
        .single();

      if (error) throw error;

      const newTaggedItem: TaggedItem = {
        ...item,
        tagId: data.id,
        item_order: newOrder
      };

      setTaggedItems([...taggedItems, newTaggedItem]);
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

  const handleUntagItem = async (item: TaggedItem) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('fit_tags')
        .delete()
        .eq('id', item.tagId);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = taggedItems.findIndex(item => item.tagId === active.id);
      const newIndex = taggedItems.findIndex(item => item.tagId === over?.id);

      const newTaggedItems = arrayMove(taggedItems, oldIndex, newIndex);
      
      // Update the item_order for all items
      const updatedItems = newTaggedItems.map((item, index) => ({
        ...item,
        item_order: index
      }));

      setTaggedItems(updatedItems);

      // Update the database
      try {
        const updates = updatedItems.map(item => ({
          id: item.tagId,
          item_order: item.item_order
        }));

        for (const update of updates) {
          await (supabase as any)
            .from('fit_tags')
            .update({ item_order: update.item_order })
            .eq('id', update.id);
        }
      } catch (error) {
        console.error('Error updating item order:', error);
        // Revert on error
        loadTaggedItems();
      }
    }
  };

  // Sortable item component
  const SortableTaggedItem = ({ item }: { item: TaggedItem }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: item.tagId });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 p-2 bg-secondary rounded-lg"
        {...attributes}
      >
        <div {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.product_name}</p>
          <p className="text-xs text-muted-foreground truncate">{item.brand_name}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 shrink-0"
          onClick={() => handleUntagItem(item)}
          disabled={loading}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
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
              <h4 className="text-sm font-medium">Tagged Items (Drag to reorder)</h4>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={taggedItems.map(item => item.tagId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {taggedItems.map((item) => (
                      <SortableTaggedItem key={item.tagId} item={item} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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