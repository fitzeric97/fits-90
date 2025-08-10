import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FallbackImage } from "@/components/ui/fallback-image";
import { useToast } from "@/hooks/use-toast";
import { useBrandPromotions } from "@/hooks/useBrandPromotions";
import { ExternalLink, Heart, Trash2, Plus, Tag, Search, X, ArrowUpDown, Gem, Shirt, ShirtIcon, Package, Archive, Scissors, Square, Footprints, Dumbbell, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditLikeDialog } from "@/components/likes/EditLikeDialog";

interface Like {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  uploaded_image_url: string | null;
  price: string | null;
  brand_name: string | null;
  source_email: string | null;
  category: string | null;
  item_type: string | null;
  created_at: string;
}

// Category configuration with icons and display names (same as Closet)
const categoryConfig = {
  'hats': { icon: Archive, label: 'Hats', color: 'text-blue-600' },
  'necklaces': { icon: Gem, label: 'Necklaces', color: 'text-pink-600' },
  'fragrances': { icon: Sparkles, label: 'Fragrances', color: 'text-purple-600' },
  'shirts': { icon: Shirt, label: 'Shirts', color: 'text-blue-600' },
  't-shirts': { icon: Shirt, label: 'T-Shirts', color: 'text-green-600' },
  'polo-shirts': { icon: ShirtIcon, label: 'Polo Shirts', color: 'text-purple-600' },
  'button-shirts': { icon: Shirt, label: 'Button Shirts', color: 'text-indigo-600' },
  'sweaters': { icon: Package, label: 'Sweaters', color: 'text-red-600' },
  'hoodies': { icon: ShirtIcon, label: 'Hoodies', color: 'text-orange-600' },
  'jackets': { icon: Archive, label: 'Jackets', color: 'text-gray-800' },
  'activewear': { icon: Dumbbell, label: 'Activewear', color: 'text-green-700' },
  'pants': { icon: Scissors, label: 'Pants', color: 'text-gray-600' },
  'jeans': { icon: Scissors, label: 'Jeans', color: 'text-blue-800' },
  'shorts': { icon: Square, label: 'Shorts', color: 'text-yellow-600' },
  'shoes': { icon: Footprints, label: 'Shoes', color: 'text-brown-600' },
  'boots': { icon: Footprints, label: 'Boots', color: 'text-amber-700' }
};

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

export default function Likes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasBrandPromotions, getBrandPromotionCount } = useBrandPromotions();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLike, setNewLike] = useState({ url: '', title: '' });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLikes, setFilteredLikes] = useState<Like[]>([]);
  const [sortByHeadToToe, setSortByHeadToToe] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLikes();
    }
  }, [user]);

  // Filter likes based on search query
  useEffect(() => {
    let filtered = likes;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = likes.filter((like) => {
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
      filtered = [...filtered].sort((a, b) => {
        const aIndex = a.category ? headToToeOrder.indexOf(a.category) : 999;
        const bIndex = b.category ? headToToeOrder.indexOf(b.category) : 999;
        return aIndex - bIndex;
      });
    }

    setFilteredLikes(filtered);
  }, [likes, searchQuery, sortByHeadToToe]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Likes</h1>
            <p className="text-muted-foreground mt-2">
              Products you've saved for later from links sent to your @myfits.co email
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={sortByHeadToToe ? "default" : "outline"}
              size="sm"
              onClick={() => setSortByHeadToToe(!sortByHeadToToe)}
              title="Sort Head to Toe"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Head to Toe
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
          
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
        </div>

        {/* Search Bar */}
        {likes.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

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
        ) : filteredLikes.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No matches found</h3>
                <p className="text-muted-foreground mb-4">
                  No items match your search for "{searchQuery}"
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLikes.map((like) => (
              <Card key={like.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative">
                  {/* Product Image with Price Overlay */}
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    <FallbackImage
                      src={like.image_url}
                      fallbackSrc={like.uploaded_image_url}
                      alt={like.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallbackIcon={<Heart className="h-12 w-12 text-muted-foreground" />}
                    />
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
                      description: like.description,
                      image_url: like.image_url,
                      uploaded_image_url: like.uploaded_image_url
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
                    <div className="flex gap-2">
                      {/* Promotions Button - Show if brand has active promotions */}
                      {like.brand_name && hasBrandPromotions(like.brand_name) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate(`/brand-promotions/${encodeURIComponent(like.brand_name)}`)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          Promotions ({getBrandPromotionCount(like.brand_name)})
                        </Button>
                      )}
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