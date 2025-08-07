import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Grid, List, Heart, ExternalLink, Calendar, Tag, Package, Shirt, Zap, Scissors, ShirtIcon, ShoppingBag, Dumbbell, Archive, Square, Footprints, Eye, Trash2 } from "lucide-react";
import { AddClosetItemDialog } from "@/components/closet/AddClosetItemDialog";
import { EditClosetItemDialog } from "@/components/closet/EditClosetItemDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useBrandPromotions } from "@/hooks/useBrandPromotions";

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

// Category configuration with icons and display names
const categoryConfig = {
  'shirts': { icon: Shirt, label: 'Shirts', color: 'text-blue-600' },
  't-shirts': { icon: Shirt, label: 'T-Shirts', color: 'text-green-600' },
  'polo-shirts': { icon: ShirtIcon, label: 'Polo Shirts', color: 'text-purple-600' },
  'button-shirts': { icon: Shirt, label: 'Button Shirts', color: 'text-indigo-600' },
  'jeans': { icon: Scissors, label: 'Jeans', color: 'text-blue-800' },
  'pants': { icon: Scissors, label: 'Pants', color: 'text-gray-600' },
  'shorts': { icon: Square, label: 'Shorts', color: 'text-yellow-600' },
  'jackets': { icon: Archive, label: 'Jackets', color: 'text-gray-800' },
  'sweaters': { icon: Package, label: 'Sweaters', color: 'text-red-600' },
  'hoodies': { icon: ShirtIcon, label: 'Hoodies', color: 'text-orange-600' },
  'activewear': { icon: Dumbbell, label: 'Activewear', color: 'text-green-700' },
  'shoes': { icon: Footprints, label: 'Shoes', color: 'text-brown-600' }
};

