import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Heart, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestLikeButton } from "@/components/testing/TestLikeButton";
import { EditLikeDialog } from "@/components/likes/EditLikeDialog";

interface Like {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: string | null;
  brand_name: string | null;
  source_email: string | null;
  category: string | null;
  item_type: string | null;
  created_at: string;
}

export default function Likes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLike, setNewLike] = useState({ url: '', title: '' });
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLikes();
    }
  }, [user]);

  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLikes(data || []);
    } catch (error) {
      console.error('Error fetching likes:', error);
      toast({
        title: "Error",
        description: "Failed to load your liked items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addManualLike = async () => {
    if (!newLike.url) {
      toast({
        title: "Missing Information",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the edge function to extract product data and add to likes
      const { data, error } = await supabase.functions.invoke('add-url-to-likes', {
        body: {
          url: newLike.url,
          title: newLike.title || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Like Added!",
        description: `${data.like.brand_name || 'Product'} saved to your likes`,
      });

      setNewLike({ url: '', title: '' });
      setShowAddDialog(false);
      fetchLikes();
    } catch (error) {
      console.error('Error adding like:', error);
      toast({
        title: "Error",
        description: "Failed to add like",
        variant: "destructive",
      });
    }
  };

  const removeLike = async (likeId: string) => {
    try {
      const { error } = await supabase
        .from('user_likes')
        .delete()
        .eq('id', likeId);

      if (error) throw error;

      toast({
        title: "Like Removed",
        description: "Item removed from your likes",
      });

      fetchLikes();
    } catch (error) {
      console.error('Error removing like:', error);
      toast({
        title: "Error",
        description: "Failed to remove like",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground">Loading your likes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TestLikeButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Likes</h1>
            <p className="text-muted-foreground mt-2">
              Products you've saved for later from links sent to your @myfits.co email
            </p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Like
              </Button>
            </DialogTrigger>
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
                  <Label htmlFor="title">Product Title</Label>
                  <Input
                    id="title"
                    placeholder="Product name or description"
                    value={newLike.title}
                    onChange={(e) => setNewLike({ ...newLike, title: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addManualLike}>
                    Add Like
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {likes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                No Likes Yet
              </CardTitle>
              <CardDescription>
                Send product URLs to your @myfits.co email to save them here automatically, or add them manually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Your @myfits.co email: <strong>{user?.user_metadata?.myfits_email || 'N/A'}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Send yourself links to products you want to save for later!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {likes.map((like) => (
              <Card key={like.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative">
                  {/* Product Image with Price Overlay */}
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {like.image_url ? (
                      <img 
                        src={like.image_url} 
                        alt={like.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Heart className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Price Badge in Upper Right */}
                  {like.price && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="default" className="bg-background/90 text-foreground font-semibold shadow-md">
                        {like.price}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <EditLikeDialog 
                    like={{
                      id: like.id,
                      title: like.title,
                      brand_name: like.brand_name,
                      price: like.price,
                      category: like.category,
                      description: like.description
                    }}
                    onItemUpdated={fetchLikes}
                  />
                  
                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLike(like.id)}
                    className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 hover:bg-background"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardContent className="p-4 space-y-3">
                  {/* Brand and Product Name */}
                  <div className="space-y-1">
                    {like.brand_name && (
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {like.brand_name}
                      </p>
                    )}
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                      {like.title}
                    </h3>
                  </div>
                  
                  {/* Category */}
                  {like.category && (
                    <Badge variant="secondary" className="capitalize">
                      {like.category}
                    </Badge>
                  )}
                  
                  {/* Description */}
                  {like.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {like.description}
                    </p>
                  )}
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {new Date(like.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(like.url, '_blank')}
                      className="hover:bg-primary hover:text-primary-foreground"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                  
                  {like.source_email && (
                    <p className="text-xs text-muted-foreground">
                      From: {like.source_email}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}