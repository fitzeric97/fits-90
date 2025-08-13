import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface AddLikeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLikeAdded?: () => void;
}

export function AddLikeDialog({ open, onOpenChange, onLikeAdded }: AddLikeDialogProps) {
  const { toast } = useToast();
  const { authMode } = useAuth();
  const [newLike, setNewLike] = useState({ url: '', title: '' });
  const [loading, setLoading] = useState(false);

  const addManualLike = async () => {
    if (!newLike.url) {
      toast({
        title: "Missing Information",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare headers for dev mode
      const headers: { [key: string]: string } = {};
      
      if (authMode === 'dev') {
        const devUserId = localStorage.getItem('user_id');
        if (devUserId) {
          headers['x-dev-user-id'] = devUserId;
        }
      }
      
      // Use the edge function to extract product data and add to likes
      const { data, error } = await supabase.functions.invoke('add-url-to-likes', {
        body: {
          url: newLike.url,
          title: newLike.title || undefined
        },
        headers
      });

      if (error) throw error;

      toast({
        title: "Like Added!",
        description: `${data.like.brand_name || 'Product'} saved to your likes`,
      });

      setNewLike({ url: '', title: '' });
      onOpenChange(false);
      onLikeAdded?.();
    } catch (error) {
      console.error('Error adding like:', error);
      toast({
        title: "Error",
        description: "Failed to add like",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewLike({ url: '', title: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Liked Item</DialogTitle>
          <DialogDescription>
            Save a product URL and title to your likes
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/product"
              value={newLike.url}
              onChange={(e) => setNewLike({ ...newLike, url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Product Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Product name or description"
              value={newLike.title}
              onChange={(e) => setNewLike({ ...newLike, title: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={addManualLike} disabled={loading}>
              {loading ? "Adding..." : "Add Like"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}