export default function Closet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasBrandPromotions, getBrandPromotionCount } = useBrandPromotions();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"categories" | "grid" | "list">("categories");

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
  
  // Get recent purchases (top 3 most recent items)
  const recentPurchases = items.slice(0, 3);
  
  // Get category counts
  const categoryCounts = items.reduce((acc, item) => {
    if (item.category) {
      acc[item.category] = (acc[item.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Available categories with items
  const availableCategories = Object.keys(categoryConfig).filter(category => 
    categoryCounts[category] > 0
  );

  const handleItemClick = (item: ClosetItem) => {
    if (item.company_website_url) {
      window.open(item.company_website_url, '_blank');
    }
  };

  const handleViewAllClick = () => {
    setCategoryFilter("all");
    setViewMode("grid");
  };

  const handleCategoryClick = (category: string) => {
    setCategoryFilter(category);
    setViewMode("grid");
  };

  const removeClosetItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('closet_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item Removed",
        description: "Item removed from your closet",
      });

      fetchClosetItems();
    } catch (error) {
      console.error('Error removing closet item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
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
                Add items to your closet by URL or upload photos of items you own
              </p>
              <AddClosetItemDialog onItemAdded={fetchClosetItems} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Closet</h1>
            <p className="text-muted-foreground">
              Your digital wardrobe ({items.length} items)
            </p>
          </div>
          
          <div className="flex gap-2">
            <AddClosetItemDialog onItemAdded={fetchClosetItems} />
            <Button
              variant={viewMode === "categories" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("categories")}
            >
              <Tag className="h-4 w-4" />
            </Button>
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

        {/* Categories View - Default */}
        {viewMode === "categories" && (
          <div className="space-y-8">
            {/* View All Items */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Quick Access</h2>
              <Card 
                className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
                onClick={handleViewAllClick}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-blue-500 text-white">
                      <Eye className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">View All Items</h3>
                      <p className="text-muted-foreground">Browse your entire wardrobe</p>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium text-lg px-3 py-1"
                  >
                    {items.length} items
                  </Badge>
                </CardContent>
              </Card>
            </div>
            {/* Recent Purchases */}
            {recentPurchases.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recent Purchases</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentPurchases.map((item) => (
                    <Card 
                      key={item.id} 
                      className="group cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                        {(item.product_image_url || item.stored_image_path) ? (
                          <img
                            src={item.stored_image_path 
                              ? `https://ijawvesjgyddyiymiahk.supabase.co/storage/v1/object/public/closet-items/${item.stored_image_path}` 
                              : item.product_image_url!
                            }
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
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {item.product_name || `${item.brand_name} Item`}
                        </h3>
                        <p className="text-xs text-muted-foreground">{item.brand_name}</p>
                        {item.price && (
                          <p className="text-sm font-medium text-primary">{item.price}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Grid */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {availableCategories.map((categoryKey) => {
                  const config = categoryConfig[categoryKey as keyof typeof categoryConfig];
                  const count = categoryCounts[categoryKey];
                  const IconComponent = config.icon;
                  
                  return (
                    <Card 
                      key={categoryKey}
                      className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
                      onClick={() => handleCategoryClick(categoryKey)}
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                        <div className={`p-4 rounded-full bg-muted ${config.color}`}>
                          <IconComponent className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm">{config.label}</h3>
                          <Badge 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
                          >
                            {count} item{count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filters - Only show when not in categories view */}
        {viewMode !== "categories" && (
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
                    {categoryConfig[category as keyof typeof categoryConfig]?.label || category?.charAt(0).toUpperCase() + category?.slice(1) || 'Other'}
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

            {categoryFilter !== "all" && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setCategoryFilter("all");
                  setViewMode("categories");
                }}
              >
                Back to Categories
              </Button>
            )}
          </div>
        )}

        {/* Items Grid/List - Only show when not in categories view */}
        {viewMode !== "categories" && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="group cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                      {(item.product_image_url || item.stored_image_path) ? (
                        <img
                          src={item.stored_image_path 
                            ? `https://ijawvesjgyddyiymiahk.supabase.co/storage/v1/object/public/closet-items/${item.stored_image_path}` 
                            : item.product_image_url!
                          }
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
                       
                      {/* Action Buttons */}
                      <EditClosetItemDialog 
                        item={{
                          id: item.id,
                          product_name: item.product_name,
                          brand_name: item.brand_name,
                          product_description: item.product_description,
                          price: item.price,
                          size: item.size,
                          color: item.color,
                          category: item.category,
                          purchase_date: item.purchase_date
                        }}
                        onItemUpdated={fetchClosetItems}
                      />
                      
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeClosetItem(item.id);
                        }}
                        className="absolute top-2 left-12 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white z-10"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      
                      {item.company_website_url && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 rounded-full p-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(item.company_website_url!, '_blank');
                              }}
                              className="h-8 w-8 rounded-full hover:bg-white"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Promotions Button - Show if brand has active promotions */}
                      {item.brand_name && hasBrandPromotions(item.brand_name) && (
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/brand-promotions/${encodeURIComponent(item.brand_name)}`);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            Promotions ({getBrandPromotionCount(item.brand_name)})
                          </Button>
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
                                  {(() => {
                                    const config = categoryConfig[item.category as keyof typeof categoryConfig];
                                    if (config) {
                                      const IconComponent = config.icon;
                                      return <IconComponent className="h-3 w-3" />;
                                    }
                                    return <Tag className="h-3 w-3" />;
                                  })()}
                                  <span className="text-xs">{categoryConfig[item.category as keyof typeof categoryConfig]?.label || item.category}</span>
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
                    <CardContent className="p-4 relative">
                      {/* Edit Button for List View */}
                      <EditClosetItemDialog 
                        item={{
                          id: item.id,
                          product_name: item.product_name,
                          brand_name: item.brand_name,
                          product_description: item.product_description,
                          price: item.price,
                          size: item.size,
                          color: item.color,
                          category: item.category,
                          purchase_date: item.purchase_date
                        }}
                        onItemUpdated={fetchClosetItems}
                      />
                      
                      {/* Delete Button for List View */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeClosetItem(item.id);
                        }}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white z-10"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      
                      {/* Promotions Button for List View */}
                      {item.brand_name && hasBrandPromotions(item.brand_name) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/brand-promotions/${encodeURIComponent(item.brand_name)}`);
                          }}
                          className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 hover:bg-green-600 text-white z-10"
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          Promotions ({getBrandPromotionCount(item.brand_name)})
                        </Button>
                      )}
                      
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                          {(item.product_image_url || item.stored_image_path) ? (
                            <img
                              src={item.stored_image_path 
                                ? `https://ijawvesjgyddyiymiahk.supabase.co/storage/v1/object/public/closet-items/${item.stored_image_path}` 
                                : item.product_image_url!
                              }
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
                                    {(() => {
                                      const config = categoryConfig[item.category as keyof typeof categoryConfig];
                                      if (config) {
                                        const IconComponent = config.icon;
                                        return <IconComponent className="h-3 w-3" />;
                                      }
                                      return <Tag className="h-3 w-3" />;
                                    })()}
                                    <span>{categoryConfig[item.category as keyof typeof categoryConfig]?.label || item.category}</span>
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
          </>
        )}

        {(viewMode !== "categories" && filteredItems.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No items found matching your criteria.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}