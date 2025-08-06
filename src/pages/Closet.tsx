import { useState, useEffect } from "react";
import { Search, Filter, Grid, List, Heart, ExternalLink, Calendar, Tag, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";

interface ClosetItem {
  id: string;
  brand_name: string;
  product_name: string | null;
  product_description: string | null;
  product_image_url: string | null;
  stored_image_path: string | null;
  company_website_url: string | null;
  purchase_date: string | null;
  order_number: string | null;
  price: string | null;
  size: string | null;
  color: string | null;
  category: string | null;
  created_at: string;
}

export default function Closet() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchClosetItems();
    }
  }, [user]);

  const fetchClosetItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('closet_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching closet items:', error);
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching closet items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesBrand = brandFilter === "all" || item.brand_name === brandFilter;
    
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const uniqueBrands = [...new Set(items.map(item => item.brand_name))];
  const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))];

  const handleItemClick = (item: ClosetItem) => {
    if (item.company_website_url) {
      window.open(item.company_website_url, '_blank');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'clothing':
        return <Tag className="h-4 w-4" />;
      case 'shoes':
        return <Package className="h-4 w-4" />;
      case 'accessories':
        return <Heart className="h-4 w-4" />;
      case 'jewelry':
        return <Heart className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your closet...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (items.length === 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your closet is empty</h3>
              <p className="text-muted-foreground mb-4">
                Items from your order confirmation emails will appear here automatically.
              </p>
              <p className="text-sm text-muted-foreground">
                Scan your Gmail to start building your digital wardrobe!
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Closet</h1>
            <p className="text-muted-foreground">
              Your digital wardrobe from order confirmations ({items.length} items)
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items, brands, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category || 'other'}>
                  {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Other'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Items Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="group cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleItemClick(item)}
              >
                <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {item.company_website_url && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 rounded-full p-1">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {item.product_name || `${item.brand_name} Item`}
                      </h3>
                      {item.category && (
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(item.category)}
                            <span className="text-xs">{item.category}</span>
                          </div>
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground font-medium">
                      {item.brand_name}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 text-xs">
                      {item.price && (
                        <Badge variant="outline">{item.price}</Badge>
                      )}
                      {item.size && (
                        <Badge variant="outline">Size {item.size}</Badge>
                      )}
                      {item.color && (
                        <Badge variant="outline">{item.color}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.purchase_date)}</span>
                      {item.order_number && (
                        <span className="ml-auto font-mono">#{item.order_number}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleItemClick(item)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_name || 'Product'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {item.product_name || `${item.brand_name} Item`}
                          </h3>
                          <p className="text-sm text-muted-foreground">{item.brand_name}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.category && (
                            <Badge variant="secondary">
                              <div className="flex items-center gap-1">
                                {getCategoryIcon(item.category)}
                                <span>{item.category}</span>
                              </div>
                            </Badge>
                          )}
                          {item.company_website_url && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {item.price && (
                          <Badge variant="outline">{item.price}</Badge>
                        )}
                        {item.size && (
                          <Badge variant="outline">Size {item.size}</Badge>
                        )}
                        {item.color && (
                          <Badge variant="outline">{item.color}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>Purchased {formatDate(item.purchase_date)}</span>
                        </div>
                        {item.order_number && (
                          <span className="font-mono">Order #{item.order_number}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No items found matching your criteria.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}